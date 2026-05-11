import React, { useState, useEffect } from 'react';
import { getPacientes, createPaciente, updatePaciente, deletePaciente } from '../services/pacienteService';
import { Users, Plus, Edit2, Trash2, Search, X, Activity, Droplet } from 'lucide-react';

const PacienteManagement = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    ci: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    edad: '',
    sexo: '',
    historia_clinica: '',
    grupo_sanguineo: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getPacientes();
      setPacientes(data.results || data || []);
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
        edad: paciente.edad || '',
        sexo: paciente.sexo || '',
        historia_clinica: paciente.historia_clinica || '',
        grupo_sanguineo: paciente.grupo_sanguineo || ''
      });
    } else {
      setEditingPaciente(null);
      setFormData({
        ci: '',
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        edad: '',
        sexo: '',
        historia_clinica: '',
        grupo_sanguineo: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPaciente(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPaciente) {
        // En backend la PK es CI, normalmente para actualizar se envía a la PK anterior
        await updatePaciente(editingPaciente.ci, formData);
      } else {
        await createPaciente(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving paciente:', error);
      let errorMsg = 'Ocurrió un error al guardar el paciente. Verifica los datos.';
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
                  <tr key={p.ci} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {p.apellido_paterno} {p.apellido_materno} {p.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div>CI: {p.ci}</div>
                      <div className="text-xs text-gray-400">{p.edad} años • Sexo: {p.sexo}</div>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    value={formData.ci}
                    onChange={(e) => setFormData({...formData, ci: e.target.value})}
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
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido Paterno *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.apellido_paterno}
                    onChange={(e) => setFormData({...formData, apellido_paterno: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido Materno</label>
                  <input 
                    type="text" 
                    value={formData.apellido_materno}
                    onChange={(e) => setFormData({...formData, apellido_materno: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Edad *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    max="150"
                    value={formData.edad}
                    onChange={(e) => setFormData({...formData, edad: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Sexo *</label>
                  <select 
                    required
                    value={formData.sexo}
                    onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">N° Historia Clínica *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.historia_clinica}
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
    </>
  );
};

export default PacienteManagement;
