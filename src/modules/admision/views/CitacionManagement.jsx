import React, { useState, useEffect } from 'react';
import { getCitaciones, createCitacion, updateCitacion, deleteCitacion } from '../services/citacionService';
import { getSolicitudes } from '../services/solicitudService';
import { getServicios } from '../services/servicioService';
import { useAuth } from '../../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Search, X, CalendarClock, Eye } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  TEXT_PATTERNS,
  formatBackendErrors,
  keepChars,
  onlyPositiveInteger,
  preventInvalidNumberKeys,
  showValidationAlert,
  validateFormData
} from '../../../utils/formValidation';

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

const HEMOCOMPONENTES = [
  { value: 'PLASMA_FRESCO_CONGELADO', label: 'Plasma fresco congelado' },
  { value: 'CRIOPRECIPITADOS', label: 'Crioprecipitados' },
  { value: 'CONCENTRADO_PLAQUETAS', label: 'Concentrado de plaquetas' },
  { value: 'PAQUETE_GLOBULAR', label: 'Paquete globular' },
  { value: 'CONCENTRADO_HELITROCITO_PLAQUETAS', label: 'Concentrado de helitrocito y plaquetas por aféresis' },
  { value: 'GLOBULO_ROJO_LAVADO', label: 'Globulo rojo lavado' }
];

const GRUPOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const getInitialCitacionForm = (userId = '') => ({
  nro_solicitud: '',
  id_user: userId,
  fecha: getBoliviaNow().date,
  hora: getBoliviaNow().time,
  id_servicio: '',
  sala_cama: '',
  cantidad: '',
  codigos_donante: [{ codigo: '' }],
  grupo_factor: '',
  tipo: ''
});

const CitacionManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const boliviaNow = getBoliviaNow();
  const [citaciones, setCitaciones] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingCitacion, setEditingCitacion] = useState(null);
  const [viewingCitacion, setViewingCitacion] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState(getInitialCitacionForm(user?.id || ''));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [citacionesData, solicitudesData, serviciosData] = await Promise.all([
        getCitaciones(),
        getSolicitudes(),
        getServicios()
      ]);
      setCitaciones(citacionesData.results || citacionesData || []);
      setSolicitudes(solicitudesData.results || solicitudesData || []);
      setServicios(serviciosData.results || serviciosData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (citacion = null) => {
    if (citacion) {
      setEditingCitacion(citacion);
      setFormData({
        nro_solicitud: citacion.nro_solicitud || '',
        id_user: citacion.id_user || user?.id || '',
        fecha: citacion.fecha || '',
        hora: citacion.hora ? citacion.hora.substring(0, 5) : '',
        id_servicio: citacion.id_servicio || '',
        sala_cama: citacion.sala_cama || '',
        cantidad: citacion.cantidad || '',
        codigos_donante: citacion.codigos_donante?.length ? citacion.codigos_donante.map(c => ({...c})) : [{ codigo: '' }],
        grupo_factor: citacion.grupo_factor || '',
        tipo: citacion.tipo || ''
      });
    } else {
      setEditingCitacion(null);
      setFormData(getInitialCitacionForm(user?.id || ''));
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCitacion(null);
  };

  const handleOpenDetails = (citacion) => {
    setViewingCitacion(citacion);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingCitacion(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const codigosInvalidos = formData.codigos_donante.filter(c => !c.codigo.trim() || !TEXT_PATTERNS.alphanumeric.test(c.codigo));
    if (codigosInvalidos.length > 0) {
      alert('Todos los códigos de donante deben estar llenos y contener solo letras y números.');
      return;
    }

    const errors = validateFormData(formData, [
      { field: 'nro_solicitud', label: 'Solicitud de transfusión', required: true },
      { field: 'grupo_factor', label: 'Grupo / factor', required: true },
      { field: 'fecha', label: 'Fecha', required: true },
      { field: 'hora', label: 'Hora', required: true },
      { field: 'tipo', label: 'Tipo de donación', required: true },
      { field: 'id_servicio', label: 'Servicio', required: true },
      { field: 'cantidad', label: 'Cantidad', required: true, integer: true, min: 1, max: 10 },
      {
        field: 'sala_cama',
        label: 'Sala / cama',
        pattern: TEXT_PATTERNS.textNumberSpace,
        message: 'solo se permiten letras, números y espacios.'
      }
    ]);
    if (showValidationAlert(errors)) return;

    try {
      if (editingCitacion) {
        await updateCitacion(editingCitacion.id, formData);
      } else {
        await createCitacion(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving citacion:', error);
      let errorMsg = 'Ocurrió un error al guardar la citación. Verifica los datos.';
      if (error.response && error.response.data) {
        errorMsg += '\n\nDetalles:\n' + formatBackendErrors(error.response.data);
      }
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta citación?')) {
      try {
        await deleteCitacion(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting citacion:', error);
        let errorMsg = 'Ocurrió un error al eliminar la citación.';
        if (error.response && error.response.data && error.response.data.error) {
          errorMsg = error.response.data.error;
        }
        alert(errorMsg);
      }
    }
  };

  const filteredCitaciones = citaciones.filter(c => 
    (c.codigos_donante || []).some(cd => cd.codigo.toLowerCase().includes(search.toLowerCase())) ||
    (c.nro_solicitud?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.tipo?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.servicio_nombre?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const maxHora = formData.fecha === boliviaNow.date ? boliviaNow.time : undefined;
  const formatTipo = (tipo) => HEMOCOMPONENTES.find(item => item.value === tipo)?.label || tipo;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarClock className="text-orange-500" />
              Citación de Donantes
            </h1>
            <p className="text-gray-500 text-sm mt-1">Programa donaciones vinculadas a solicitudes</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar Código, Solicitud..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none w-full md:w-72 transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nueva Citación
            </button>
          </div>
        </div>

        {/* Citaciones Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Códigos Donante</th>
                  <th className="px-6 py-4">Paciente / N° Solicitud</th>
                  <th className="px-6 py-4">Grupo / Tipo</th>
                  <th className="px-6 py-4">Balance / Registro</th>
                  <th className="px-6 py-4">Fecha / Hora</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        Cargando citaciones...
                      </div>
                    </td>
                  </tr>
                ) : filteredCitaciones.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron citaciones.
                    </td>
                  </tr>
                ) : (
                  filteredCitaciones.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenDetails(c)}>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(c.codigos_donante || []).map(cd => (
                            <span key={cd.id || cd.codigo} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-mono font-bold border border-indigo-100">
                              {cd.codigo}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {c.paciente_ci ? (
                          <div 
                            className="font-bold text-indigo-700 hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/pacientes', { state: { openDetailsCi: c.paciente_ci } });
                            }}
                          >
                            {c.paciente_nombre}
                          </div>
                        ) : (
                          <div className="font-bold text-gray-900">{c.paciente_nombre || 'Paciente no registrado'}</div>
                        )}
                        <div 
                          className="text-xs font-mono text-indigo-600 mt-0.5 hover:underline cursor-pointer inline-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/solicitudes', { state: { openDetailsId: c.nro_solicitud } });
                          }}
                        >
                          Sol: {c.nro_solicitud}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-red-600">{c.grupo_factor}</span>
                          <span className="text-xs text-gray-500">{formatTipo(c.tipo)} ({c.cantidad} U)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${c.bolsas_a_favor > 0 ? 'bg-green-100 text-green-700' : c.bolsas_a_favor < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {c.bolsas_a_favor > 0 ? '+' : ''}{c.bolsas_a_favor} a favor
                          </span>
                          <span className="text-xs text-gray-500">Por: <span className="font-medium text-gray-700">{c.created_by_name || 'Sistema'}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{c.fecha}</div>
                        <div className="text-xs text-gray-500">{c.hora?.substring(0, 5)} • {c.servicio_nombre}</div>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenDetails(c)}
                            className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="Ver Detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(c)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarClock className="text-orange-500 w-5 h-5" />
                {editingCitacion ? 'Editar Citación' : 'Nueva Citación de Donante'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="citacionForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Solicitud de Transfusión *</label>
                  <select 
                    required
                    value={formData.nro_solicitud}
                    onChange={(e) => setFormData({...formData, nro_solicitud: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Solicitud --</option>
                    {solicitudes.map(s => (
                      <option key={s.nro} value={s.nro}>{s.nro} - Paciente: {s.paciente_nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Códigos de Donante *</label>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, codigos_donante: [...formData.codigos_donante, {codigo: ''}]})}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Añadir Código
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {formData.codigos_donante.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input 
                          type="text" 
                          required
                          pattern="[A-Za-z0-9]+"
                          maxLength={50}
                          title="Solo se permiten letras y números"
                          value={item.codigo}
                          onChange={(e) => {
                            const newCodigos = [...formData.codigos_donante];
                            newCodigos[index].codigo = keepChars(e.target.value, 'alphanumeric').toUpperCase();
                            setFormData({...formData, codigos_donante: newCodigos});
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none uppercase font-mono"
                          placeholder={`Ej: DON${index + 1}23`}
                        />
                        {formData.codigos_donante.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => {
                              const newCodigos = formData.codigos_donante.filter((_, i) => i !== index);
                              setFormData({...formData, codigos_donante: newCodigos});
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Grupo / Factor *</label>
                  <select 
                    required
                    value={formData.grupo_factor}
                    onChange={(e) => setFormData({...formData, grupo_factor: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white font-bold text-red-700"
                  >
                    <option value="" className="font-normal text-gray-900">-- Sel --</option>
                    {GRUPOS.map(grupo => (
                      <option key={grupo} value={grupo}>{grupo}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Fecha *</label>
                  <input 
                    type="date" 
                    required
                    max={boliviaNow.date}
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Hora *</label>
                  <input 
                    type="time" 
                    required
                    max={maxHora}
                    value={formData.hora}
                    onChange={(e) => setFormData({...formData, hora: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Tipo de Donación *</label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    {HEMOCOMPONENTES.map(item => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Servicio *</label>
                  <select
                    required
                    value={formData.id_servicio}
                    onChange={(e) => setFormData({...formData, id_servicio: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Servicio --</option>
                    {servicios.map(servicio => (
                      <option key={servicio.id} value={servicio.id}>{servicio.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Cantidad *</label>
                  <input 
                    type="number" 
                    required min="1" max="10" step="1" inputMode="numeric"
                    value={formData.cantidad}
                    onKeyDown={preventInvalidNumberKeys}
                    onChange={(e) => setFormData({...formData, cantidad: onlyPositiveInteger(e.target.value, 10)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Sala / Cama</label>
                  <input 
                    type="text" 
                    pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ]*"
                    title="Solo se permiten letras, números y espacios"
                    value={formData.sala_cama}
                    onChange={(e) => setFormData({...formData, sala_cama: keepChars(e.target.value, 'textNumberSpace')})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Ej: Sala 3, Cama 12"
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
                form="citacionForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20"
              >
                {editingCitacion ? 'Guardar Cambios' : 'Registrar Citación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && viewingCitacion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-cyan-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarClock className="text-cyan-600 w-5 h-5" />
                Detalles de Citación
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Paciente</p>
                    {viewingCitacion.paciente_ci ? (
                      <p 
                        className="font-bold text-lg text-indigo-700 hover:underline cursor-pointer"
                        onClick={() => navigate('/pacientes', { state: { openDetailsCi: viewingCitacion.paciente_ci } })}
                      >
                        {viewingCitacion.paciente_nombre}
                      </p>
                    ) : (
                      <p className="font-bold text-lg text-indigo-700">{viewingCitacion.paciente_nombre || 'Desconocido'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Nro. Solicitud Asociada</p>
                    {viewingCitacion.nro_solicitud ? (
                      <p 
                        className="font-mono text-indigo-700 font-semibold hover:underline cursor-pointer"
                        onClick={() => navigate('/solicitudes', { state: { openDetailsId: viewingCitacion.nro_solicitud } })}
                      >
                        {viewingCitacion.nro_solicitud}
                      </p>
                    ) : (
                      <p className="font-mono text-gray-900 font-semibold">No especificado</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Fecha y Hora</p>
                    <p className="font-semibold text-gray-900">{viewingCitacion.fecha} a las {viewingCitacion.hora?.substring(0,5)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Servicio / Sala y Cama</p>
                    <p className="font-semibold text-gray-900">{viewingCitacion.servicio_nombre || 'No especificado'} - {viewingCitacion.sala_cama || 'Sin especificar'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Tipo de Donación</p>
                    <p className="font-semibold text-gray-900">{HEMOCOMPONENTES.find(item => item.value === viewingCitacion.tipo)?.label || viewingCitacion.tipo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Grupo y Factor / Cantidad</p>
                    <p className="font-semibold text-red-700">{viewingCitacion.grupo_factor}</p>
                    <p className="text-sm text-gray-600">{viewingCitacion.cantidad} unidad(es)</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 font-medium mb-2">Códigos de Donante ({viewingCitacion.codigos_donante?.length || 0})</p>
                    <div className="flex flex-wrap gap-2">
                      {(viewingCitacion.codigos_donante || []).map(cd => (
                        <div key={cd.id || cd.codigo} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-mono font-bold border border-indigo-100">
                          {cd.codigo}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Balance de Bolsas</p>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full w-fit flex items-center gap-1 ${viewingCitacion.bolsas_a_favor > 0 ? 'bg-green-100 text-green-700' : viewingCitacion.bolsas_a_favor < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {viewingCitacion.bolsas_a_favor > 0 ? '+' : ''}{viewingCitacion.bolsas_a_favor} a favor
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Auditoría de Registro</p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm text-gray-700">
                        <span className="text-gray-500 text-xs">Creado por:</span> <span className="font-medium">{viewingCitacion.created_by_name || 'Sistema'}</span>
                      </p>
                      {viewingCitacion.updated_by_name && (
                        <p className="text-sm text-gray-700">
                          <span className="text-gray-500 text-xs">Última edición por:</span> <span className="font-medium">{viewingCitacion.updated_by_name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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

export default CitacionManagement;
