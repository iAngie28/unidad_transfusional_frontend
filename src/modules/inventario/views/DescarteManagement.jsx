import React, { useState, useEffect } from 'react';
import { getDescartes, createDescarte, updateDescarte, deleteDescarte } from '../services/descarteService';
import { getHemocomponentes } from '../services/hemocomponenteService';
import { Trash2, Plus, Edit2, Search, X, AlertTriangle } from 'lucide-react';

const DescarteManagement = () => {
  const [descartes, setDescartes] = useState([]);
  const [hemocomponentes, setHemocomponentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDescarte, setEditingDescarte] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    nro_bolsa: '',
    tipo_accion: 'DESCARTE',
    motivo: '',
    fecha_hora: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [descartesData, hemocomponentesData] = await Promise.all([
        getDescartes(),
        getHemocomponentes()
      ]);
      setDescartes(descartesData.results || descartesData || []);
      setHemocomponentes(hemocomponentesData.results || hemocomponentesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (descarte = null) => {
    if (descarte) {
      setEditingDescarte(descarte);
      setFormData({
        nro_bolsa: descarte.nro_bolsa || '',
        tipo_accion: descarte.tipo_accion || 'DESCARTE',
        motivo: descarte.motivo || '',
        fecha_hora: descarte.fecha_hora ? new Date(descarte.fecha_hora).toISOString().slice(0, 16) : ''
      });
    } else {
      setEditingDescarte(null);
      setFormData({
        nro_bolsa: '',
        tipo_accion: 'DESCARTE',
        motivo: '',
        fecha_hora: new Date().toISOString().slice(0, 16)
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDescarte(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDescarte) {
        await updateDescarte(editingDescarte.id, formData);
      } else {
        await createDescarte(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving descarte:', error);
      let errorMsg = 'Ocurrió un error al registrar el descarte. Verifica los datos.';
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
    if (window.confirm('¿Estás seguro de revertir/eliminar este registro de descarte?')) {
      try {
        await deleteDescarte(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting descarte:', error);
        alert('Ocurrió un error al eliminar el registro.');
      }
    }
  };

  const filteredDescartes = descartes.filter(d => 
    (d.nro_bolsa?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (d.tipo_accion?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" />
              Descartes y Bajas
            </h1>
            <p className="text-gray-500 text-sm mt-1">Gestión de unidades descartadas o vencidas</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar Bolsa..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none w-full md:w-72 transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Registrar Descarte
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Bolsa / Unidad</th>
                  <th className="px-6 py-4">Acción</th>
                  <th className="px-6 py-4">Motivo</th>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4 text-right">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        Cargando descartes...
                      </div>
                    </td>
                  </tr>
                ) : filteredDescartes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No hay registros de descarte.
                    </td>
                  </tr>
                ) : (
                  filteredDescartes.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-gray-800">
                        {d.nro_bolsa}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold px-2 py-1 rounded-lg border text-xs ${
                          d.tipo_accion === 'VENCIMIENTO' ? 'bg-red-50 text-red-700 border-red-200' : 
                          d.tipo_accion === 'BAJA' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {d.tipo_accion}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700 max-w-xs truncate" title={d.motivo}>{d.motivo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600">{new Date(d.fecha_hora).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(d)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(d.id)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-amber-500 w-5 h-5" />
                {editingDescarte ? 'Editar Descarte' : 'Registrar Nuevo Descarte'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="descarteForm" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Hemocomponente a descartar *</label>
                  <select 
                    required
                    disabled={!!editingDescarte}
                    value={formData.nro_bolsa}
                    onChange={(e) => setFormData({...formData, nro_bolsa: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white font-mono disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">-- Seleccionar Bolsa --</option>
                    {hemocomponentes.map(h => (
                      <option key={h.nro_bolsa} value={h.nro_bolsa}>{h.nro_bolsa} ({h.estado})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Tipo de Acción *</label>
                  <select 
                    required
                    value={formData.tipo_accion}
                    onChange={(e) => setFormData({...formData, tipo_accion: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                  >
                    <option value="DESCARTE">Descarte</option>
                    <option value="BAJA">Baja</option>
                    <option value="VENCIMIENTO">Vencimiento</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Motivo Detallado *</label>
                  <textarea 
                    required rows="3"
                    value={formData.motivo}
                    onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    placeholder="Ej: Reactivo a Chagas, Bolsa rota, etc."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Fecha y Hora *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.fecha_hora}
                    onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
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
                form="descarteForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20"
              >
                {editingDescarte ? 'Guardar Cambios' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DescarteManagement;
