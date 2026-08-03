import React, { useState, useEffect } from 'react';
import { getSolicitudes, createSolicitud, updateSolicitud, deleteSolicitud, archivarSolicitud } from '../services/solicitudService';
import { getPacientes } from '../services/pacienteService';
import { getMedicos } from '../services/medicoService';
import { getServicios } from '../services/servicioService';
import { getTransfusiones } from '../../laboratorio/services/transfusionService';
import { useAuth } from '../../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchableSelect from '../../../components/common/SearchableSelect';
import { FileText, Plus, Edit2, Trash2, Search, X, ActivitySquare, Clock, Archive, Eye, ListTree } from 'lucide-react';
import {
  formatBackendErrors,
  onlyDecimal,
  onlyPositiveInteger,
  preventInvalidNumberKeys,
  showValidationAlert,
  validateFormData
} from '../../../utils/formValidation';

const EDAD_UNIDADES = {
  DIAS: 'días',
  MESES: 'meses',
  ANOS: 'años'
};

const URGENCIA_OPCIONES = {
  'URGENTE': 'Urgente',
  'EN_EL_DIA': 'En el día',
  'PROGRAMADA': 'Programada'
};

const HEMOCOMPONENTES_OPCIONES = {
  'PLASMA_FRESCO_CONGELADO': 'Plasma fresco congelado',
  'CRIOPRECIPITADOS': 'Crioprecipitados',
  'CONCENTRADO_PLAQUETAS': 'Concentrado de plaquetas',
  'PAQUETE_GLOBULAR': 'Paquete globular',
  'CONCENTRADO_HELITROCITO_PLAQUETAS': 'Concentrado de helitrocito y plaquetas por aféresis',
  'GLOBULO_ROJO_LAVADO': 'Glóbulo rojo lavado'
};

const getBoliviaNow = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map(part => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
};

const getInitialSolicitudForm = (userId = '') => ({
  fecha: getBoliviaNow().date,
  hora: getBoliviaNow().time,
  edad_valor: '',
  edad_unidad: 'ANOS',
  fecha_nacimiento: '',
  hto: '',
  hb: '',
  grupo: '',
  hemocomponente: '',
  cantidad: '',
  fraccionado: false,
  ml: '',
  tipo_urgencia: 'EN_EL_DIA',
  diagnostico: '',
  id_paciente: '',
  id_medico: '',
  id_servicio: '',
  id_user: userId
});

const formatEdad = (valor, unidad) => {
  if (!valor) return 'Edad no definida';
  return `${valor} ${EDAD_UNIDADES[unidad] || unidad || ''}`.trim();
};

const buildSolicitudPayload = (formData) => ({
  ...formData,
  fecha_nacimiento: formData.fecha_nacimiento || null
});

const SolicitudManagement = () => {
  const { user } = useAuth();
  const boliviaNow = getBoliviaNow();
  const [solicitudes, setSolicitudes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingSolicitud, setEditingSolicitud] = useState(null);
  const [viewingSolicitud, setViewingSolicitud] = useState(null);
  const [transfusionHistory, setTransfusionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [search, setSearch] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();

  const [groupMismatchWarning, setGroupMismatchWarning] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  
  const [formData, setFormData] = useState(getInitialSolicitudForm(user?.id || ''));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [solicitudesData, pacientesData, medicosData, serviciosData] = await Promise.all([
        getSolicitudes(),
        getPacientes(),
        getMedicos(),
        getServicios()
      ]);
      const sols = solicitudesData.results || solicitudesData || [];
      setSolicitudes(sols);
      setPacientes(pacientesData.results || pacientesData || []);
      setMedicos(medicosData.results || medicosData || []);
      setServicios(serviciosData.results || serviciosData || []);
      
      // Auto-open modal if navigated from history
      if (location.state?.openDetailsId) {
        const itemToOpen = sols.find(s => String(s.nro) === String(location.state.openDetailsId));
        if (itemToOpen) {
          handleOpenDetails(itemToOpen);
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (solicitud = null) => {
    if (solicitud) {
      setEditingSolicitud(solicitud);
      setFormData({
        nro: solicitud.nro || '',
        fecha: solicitud.fecha || '',
        hora: solicitud.hora ? solicitud.hora.substring(0, 5) : '',
        edad_valor: solicitud.edad_valor || '',
        edad_unidad: solicitud.edad_unidad || 'ANOS',
        fecha_nacimiento: solicitud.fecha_nacimiento || '',
        hto: solicitud.hto || '',
        hb: solicitud.hb || '',
        grupo: solicitud.grupo || '',
        hemocomponente: solicitud.hemocomponente || '',
        cantidad: solicitud.cantidad || '',
        fraccionado: solicitud.fraccionado || false,
        ml: solicitud.ml || '',
        tipo_urgencia: solicitud.tipo_urgencia || 'EN_EL_DIA',
        diagnostico: solicitud.diagnostico || '',
        id_paciente: solicitud.id_paciente || '',
        id_medico: solicitud.id_medico || '',
        id_servicio: solicitud.id_servicio || '',
        id_user: solicitud.id_user || user?.id || ''
      });
    } else {
      setEditingSolicitud(null);
      setFormData(getInitialSolicitudForm(user?.id || ''));
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSolicitud(null);
    setGroupMismatchWarning(false);
    setPendingFormData(null);
  };

  const handleOpenDetails = async (solicitud) => {
    setViewingSolicitud(solicitud);
    setIsDetailsModalOpen(true);
    setLoadingHistory(true);
    try {
      const history = await getTransfusiones({ solicitud: solicitud.nro });
      setTransfusionHistory(history.results || history || []);
    } catch (error) {
      console.error('Error fetching transfusion history:', error);
      setTransfusionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingSolicitud(null);
    setTransfusionHistory([]);
  };

  const processSave = async (dataToSave, editingSol) => {
    try {
      const payload = buildSolicitudPayload(dataToSave);
      if (editingSol) {
        await updateSolicitud(editingSol.nro, payload);
      } else {
        await createSolicitud(payload);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving solicitud:', error);
      let errorMsg = 'Ocurrió un error al guardar la solicitud. Verifica los datos.';
      if (error.response && error.response.data) {
        errorMsg += '\n\nDetalles:\n' + formatBackendErrors(error.response.data);
      }
      alert(errorMsg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateFormData(formData, [
      { field: 'fecha', label: 'Fecha', required: true },
      { field: 'hora', label: 'Hora', required: true },
      { field: 'id_paciente', label: 'Paciente', required: true },
      { field: 'id_medico', label: 'Médico solicitante', required: true },
      { field: 'id_servicio', label: 'Servicio', required: true },
      { field: 'hemocomponente', label: 'Hemocomponente', required: true },
      { field: 'cantidad', label: 'Cantidad', required: true, integer: true, min: 1, max: 20 },
      { field: 'tipo_urgencia', label: 'Urgencia', required: true },
      { field: 'grupo', label: 'Grupo ABO/Rh', required: true },
      { field: 'edad_valor', label: 'Edad', required: true, integer: true, min: 1 },
      { field: 'hb', label: 'Hemoglobina', required: true, decimal: true, min: 0 },
      { field: 'hto', label: 'Hematocrito', required: true, decimal: true, min: 0, max: 99.9 },
      { field: 'diagnostico', label: 'Diagnóstico principal', required: true }
    ]);
    if (showValidationAlert(errors)) return;

    const selectedPaciente = pacientes.find(p => p.ci === formData.id_paciente);
    if (selectedPaciente && selectedPaciente.grupo_sanguineo && formData.grupo) {
      if (selectedPaciente.grupo_sanguineo !== formData.grupo) {
        setPendingFormData(formData);
        setGroupMismatchWarning(true);
        return;
      }
    }

    await processSave(formData, editingSolicitud);
  };

  const handleDelete = async (nro) => {
    if (window.confirm('¿Estás seguro de eliminar esta solicitud?')) {
      try {
        await deleteSolicitud(nro);
        fetchData();
      } catch (error) {
        console.error('Error deleting solicitud:', error);
        alert('Ocurrió un error al eliminar la solicitud.');
      }
    }
  };

  const handleArchivar = async (id) => {
    if (window.confirm('¿Seguro que deseas archivar esta solicitud?')) {
      try {
        await archivarSolicitud(id);
        fetchData();
      } catch (error) {
        console.error('Error archivando:', error.response ? error.response.data : error);
        alert('Error al archivar: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const filteredSolicitudes = solicitudes.filter(s => 
    (s.nro?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (s.paciente_nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (s.medico_nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (s.hemocomponente?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const renderStatusBadge = (estado) => {
    switch(estado) {
      case 'FINALIZADA':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Finalizada</span>;
      case 'ARCHIVADA':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Archivada</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pendiente</span>;
    }
  };

  const maxHora = formData.fecha === boliviaNow.date ? boliviaNow.time : undefined;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="text-indigo-600" />
              Solicitudes de Transfusión
            </h1>
            <p className="text-gray-500 text-sm mt-1">Gestiona los pedidos de hemocomponentes</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar Nro, Paciente..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full md:w-72 transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nueva Solicitud
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">Hemocomponente</th>
                  <th className="px-6 py-4">Diagnóstico / Urgencia</th>
                  <th className="px-6 py-4">Estado / Registro</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        Cargando solicitudes...
                      </div>
                    </td>
                  </tr>
                ) : filteredSolicitudes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron solicitudes.
                    </td>
                  </tr>
                ) : (
                  filteredSolicitudes.map((sol) => (
                    <tr key={sol.nro} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenDetails(sol)}>
                      <td className="px-6 py-4">
                        <div 
                          className="font-semibold text-indigo-700 text-base hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/pacientes', { state: { openDetailsCi: sol.id_paciente } });
                          }}
                        >
                          {sol.paciente_nombre}
                        </div>
                        <div className="text-xs text-gray-500">Dr. {sol.medico_nombre}</div>
                        <div className="text-xs text-indigo-500">{sol.servicio_nombre}</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">Nro: {sol.nro}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-gray-800">{sol.hemocomponente?.replace('_', ' ')}</span>
                          <span className="text-xs text-gray-500">{sol.cantidad} unidad(es) • {sol.grupo}</span>
                          <span className="text-xs text-gray-500">Hb {sol.hb} g/dL • Hto {sol.hto}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs" title={sol.diagnostico}>
                        <div className="text-sm text-gray-600 truncate">{sol.diagnostico}</div>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {URGENCIA_OPCIONES[sol.tipo_urgencia] || sol.tipo_urgencia}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {renderStatusBadge(sol.estado)}
                          <span className="text-xs text-gray-500 mt-1">Por: <span className="font-medium text-gray-700">{sol.created_by_name || 'Sistema'}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenDetails(sol); }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ver Detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {sol.estado === 'PENDIENTE' && (
                            <button 
                              onClick={() => handleArchivar(sol.nro)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg transition-colors"
                              title="Archivar"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleOpenModal(sol)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(sol.nro)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ActivitySquare className="text-indigo-600 w-5 h-5" />
                {editingSolicitud ? 'Editar Solicitud' : 'Nueva Solicitud de Transfusión'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="solicitudForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                <div className="md:col-span-12 font-semibold text-indigo-800 border-b pb-2 mb-2">1. Información General</div>
                
                {editingSolicitud && (
                  <div className="md:col-span-4">
                    <label className="text-sm font-medium text-gray-700">Nro Solicitud</label>
                    <input disabled type="text" value={formData.nro} className="w-full mt-1 p-2 bg-gray-100 border border-gray-200 rounded-xl outline-none font-mono text-gray-500" />
                  </div>
                )}
                
                <div className="space-y-1.5 md:col-span-4">
                  <label className="text-sm font-medium text-gray-700">Fecha *</label>
                  <input 
                    type="date" 
                    required
                    max={boliviaNow.date}
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-4">
                  <label className="text-sm font-medium text-gray-700">Hora *</label>
                  <input 
                    type="time" 
                    required
                    max={maxHora}
                    value={formData.hora}
                    onChange={(e) => setFormData({...formData, hora: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="md:col-span-12 font-semibold text-indigo-800 border-b pb-2 mt-4 mb-2">2. Participantes</div>

                <div className="space-y-1.5 md:col-span-4">
                  <label className="text-sm font-medium text-gray-700">Paciente *</label>
                  <SearchableSelect
                    options={pacientes.map(p => ({
                      value: p.ci,
                      label: `${p.apellido_paterno} ${p.nombre} (CI: ${p.ci})`,
                      data: p
                    }))}
                    value={formData.id_paciente}
                    onChange={(val, selectedPaciente) => {
                      setFormData({
                        ...formData, 
                        id_paciente: val,
                        edad_valor: selectedPaciente?.edad_valor || formData.edad_valor,
                        edad_unidad: selectedPaciente?.edad_unidad || formData.edad_unidad,
                        fecha_nacimiento: selectedPaciente?.fecha_nacimiento || formData.fecha_nacimiento,
                        grupo: selectedPaciente?.grupo_sanguineo || formData.grupo
                      });
                    }}
                    placeholder="-- Buscar Paciente --"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-4">
                  <label className="text-sm font-medium text-gray-700">Médico Solicitante *</label>
                  <SearchableSelect
                    options={medicos.map(m => ({
                      value: m.id,
                      label: `Dr. ${m.apellido_paterno} ${m.nombre}`,
                      data: m
                    }))}
                    value={formData.id_medico}
                    onChange={(val) => setFormData({...formData, id_medico: val})}
                    placeholder="-- Buscar Médico --"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-4">
                  <label className="text-sm font-medium text-gray-700">Servicio *</label>
                  <SearchableSelect
                    options={servicios.map(s => ({
                      value: s.id,
                      label: s.nombre,
                      data: s
                    }))}
                    value={formData.id_servicio}
                    onChange={(val) => setFormData({...formData, id_servicio: val})}
                    placeholder="-- Buscar Servicio --"
                  />
                </div>

                <div className="md:col-span-12 font-semibold text-indigo-800 border-b pb-2 mt-4 mb-2">3. Detalles de la Solicitud</div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Hemocomponente *</label>
                  <select 
                    required
                    value={formData.hemocomponente}
                    onChange={(e) => setFormData({...formData, hemocomponente: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold"
                  >
                    <option value="" className="font-normal">-- Seleccionar --</option>
                    <option value="PLASMA_FRESCO_CONGELADO">Plasma fresco congelado</option>
                    <option value="CRIOPRECIPITADOS">Crioprecipitados</option>
                    <option value="CONCENTRADO_PLAQUETAS">Concentrado de plaquetas</option>
                    <option value="PAQUETE_GLOBULAR">Paquete globular</option>
                    <option value="CONCENTRADO_HELITROCITO_PLAQUETAS">Concentrado de helitrocito y plaquetas por aféresis</option>
                    <option value="GLOBULO_ROJO_LAVADO">Globulo rojo lavado</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Cantidad (U) *</label>
                  <input 
                    type="number" 
                    required min="1" max="20" step="1" inputMode="numeric"
                    value={formData.cantidad}
                    onKeyDown={preventInvalidNumberKeys}
                    onChange={(e) => setFormData({...formData, cantidad: onlyPositiveInteger(e.target.value, 20)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Tipo de Urgencia *</label>
                  <select required value={formData.tipo_urgencia} onChange={(e) => setFormData({...formData, tipo_urgencia: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    {Object.entries(URGENCIA_OPCIONES).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Grupo ABO/Rh *</label>
                  <select 
                    required
                    value={formData.grupo}
                    onChange={(e) => setFormData({...formData, grupo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-red-700 font-bold"
                  >
                    <option value="" className="text-gray-900 font-normal">-- Sel --</option>
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
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Edad *</label>
                  <input 
                    type="number" 
                    required min="1" step="1" inputMode="numeric"
                    value={formData.edad_valor}
                    onKeyDown={preventInvalidNumberKeys}
                    onChange={(e) => setFormData({...formData, edad_valor: onlyPositiveInteger(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Unidad *</label>
                  <select
                    required
                    value={formData.edad_unidad}
                    onChange={(e) => setFormData({...formData, edad_unidad: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="DIAS">Días</option>
                    <option value="MESES">Meses</option>
                    <option value="ANOS">Años</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                  <input
                    type="date"
                    max={boliviaNow.date}
                    value={formData.fecha_nacimiento || ''}
                    onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Hemoglobina (Hb) *</label>
                  <input 
                    type="number" 
                    required step="0.1" min="0" inputMode="decimal"
                    value={formData.hb}
                    onKeyDown={preventInvalidNumberKeys}
                    onChange={(e) => setFormData({...formData, hb: onlyDecimal(e.target.value, 1)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="g/dL"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Hematocrito (Hto %) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required step="0.1" min="0" max="99.9" inputMode="decimal"
                      value={formData.hto}
                      onKeyDown={preventInvalidNumberKeys}
                      onChange={(e) => setFormData({...formData, hto: onlyDecimal(e.target.value, 1)})}
                      className="w-full px-4 py-2 pr-9 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="0.0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">%</span>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-12">
                  <label className="text-sm font-medium text-gray-700">Diagnóstico Principal *</label>
                  <textarea 
                    required rows="2"
                    value={formData.diagnostico}
                    onChange={(e) => setFormData({...formData, diagnostico: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Escriba el diagnóstico del paciente..."
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
                form="solicitudForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 flex items-center gap-2"
              >
                <ActivitySquare className="w-4 h-4" />
                {editingSolicitud ? 'Guardar Cambios' : 'Registrar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Mismatch Modal */}
      {groupMismatchWarning && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col scale-100">
            <div className="px-6 py-4 border-b border-orange-100 flex items-center gap-3 bg-orange-50/50">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <span className="font-bold text-xl">!</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Alarma de Incompatibilidad</h2>
            </div>
            
            <div className="p-6 text-sm text-gray-600">
              <p className="mb-4 text-base">
                El grupo sanguíneo especificado en esta solicitud <strong>({pendingFormData.grupo})</strong> es diferente al grupo registrado en el expediente del paciente.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
                <p className="font-bold text-gray-900 mb-2">Datos del Paciente Registrado:</p>
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                  <p>Grupo Sanguíneo: <span className="font-bold text-orange-600 text-sm">{pacientes.find(p => p.ci === pendingFormData.id_paciente)?.grupo_sanguineo}</span></p>
                  <p>Paciente: <span className="font-medium text-gray-700">{pacientes.find(p => p.ci === pendingFormData.id_paciente)?.nombre} {pacientes.find(p => p.ci === pendingFormData.id_paciente)?.apellido_paterno}</span></p>
                </div>
              </div>
              
              <p className="text-orange-700 bg-orange-50 p-3 rounded-lg border border-orange-100 font-medium">
                ¿Estás seguro de que deseas ignorar esta alarma y guardar la solicitud con el grupo {pendingFormData.grupo}?
              </p>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => {
                  setGroupMismatchWarning(false);
                  setPendingFormData(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                Cancelar y Revisar
              </button>
              <button 
                type="button"
                onClick={() => {
                  setGroupMismatchWarning(false);
                  processSave(pendingFormData, editingSolicitud);
                }}
                className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors shadow-sm shadow-orange-600/20"
              >
                Sí, Guardar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && viewingSolicitud && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-indigo-600 w-5 h-5" />
                Detalles de la Solicitud
              </h2>
              <button
                onClick={handleCloseDetailsModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Nro. Solicitud</p>
                    <p className="font-mono text-gray-900">{viewingSolicitud.nro}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Estado</p>
                    <p className="font-semibold text-gray-900">{viewingSolicitud.estado}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Paciente</p>
                    <p 
                      className="font-semibold text-indigo-600 hover:underline cursor-pointer"
                      onClick={() => navigate('/pacientes', { state: { openDetailsCi: viewingSolicitud.id_paciente } })}
                    >
                      {viewingSolicitud.paciente_nombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Médico Solicitante</p>
                    <p className="font-semibold text-gray-900">Dr/a. {viewingSolicitud.medico_nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Hemocomponente</p>
                    <p className="font-semibold text-indigo-700">{HEMOCOMPONENTES_OPCIONES[viewingSolicitud.hemocomponente] || viewingSolicitud.hemocomponente}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Cantidad / Urgencia</p>
                    <p className="font-semibold text-gray-900">{viewingSolicitud.cantidad} uni. - {URGENCIA_OPCIONES[viewingSolicitud.tipo_urgencia] || viewingSolicitud.tipo_urgencia}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 font-medium mb-1">Diagnóstico</p>
                    <p className="text-gray-700">{viewingSolicitud.diagnostico}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 font-medium mb-1">Auditoría de Registro</p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm text-gray-700">
                        <span className="text-gray-500 text-xs">Creado por:</span> <span className="font-medium">{viewingSolicitud.created_by_name || 'Sistema'}</span>
                      </p>
                      {viewingSolicitud.updated_by_name && (
                        <p className="text-sm text-gray-700">
                          <span className="text-gray-500 text-xs">Última edición por:</span> <span className="font-medium">{viewingSolicitud.updated_by_name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Historial de Transfusiones */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ListTree className="w-4 h-4" />
                  Historial de Transfusiones de esta Solicitud
                </h3>

                {loadingHistory ? (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : transfusionHistory.length === 0 ? (
                  <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
                    Aún no se han registrado transfusiones asociadas a esta solicitud.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transfusionHistory.map((transfusion, idx) => (
                      <div 
                        key={transfusion.id} 
                        className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
                        onClick={() => { handleCloseDetailsModal(); navigate('/transfusiones', { state: { openDetailsId: transfusion.id } }); }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-3 h-3 rounded-full mt-1.5 ${idx === 0 ? 'bg-indigo-500 ring-4 ring-indigo-100' : 'bg-gray-300'}`}></div>
                          {idx !== transfusionHistory.length - 1 && <div className="w-0.5 h-full bg-gray-100"></div>}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-900 bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-lg text-sm border border-indigo-100">
                              Bolsa: {transfusion.nro_bolsa || transfusion.hemocomponente}
                            </span>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                              {new Date(transfusion.hora_inicio).toLocaleString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                            <div className="text-gray-600">
                              Volumen: <span className="font-semibold text-gray-800">{transfusion.ml} ml</span>
                            </div>
                            <div className="text-gray-600">
                              Fraccionado: <span className="font-semibold text-gray-800">{transfusion.fraccionado ? 'Sí' : 'No'}</span>
                            </div>
                            <div className="text-gray-600 col-span-2">
                              Diagnóstico: <span className="font-medium text-gray-800">{transfusion.diagnostico}</span>
                            </div>
                            {transfusion.ate_trans_alerg && (
                              <div className="col-span-2 text-red-600 font-medium text-xs bg-red-50 p-2 rounded border border-red-100 mt-1">
                                ⚠️ Se registró reacción adversa durante la transfusión.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={handleCloseDetailsModal} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SolicitudManagement;
