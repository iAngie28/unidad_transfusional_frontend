import React, { useState, useEffect, useMemo } from 'react';
import { getRoles, createRole, updateRole, deleteRole, getPermisos } from '../services/roleService';
import { Shield, Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { showValidationAlert, validateFormData } from '../../../utils/formValidation';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permisosList, setPermisosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedModulo, setSelectedModulo] = useState('');
  
  const modulos = useMemo(() => {
    return [...new Set(permisosList.map(p => p.modulo))].filter(Boolean).sort();
  }, [permisosList]);

  useEffect(() => {
    if (modulos.length > 0 && !selectedModulo) {
      setSelectedModulo(modulos[0]);
    }
  }, [modulos, selectedModulo]);

  const formatPermissionName = (name) => {
    return name
      .replace('Can add ', 'Añadir ')
      .replace('Can change ', 'Editar ')
      .replace('Can delete ', 'Eliminar ')
      .replace('Can view ', 'Ver ');
  };
  
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
      const [rolesData, permisosData] = await Promise.all([
        getRoles(),
        getPermisos()
      ]);
      setRoles(rolesData.results || rolesData || []);
      setPermisosList(permisosData.results || permisosData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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
    const errors = validateFormData(formData, [
      { field: 'nombre', label: 'Nombre del rol', required: true, maxLength: 100 },
      { field: 'descripcion', label: 'Descripción', maxLength: 255 }
    ]);
    if (showValidationAlert(errors)) return;

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
    <>
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
    </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const allPerms = permisosList.map(p => p.id);
                    if (formData.permisos.length === allPerms.length) {
                      setFormData({ ...formData, permisos: [] });
                    } else {
                      setFormData({ ...formData, permisos: allPerms });
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                >
                  Seleccionar Todo el Sistema
                </button>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-hidden flex-1 flex flex-col">
              <form id="roleForm" onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Nombre del Rol *</label>
                    <input 
                      type="text" 
                      required
                      maxLength={100}
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="ej: BIOQUIMICO"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                    <textarea 
                      rows={2}
                      maxLength={255}
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                      placeholder="Describe los permisos y responsabilidades..."
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 border-t border-gray-100 pt-4 flex-1 min-h-0">
                  {/* Sidebar Módulos */}
                  <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-100 pr-4 flex flex-col min-h-0">
                    <label className="text-sm font-medium text-gray-700 mb-2">Módulos del Sistema</label>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                      {modulos.map(mod => {
                        const modulePerms = permisosList.filter(p => p.modulo === mod);
                        const selectedCount = modulePerms.filter(p => formData.permisos.includes(p.id)).length;
                        return (
                          <button
                            key={mod}
                            type="button"
                            onClick={() => setSelectedModulo(mod)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                              selectedModulo === mod 
                                ? 'bg-indigo-50 text-indigo-700' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="capitalize">{mod.replace('_', ' ')}</span>
                            {selectedCount > 0 && (
                              <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                                {selectedCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Panel Permisos */}
                  <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col min-h-0">
                    <label className="text-sm font-medium text-gray-700 mb-2 capitalize flex justify-between items-center">
                      <span>Permisos en {selectedModulo?.replace('_', ' ')}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const modulePerms = permisosList.filter(p => p.modulo === selectedModulo).map(p => p.id);
                          const allSelected = modulePerms.every(id => formData.permisos.includes(id));
                          if (allSelected) {
                            setFormData({ ...formData, permisos: formData.permisos.filter(id => !modulePerms.includes(id)) });
                          } else {
                            const newPerms = [...new Set([...formData.permisos, ...modulePerms])];
                            setFormData({ ...formData, permisos: newPerms });
                          }
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Seleccionar / Deseleccionar Todo
                      </button>
                    </label>
                    <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50 rounded-xl border border-gray-200 custom-scrollbar">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {permisosList.filter(p => p.modulo === selectedModulo).map(permiso => (
                          <label key={permiso.id} className="flex items-start gap-3 cursor-pointer hover:bg-white p-2.5 rounded-lg transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm">
                            <input
                              type="checkbox"
                              className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 transition-colors"
                              checked={formData.permisos.includes(permiso.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, permisos: [...formData.permisos, permiso.id] });
                                } else {
                                  setFormData({ ...formData, permisos: formData.permisos.filter(id => id !== permiso.id) });
                                }
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">{formatPermissionName(permiso.name)}</span>
                              <span className="text-xs text-gray-500 font-mono mt-0.5">{permiso.codename}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
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
    </>
  );
};

export default RoleManagement;
