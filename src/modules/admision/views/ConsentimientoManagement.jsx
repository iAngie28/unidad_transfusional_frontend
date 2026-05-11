import React, { useState, useEffect } from 'react';
import { getConsentimientos, createConsentimiento, updateConsentimiento, deleteConsentimiento } from '../services/consentimientoService';
import { getSolicitudes } from '../services/solicitudService';
import { FileCheck, Plus, Edit2, Trash2, Search, X } from 'lucide-react';

const ConsentimientoManagement = () => {
  const [consentimientos, setConsentimientos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsentimiento, setEditingConsentimiento] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    nro_solicitud: '',
    fecha: new Date().toISOString().split('T')[0],
    servicio: '',
    nombre_familiar: '',
    apellido_paterno_familiar: '',
    apellido_materno_familiar: '',
    telefono: '',
    ci: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [consentimientosData, solicitudesData] = await Promise.all([
        getConsentimientos(),
        getSolicitudes()
      ]);
      setConsentimientos(consentimientosData.results || consentimientosData || []);
      setSolicitudes(solicitudesData.results || solicitudesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (consentimiento = null) => {
    if (consentimiento) {
      setEditingConsentimiento(consentimiento);
      setFormData({
        nro_solicitud: consentimiento.nro_solicitud || '',
        fecha: consentimiento.fecha || '',
        servicio: consentimiento.servicio || '',
        nombre_familiar: consentimiento.nombre_familiar || '',
        apellido_paterno_familiar: consentimiento.apellido_paterno_familiar || '',
        apellido_materno_familiar: consentimiento.apellido_materno_familiar || '',
        telefono: consentimiento.telefono || '',
        ci: consentimiento.ci || ''
      });
    } else {
      setEditingConsentimiento(null);
      setFormData({
        nro_solicitud: '',
        fecha: new Date().toISOString().split('T')[0],
        servicio: '',
        nombre_familiar: '',
        apellido_paterno_familiar: '',
        apellido_materno_familiar: '',
        telefono: '',
        ci: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingConsentimiento(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingConsentimiento) {
        await updateConsentimiento(editingConsentimiento.id, formData);
      } else {
        await createConsentimiento(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving consentimiento:', error);
      let errorMsg = 'Ocurrió un error al guardar el consentimiento. Verifica los datos.';
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
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        await deleteConsentimiento(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting consentimiento:', error);
        alert('Ocurrió un error al eliminar.');
      }
    }
  };

  const filteredConsentimientos = consentimientos.filter(c => 
    (c.ci?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.nro_solicitud?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.nombre_familiar?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.apellido_paterno_familiar?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileCheck className="text-emerald-600" />
              Consentimientos Informados
            </h1>
            <p className="text-gray-500 text-sm mt-1">Registra la autorización familiar para transfusiones</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar CI, Familiar, Solicitud..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full md:w-72 transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nuevo Registro
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">N° Solicitud</th>
                  <th className="px-6 py-4">Familiar Responsable</th>
                  <th className="px-6 py-4">CI / Teléfono</th>
                  <th className="px-6 py-4">Fecha / Servicio</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        Cargando consentimientos...
                      </div>
                    </td>
                  </tr>
                ) : filteredConsentimientos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron registros.
                    </td>
                  </tr>
                ) : (
                  filteredConsentimientos.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                        {c.nro_solicitud}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {c.apellido_paterno_familiar} {c.apellido_materno_familiar} {c.nombre_familiar}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div>CI: {c.ci}</div>
                        <div className="text-xs text-gray-400">Tel: {c.telefono}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{c.fecha}</div>
                        <div className="text-xs text-gray-500">{c.servicio}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(c)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="text-emerald-600 w-5 h-5" />
                {editingConsentimiento ? 'Editar Consentimiento' : 'Nuevo Consentimiento'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="consentForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Solicitud de Transfusión *</label>
                  <select 
                    required
                    value={formData.nro_solicitud}
                    onChange={(e) => setFormData({...formData, nro_solicitud: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Solicitud --</option>
                    {solicitudes.map(s => (
                      <option key={s.nro} value={s.nro}>{s.nro} - Paciente: {s.paciente_nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nombre del Familiar *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nombre_familiar}
                    onChange={(e) => setFormData({...formData, nombre_familiar: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido Paterno *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.apellido_paterno_familiar}
                    onChange={(e) => setFormData({...formData, apellido_paterno_familiar: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido Materno</label>
                  <input 
                    type="text" 
                    value={formData.apellido_materno_familiar}
                    onChange={(e) => setFormData({...formData, apellido_materno_familiar: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">CI del Familiar *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.ci}
                    onChange={(e) => setFormData({...formData, ci: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Teléfono *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Fecha *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Servicio *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.servicio}
                    onChange={(e) => setFormData({...formData, servicio: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ej: Banco de Sangre"
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
                form="consentForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
              >
                {editingConsentimiento ? 'Guardar Cambios' : 'Registrar Consentimiento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConsentimientoManagement;
