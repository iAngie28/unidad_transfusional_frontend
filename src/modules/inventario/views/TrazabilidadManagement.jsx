import React, { useState, useEffect } from 'react';
import { getTrazabilidades, createTrazabilidad, updateTrazabilidad, deleteTrazabilidad } from '../services/trazabilidadService';
import { getHemocomponentes } from '../services/hemocomponenteService';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ListTree, Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { formatBackendErrors, showValidationAlert, validateFormData } from '../../../utils/formValidation';

const BOLIVIA_TIME_ZONE = 'America/La_Paz';

const EVENTOS_TRAZABILIDAD = [
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'FRACCIONAMIENTO', label: 'Fraccionamiento' },
  { value: 'RESERVA', label: 'Reserva' },
  { value: 'DESPACHO', label: 'Despacho' },
  { value: 'DEVOLUCION', label: 'Devolución' },
  { value: 'DESCARTE', label: 'Descarte' }
];

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

const getInitialTrazabilidadForm = (userId = '') => ({
  nro_bolsa: '',
  evento: 'INGRESO',
  encargado: userId,
  fecha_hora: getBoliviaDateTimeLocal()
});

const TrazabilidadManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trazabilidades, setTrazabilidades] = useState([]);
  const [hemocomponentes, setHemocomponentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrazabilidad, setEditingTrazabilidad] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState(getInitialTrazabilidadForm(user?.id || ''));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trazabilidadesData, hemocomponentesData] = await Promise.all([
        getTrazabilidades(),
        getHemocomponentes()
      ]);
      setTrazabilidades(trazabilidadesData.results || trazabilidadesData || []);
      setHemocomponentes(hemocomponentesData.results || hemocomponentesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (trazabilidad = null) => {
    if (trazabilidad) {
      setEditingTrazabilidad(trazabilidad);
      setFormData({
        nro_bolsa: trazabilidad.nro_bolsa || '',
        evento: trazabilidad.evento || 'INGRESO',
        encargado: trazabilidad.encargado || user?.id || '',
        fecha_hora: trazabilidad.fecha_hora ? getBoliviaDateTimeLocal(trazabilidad.fecha_hora) : ''
      });
    } else {
      setEditingTrazabilidad(null);
      setFormData(getInitialTrazabilidadForm(user?.id || ''));
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTrazabilidad(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateFormData(formData, [
      { field: 'nro_bolsa', label: 'Hemocomponente', required: true },
      { field: 'evento', label: 'Tipo de evento', required: true },
      { field: 'fecha_hora', label: 'Fecha y hora', required: true }
    ]);
    if (minFechaHora && formData.fecha_hora && formData.fecha_hora < minFechaHora) {
      errors.push('Fecha y hora: no puede ser anterior al ingreso del hemocomponente.');
    }
    if (formData.fecha_hora && formData.fecha_hora > getBoliviaDateTimeLocal()) {
      errors.push('Fecha y hora: no puede estar en el futuro.');
    }
    if (showValidationAlert(errors)) return;

    try {
      const payload = {
        ...formData,
        fecha_hora: toBoliviaIsoDateTime(formData.fecha_hora)
      };

      if (editingTrazabilidad) {
        await updateTrazabilidad(editingTrazabilidad.id, payload);
      } else {
        await createTrazabilidad(payload);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving trazabilidad:', error);
      let errorMsg = 'Ocurrió un error al registrar el evento. Verifica los datos.';
      if (error.response && error.response.data) {
        errorMsg += '\n\nDetalles:\n' + formatBackendErrors(error.response.data);
      }
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro de trazabilidad?')) {
      try {
        await deleteTrazabilidad(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting trazabilidad:', error);
        alert('Ocurrió un error al eliminar el registro.');
      }
    }
  };

  const filteredTrazabilidades = trazabilidades.filter(t => 
    (t.nro_bolsa?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (t.evento?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (t.encargado_username?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const selectedHemocomponente = hemocomponentes.find((h) => h.nro_bolsa === formData.nro_bolsa);
  const minFechaHora = selectedHemocomponente?.fecha_ingreso
    ? getBoliviaDateTimeLocal(selectedHemocomponente.fecha_ingreso)
    : undefined;
  const nowBolivia = getBoliviaDateTimeLocal();

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ListTree className="text-cyan-600" />
              Trazabilidad
            </h1>
            <p className="text-gray-500 text-sm mt-1">Bitácora de eventos y ciclo de vida de cada unidad</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar Bolsa, Evento..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none w-full md:w-72 transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-xl hover:bg-cyan-700 transition-colors shadow-sm shadow-cyan-600/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Registrar Evento
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Bolsa / Unidad</th>
                  <th className="px-6 py-4">Evento</th>
                  <th className="px-6 py-4">Encargado</th>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        Cargando registros...
                      </div>
                    </td>
                  </tr>
                ) : filteredTrazabilidades.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron registros de trazabilidad.
                    </td>
                  </tr>
                ) : (
                  filteredTrazabilidades.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div
                          className="font-mono font-bold text-indigo-700 hover:underline cursor-pointer"
                          onClick={() => navigate('/hemocomponentes', { state: { openDetailsNroBolsa: t.nro_bolsa } })}
                          title="Ver detalles del hemocomponente"
                        >
                          {t.nro_bolsa}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-cyan-700 bg-cyan-50 px-2 py-1 rounded-lg border border-cyan-100">
                          {t.evento}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700">{t.encargado_username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600">{new Date(t.fecha_hora).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(t)}
                            className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ListTree className="text-cyan-600 w-5 h-5" />
                {editingTrazabilidad ? 'Editar Evento' : 'Registrar Evento de Trazabilidad'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="trazabilidadForm" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Hemocomponente (Bolsa) *</label>
                  <select 
                    required
                    value={formData.nro_bolsa}
                    onChange={(e) => setFormData({...formData, nro_bolsa: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white font-mono"
                  >
                    <option value="">-- Seleccionar Bolsa --</option>
                    {hemocomponentes.map(h => (
                      <option key={h.nro_bolsa} value={h.nro_bolsa}>{h.nro_bolsa} - {h.tipo?.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Tipo de Evento *</label>
                  <select 
                    required
                    value={formData.evento}
                    onChange={(e) => setFormData({...formData, evento: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none bg-white font-bold"
                  >
                    {EVENTOS_TRAZABILIDAD.map((evento) => (
                      <option key={evento.value} value={evento.value}>{evento.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Fecha y Hora *</label>
                  <input 
                    type="datetime-local" 
                    required
                    min={minFechaHora}
                    max={nowBolivia}
                    value={formData.fecha_hora}
                    onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
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
                form="trazabilidadForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-colors shadow-sm shadow-cyan-600/20"
              >
                {editingTrazabilidad ? 'Guardar Cambios' : 'Registrar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrazabilidadManagement;
