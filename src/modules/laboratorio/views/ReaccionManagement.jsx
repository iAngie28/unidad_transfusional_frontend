import React, { useState, useEffect } from 'react';
import { getReacciones, createReaccion, updateReaccion, deleteReaccion } from '../services/reaccionService';
import { getTransfusiones } from '../services/transfusionService';
import { AlertTriangle, Plus, Edit2, Trash2, Search, X, Eye } from 'lucide-react';
import { formatBackendErrors, showValidationAlert, validateFormData } from '../../../utils/formValidation';

const BOLIVIA_TIME_ZONE = 'America/La_Paz';

const getBoliviaDateTimeLocal = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOLIVIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const toBoliviaIsoDateTime = (value) => {
  if (!value) return value;
  const valueWithSeconds = value.length === 16 ? `${value}:00` : value;
  return `${valueWithSeconds}-04:00`;
};

const getInitialReaccionForm = () => ({
  id_transfusion: '',
  descripcion: '',
  fecha_hora: getBoliviaDateTimeLocal()
});

const ReaccionManagement = () => {
  const [reacciones, setReacciones] = useState([]);
  const [transfusiones, setTransfusiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReaccion, setEditingReaccion] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState(getInitialReaccionForm());

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
        fecha_hora: reaccion.fecha_hora ? getBoliviaDateTimeLocal(reaccion.fecha_hora) : ''
      });
    } else {
      setEditingReaccion(null);
      setFormData(getInitialReaccionForm());
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
    const errors = validateFormData(formData, [
      { field: 'id_transfusion', label: 'Transfusión afectada', required: true },
      { field: 'descripcion', label: 'Descripción de la reacción', required: true },
      { field: 'fecha_hora', label: 'Fecha y hora', required: true }
    ]);
    if (minFechaHora && formData.fecha_hora && formData.fecha_hora < minFechaHora) {
      errors.push('Fecha y hora: no puede ser anterior al inicio de la transfusión.');
    }
    if (maxFechaHora && formData.fecha_hora && formData.fecha_hora > maxFechaHora) {
      errors.push('Fecha y hora: no puede ser posterior al fin de la transfusión ni estar en el futuro.');
    }
    if (showValidationAlert(errors)) return;

    try {
      const payload = {
        ...formData,
        descripcion: formData.descripcion.trim(),
        fecha_hora: toBoliviaIsoDateTime(formData.fecha_hora)
      };

      if (editingReaccion) {
        await updateReaccion(editingReaccion.id, payload);
      } else {
        await createReaccion(payload);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error(error);
      let errorMsg = 'Error al guardar la reaccion. Verifica los datos.';
      if (error.response?.data) {
        errorMsg += `\n\nDetalles:\n${formatBackendErrors(error.response.data)}`;
      }
      alert(errorMsg);
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
  const selectedTransfusion = transfusiones.find((t) => String(t.id) === String(formData.id_transfusion));
  const minFechaHora = selectedTransfusion?.hora_inicio
    ? getBoliviaDateTimeLocal(selectedTransfusion.hora_inicio)
    : undefined;
  const maxFechaHora = selectedTransfusion?.hora_fin
    ? getBoliviaDateTimeLocal(selectedTransfusion.hora_fin)
    : getBoliviaDateTimeLocal();

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl outline-none"
              />
            </div>
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
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    Cargando reacciones...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No hay reacciones registradas.
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingReaccion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col">
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
          <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col">
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
                  <input
                    type="datetime-local"
                    required
                    min={minFechaHora}
                    max={maxFechaHora}
                    value={formData.fecha_hora}
                    onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})}
                    className="w-full p-2 border rounded-lg mt-1"
                  />
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
