import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEspecialidad, deleteEspecialidad, getEspecialidades, updateEspecialidad } from '../services/especialidadService';
import { getMedicos } from '../services/medicoService';
import { BookOpen, Edit2, Plus, Search, Trash2, X, Eye, Users } from 'lucide-react';
import { formatBackendErrors, showValidationAlert, validateFormData } from '../../../utils/formValidation';

const EspecialidadManagement = () => {
  const navigate = useNavigate();
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingEspecialidad, setEditingEspecialidad] = useState(null);
  const [viewingEspecialidad, setViewingEspecialidad] = useState(null);
  const [medicosAsignados, setMedicosAsignados] = useState([]);
  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getEspecialidades();
      setEspecialidades(data.results || data || []);
    } catch (error) {
      console.error('Error fetching especialidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (especialidad = null) => {
    if (especialidad) {
      setEditingEspecialidad(especialidad);
      setFormData({
        nombre: especialidad.nombre || '',
        descripcion: especialidad.descripcion || ''
      });
    } else {
      setEditingEspecialidad(null);
      setFormData({
        nombre: '',
        descripcion: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEspecialidad(null);
  };

  const handleOpenDetails = async (especialidad) => {
    setViewingEspecialidad(especialidad);
    setIsDetailsModalOpen(true);
    setLoadingMedicos(true);
    try {
      const data = await getMedicos({ especialidad: especialidad.id });
      setMedicosAsignados(data.results || data || []);
    } catch (error) {
      console.error('Error fetching medicos:', error);
    } finally {
      setLoadingMedicos(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingEspecialidad(null);
    setMedicosAsignados([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateFormData(formData, [
      { field: 'nombre', label: 'Nombre', required: true, maxLength: 120 },
      { field: 'descripcion', label: 'Descripción', maxLength: 255 }
    ]);
    if (showValidationAlert(errors)) return;

    try {
      if (editingEspecialidad) {
        await updateEspecialidad(editingEspecialidad.id, formData);
      } else {
        await createEspecialidad(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving especialidad:', error);
      let errorMsg = 'Ocurrió un error al guardar la especialidad. Verifica los datos.';
      if (error.response && error.response.data) {
        errorMsg += '\n\nDetalles:\n' + formatBackendErrors(error.response.data);
      }
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta especialidad? Puede afectar a médicos vinculados.')) {
      try {
        await deleteEspecialidad(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting especialidad:', error);
        alert('Ocurrió un error al eliminar la especialidad. Puede que esté en uso.');
      }
    }
  };

  const filteredEspecialidades = especialidades.filter((especialidad) =>
    (especialidad.nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (especialidad.descripcion?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-teal-600" />
            Especialidades Médicas
          </h1>
          <p className="text-gray-500 text-sm mt-1">Administra el catálogo usado por el registro de médicos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none w-full md:w-72 transition-all"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors shadow-sm shadow-teal-600/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nueva Especialidad
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="px-6 py-4">Especialidad</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Cargando especialidades...
                    </div>
                  </td>
                </tr>
              ) : filteredEspecialidades.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron especialidades.
                  </td>
                </tr>
              ) : (
                filteredEspecialidades.map((especialidad) => (
                  <tr key={especialidad.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenDetails(especialidad)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-gray-900">{especialidad.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {especialidad.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenDetails(especialidad)}
                          className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Ver Detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(especialidad)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(especialidad.id)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEspecialidad ? 'Editar Especialidad' : 'Nueva Especialidad'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="especialidadForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="Ej: Medicina Interna"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    rows={3}
                    maxLength={255}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                    placeholder="Detalle breve de la especialidad..."
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
                form="especialidadForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-sm shadow-teal-600/20"
              >
                {editingEspecialidad ? 'Guardar Cambios' : 'Crear Especialidad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && viewingEspecialidad && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="text-cyan-600 w-5 h-5" />
                Detalles de Especialidad
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
                <div className="grid gap-6">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Nombre</p>
                    <p className="font-semibold text-gray-900 text-lg">{viewingEspecialidad.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Descripción</p>
                    <p className="text-gray-700">{viewingEspecialidad.descripcion || <span className="italic text-gray-400">Sin descripción registrada.</span>}</p>
                  </div>
                </div>
              </div>

              {/* Lista de Médicos Asignados */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Médicos Registrados
                </h3>
                
                {loadingMedicos ? (
                  <div className="flex justify-center p-6">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : medicosAsignados.length === 0 ? (
                  <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm">
                    No hay médicos registrados con esta especialidad.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {medicosAsignados.map(medico => (
                      <div 
                        key={medico.id} 
                        className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-all"
                        onClick={() => { handleCloseDetailsModal(); navigate('/medicos', { state: { openDetailsId: medico.id } }); }}
                      >
                        <p className="font-semibold text-gray-800 text-sm">Dr/a. {medico.apellido_paterno} {medico.nombre}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          {medico.telefono || 'Sin teléfono'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EspecialidadManagement;
