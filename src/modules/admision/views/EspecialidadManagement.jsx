import React, { useEffect, useState } from 'react';
import { createEspecialidad, deleteEspecialidad, getEspecialidades, updateEspecialidad } from '../services/especialidadService';
import { BookOpen, Edit2, Plus, Search, Trash2, X } from 'lucide-react';

const EspecialidadManagement = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEspecialidad, setEditingEspecialidad] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        const backendErrors = error.response.data;
        const errorList = Object.entries(backendErrors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n');
        errorMsg += '\n\nDetalles:\n' + errorList;
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
                  <tr key={especialidad.id} className="hover:bg-gray-50/50 transition-colors group">
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
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
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
    </div>
  );
};

export default EspecialidadManagement;
