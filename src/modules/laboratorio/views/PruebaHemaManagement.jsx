import React, { useState, useEffect } from 'react';
import { getPruebasHema, createPruebaHema, updatePruebaHema, deletePruebaHema } from '../services/pruebaHemaService';
import { getHemocomponentes } from '../../inventario/services/hemocomponenteService';
import { getSolicitudes } from '../../admision/services/solicitudService';
import { useAuth } from '../../../contexts/AuthContext';
import { Microscope, Plus, Edit2, Trash2, Search, X, Eye } from 'lucide-react';

const PruebaHemaManagement = () => {
  const { user } = useAuth();
  const [pruebas, setPruebas] = useState([]);
  const [bolsas, setBolsas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrueba, setEditingPrueba] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().slice(0, 16),
    nro_bolsa: '',
    user_id: user?.id || '',
    nro_solicitud: '',
    salina: '', albumina: '', liss: '', coombs: '', cruzada_mayor: '', cruzada_menor: '', hemolisis: '',
    anti_a: 'NO_REALIZADO', anti_b: 'NO_REALIZADO', anti_ab: 'NO_REALIZADO', anti_d: 'NO_REALIZADO', celula_a: '', celula_b: '', celula_o: '', fenotipo: ''
  });

  const [viewingPrueba, setViewingPrueba] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pruebasData, bolsasData, solicitudesData] = await Promise.all([
        getPruebasHema(),
        getHemocomponentes(),
        getSolicitudes()
      ]);
      setPruebas(pruebasData.results || pruebasData || []);
      setBolsas(bolsasData.results || bolsasData || []);
      setSolicitudes(solicitudesData.results || solicitudesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prueba = null) => {
    if (prueba) {
      setEditingPrueba(prueba);
      setFormData({
        ...prueba,
        fecha: prueba.fecha ? new Date(prueba.fecha).toISOString().slice(0, 16) : '',
        user_id: prueba.user_id || user?.id || ''
      });
    } else {
      setEditingPrueba(null);
      setFormData({
        fecha: new Date().toISOString().slice(0, 16),
        nro_bolsa: '',
        user_id: user?.id || '',
        nro_solicitud: '',
        salina: '', albumina: '', liss: '', coombs: '', cruzada_mayor: '', cruzada_menor: '', hemolisis: '',
        anti_a: 'NO_REALIZADO', anti_b: 'NO_REALIZADO', anti_ab: 'NO_REALIZADO', anti_d: 'NO_REALIZADO', celula_a: '', celula_b: '', celula_o: '', fenotipo: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrueba(null);
  };

  const handleOpenView = (prueba) => {
    setViewingPrueba(prueba);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPrueba) {
        await updatePruebaHema(editingPrueba.id, formData);
      } else {
        await createPruebaHema(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving prueba hema:', error);
      let errorMsg = 'Ocurrió un error al guardar. Verifica los datos.';
      if (error.response?.data) {
        errorMsg += '\n\n' + JSON.stringify(error.response.data);
      }
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        await deletePruebaHema(id);
        fetchData();
      } catch (error) {
        alert('Ocurrió un error al eliminar.');
      }
    }
  };

  const filteredPruebas = pruebas.filter(p => 
    (p.nro_bolsa?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (String(p.nro_solicitud).toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Microscope className="text-pink-600" />
              Pruebas Cruzadas (Hemocomponente)
            </h1>
            <p className="text-gray-500 text-sm mt-1">Análisis de compatibilidad de bolsas sanguíneas</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar Bolsa..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none w-full md:w-72"
              />
            </div>
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-xl hover:bg-pink-700 shadow-sm">
              <Plus className="w-4 h-4" />
              Nueva Prueba
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Hemocomponente</th>
                  <th className="px-6 py-4">N° Solicitud</th>
                  <th className="px-6 py-4">Cruzada Mayor</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Cargando...</td></tr>
                ) : filteredPruebas.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No se encontraron registros.</td></tr>
                ) : (
                  filteredPruebas.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-mono">#{p.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{p.nro_bolsa}</td>
                      <td className="px-6 py-4 text-gray-600">{p.nro_solicitud || 'N/A'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{p.cruzada_mayor || '-'}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(p.fecha).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenView(p)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-blue-50 rounded-lg" title="Ver Detalles"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleOpenModal(p)} className="p-1.5 text-gray-400 hover:text-pink-600 bg-pink-50 rounded-lg" title="Editar"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-red-50 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
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

      {viewingPrueba && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-pink-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Microscope className="text-pink-600 w-5 h-5" />
                Detalle de Prueba Cruzada #{viewingPrueba.id}
              </h2>
              <button onClick={() => setViewingPrueba(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                
                <div className="col-span-2 md:col-span-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Información General</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div><p className="text-xs text-gray-500">Hemocomponente</p><p className="font-bold text-gray-900">{viewingPrueba.nro_bolsa}</p></div>
                    <div><p className="text-xs text-gray-500">Solicitud Asociada</p><p className="font-bold text-gray-900">{viewingPrueba.nro_solicitud || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Fecha y Hora</p><p className="font-bold text-gray-900">{new Date(viewingPrueba.fecha).toLocaleString()}</p></div>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-4 mt-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Fase en Tubo</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                    <div><p className="text-xs text-gray-500">Salina</p><p className="font-bold text-gray-900">{viewingPrueba.salina || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Albúmina</p><p className="font-bold text-gray-900">{viewingPrueba.albumina || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">LISS</p><p className="font-bold text-gray-900">{viewingPrueba.liss || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Coombs</p><p className="font-bold text-gray-900">{viewingPrueba.coombs || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Cruzada Mayor</p><p className="font-bold text-gray-900">{viewingPrueba.cruzada_mayor || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Cruzada Menor</p><p className="font-bold text-gray-900">{viewingPrueba.cruzada_menor || '-'}</p></div>
                    <div className="col-span-2"><p className="text-xs text-gray-500">Hemólisis</p><p className="font-bold text-gray-900">{viewingPrueba.hemolisis || '-'}</p></div>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-4 mt-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Clasificación & Serología</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-pink-50/30 p-4 rounded-xl border border-pink-100">
                    <div><p className="text-xs text-gray-500">Anti-A</p><p className="font-bold text-gray-900">{viewingPrueba.anti_a}</p></div>
                    <div><p className="text-xs text-gray-500">Anti-B</p><p className="font-bold text-gray-900">{viewingPrueba.anti_b}</p></div>
                    <div><p className="text-xs text-gray-500">Anti-AB</p><p className="font-bold text-gray-900">{viewingPrueba.anti_ab}</p></div>
                    <div><p className="text-xs text-gray-500">Anti-D</p><p className="font-bold text-gray-900">{viewingPrueba.anti_d}</p></div>
                    
                    <div><p className="text-xs text-gray-500">Célula A</p><p className="font-bold text-gray-900">{viewingPrueba.celula_a || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Célula B</p><p className="font-bold text-gray-900">{viewingPrueba.celula_b || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Célula O</p><p className="font-bold text-gray-900">{viewingPrueba.celula_o || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Fenotipo</p><p className="font-bold text-gray-900">{viewingPrueba.fenotipo || '-'}</p></div>
                  </div>
                </div>

              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setViewingPrueba(null)} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Microscope className="text-pink-600 w-5 h-5" />
                {editingPrueba ? 'Editar Prueba' : 'Nueva Prueba (Hemocomponente)'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="pruebaHemaForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-4">
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-gray-700">N° Bolsa (Hemocomponente) *</label>
                  <select required value={formData.nro_bolsa} onChange={(e) => setFormData({...formData, nro_bolsa: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-mono">
                    <option value="">-- Seleccionar --</option>
                    {bolsas.map(b => <option key={b.nro_bolsa} value={b.nro_bolsa}>{b.nro_bolsa} - {b.tipo}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Solicitud Asociada *</label>
                  <select required value={formData.nro_solicitud} onChange={(e) => setFormData({...formData, nro_solicitud: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                    <option value="">-- Seleccionar --</option>
                    {solicitudes.map(s => <option key={s.nro} value={s.nro}>Sol #{s.nro}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Fecha y Hora *</label>
                  <input type="datetime-local" required value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                </div>

                <div className="md:col-span-4 mt-2 pb-1 border-b border-gray-100">
                  <h3 className="text-xs font-bold text-pink-800 uppercase tracking-wider">Fase en Tubo</h3>
                </div>
                {['salina', 'albumina', 'liss', 'coombs', 'cruzada_mayor', 'cruzada_menor', 'hemolisis'].map(field => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600 capitalize">{field.replace('_', ' ')}</label>
                    <input type="text" maxLength="50" value={formData[field]} onChange={(e) => setFormData({...formData, [field]: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                  </div>
                ))}

                <div className="md:col-span-4 mt-2 pb-1 border-b border-gray-100">
                  <h3 className="text-xs font-bold text-pink-800 uppercase tracking-wider">Clasificación & Serología</h3>
                </div>
                {['anti_a', 'anti_b', 'anti_ab', 'anti_d'].map(field => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600 capitalize">{field.replace('_', ' ')} *</label>
                    <select required value={formData[field]} onChange={(e) => setFormData({...formData, [field]: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                      <option value="POSITIVO">POSITIVO</option>
                      <option value="NEGATIVO">NEGATIVO</option>
                      <option value="NO_REALIZADO">NO REALIZADO</option>
                    </select>
                  </div>
                ))}
                {['celula_a', 'celula_b', 'celula_o', 'fenotipo'].map(field => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-[11px] font-medium text-gray-600 capitalize">{field.replace('_', ' ')}</label>
                    <input type="text" maxLength="50" value={formData[field]} onChange={(e) => setFormData({...formData, [field]: e.target.value})} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" />
                  </div>
                ))}

              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl">Cancelar</button>
              <button type="submit" form="pruebaHemaForm" className="px-5 py-2.5 text-sm font-medium text-white bg-pink-600 rounded-xl hover:bg-pink-700">{editingPrueba ? 'Guardar Cambios' : 'Registrar Prueba'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PruebaHemaManagement;
