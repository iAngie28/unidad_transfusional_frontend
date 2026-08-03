import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPacientes, createPaciente, updatePaciente, deletePaciente } from '../services/pacienteService';
import { getSolicitudes, archivarSolicitud } from '../services/solicitudService';
import { getTransfusiones } from '../../laboratorio/services/transfusionService';
import { Users, Plus, Edit2, Trash2, Search, X, Activity, Droplet, Eye, ListTree, AlertCircle } from 'lucide-react';
import {
  TEXT_PATTERNS,
  formatBackendErrors,
  keepChars,
  onlyDigits,
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

const HEMOCOMPONENTES_OPCIONES = {
  'SANGRE_TOTAL': 'Sangre Total',
  'PAQUETE_GLOBULAR': 'Paquete Globular',
  'PLASMA_FRESCO_CONGELADO': 'Plasma Fresco Congelado',
  'CONCENTRADO_PLAQUETARIO': 'Concentrado Plaquetario',
  'CRIOPRECIPITADO': 'Crioprecipitado',
  'GLOBULO_ROJO_LAVADO': 'Glóbulo Rojo Lavado'
};

const getBoliviaToday = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const initialPacienteForm = () => ({
  ci: '',
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  edad_valor: '',
  edad_unidad: 'ANOS',
  fecha_nacimiento: '',
  sexo: '',
  historia_clinica: '',
  grupo_sanguineo: ''
});

const formatEdad = (valor, unidad) => {
  if (!valor) return 'Edad no definida';
  return `${valor} ${EDAD_UNIDADES[unidad] || unidad || ''}`.trim();
};

const calculateAge = (birthDateStr) => {
  if (!birthDateStr) return null;
  // Añadimos 'T00:00:00' para evitar desfases de zona horaria al parsear la fecha (YYYY-MM-DD)
  const birthDate = new Date(birthDateStr + 'T00:00:00');
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  
  if (months < 0 || (months === 0 && days < 0)) {
    years--;
    months += 12;
  }
  if (days < 0) {
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  if (years > 0) return { valor: years, unidad: 'ANOS' };
  if (months > 0) return { valor: months, unidad: 'MESES' };
  return { valor: Math.max(1, days), unidad: 'DIAS' }; // Al menos 1 día
};

const buildPacientePayload = (formData) => ({
  ...formData,
  fecha_nacimiento: formData.fecha_nacimiento || null
});

const PacienteManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const boliviaToday = getBoliviaToday();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [viewingPaciente, setViewingPaciente] = useState(null);
  const [transfusionHistory, setTransfusionHistory] = useState([]);
  const [pendingSolicitudes, setPendingSolicitudes] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState(initialPacienteForm());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getPacientes();
      const pacs = data.results || data || [];
      setPacientes(pacs);
      
      if (location.state?.openDetailsCi) {
        const itemToOpen = pacs.find(p => String(p.ci) === String(location.state.openDetailsCi));
        if (itemToOpen) {
          handleOpenDetails(itemToOpen);
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    } catch (error) {
      console.error('Error fetching pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (paciente = null) => {
    if (paciente) {
      setEditingPaciente(paciente);
      setFormData({
        ci: paciente.ci || '',
        nombre: paciente.nombre || '',
        apellido_paterno: paciente.apellido_paterno || '',
        apellido_materno: paciente.apellido_materno || '',
        edad_valor: paciente.edad_valor || '',
        edad_unidad: paciente.edad_unidad || 'ANOS',
        fecha_nacimiento: paciente.fecha_nacimiento || '',
        sexo: paciente.sexo || '',
        historia_clinica: paciente.historia_clinica || '',
        grupo_sanguineo: paciente.grupo_sanguineo || ''
      });
    } else {
      setEditingPaciente(null);
      setFormData(initialPacienteForm());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPaciente(null);
    setDuplicateWarning(null);
  };

  const handleBlurValidation = async (field, value) => {
    if (!value || value.trim() === '') return;
    
    // Si estamos editando y el valor es el mismo que el original, no hacemos nada
    if (editingPaciente && String(editingPaciente[field]) === String(value)) return;

    try {
      // Hacemos un llamado con filtro exacto
      const data = await getPacientes({ [field]: value });
      const results = data.results || data || [];
      
      // Aseguramos coincidencia exacta por si el backend hizo un 'contains'
      const match = results.find(p => String(p[field]) === String(value));
      
      if (match) {
        setDuplicateWarning({
          field: field === 'ci' ? 'Carnet de Identidad' : 'Historia Clínica',
          value: value,
          paciente: match
        });
      }
    } catch (error) {
      console.error(`Error validating ${field}:`, error);
    }
  };

  const handleOpenDetails = async (paciente) => {
    // Si viene desde la advertencia de duplicados, cerramos todo lo demás primero
    if (duplicateWarning) {
      setDuplicateWarning(null);
      setIsModalOpen(false);
    }
    
    setViewingPaciente(paciente);
    setIsDetailsModalOpen(true);
    setLoadingHistory(true);
    try {
      // Fetch historial de transfusiones y solicitudes pendientes en paralelo
      const [transData, solData] = await Promise.all([
        getTransfusiones({ paciente: paciente.ci }),
        getSolicitudes({ paciente: paciente.ci, estado: 'PENDIENTE' })
      ]);
      setTransfusionHistory(transData.results || transData || []);
      setPendingSolicitudes(solData.results || solData || []);
    } catch (error) {
      console.error('Error fetching historial:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingPaciente(null);
    setTransfusionHistory([]);
    setPendingSolicitudes([]);
  };

  const handleArchivarSolicitud = async (nro) => {
    if (window.confirm('¿Seguro que deseas archivar esta solicitud?')) {
      try {
        await archivarSolicitud(nro);
        // Refresh the pending requests list
        if (viewingPaciente) {
          const solData = await getSolicitudes({ paciente: viewingPaciente.ci, estado: 'PENDIENTE' });
          setPendingSolicitudes(solData.results || solData || []);
        }
      } catch (error) {
        console.error('Error archivando:', error.response ? error.response.data : error);
        alert('Error al archivar: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateFormData(formData, [
      { field: 'ci', label: 'CI', required: true, integer: true, maxLength: 20 },
      {
        field: 'nombre',
        label: 'Nombre',
        required: true,
        pattern: TEXT_PATTERNS.lettersSpaces,
        message: 'solo se permiten letras y espacios.'
      },
      {
        field: 'apellido_paterno',
        label: 'Apellido paterno',
        required: true,
        pattern: TEXT_PATTERNS.lettersSpaces,
        message: 'solo se permiten letras y espacios.'
      },
      {
        field: 'apellido_materno',
        label: 'Apellido materno',
        pattern: TEXT_PATTERNS.lettersSpaces,
        message: 'solo se permiten letras y espacios.'
      },
      { field: 'edad_valor', label: 'Edad', required: true, integer: true, min: 1 },
      { field: 'edad_unidad', label: 'Unidad de edad', required: true },
      { field: 'historia_clinica', label: 'Historia clínica', required: true, maxLength: 50 },
      { field: 'grupo_sanguineo', label: 'Grupo sanguíneo', required: true }
    ]);

    // Validación cruzada de edad y fecha de nacimiento
    if (formData.fecha_nacimiento && formData.edad_valor) {
      const calc = calculateAge(formData.fecha_nacimiento);
      if (calc && (String(calc.valor) !== String(formData.edad_valor) || calc.unidad !== formData.edad_unidad)) {
        errors.push(`Incongruencia detectada: La edad ingresada (${formData.edad_valor} ${formData.edad_unidad.toLowerCase()}) no coincide con la calculada a partir de la fecha de nacimiento (${calc.valor} ${calc.unidad.toLowerCase()}). Por favor corrige uno de los dos campos.`);
      }
    }

    if (showValidationAlert(errors)) return;

    try {
      const payload = buildPacientePayload(formData);
      if (editingPaciente) {
        // En backend la PK es CI, normalmente para actualizar se envía a la PK anterior
        await updatePaciente(editingPaciente.ci, payload);
      } else {
        await createPaciente(payload);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving paciente:', error);
      let errorMsg = 'Ocurrió un error al guardar el paciente. Verifica los datos.';
      if (error.response && error.response.data) {
        errorMsg += '\n\nDetalles:\n' + formatBackendErrors(error.response.data);
      }
      alert(errorMsg);
    }
  };

  const handleDelete = async (ci) => {
    if (window.confirm('¿Estás seguro de eliminar este paciente? Podría afectar a las solicitudes vinculadas.')) {
      try {
        await deletePaciente(ci);
        fetchData();
      } catch (error) {
        console.error('Error deleting paciente:', error);
        alert('Ocurrió un error al eliminar el paciente. Puede que esté en uso.');
      }
    }
  };

  const filteredPacientes = pacientes.filter(p => 
    (p.nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.apellido_paterno?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.ci?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.historia_clinica?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" />
            Registro de Pacientes
          </h1>
          <p className="text-gray-500 text-sm mt-1">Administra la información clínica de los pacientes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por CI, Nombre, HCL..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full md:w-72 transition-all"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nuevo Paciente
          </button>
        </div>
      </div>

      {/* Pacientes Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">CI / Edad / Sexo</th>
                <th className="px-6 py-4">H. Clínica</th>
                <th className="px-6 py-4">Grupo Sanguíneo</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Cargando pacientes...
                    </div>
                  </td>
                </tr>
              ) : filteredPacientes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron pacientes.
                  </td>
                </tr>
              ) : (
                filteredPacientes.map((p) => (
                  <tr key={p.ci} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenDetails(p)}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {p.apellido_paterno} {p.apellido_materno} {p.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div>CI: {p.ci}</div>
                      <div className="text-xs text-gray-400">
                        {formatEdad(p.edad_valor, p.edad_unidad)} • Sexo: {p.sexo || 'No especificado'}
                      </div>
                      {p.fecha_nacimiento && (
                        <div className="text-xs text-gray-400">Nac.: {p.fecha_nacimiento}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md w-max text-xs font-medium border border-slate-200">
                        <Activity className="w-3.5 h-3.5" />
                        {p.historia_clinica}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md w-max text-xs font-bold border ${
                        p.grupo_sanguineo ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        <Droplet className={`w-3.5 h-3.5 ${p.grupo_sanguineo ? 'fill-red-700 text-red-700' : ''}`} />
                        {p.grupo_sanguineo || 'No definido'}
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenDetails(p)}
                          className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Ver Detalles y Transfusiones"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(p)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.ci)}
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
              <h2 className="text-xl font-bold text-gray-900">
                {editingPaciente ? 'Editar Paciente' : 'Nuevo Paciente'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="pacienteForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Carnet de Identidad (CI) *</label>
                  <input 
                    type="text" 
                    required
                    disabled={!!editingPaciente}
                    inputMode="numeric"
                    maxLength={20}
                    pattern="[0-9]+"
                    title="Solo se permiten números"
                    value={formData.ci}
                    onBlur={(e) => handleBlurValidation('ci', e.target.value)}
                    onChange={(e) => setFormData({...formData, ci: onlyDigits(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Ej: 1234567"
                  />
                  {editingPaciente && <p className="text-xs text-gray-500">El CI es el identificador único y no se puede modificar.</p>}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nombre *</label>
                  <input 
                    type="text" 
                    required
                    maxLength={100}
                    pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+"
                    title="Solo se permiten letras y espacios"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: keepChars(e.target.value, 'lettersSpaces')})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido Paterno *</label>
                  <input 
                    type="text" 
                    required
                    maxLength={100}
                    pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+"
                    title="Solo se permiten letras y espacios"
                    value={formData.apellido_paterno}
                    onChange={(e) => setFormData({...formData, apellido_paterno: keepChars(e.target.value, 'lettersSpaces')})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido Materno</label>
                  <input 
                    type="text" 
                    maxLength={100}
                    pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]*"
                    title="Solo se permiten letras y espacios"
                    value={formData.apellido_materno}
                    onChange={(e) => setFormData({...formData, apellido_materno: keepChars(e.target.value, 'lettersSpaces')})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Edad *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={formData.edad_valor}
                    onKeyDown={preventInvalidNumberKeys}
                    onChange={(e) => setFormData({...formData, edad_valor: onlyPositiveInteger(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Unidad de edad *</label>
                  <select
                    required
                    value={formData.edad_unidad}
                    onChange={(e) => setFormData({...formData, edad_unidad: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="DIAS">Días</option>
                    <option value="MESES">Meses</option>
                    <option value="ANOS">Años</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                  <input
                    type="date"
                    max={boliviaToday}
                    value={formData.fecha_nacimiento || ''}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      setFormData(prev => {
                        const newData = { ...prev, fecha_nacimiento: dateValue };
                        // Solo autocompletamos si el valor de edad está vacío
                        if (!prev.edad_valor && dateValue) {
                          const ageCalc = calculateAge(dateValue);
                          if (ageCalc) {
                            newData.edad_valor = ageCalc.valor;
                            newData.edad_unidad = ageCalc.unidad;
                          }
                        }
                        return newData;
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Sexo</label>
                  <select 
                    value={formData.sexo}
                    onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">N° Historia Clínica *</label>
                  <input 
                    type="text" 
                    required
                    maxLength={50}
                    value={formData.historia_clinica}
                    onBlur={(e) => handleBlurValidation('historia_clinica', e.target.value)}
                    onChange={(e) => setFormData({...formData, historia_clinica: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Grupo Sanguíneo *</label>
                  <select 
                    required
                    value={formData.grupo_sanguineo}
                    onChange={(e) => setFormData({...formData, grupo_sanguineo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-bold text-red-700"
                  >
                    <option value="" className="text-gray-900 font-normal">-- Seleccionar --</option>
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
                form="pacienteForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
              >
                {editingPaciente ? 'Guardar Cambios' : 'Registrar Paciente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details & History Modal */}
      {isDetailsModalOpen && viewingPaciente && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ListTree className="text-cyan-600 w-5 h-5" />
                Expediente del Paciente
              </h2>
              <button 
                onClick={handleCloseDetailsModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
              
              {/* Patient Info Card */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-medium mb-1">Nombre Completo</p>
                  <p className="font-semibold text-gray-900 text-lg">
                    {viewingPaciente.apellido_paterno} {viewingPaciente.apellido_materno} {viewingPaciente.nombre}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">C.I.</p>
                  <p className="font-mono text-gray-800">{viewingPaciente.ci}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">H. Clínica</p>
                  <div className="flex items-center gap-1.5 w-max text-sm font-medium text-slate-700">
                    <Activity className="w-4 h-4" />
                    {viewingPaciente.historia_clinica}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Edad</p>
                  <p className="text-gray-700 text-sm">{formatEdad(viewingPaciente.edad_valor, viewingPaciente.edad_unidad)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Sexo</p>
                  <p className="text-gray-700 text-sm">{viewingPaciente.sexo === 'M' ? 'Masculino' : viewingPaciente.sexo === 'F' ? 'Femenino' : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">F. Nacimiento</p>
                  <p className="text-gray-700 text-sm">{viewingPaciente.fecha_nacimiento || 'No registrada'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Grupo ABO/Rh</p>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md w-max text-xs font-bold border ${
                    viewingPaciente.grupo_sanguineo ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    <Droplet className={`w-3.5 h-3.5 ${viewingPaciente.grupo_sanguineo ? 'fill-red-700 text-red-700' : ''}`} />
                    {viewingPaciente.grupo_sanguineo || 'No definido'}
                  </div>
                </div>
              </div>

                  {/* Historial Clínico Resumido */}
                  <div className="col-span-1 md:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <ListTree className="w-4 h-4" />
                      Historial de Transfusiones
                    </h3>
                    
                    {pendingSolicitudes.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <AlertCircle className="w-6 h-6 text-amber-600" />
                          <div>
                            <h4 className="font-bold text-amber-900 text-base">Solicitudes Pendientes ({pendingSolicitudes.length})</h4>
                            <p className="text-sm text-amber-700">Este paciente tiene solicitudes en espera de ser atendidas.</p>
                          </div>
                        </div>
                        <div className="space-y-3 pl-2 border-l-2 border-amber-300 ml-3">
                          {pendingSolicitudes.map(sol => (
                            <div key={sol.nro} className="relative pl-6 pb-2">
                              <div className="absolute -left-[1.35rem] top-1.5 w-3 h-3 bg-amber-500 rounded-full ring-4 ring-amber-100"></div>
                              <div 
                                className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm cursor-pointer hover:border-amber-300 transition-colors"
                                onClick={() => { handleCloseDetailsModal(); navigate('/solicitudes', { state: { openDetailsId: sol.nro } }); }}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg text-sm border border-amber-200">
                                    {HEMOCOMPONENTES_OPCIONES[sol.hemocomponente] || sol.hemocomponente}
                                  </span>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleArchivarSolicitud(sol.nro); }}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                                  >
                                    Archivar
                                  </button>
                                </div>
                                <div className="text-sm text-gray-700 mb-1">
                                  Solicitado por <strong>Dr. {sol.medico_nombre}</strong> el <span className="font-medium">{sol.fecha}</span> a las <span className="font-medium">{sol.hora?.substring(0,5)}</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  Cantidad: <span className="font-semibold text-gray-800">{sol.cantidad} unidad(es)</span> • Urgencia: <span className="font-semibold text-gray-800">{sol.tipo_urgencia}</span>
                                </div>
                                {sol.diagnostico && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    Diagnóstico: <span className="font-medium text-gray-800">{sol.diagnostico}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {loadingHistory ? (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : transfusionHistory.length === 0 ? (
                  <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500">
                    Sin transfusiones previas.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transfusionHistory.map((transfusion, idx) => (
                      <div 
                        key={transfusion.id} 
                        className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer"
                        onClick={() => { handleCloseDetailsModal(); navigate('/transfusiones', { state: { openDetailsId: transfusion.id } }); }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-3 h-3 rounded-full mt-1.5 ${idx === 0 ? 'bg-cyan-500 ring-4 ring-cyan-100' : 'bg-gray-300'}`}></div>
                          {idx !== transfusionHistory.length - 1 && <div className="w-0.5 h-full bg-gray-100"></div>}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-900 bg-cyan-50 text-cyan-800 px-2.5 py-0.5 rounded-lg text-sm border border-cyan-100">
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
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50/50">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <span className="font-bold text-xl">!</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Dato Duplicado
              </h2>
            </div>
            
            <div className="p-6 text-sm text-gray-600">
              <p className="mb-4">
                El/La <strong>{duplicateWarning.field}</strong> "{duplicateWarning.value}" ya pertenece a otro paciente registrado en el sistema:
              </p>
              
              <button 
                type="button"
                onClick={() => handleOpenDetails(duplicateWarning.paciente)}
                className="w-full text-left bg-gray-50 hover:bg-blue-50/50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 mb-4 transition-all cursor-pointer group"
              >
                <p className="font-bold text-gray-900 group-hover:text-blue-700 text-base mb-1 transition-colors">
                  {duplicateWarning.paciente.apellido_paterno} {duplicateWarning.paciente.apellido_materno} {duplicateWarning.paciente.nombre}
                </p>
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                  <p>CI: <span className="font-mono text-gray-700">{duplicateWarning.paciente.ci}</span></p>
                  <p>Historia Clínica: <span className="font-medium text-gray-700">{duplicateWarning.paciente.historia_clinica}</span></p>
                  <p>Grupo: <span className="font-bold text-red-600">{duplicateWarning.paciente.grupo_sanguineo || 'N/A'}</span></p>
                </div>
              </button>
              
              <p>Por favor, revisa el número ingresado o actualiza el registro existente en lugar de crear uno nuevo.</p>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                type="button"
                onClick={() => {
                  // Opcional: Limpiar el campo duplicado para forzar al usuario a corregirlo
                  const fieldKey = duplicateWarning.field === 'Carnet de Identidad' ? 'ci' : 'historia_clinica';
                  setFormData(prev => ({ ...prev, [fieldKey]: '' }));
                  setDuplicateWarning(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PacienteManagement;
