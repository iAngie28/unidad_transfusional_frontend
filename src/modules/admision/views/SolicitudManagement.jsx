import React, { useState, useEffect } from 'react';
import { getSolicitudes, createSolicitud, updateSolicitud, deleteSolicitud } from '../services/solicitudService';
import { getPacientes } from '../services/pacienteService';
import { getMedicos } from '../services/medicoService';
import { useAuth } from '../../../contexts/AuthContext';
import { FileText, Plus, Edit2, Trash2, Search, X, ActivitySquare, Clock } from 'lucide-react';

const EDAD_UNIDADES = {
  DIAS: 'días',
  MESES: 'meses',
  ANOS: 'años'
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
  nro: '',
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
  tipo_urgencia: '',
  diagnostico: '',
  id_paciente: '',
  id_medico: '',
  id_user: userId
});

const formatEdad = (valor, unidad) => {
  if (!valor) return 'Edad no definida';
  return `${valor} ${EDAD_UNIDADES[unidad] || unidad || ''}`.trim();
};

const buildSolicitudPayload = (formData) => ({
  ...formData,
  cantidad: formData.fraccionado ? 1 : formData.cantidad,
  ml: formData.fraccionado ? Number(formData.ml) : null,
  fecha_nacimiento: formData.fecha_nacimiento || null
});

const SolicitudManagement = () => {
  const { user } = useAuth();
  const boliviaNow = getBoliviaNow();
  const [solicitudes, setSolicitudes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSolicitud, setEditingSolicitud] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState(getInitialSolicitudForm(user?.id || ''));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [solicitudesData, pacientesData, medicosData] = await Promise.all([
        getSolicitudes(),
        getPacientes(),
        getMedicos()
      ]);
      setSolicitudes(solicitudesData.results || solicitudesData || []);
      setPacientes(pacientesData.results || pacientesData || []);
      setMedicos(medicosData.results || medicosData || []);
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
        tipo_urgencia: solicitud.tipo_urgencia || '',
        diagnostico: solicitud.diagnostico || '',
        id_paciente: solicitud.id_paciente || '',
        id_medico: solicitud.id_medico || '',
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = buildSolicitudPayload(formData);
      if (editingSolicitud) {
        await updateSolicitud(editingSolicitud.nro, payload);
      } else {
        await createSolicitud(payload);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving solicitud:', error);
      let errorMsg = 'Ocurrió un error al guardar la solicitud. Verifica los datos.';
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

  const filteredSolicitudes = solicitudes.filter(s => 
    (s.nro?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (s.paciente_nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (s.medico_nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (s.hemocomponente?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const formatUrgencia = (urgencia) => {
    switch (urgencia) {
      case 'EMERGENCIA': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold border border-red-200">EMERGENCIA</span>;
      case 'URGENTE': return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold border border-orange-200">URGENTE</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-200">RUTINA</span>;
    }
  };

  const maxHora = formData.fecha === boliviaNow.date ? boliviaNow.time : undefined;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header Section */}
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

        {/* Solicitudes Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">N° Solicitud</th>
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">Hemocomponente</th>
                  <th className="px-6 py-4">Prioridad / Fecha</th>
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
                  filteredSolicitudes.map((s) => (
                    <tr key={s.nro} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-medium text-indigo-700">
                        {s.nro}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{s.paciente_nombre}</div>
                        <div className="text-xs text-gray-500">Dr. {s.medico_nombre}</div>
                        <div className="text-xs text-gray-400">{formatEdad(s.edad_valor, s.edad_unidad)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-gray-800">{s.hemocomponente?.replace('_', ' ')}</span>
                          <span className="text-xs text-gray-500">{s.cantidad} unidad(es) • {s.grupo}</span>
                          {s.fraccionado && <span className="text-xs font-semibold text-indigo-600">Fraccionada • {s.ml} ml</span>}
                          <span className="text-xs text-gray-500">Hb {s.hb} g/dL • Hto {s.hto}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {formatUrgencia(s.tipo_urgencia)}
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {s.fecha} {s.hora?.substring(0,5)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(s)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.nro)}
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
                
                {/* Bloque 1: Identificadores y Tiempos */}
                <div className="md:col-span-12 font-semibold text-indigo-800 border-b pb-2 mb-2">1. Datos Generales</div>
                
                <div className="space-y-1.5 md:col-span-4">
                  <label className="text-sm font-medium text-gray-700">Nro de Solicitud *</label>
                  <input 
                    type="text" 
                    required
                    disabled={!!editingSolicitud}
                    value={formData.nro}
                    onChange={(e) => setFormData({...formData, nro: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Ej: SOL-001"
                  />
                </div>
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

                {/* Bloque 2: Relaciones */}
                <div className="md:col-span-12 font-semibold text-indigo-800 border-b pb-2 mt-4 mb-2">2. Participantes</div>

                <div className="space-y-1.5 md:col-span-6">
                  <label className="text-sm font-medium text-gray-700">Paciente *</label>
                  <select 
                    required
                    value={formData.id_paciente}
                    onChange={(e) => {
                      const selectedPaciente = pacientes.find(p => p.ci === e.target.value);
                      setFormData({
                        ...formData, 
                        id_paciente: e.target.value,
                        // Autocompletar datos clínicos base
                        edad_valor: selectedPaciente?.edad_valor || formData.edad_valor,
                        edad_unidad: selectedPaciente?.edad_unidad || formData.edad_unidad,
                        fecha_nacimiento: selectedPaciente?.fecha_nacimiento || formData.fecha_nacimiento,
                        grupo: selectedPaciente?.grupo_sanguineo || formData.grupo
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Paciente --</option>
                    {pacientes.map(p => (
                      <option key={p.ci} value={p.ci}>{p.apellido_paterno} {p.nombre} (CI: {p.ci})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-6">
                  <label className="text-sm font-medium text-gray-700">Médico Solicitante *</label>
                  <select 
                    required
                    value={formData.id_medico}
                    onChange={(e) => setFormData({...formData, id_medico: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Médico --</option>
                    {medicos.map(m => (
                      <option key={m.id} value={m.id}>Dr/Dra. {m.apellido_paterno} {m.nombre} - {m.especialidad_nombre || m.especialidad}</option>
                    ))}
                  </select>
                </div>

                {/* Bloque 3: Datos Clínicos */}
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
                    disabled={formData.fraccionado}
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Fraccionada</label>
                  <label className="flex items-center gap-2 h-[42px] px-4 border border-gray-300 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.fraccionado}
                      onChange={(e) => setFormData({
                        ...formData,
                        fraccionado: e.target.checked,
                        cantidad: e.target.checked ? 1 : formData.cantidad,
                        ml: e.target.checked ? formData.ml : ''
                      })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Sí</span>
                  </label>
                </div>
                {formData.fraccionado && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">ML *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="1000"
                      step="1"
                      inputMode="numeric"
                      value={formData.ml}
                      onChange={(e) => setFormData({...formData, ml: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                      placeholder="Ej: 250"
                    />
                  </div>
                )}
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Urgencia *</label>
                  <select 
                    required
                    value={formData.tipo_urgencia}
                    onChange={(e) => setFormData({...formData, tipo_urgencia: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="RUTINA">Rutina</option>
                    <option value="URGENTE">Urgente</option>
                    <option value="EMERGENCIA">Emergencia</option>
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
                    onChange={(e) => setFormData({...formData, edad_valor: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, hb: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, hto: e.target.value})}
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
    </>
  );
};

export default SolicitudManagement;
