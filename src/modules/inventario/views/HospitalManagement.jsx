import React, { useEffect, useState } from 'react';
import { createHospital, deleteHospital, getHospitales, updateHospital } from '../services/hospitalService';
import { Building2, Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { formatBackendErrors, showValidationAlert, validateFormData } from '../../../utils/formValidation';

const HospitalManagement = () => {
  const [hospitales, setHospitales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
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
      const data = await getHospitales();
      setHospitales(data.results || data || []);
    } catch (error) {
      console.error('Error fetching hospitales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (hospital = null) => {
    if (hospital) {
      setEditingHospital(hospital);
      setFormData({
        nombre: hospital.nombre || '',
        descripcion: hospital.descripcion || ''
      });
    } else {
      setEditingHospital(null);
      setFormData({
        nombre: '',
        descripcion: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHospital(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateFormData(formData, [
      { field: 'nombre', label: 'Nombre', required: true, maxLength: 120 },
      { field: 'descripcion', label: 'Descripción', maxLength: 255 }
    ]);
    if (showValidationAlert(errors)) return;

    try {
      if (editingHospital) {
        await updateHospital(editingHospital.id, formData);
      } else {
        await createHospital(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving hospital:', error);
      let errorMsg = 'Ocurrió un error al guardar el hospital. Verifica los datos.';
      if (error.response && error.response.data) {
        errorMsg += '\n\nDetalles:\n' + formatBackendErrors(error.response.data);
      }
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este hospital?')) {
      try {
        await deleteHospital(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting hospital:', error);
        alert('Ocurrió un error al eliminar el hospital. Puede que esté en uso.');
      }
    }
  };

  const filteredHospitales = hospitales.filter((hospital) =>
    (hospital.nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (hospital.descripcion?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-blue-600" />
            Hospitales
          </h1>
          <p className="text-gray-500 text-sm mt-1">Administra el catálogo de hospitales</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar hospital..."
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
            Nuevo Hospital
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="px-6 py-4">Hospital</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Cargando hospitales...
                    </div>
                  </td>
                </tr>
              ) : filteredHospitales.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron hospitales.
                  </td>
                </tr>
              ) : (
                filteredHospitales.map((hospital) => (
                  <tr key={hospital.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-gray-900">{hospital.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {hospital.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(hospital)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(hospital.id)}
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingHospital ? 'Editar Hospital' : 'Nuevo Hospital'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="hospitalForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Ej: Hospital General"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    rows={3}
                    maxLength={255}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Detalle breve del hospital..."
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
                form="hospitalForm"
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
              >
                {editingHospital ? 'Guardar Cambios' : 'Crear Hospital'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HospitalManagement;
