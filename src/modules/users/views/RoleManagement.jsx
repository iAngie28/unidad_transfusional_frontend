import React, { useState, useEffect } from 'react';
import { getRoles, createRole, updateRole, deleteRole } from '../services/roleService';
import { Shield, Plus, Edit2, Trash2, Search, X, CheckSquare, Square } from 'lucide-react';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    // This could be expanded depending on how permissions are handled in the backend
    permisos: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getRoles();
      setRoles(data.results || data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        nombre: role.nombre || '',
        descripcion: role.descripcion || '',
        permisos: role.permisos || []
      });
    } else {
      setEditingRole(null);
      setFormData({
        nombre: '',
        descripcion: '',
        permisos: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
      } else {
        await createRole(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Ocurrió un error al guardar el rol. Verifica los datos.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este rol? Podría afectar a usuarios que lo tengan asignado.')) {
      try {
        await deleteRole(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting role:', error);
        alert('Ocurrió un error al eliminar el rol. Puede que esté en uso.');
      }
    }
  };

  const filteredRoles = roles.filter(role => 
    (role.nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (role.descripcion?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-indigo-600" />
            Roles y Permisos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Administra los niveles de acceso al sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar rol..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full md:w-64 transition-all"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nuevo Rol
          </button>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="px-6 py-4">Nombre del Rol</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Cargando roles...
                    </div>
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron roles.
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-gray-900">{role.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {role.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(role)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(role.id)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="roleForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Nombre del Rol *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="ej: BIOQUIMICO"
                  />
                  <p className="text-xs text-gray-500">Se recomienda usar MAYÚSCULAS para identificadores internos.</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Descripción</label>
                  <textarea 
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                    placeholder="Describe los permisos y responsabilidades de este rol..."
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
                form="roleForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
              >
                {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
