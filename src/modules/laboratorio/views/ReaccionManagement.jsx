import React, { useState, useEffect } from 'react';
import { getReacciones, createReaccion, updateReaccion, deleteReaccion } from '../services/reaccionService';
import { getTransfusiones } from '../services/transfusionService';
import { AlertTriangle, Plus, Edit2, Trash2, Search, X, Eye } from 'lucide-react';

const ReaccionManagement = () => {
  const [reacciones, setReacciones] = useState([]);
  const [transfusiones, setTransfusiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReaccion, setEditingReaccion] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    id_transfusion: '',
    descripcion: '',
    fecha_hora: new Date().toISOString().slice(0, 16)
  });

  const [viewingReaccion, setViewingReaccion] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reaccData, transData] = await Promise.all([
        getReacciones(),
        getTransfusiones()
      ]);
      setReacciones(reaccData.results || reaccData || []);
      setTransfusiones(transData.results || transData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (reaccion = null) => {
    if (reaccion) {
      setEditingReaccion(reaccion);
      setFormData({
        id_transfusion: reaccion.id_transfusion,
        descripcion: reaccion.descripcion,
        fecha_hora: reaccion.fecha_hora ? new Date(reaccion.fecha_hora).toISOString().slice(0, 16) : ''
      });
    } else {
      setEditingReaccion(null);
      setFormData({
        id_transfusion: '',
        descripcion: '',
        fecha_hora: new Date().toISOString().slice(0, 16)
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReaccion(null);
  };

  const handleOpenView = (reaccion) => {
    setViewingReaccion(reaccion);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReaccion) {
        await updateReaccion(editingReaccion.id, formData);
      } else {
        await createReaccion(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      alert('Error al guardar. Ver consola.');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta reacción adversa?')) {
      try {
        await deleteReaccion(id);
        fetchData();
      } catch (error) {
        alert('Error al eliminar.');
      }
    }
  };

  const filtered = reacciones.filter(r => 
    (r.descripcion?.toLowerCase() || '').includes(search.toLowerCase()) ||
    String(r.id_transfusion).includes(search)
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" />
              Reacciones Adversas a Transfusión
            </h1>
            <p className="text-gray-500 text-sm mt-1">Registro de incidentes o reacciones durante la transfusión</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl outline-none"
            />
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl">
              <Plus className="w-4 h-4" /> Registrar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
              <tr>
                <th className="px-6 py-4">ID Transfusión</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4">Fecha/Hora</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold">Transf. #{r.id_transfusion}</td>
                  <td className="px-6 py-4 text-red-600 font-medium">{r.descripcion}</td>
                  <td className="px-6 py-4">{new Date(r.fecha_hora).toLocaleString()}</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenView(r)} className="p-1.5 text-gray-400 hover:text-orange-500 bg-orange-50 rounded-lg" title="Ver Detalles"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleOpenModal(r)} className="p-1.5 text-gray-400 hover:text-orange-500 bg-orange-50 rounded-lg" title="Editar"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-red-50 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingReaccion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-orange-600 w-5 h-5" />
                Detalle de Reacción Adversa
              </h2>
              <button onClick={() => setViewingReaccion(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Transfusión Afectada</p>
                  <p className="font-bold text-gray-900 text-lg">Tr. #{viewingReaccion.id_transfusion}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Fecha y Hora</p>
                  <p className="font-medium text-gray-900">{new Date(viewingReaccion.fecha_hora).toLocaleString()}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Descripción del Incidente</p>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-800 whitespace-pre-wrap">
                    {viewingReaccion.descripcion}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setViewingReaccion(null)} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2"><AlertTriangle className="text-orange-500" /> {editingReaccion ? 'Editar' : 'Registrar Reacción'}</h2>
              <button onClick={handleCloseModal}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <form id="reacForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Transfusión Afectada *</label>
                  <select required value={formData.id_transfusion} onChange={(e) => setFormData({...formData, id_transfusion: e.target.value})} className="w-full p-2 border rounded-lg mt-1">
                    <option value="">Seleccionar Transfusión</option>
                    {transfusiones.map(t => <option key={t.id} value={t.id}>Tr. #{t.id} | Pac: {t.paciente_nombre} | Bolsa: {t.nro_bolsa}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción de la Reacción *</label>
                  <textarea required value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} className="w-full p-2 border rounded-lg mt-1 h-32" placeholder="Ej. Fiebre, escalofríos, urticaria..." />
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha y Hora *</label>
                  <input type="datetime-local" required value={formData.fecha_hora} onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})} className="w-full p-2 border rounded-lg mt-1" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-white border rounded-xl">Cancelar</button>
              <button type="submit" form="reacForm" className="px-5 py-2 text-white bg-orange-500 rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default ReaccionManagement;
