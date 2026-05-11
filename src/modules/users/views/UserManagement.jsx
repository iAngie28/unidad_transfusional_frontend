import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { getRoles } from '../services/roleService';
import { Users, Plus, Edit2, Trash2, Search, X, Shield, Phone, Mail } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    telefono: '',
    rol: '', // Changed from role to rol to match backend serializer
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both users and roles in parallel
      const [usersData, rolesData] = await Promise.all([
        getUsers(),
        getRoles()
      ]);
      // The API might return { count, results } if paginated, or an array
      setUsers(usersData.results || usersData || []);
      setRoles(rolesData.results || rolesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        password: '', // Leave blank when editing
        telefono: user.telefono || '',
        rol: user.rol || '', // Changed to rol
        is_active: user.is_active !== undefined ? user.is_active : true
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        telefono: '',
        rol: '', // Changed to rol
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
      } else {
        await createUser(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      let errorMsg = 'Ocurrió un error al guardar el usuario. Verifica los datos.';
      if (error.response && error.response.data) {
        // Formatear los errores de validación del backend
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
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await deleteUser(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Ocurrió un error al eliminar el usuario.');
      }
    }
  };

  const filteredUsers = users.filter(user => 
    (user.username?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (user.first_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (user.last_name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" />
            Gestión de Personal
          </h1>
          <p className="text-gray-500 text-sm mt-1">Administra los usuarios y accesos al sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar usuario..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full md:w-64 transition-all"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="px-6 py-4">Usuario / Nombre</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Cargando personal...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold">
                          {user.first_name ? user.first_name.charAt(0) : user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {user.email && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="text-xs">{user.email}</span>
                          </div>
                        )}
                        {user.telefono && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-xs">{user.telefono}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md w-max text-xs font-medium border border-indigo-100">
                        <Shield className="w-3.5 h-3.5" />
                        {user.role_display || roles.find(r => r.id === user.rol)?.nombre || user.rol_nombre || 'Sin Rol'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.is_active 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
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
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="userForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Usuario *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="ej: jperez"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Contraseña {editingUser ? '(dejar en blanco para mantener)' : '*'}
                  </label>
                  <input 
                    type="password" 
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Nombre *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Juan"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Apellido *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Pérez"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="juan@ejemplo.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <input 
                    type="text" 
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="71234567"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Rol *</label>
                  <select 
                    required
                    value={formData.rol}
                    onChange={(e) => setFormData({...formData, rol: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccionar Rol --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Usuario Activo
                  </label>
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
                form="userForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
              >
                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;
