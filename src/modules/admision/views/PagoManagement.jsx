import React, { useState, useEffect } from 'react';
import { getPagos, createPago, updatePago, deletePago } from '../services/pagoService';
import { getCitaciones } from '../services/citacionService';
import { CreditCard, Plus, Edit2, Trash2, Search, X } from 'lucide-react';

const PagoManagement = () => {
  const [pagos, setPagos] = useState([]);
  const [citaciones, setCitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPago, setEditingPago] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    estado: 'PENDIENTE',
    es_sus: true,
    id_citacion: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pagosData, citacionesData] = await Promise.all([
        getPagos(),
        getCitaciones()
      ]);
      setPagos(pagosData.results || pagosData || []);
      setCitaciones(citacionesData.results || citacionesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pago = null) => {
    if (pago) {
      setEditingPago(pago);
      setFormData({
        estado: pago.estado || 'PENDIENTE',
        es_sus: pago.es_sus !== undefined ? pago.es_sus : true,
        id_citacion: pago.id_citacion || ''
      });
    } else {
      setEditingPago(null);
      setFormData({
        estado: 'PENDIENTE',
        es_sus: true,
        id_citacion: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPago(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPago) {
        await updatePago(editingPago.id, formData);
      } else {
        await createPago(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving pago:', error);
      let errorMsg = 'Ocurrió un error al guardar el pago. Verifica los datos.';
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
    if (window.confirm('¿Estás seguro de eliminar este pago?')) {
      try {
        await deletePago(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting pago:', error);
        alert('Ocurrió un error al eliminar.');
      }
    }
  };

  const filteredPagos = pagos.filter(p => 
    (p.nro_solicitud?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.estado?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const formatEstado = (estado) => {
    switch (estado) {
      case 'PAGADO': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold border border-green-200">PAGADO</span>;
      case 'EXENTO': return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold border border-purple-200">EXENTO</span>;
      case 'ANULADO': return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold border border-gray-200">ANULADO</span>;
      default: return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold border border-yellow-200">PENDIENTE</span>;
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="text-green-600" />
              Gestión de Pagos
            </h1>
            <p className="text-gray-500 text-sm mt-1">Control de pagos y exenciones (SUS)</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar Solicitud, Estado..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none w-full md:w-72 transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nuevo Pago
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">ID Pago</th>
                  <th className="px-6 py-4">Solicitud / Citación</th>
                  <th className="px-6 py-4">Seguro (SUS)</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        Cargando pagos...
                      </div>
                    </td>
                  </tr>
                ) : filteredPagos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron registros.
                    </td>
                  </tr>
                ) : (
                  filteredPagos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-medium text-gray-600">
                        #{p.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-indigo-600">
                          {p.nro_solicitud || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Citación: {p.id_citacion ? `#${p.id_citacion}` : 'Ninguna'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {p.es_sus ? (
                          <span className="text-green-600 font-medium">Sí (SUS)</span>
                        ) : (
                          <span className="text-gray-500 font-medium">No (Particular)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {formatEstado(p.estado)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(p)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)}
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
                <CreditCard className="text-green-600 w-5 h-5" />
                {editingPago ? 'Editar Pago' : 'Nuevo Pago'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="pagoForm" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Citación de Donante (Opcional)</label>
                  <select 
                    value={formData.id_citacion}
                    onChange={(e) => setFormData({...formData, id_citacion: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white"
                  >
                    <option value="">-- Sin citación vinculada --</option>
                    {citaciones.map(c => (
                      <option key={c.id} value={c.id}>Citación #{c.id} - Donante: {c.codigo_donante}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Estado del Pago *</label>
                  <select 
                    required
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white font-bold"
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PAGADO">Pagado</option>
                    <option value="EXENTO">Exento</option>
                    <option value="ANULADO">Anulado</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <input 
                    type="checkbox" 
                    id="es_sus"
                    checked={formData.es_sus}
                    onChange={(e) => setFormData({...formData, es_sus: e.target.checked})}
                    className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <div className="flex flex-col">
                    <label htmlFor="es_sus" className="text-sm font-bold text-gray-900 cursor-pointer">
                      Asegurado por el SUS
                    </label>
                    <span className="text-xs text-gray-500">Marcar si el paciente goza de seguro universal de salud</span>
                  </div>
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
                form="pagoForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20"
              >
                {editingPago ? 'Guardar Cambios' : 'Registrar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PagoManagement;
