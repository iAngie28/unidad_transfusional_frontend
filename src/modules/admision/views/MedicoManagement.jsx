import React, { useState, useEffect } from 'react';
import { getMedicos, createMedico, updateMedico, deleteMedico } from '../services/medicoService';
import { getEspecialidades } from '../services/especialidadService';
import { Stethoscope, Plus, Edit2, Trash2, Search, X } from 'lucide-react';

const MedicoManagement = () => {
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedico, setEditingMedico] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    matricula_profesional: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    especialidad: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [medicosData, especialidadesData] = await Promise.all([
        getMedicos(),
        getEspecialidades()
      ]);
      setMedicos(medicosData.results || medicosData || []);
      setEspecialidades(especialidadesData.results || especialidadesData || []);
    } catch (error) {
      console.error('Error fetching medicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (medico = null) => {
    if (medico) {
      setEditingMedico(medico);
      setFormData({
        matricula_profesional: medico.matricula_profesional || '',
        nombre: medico.nombre || '',
        apellido_paterno: medico.apellido_paterno || '',
        apellido_materno: medico.apellido_materno || '',
        especialidad: medico.especialidad || ''
      });
    } else {
      setEditingMedico(null);
      setFormData({
        matricula_profesional: '',
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        especialidad: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMedico(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMedico) {
        await updateMedico(editingMedico.id, formData);
      } else {
        await createMedico(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving medico:', error);
      let errorMsg = 'Ocurrió un error al guardar el médico. Verifica los datos.';
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
    if (window.confirm('¿Estás seguro de eliminar este médico? Podría afectar a las solicitudes vinculadas.')) {
      try {
        await deleteMedico(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting medico:', error);
        alert('Ocurrió un error al eliminar el médico. Puede que esté en uso.');
      }
    }
  };

  const filteredMedicos = medicos.filter(m => 
    (m.nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (m.apellido_paterno?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (m.matricula_profesional?.toLowerCase() || '').includes(search.toLowerCase()) ||
    ((m.especialidad_nombre || m.especialidad || '').toString().toLowerCase()).includes(search.toLowerCase())
  );

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="text-teal-600" />
            Registro de Médicos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Administra el personal médico externo/solicitante</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por Nombre, Matrícula..." 
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
            Nuevo Médico
          </button>
        </div>
      </div>

      {/* Medicos Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="px-6 py-4">Médico</th>
                <th className="px-6 py-4">Especialidad</th>
                <th className="px-6 py-4">Matrícula Profesional</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Cargando médicos...
                    </div>
                  </td>
                </tr>
              ) : filteredMedicos.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron médicos.
                  </td>
                </tr>
              ) : (
                filteredMedicos.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div className="font-semibold text-gray-900">
                          Dr/Dra. {m.nombre} {m.apellido_paterno} {m.apellido_materno}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200">
                        {m.especialidad_nombre || m.especialidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600">
                      {m.matricula_profesional}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(m)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id)}
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
                {editingMedico ? 'Editar Médico' : 'Nuevo Médico'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="medicoForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Matrícula Profesional *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.matricula_profesional}
                    onChange={(e) => setFormData({...formData, matricula_profesional: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="Ej: M-1234"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nombre *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido Paterno *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.apellido_paterno}
                    onChange={(e) => setFormData({...formData, apellido_paterno: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido Materno</label>
                  <input 
                    type="text" 
                    value={formData.apellido_materno}
                    onChange={(e) => setFormData({...formData, apellido_materno: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Especialidad *</label>
                  <select
                    required
                    value={formData.especialidad}
                    onChange={(e) => setFormData({...formData, especialidad: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Especialidad --</option>
                    {especialidades.map((especialidad) => (
                      <option key={especialidad.id} value={especialidad.id}>
                        {especialidad.nombre}
                      </option>
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
                form="medicoForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-sm shadow-teal-600/20"
              >
                {editingMedico ? 'Guardar Cambios' : 'Registrar Médico'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MedicoManagement;
