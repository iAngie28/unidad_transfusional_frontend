import React, { useState, useEffect } from 'react';
import { getPruebasPac, createPruebaPac, updatePruebaPac, deletePruebaPac } from '../services/pruebaPacService';
import { getPacientes } from '../../admision/services/pacienteService';
import { getSolicitudes } from '../../admision/services/solicitudService';
import { useAuth } from '../../../contexts/AuthContext';
import { FlaskConical, Plus, Edit2, Trash2, Search, X, Eye } from 'lucide-react';

const PruebaPacManagement = () => {
  const { user } = useAuth();
  const [pruebas, setPruebas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrueba, setEditingPrueba] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    fecha_hora: new Date().toISOString().slice(0, 16),
    paciente_id: '',
    user_id: user?.id || '',
    nro_solicitud: '',
    anti_a: 'NO_REALIZADO',
    anti_b: 'NO_REALIZADO',
    anti_ab: 'NO_REALIZADO',
    anti_d: 'NO_REALIZADO',
    control_rhesus: '',
    alfa: '',
    beta: '',
    o: '',
    fenotipo: '',
    hto: '',
    hb: '',
    coombs_directo: '',
    resultado: 'PENDIENTE'
  });

  const [viewingPrueba, setViewingPrueba] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pruebasData, pacientesData, solicitudesData] = await Promise.all([
        getPruebasPac(),
        getPacientes(),
        getSolicitudes()
      ]);
      setPruebas(pruebasData.results || pruebasData || []);
      setPacientes(pacientesData.results || pacientesData || []);
      setSolicitudes(solicitudesData.results || solicitudesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prueba = null) => {
    if (prueba) {
      setEditingPrueba(prueba);
      setFormData({
        ...prueba,
        fecha_hora: prueba.fecha_hora ? new Date(prueba.fecha_hora).toISOString().slice(0, 16) : '',
        user_id: prueba.user_id || user?.id || ''
      });
    } else {
      setEditingPrueba(null);
      setFormData({
        fecha_hora: new Date().toISOString().slice(0, 16),
        paciente_id: '',
        user_id: user?.id || '',
        nro_solicitud: '',
        anti_a: 'NO_REALIZADO', anti_b: 'NO_REALIZADO', anti_ab: 'NO_REALIZADO', anti_d: 'NO_REALIZADO', control_rhesus: '',
        alfa: '', beta: '', o: '', fenotipo: '', hto: '', hb: '', coombs_directo: '',
        resultado: 'PENDIENTE'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrueba(null);
  };

  const handleOpenView = (prueba) => {
    setViewingPrueba(prueba);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPrueba) {
        await updatePruebaPac(editingPrueba.id, formData);
      } else {
        await createPruebaPac(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving prueba:', error);
      let errorMsg = 'Ocurrió un error al guardar. Verifica los datos.';
      if (error.response?.data) {
        const backendErrors = error.response.data;
        const errorList = Object.entries(backendErrors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n');
        errorMsg += '\n\n' + errorList;
      }
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        await deletePruebaPac(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting prueba:', error);
        alert('Ocurrió un error al eliminar.');
      }
    }
  };

  const filteredPruebas = pruebas.filter(p => 
    (p.paciente_id?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (String(p.nro_solicitud).toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FlaskConical className="text-purple-600" />
              Pruebas Pretransfusionales (Paciente)
            </h1>
            <p className="text-gray-500 text-sm mt-1">Análisis serológico del receptor</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar CI, Solicitud..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none w-full md:w-72 transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Nueva Prueba
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">N° Solicitud</th>
                  <th className="px-6 py-4">Resultado</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center mb-2"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
                      Cargando pruebas...
                    </td>
                  </tr>
                ) : filteredPruebas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No se encontraron registros.</td>
                  </tr>
                ) : (
                  filteredPruebas.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono">#{p.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{p.paciente_id}</td>
                      <td className="px-6 py-4 text-gray-600">{p.nro_solicitud || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                          p.resultado === 'APTO' ? 'bg-green-100 text-green-700 border-green-200' : p.resultado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {p.resultado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{new Date(p.fecha_hora).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenView(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver Detalles"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleOpenModal(p)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Editar"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
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

      {viewingPrueba && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FlaskConical className="text-purple-600 w-5 h-5" />
                Detalle de Prueba (Paciente) #{viewingPrueba.id}
              </h2>
              <button onClick={() => setViewingPrueba(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                
                <div className="col-span-2 md:col-span-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Información General</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div><p className="text-xs text-gray-500">Paciente CI</p><p className="font-bold text-gray-900">{viewingPrueba.paciente_id}</p></div>
                    <div><p className="text-xs text-gray-500">Solicitud Asociada</p><p className="font-bold text-gray-900">{viewingPrueba.nro_solicitud || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Fecha y Hora</p><p className="font-bold text-gray-900">{new Date(viewingPrueba.fecha_hora).toLocaleString()}</p></div>
                    <div>
                      <p className="text-xs text-gray-500">Resultado</p>
                      <span className={`inline-block px-2 py-1 mt-1 rounded-md text-xs font-bold border ${viewingPrueba.resultado === 'APTO' ? 'bg-green-100 text-green-700 border-green-200' : viewingPrueba.resultado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{viewingPrueba.resultado}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-4 mt-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Reactivos Serológicos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                    <div><p className="text-xs text-gray-500">Anti-A</p><p className="font-bold text-gray-900">{viewingPrueba.anti_a}</p></div>
                    <div><p className="text-xs text-gray-500">Anti-B</p><p className="font-bold text-gray-900">{viewingPrueba.anti_b}</p></div>
                    <div><p className="text-xs text-gray-500">Anti-AB</p><p className="font-bold text-gray-900">{viewingPrueba.anti_ab}</p></div>
                    <div><p className="text-xs text-gray-500">Anti-D</p><p className="font-bold text-gray-900">{viewingPrueba.anti_d}</p></div>
                    
                    <div><p className="text-xs text-gray-500">Control Rhesus</p><p className="font-bold text-gray-900">{viewingPrueba.control_rhesus || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Alfa</p><p className="font-bold text-gray-900">{viewingPrueba.alfa || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Beta</p><p className="font-bold text-gray-900">{viewingPrueba.beta || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">O</p><p className="font-bold text-gray-900">{viewingPrueba.o || '-'}</p></div>
                    
                    <div className="col-span-2"><p className="text-xs text-gray-500">Fenotipo</p><p className="font-bold text-gray-900">{viewingPrueba.fenotipo || '-'}</p></div>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-4 mt-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Valores Clínicos</h3>
                  <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div><p className="text-xs text-gray-500">HTO</p><p className="font-bold text-gray-900">{viewingPrueba.hto}</p></div>
                    <div><p className="text-xs text-gray-500">HB</p><p className="font-bold text-gray-900">{viewingPrueba.hb}</p></div>
                    <div><p className="text-xs text-gray-500">Coombs Directo</p><p className="font-bold text-gray-900">{viewingPrueba.coombs_directo || '-'}</p></div>
                  </div>
                </div>

              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setViewingPrueba(null)} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FlaskConical className="text-purple-600 w-5 h-5" />
                {editingPrueba ? 'Editar Prueba de Paciente' : 'Nueva Prueba Pretransfusional (Receptor)'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="pruebaPacForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
                
                {/* Datos Generales */}
                <div className="md:col-span-3 pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider">Datos Generales</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Paciente *</label>
                  <select required value={formData.paciente_id} onChange={(e) => setFormData({...formData, paciente_id: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                    <option value="">-- Seleccionar --</option>
                    {pacientes.map(p => <option key={p.ci} value={p.ci}>{p.ci} - {p.nombre} {p.apellido_paterno}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Solicitud Asociada *</label>
                  <select required value={formData.nro_solicitud} onChange={(e) => setFormData({...formData, nro_solicitud: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                    <option value="">-- Seleccionar --</option>
                    {solicitudes.map(s => <option key={s.nro} value={s.nro}>Sol #{s.nro} - {s.paciente_nombre}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Fecha y Hora *</label>
                  <input type="datetime-local" required value={formData.fecha_hora} onChange={(e) => setFormData({...formData, fecha_hora: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>

                {/* Reactivos */}
                <div className="md:col-span-3 pb-2 mt-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider">Reactivos Serológicos</h3>
                </div>

                {['anti_a', 'anti_b', 'anti_ab', 'anti_d'].map(field => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700 capitalize">{field.replace('_', ' ')} *</label>
                    <select required value={formData[field]} onChange={(e) => setFormData({...formData, [field]: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-medium">
                      <option value="POSITIVO">POSITIVO</option>
                      <option value="NEGATIVO">NEGATIVO</option>
                      <option value="NO_REALIZADO">NO REALIZADO</option>
                    </select>
                  </div>
                ))}
                
                {['control_rhesus', 'alfa', 'beta', 'o', 'fenotipo'].map(field => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700 capitalize">{field.replace('_', ' ')}</label>
                    <input type="text" maxLength="50" value={formData[field]} onChange={(e) => setFormData({...formData, [field]: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                ))}

                {/* Otros Valores */}
                <div className="md:col-span-3 pb-2 mt-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider">Valores & Resultado</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">HTO (Número) *</label>
                  <input type="number" step="0.01" required value={formData.hto} onChange={(e) => setFormData({...formData, hto: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">HB (Número) *</label>
                  <input type="number" step="0.01" required value={formData.hb} onChange={(e) => setFormData({...formData, hb: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Coombs Directo</label>
                  <input type="text" maxLength="50" value={formData.coombs_directo} onChange={(e) => setFormData({...formData, coombs_directo: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>

                <div className="space-y-1.5 md:col-span-3 bg-purple-50 p-4 rounded-xl border border-purple-100 mt-2">
                  <label className="text-sm font-bold text-purple-900">Resultado Final *</label>
                  <select required value={formData.resultado} onChange={(e) => setFormData({...formData, resultado: e.target.value})} className="w-full mt-2 px-4 py-2 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-gray-900 bg-white shadow-sm">
                    <option value="APTO">APTO</option>
                    <option value="NO_APTO">NO APTO</option>
                    <option value="PENDIENTE">PENDIENTE</option>
                  </select>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm">Cancelar</button>
              <button type="submit" form="pruebaPacForm" className="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 shadow-sm shadow-purple-600/20">{editingPrueba ? 'Guardar Cambios' : 'Registrar Prueba'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PruebaPacManagement;
