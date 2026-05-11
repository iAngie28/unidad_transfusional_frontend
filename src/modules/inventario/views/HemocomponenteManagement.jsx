import React, { useState, useEffect } from 'react';
import { getHemocomponentes, createHemocomponente, updateHemocomponente, deleteHemocomponente } from '../services/hemocomponenteService';
import { getTrazabilidades } from '../services/trazabilidadService';
import { Droplet, Plus, Edit2, Trash2, Search, X, Package, Eye, ListTree, Activity } from 'lucide-react';

const HemocomponenteManagement = () => {
  const [hemocomponentes, setHemocomponentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingHemocomponente, setEditingHemocomponente] = useState(null);
  const [viewingHemocomponente, setViewingHemocomponente] = useState(null);
  const [trazabilidadHistory, setTrazabilidadHistory] = useState([]);
  const [loadingTrazabilidad, setLoadingTrazabilidad] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    nro_bolsa: '',
    nro_tubuladura: '',
    tipo: '',
    grupo_sanguineo: '',
    estado: 'DISPONIBLE',
    fecha_ingreso: new Date().toISOString().slice(0, 16), // datetime-local format
    fecha_vencimiento: '',
    devuelto: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getHemocomponentes();
      setHemocomponentes(data.results || data || []);
    } catch (error) {
      console.error('Error fetching hemocomponentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (hemo = null) => {
    if (hemo) {
      setEditingHemocomponente(hemo);
      setFormData({
        nro_bolsa: hemo.nro_bolsa || '',
        nro_tubuladura: hemo.nro_tubuladura || '',
        tipo: hemo.tipo || '',
        grupo_sanguineo: hemo.grupo_sanguineo || '',
        estado: hemo.estado || 'DISPONIBLE',
        fecha_ingreso: hemo.fecha_ingreso ? new Date(hemo.fecha_ingreso).toISOString().slice(0, 16) : '',
        fecha_vencimiento: hemo.fecha_vencimiento ? new Date(hemo.fecha_vencimiento).toISOString().slice(0, 16) : '',
        devuelto: hemo.devuelto || false
      });
    } else {
      setEditingHemocomponente(null);
      setFormData({
        nro_bolsa: '',
        nro_tubuladura: '',
        tipo: '',
        grupo_sanguineo: '',
        estado: 'DISPONIBLE',
        fecha_ingreso: new Date().toISOString().slice(0, 16),
        fecha_vencimiento: '',
        devuelto: false
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenDetails = async (hemo) => {
    setViewingHemocomponente(hemo);
    setIsDetailsModalOpen(true);
    setLoadingTrazabilidad(true);
    try {
      const data = await getTrazabilidades({ search: hemo.nro_bolsa });
      const records = data.results || data || [];
      // Filtrar exactamente por esta bolsa por si la búsqueda fue parcial
      const exactRecords = records.filter(r => r.nro_bolsa === hemo.nro_bolsa);
      setTrazabilidadHistory(exactRecords);
    } catch (error) {
      console.error('Error fetching trazabilidad:', error);
    } finally {
      setLoadingTrazabilidad(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHemocomponente(null);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingHemocomponente(null);
    setTrazabilidadHistory([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHemocomponente) {
        await updateHemocomponente(editingHemocomponente.nro_bolsa, formData);
      } else {
        await createHemocomponente(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving hemocomponente:', error);
      let errorMsg = 'Ocurrió un error al guardar el hemocomponente. Verifica los datos.';
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
        await deleteHemocomponente(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting hemocomponente:', error);
        let errorMsg = 'Ocurrió un error al eliminar.';
        if (error.response?.data?.error) errorMsg = error.response.data.error;
        alert(errorMsg);
      }
    }
  };

  const filteredHemocomponentes = hemocomponentes.filter(h => 
    (h.nro_bolsa?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (h.nro_tubuladura?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (h.tipo?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (h.grupo_sanguineo?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'DISPONIBLE': return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">DISPONIBLE</span>;
      case 'RESERVADO': return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200">RESERVADO</span>;
      case 'DESPACHADO': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-200">DESPACHADO</span>;
      case 'TRANSFUNDIDO': return <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold border border-indigo-200">TRANSFUNDIDO</span>;
      case 'VENCIDO': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200">VENCIDO</span>;
      case 'DESCARTADO': return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200">DESCARTADO</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">{estado}</span>;
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-red-600" />
              Inventario de Hemocomponentes
            </h1>
            <p className="text-gray-500 text-sm mt-1">Gestión de bolsas y hemoderivados en stock</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar Bolsa, Tipo..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none w-full md:w-72 transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Ingresar Unidad
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Bolsa / Tubuladura</th>
                  <th className="px-6 py-4">Componente</th>
                  <th className="px-6 py-4">Grupo ABO/Rh</th>
                  <th className="px-6 py-4">Estado / Vencimiento</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        Cargando inventario...
                      </div>
                    </td>
                  </tr>
                ) : filteredHemocomponentes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron unidades en inventario.
                    </td>
                  </tr>
                ) : (
                  filteredHemocomponentes.map((h) => (
                    <tr key={h.nro_bolsa} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenDetails(h)}>
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-gray-900">{h.nro_bolsa}</div>
                        <div className="font-mono text-xs text-gray-500">Tub: {h.nro_tubuladura}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {h.tipo?.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md w-max text-xs font-bold border bg-red-50 text-red-700 border-red-200">
                          <Droplet className="w-3.5 h-3.5 fill-red-700" />
                          {h.grupo_sanguineo}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          {getEstadoBadge(h.estado)}
                          <div className="text-[11px] text-gray-500">Vence: {new Date(h.fecha_vencimiento).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenDetails(h)}
                            className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="Ver Detalles y Trazabilidad"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(h)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(h.nro_bolsa)}
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
                <Package className="text-red-600 w-5 h-5" />
                {editingHemocomponente ? 'Editar Unidad' : 'Registrar Nueva Unidad'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="hemoForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">N° de Bolsa *</label>
                  <input 
                    type="text" 
                    required
                    disabled={!!editingHemocomponente}
                    value={formData.nro_bolsa}
                    onChange={(e) => setFormData({...formData, nro_bolsa: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 uppercase"
                    placeholder="Ej: B-1002"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">N° Tubuladura *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nro_tubuladura}
                    onChange={(e) => setFormData({...formData, nro_tubuladura: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none uppercase"
                    placeholder="Ej: TUB-45"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Componente *</label>
                  <select 
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white font-semibold"
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="SANGRE_TOTAL">Sangre Total</option>
                    <option value="GLOBULOS_ROJOS">Glóbulos Rojos</option>
                    <option value="PLASMA">Plasma</option>
                    <option value="PLAQUETAS">Plaquetas</option>
                    <option value="CRIOPRECIPITADO">Crioprecipitado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Grupo Sanguíneo *</label>
                  <select 
                    required
                    value={formData.grupo_sanguineo}
                    onChange={(e) => setFormData({...formData, grupo_sanguineo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white font-bold text-red-700"
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
                  <label className="text-sm font-medium text-gray-700">Estado Físico *</label>
                  <select 
                    required
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white font-bold"
                  >
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="RESERVADO">Reservado</option>
                    <option value="DESPACHADO">Despachado</option>
                    <option value="TRANSFUNDIDO">Transfundido</option>
                    <option value="DESCARTADO">Descartado</option>
                    <option value="VENCIDO">Vencido</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.devuelto}
                      onChange={(e) => setFormData({...formData, devuelto: e.target.checked})}
                      className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Unidad Devuelta</span>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Fecha/Hora Ingreso *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Fecha/Hora Vencimiento *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.fecha_vencimiento}
                    onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
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
                form="hemoForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
              >
                {editingHemocomponente ? 'Guardar Cambios' : 'Registrar Unidad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details & Trazabilidad Modal */}
      {isDetailsModalOpen && viewingHemocomponente && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ListTree className="text-cyan-600 w-5 h-5" />
                Detalles y Trazabilidad de la Unidad
              </h2>
              <button 
                onClick={handleCloseDetailsModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
              
              {/* Hemocomponente Info Card */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">N° de Bolsa</p>
                  <p className="font-mono font-bold text-gray-900 text-lg">{viewingHemocomponente.nro_bolsa}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Grupo ABO/Rh</p>
                  <div className="flex items-center gap-1.5 w-max text-sm font-bold text-red-700">
                    <Droplet className="w-4 h-4 fill-red-700" />
                    {viewingHemocomponente.grupo_sanguineo}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Componente</p>
                  <p className="font-semibold text-gray-800">{viewingHemocomponente.tipo?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Estado Actual</p>
                  {getEstadoBadge(viewingHemocomponente.estado)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Tubuladura</p>
                  <p className="font-mono text-gray-700">{viewingHemocomponente.nro_tubuladura}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Fecha Ingreso</p>
                  <p className="text-gray-700 text-sm">{new Date(viewingHemocomponente.fecha_ingreso).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Fecha Vencimiento</p>
                  <p className="text-gray-700 text-sm font-medium">{new Date(viewingHemocomponente.fecha_vencimiento).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">¿Devuelto?</p>
                  <p className="text-gray-700 text-sm font-bold">{viewingHemocomponente.devuelto ? 'SÍ' : 'NO'}</p>
                </div>
              </div>

              {/* Trazabilidad Timeline */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gray-400" />
                  Historial de Movimientos
                </h3>
                
                {loadingTrazabilidad ? (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : trazabilidadHistory.length === 0 ? (
                  <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
                    No se han registrado movimientos para esta unidad todavía.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trazabilidadHistory.map((evento, idx) => (
                      <div key={evento.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-3 h-3 rounded-full mt-1.5 ${idx === 0 ? 'bg-cyan-500 ring-4 ring-cyan-100' : 'bg-gray-300'}`}></div>
                          {idx !== trazabilidadHistory.length - 1 && <div className="w-0.5 h-full bg-gray-100"></div>}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-900 bg-cyan-50 text-cyan-800 px-2.5 py-0.5 rounded-lg text-sm border border-cyan-100">
                              {evento.evento}
                            </span>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                              {new Date(evento.fecha_hora).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            Registrado por: <span className="font-semibold text-gray-800">{evento.encargado_username}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HemocomponenteManagement;
