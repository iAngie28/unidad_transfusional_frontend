import React, { useState, useEffect } from 'react';
import { getCitaciones, createCitacion, updateCitacion, deleteCitacion } from '../services/citacionService';
import { getSolicitudes } from '../services/solicitudService';
import { useAuth } from '../../../contexts/AuthContext';
import { Users, Plus, Edit2, Trash2, Search, X, CalendarClock } from 'lucide-react';

const CitacionManagement = () => {
  const { user } = useAuth();
  const [citaciones, setCitaciones] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCitacion, setEditingCitacion] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    nro_solicitud: '',
    id_user: user?.id || '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
    servicio: '',
    sala_cama: '',
    cantidad: '',
    codigo_donante: '',
    grupo_factor: '',
    tipo: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [citacionesData, solicitudesData] = await Promise.all([
        getCitaciones(),
        getSolicitudes()
      ]);
      setCitaciones(citacionesData.results || citacionesData || []);
      setSolicitudes(solicitudesData.results || solicitudesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (citacion = null) => {
    if (citacion) {
      setEditingCitacion(citacion);
      setFormData({
        nro_solicitud: citacion.nro_solicitud || '',
        id_user: citacion.id_user || user?.id || '',
        fecha: citacion.fecha || '',
        hora: citacion.hora ? citacion.hora.substring(0, 5) : '',
        servicio: citacion.servicio || '',
        sala_cama: citacion.sala_cama || '',
        cantidad: citacion.cantidad || '',
        codigo_donante: citacion.codigo_donante || '',
        grupo_factor: citacion.grupo_factor || '',
        tipo: citacion.tipo || ''
      });
    } else {
      setEditingCitacion(null);
      setFormData({
        nro_solicitud: '',
        id_user: user?.id || '',
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
        servicio: '',
        sala_cama: '',
        cantidad: '',
        codigo_donante: '',
        grupo_factor: '',
        tipo: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCitacion(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCitacion) {
        await updateCitacion(editingCitacion.id, formData);
      } else {
        await createCitacion(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving citacion:', error);
      let errorMsg = 'Ocurrió un error al guardar la citación. Verifica los datos.';
      if (error.response && error.response.data) {
        const backendErrors = error.response.data;
        const errorList = Object.entries(backendErrors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n');
        errorMsg += '\n\nDetalles:\n' + errorList;
      }
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta citación?')) {
      try {
        await deleteCitacion(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting citacion:', error);
        let errorMsg = 'Ocurrió un error al eliminar la citación.';
        if (error.response && error.response.data && error.response.data.error) {
          errorMsg = error.response.data.error;
        }
        alert(errorMsg);
      }
    }
  };

  const filteredCitaciones = citaciones.filter(c => 
    (c.codigo_donante?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.nro_solicitud?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.tipo?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarClock className="text-orange-500" />
              Citación de Donantes
            </h1>
            <p className="text-gray-500 text-sm mt-1">Programa donaciones vinculadas a solicitudes</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar Código, Solicitud..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none w-full md:w-72 transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nueva Citación
            </button>
          </div>
        </div>

        {/* Citaciones Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Cód. Donante</th>
                  <th className="px-6 py-4">N° Solicitud</th>
                  <th className="px-6 py-4">Grupo / Tipo</th>
                  <th className="px-6 py-4">Fecha / Hora</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        Cargando citaciones...
                      </div>
                    </td>
                  </tr>
                ) : filteredCitaciones.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron citaciones.
                    </td>
                  </tr>
                ) : (
                  filteredCitaciones.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">
                        {c.codigo_donante}
                      </td>
                      <td className="px-6 py-4 font-mono text-indigo-600">
                        {c.nro_solicitud}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-red-600">{c.grupo_factor}</span>
                          <span className="text-xs text-gray-500">{c.tipo} ({c.cantidad} U)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{c.fecha}</div>
                        <div className="text-xs text-gray-500">{c.hora?.substring(0, 5)} • {c.servicio}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(c)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarClock className="text-orange-500 w-5 h-5" />
                {editingCitacion ? 'Editar Citación' : 'Nueva Citación de Donante'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="citacionForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Solicitud de Transfusión *</label>
                  <select 
                    required
                    value={formData.nro_solicitud}
                    onChange={(e) => setFormData({...formData, nro_solicitud: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Solicitud --</option>
                    {solicitudes.map(s => (
                      <option key={s.nro} value={s.nro}>{s.nro} - Paciente: {s.paciente_nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Código de Donante *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.codigo_donante}
                    onChange={(e) => setFormData({...formData, codigo_donante: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none uppercase"
                    placeholder="Ej: DON-123"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Grupo / Factor *</label>
                  <select 
                    required
                    value={formData.grupo_factor}
                    onChange={(e) => setFormData({...formData, grupo_factor: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white font-bold text-red-700"
                  >
                    <option value="" className="font-normal text-gray-900">-- Sel --</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Fecha *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Hora *</label>
                  <input 
                    type="time" 
                    required
                    value={formData.hora}
                    onChange={(e) => setFormData({...formData, hora: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Tipo de Donación *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Ej: Sangre Total, Aféresis de Plaquetas..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Servicio *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.servicio}
                    onChange={(e) => setFormData({...formData, servicio: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Ej: Banco de Sangre, Terapia..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Cantidad *</label>
                  <input 
                    type="number" 
                    required min="1" max="10"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Sala / Cama</label>
                  <input 
                    type="text" 
                    value={formData.sala_cama}
                    onChange={(e) => setFormData({...formData, sala_cama: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Ej: Sala 3, Cama 12"
                  />
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="citacionForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20"
              >
                {editingCitacion ? 'Guardar Cambios' : 'Registrar Citación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CitacionManagement;
