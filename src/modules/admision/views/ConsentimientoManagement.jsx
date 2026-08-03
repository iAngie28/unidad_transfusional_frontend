import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getConsentimientos, createConsentimiento, updateConsentimiento, deleteConsentimiento } from '../services/consentimientoService';
import { getSolicitudes } from '../services/solicitudService';
import { getServicios } from '../services/servicioService';
import { FileCheck, Plus, Edit2, Trash2, Search, X, Eye } from 'lucide-react';
import {
  TEXT_PATTERNS,
  formatBackendErrors,
  keepChars,
  onlyDigits,
  showValidationAlert,
  validateFormData
} from '../../../utils/formValidation';

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

const initialConsentimientoForm = () => ({
  nro_solicitud: '',
  fecha: getBoliviaToday(),
  id_servicio: '',
  nombre_familiar: '',
  apellido_paterno_familiar: '',
  apellido_materno_familiar: '',
  telefono: '',
  ci: ''
});

const ConsentimientoManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [consentimientos, setConsentimientos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingConsentimiento, setEditingConsentimiento] = useState(null);
  const [viewingConsentimiento, setViewingConsentimiento] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState(initialConsentimientoForm());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [consentimientosData, solicitudesData, serviciosData] = await Promise.all([
        getConsentimientos(),
        getSolicitudes(),
        getServicios()
      ]);
      const consentimientosList = consentimientosData.results || consentimientosData || [];
      setConsentimientos(consentimientosList);
      setSolicitudes(solicitudesData.results || solicitudesData || []);
      setServicios(serviciosData.results || serviciosData || []);
      
      if (location.state?.openDetailsId) {
        const itemToOpen = consentimientosList.find(c => String(c.id) === String(location.state.openDetailsId));
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

  const handleOpenModal = (consentimiento = null) => {
    if (consentimiento) {
      setEditingConsentimiento(consentimiento);
      setFormData({
        nro_solicitud: consentimiento.nro_solicitud || '',
        fecha: consentimiento.fecha || '',
        id_servicio: consentimiento.id_servicio || '',
        nombre_familiar: consentimiento.nombre_familiar || '',
        apellido_paterno_familiar: consentimiento.apellido_paterno_familiar || '',
        apellido_materno_familiar: consentimiento.apellido_materno_familiar || '',
        telefono: consentimiento.telefono || '',
        ci: consentimiento.ci || ''
      });
    } else {
      setEditingConsentimiento(null);
      setFormData(initialConsentimientoForm());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingConsentimiento(null);
  };

  const handleOpenDetails = (consentimiento) => {
    setViewingConsentimiento(consentimiento);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingConsentimiento(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateFormData(formData, [
      { field: 'nro_solicitud', label: 'Solicitud de transfusión', required: true },
      { field: 'fecha', label: 'Fecha', required: true },
      { field: 'id_servicio', label: 'Servicio', required: true },
      {
        field: 'nombre_familiar',
        label: 'Nombre del familiar',
        required: true,
        pattern: TEXT_PATTERNS.lettersSpaces,
        message: 'solo se permiten letras y espacios.'
      },
      {
        field: 'apellido_paterno_familiar',
        label: 'Apellido paterno',
        required: true,
        pattern: TEXT_PATTERNS.lettersSpaces,
        message: 'solo se permiten letras y espacios.'
      },
      {
        field: 'apellido_materno_familiar',
        label: 'Apellido materno',
        pattern: TEXT_PATTERNS.lettersSpaces,
        message: 'solo se permiten letras y espacios.'
      },
      { field: 'telefono', label: 'Teléfono', required: true, integer: true, maxLength: 30 },
      { field: 'ci', label: 'CI del familiar', required: true, integer: true, maxLength: 20 }
    ]);
    if (showValidationAlert(errors)) return;

    try {
      if (editingConsentimiento) {
        await updateConsentimiento(editingConsentimiento.id, formData);
      } else {
        await createConsentimiento(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving consentimiento:', error);
      let errorMsg = 'Ocurrió un error al guardar el consentimiento. Verifica los datos.';
      if (error.response && error.response.data) {
        errorMsg += '\n\nDetalles:\n' + formatBackendErrors(error.response.data);
      }
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        await deleteConsentimiento(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting consentimiento:', error);
        alert('Ocurrió un error al eliminar.');
      }
    }
  };

  const filteredConsentimientos = consentimientos.filter(c => 
    (c.ci?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.nro_solicitud?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.nombre_familiar?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.apellido_paterno_familiar?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (c.servicio_nombre?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileCheck className="text-emerald-600" />
              Consentimientos Informados
            </h1>
            <p className="text-gray-500 text-sm mt-1">Registra la autorización familiar para transfusiones</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar CI, Familiar, Solicitud..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full md:w-72 transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nuevo Registro
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Nro. Solicitud</th>
                  <th className="px-6 py-4">Paciente (Receptor)</th>
                  <th className="px-6 py-4">Familiar / Responsable</th>
                  <th className="px-6 py-4">CI / Teléfono</th>
                  <th className="px-6 py-4">Fecha / Servicio / Registro</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        Cargando consentimientos...
                      </div>
                    </td>
                  </tr>
                ) : filteredConsentimientos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron registros.
                    </td>
                  </tr>
                ) : (
                  filteredConsentimientos.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenDetails(c)}>
                      <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                        <div 
                          className="hover:underline cursor-pointer inline-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/solicitudes', { state: { openDetailsId: c.nro_solicitud } });
                          }}
                        >
                          {c.nro_solicitud}
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
                          <div className="font-bold text-gray-900">{c.paciente_nombre || 'No registrado'}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {c.apellido_paterno_familiar} {c.apellido_materno_familiar} {c.nombre_familiar}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div>CI: {c.ci}</div>
                        <div className="text-xs text-gray-400">Tel: {c.telefono}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-gray-900">{c.fecha}</div>
                          <div className="text-xs text-gray-500">{c.servicio_nombre || 'Sin servicio'}</div>
                          <span className="text-xs text-gray-500">Por: <span className="font-medium text-gray-700">{c.created_by_name || 'Sistema'}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenDetails(c)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Ver Detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(c)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="text-emerald-600 w-5 h-5" />
                {editingConsentimiento ? 'Editar Consentimiento' : 'Nuevo Consentimiento'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="consentForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Solicitud de Transfusión *</label>
                  <select 
                    required
                    value={formData.nro_solicitud}
                    onChange={(e) => setFormData({...formData, nro_solicitud: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Solicitud --</option>
                    {solicitudes.map(s => (
                      <option key={s.nro} value={s.nro}>{s.nro} - Paciente: {s.paciente_nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nombre del Familiar *</label>
                  <input 
                    type="text" 
                    required
                    maxLength={100}
                    pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+"
                    title="Solo se permiten letras y espacios"
                    value={formData.nombre_familiar}
                    onChange={(e) => setFormData({...formData, nombre_familiar: keepChars(e.target.value, 'lettersSpaces')})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
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
                    value={formData.apellido_paterno_familiar}
                    onChange={(e) => setFormData({...formData, apellido_paterno_familiar: keepChars(e.target.value, 'lettersSpaces')})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido Materno</label>
                  <input 
                    type="text" 
                    maxLength={100}
                    pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]*"
                    title="Solo se permiten letras y espacios"
                    value={formData.apellido_materno_familiar}
                    onChange={(e) => setFormData({...formData, apellido_materno_familiar: keepChars(e.target.value, 'lettersSpaces')})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">CI del Familiar *</label>
                  <input 
                    type="text" 
                    required
                    inputMode="numeric"
                    maxLength={20}
                    pattern="[0-9]+"
                    title="Solo se permiten números"
                    value={formData.ci}
                    onChange={(e) => setFormData({...formData, ci: onlyDigits(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Teléfono *</label>
                  <input 
                    type="text" 
                    required
                    inputMode="numeric"
                    maxLength={30}
                    pattern="[0-9]+"
                    title="Solo se permiten números"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: onlyDigits(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Fecha *</label>
                  <input 
                    type="date" 
                    required
                    max={getBoliviaToday()}
                    value={formData.fecha}
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Servicio *</label>
                  <select
                    required
                    value={formData.id_servicio}
                    onChange={(e) => setFormData({...formData, id_servicio: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Servicio --</option>
                    {servicios.map(servicio => (
                      <option key={servicio.id} value={servicio.id}>{servicio.nombre}</option>
                    ))}
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
                form="consentForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
              >
                {editingConsentimiento ? 'Guardar Cambios' : 'Registrar Consentimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && viewingConsentimiento && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="text-emerald-600 w-5 h-5" />
                Detalles del Consentimiento
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
                    <p className="text-xs text-gray-500 font-medium mb-1">Nro. Solicitud Asociada</p>
                    {viewingConsentimiento.nro_solicitud ? (
                      <p 
                        className="font-mono text-indigo-700 font-semibold hover:underline cursor-pointer"
                        onClick={() => navigate('/solicitudes', { state: { openDetailsId: viewingConsentimiento.nro_solicitud } })}
                      >
                        {viewingConsentimiento.nro_solicitud}
                      </p>
                    ) : (
                      <p className="font-mono text-gray-900 font-semibold">No especificado</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Paciente (Receptor)</p>
                    {viewingConsentimiento.paciente_ci ? (
                      <p 
                        className="font-bold text-lg text-indigo-700 hover:underline cursor-pointer"
                        onClick={() => navigate('/pacientes', { state: { openDetailsCi: viewingConsentimiento.paciente_ci } })}
                      >
                        {viewingConsentimiento.paciente_nombre}
                      </p>
                    ) : (
                      <p className="font-bold text-lg text-gray-900">{viewingConsentimiento.paciente_nombre || 'No registrado'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Fecha</p>
                    <p className="font-semibold text-gray-900">{viewingConsentimiento.fecha}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 font-medium mb-1">Familiar Responsable</p>
                    <p className="font-semibold text-gray-900">
                      {viewingConsentimiento.nombre_familiar} {viewingConsentimiento.apellido_paterno_familiar} {viewingConsentimiento.apellido_materno_familiar}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">C.I. del Familiar</p>
                    <p className="font-mono text-gray-900">{viewingConsentimiento.ci}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Teléfono</p>
                    <p className="font-semibold text-gray-900">{viewingConsentimiento.telefono || 'Sin especificar'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 font-medium mb-1">Servicio</p>
                    <p className="font-semibold text-gray-900">{viewingConsentimiento.servicio_nombre || 'No especificado'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 font-medium mb-1">Auditoría de Registro</p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm text-gray-700">
                        <span className="text-gray-500 text-xs">Creado por:</span> <span className="font-medium">{viewingConsentimiento.created_by_name || 'Sistema'}</span>
                      </p>
                      {viewingConsentimiento.updated_by_name && (
                        <p className="text-sm text-gray-700">
                          <span className="text-gray-500 text-xs">Última edición por:</span> <span className="font-medium">{viewingConsentimiento.updated_by_name}</span>
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

export default ConsentimientoManagement;
