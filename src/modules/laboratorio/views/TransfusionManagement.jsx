import React, { useState, useEffect } from 'react';
import { getTransfusiones, createTransfusion, updateTransfusion, deleteTransfusion } from '../services/transfusionService';
import { getHemocomponentes } from '../../inventario/services/hemocomponenteService';
import { getPacientes } from '../../admision/services/pacienteService';
import { useAuth } from '../../../contexts/AuthContext';
import { ActivitySquare, Plus, Edit2, Trash2, Search, X, Eye } from 'lucide-react';

const TransfusionManagement = () => {
  const { user } = useAuth();
  const [transfusiones, setTransfusiones] = useState([]);
  const [bolsas, setBolsas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransfusion, setEditingTransfusion] = useState(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    nro_bolsa: '',
    ci_paciente: '',
    user_id: user?.id || '',
    servicio: '',
    diagnostico: '',
    ate_trans_alerg: false,
    grupo_cabecera_h: '',
    hora_inicio: new Date().toISOString().slice(0, 16),
    hora_fin: '',
    fraccionado: false
  });

  const [viewingTransfusion, setViewingTransfusion] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transData, bolsasData, pacData] = await Promise.all([
        getTransfusiones(),
        getHemocomponentes(),
        getPacientes()
      ]);
      setTransfusiones(transData.results || transData || []);
      setBolsas(bolsasData.results || bolsasData || []);
      setPacientes(pacData.results || pacData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (trans = null) => {
    if (trans) {
      setEditingTransfusion(trans);
      setFormData({
        ...trans,
        hora_inicio: trans.hora_inicio ? new Date(trans.hora_inicio).toISOString().slice(0, 16) : '',
        hora_fin: trans.hora_fin ? new Date(trans.hora_fin).toISOString().slice(0, 16) : '',
        user_id: trans.user_id || user?.id || ''
      });
    } else {
      setEditingTransfusion(null);
      setFormData({
        nro_bolsa: '', ci_paciente: '', user_id: user?.id || '',
        servicio: '', diagnostico: '', ate_trans_alerg: false, grupo_cabecera_h: '',
        hora_inicio: new Date().toISOString().slice(0, 16), hora_fin: '', fraccionado: false
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransfusion(null);
  };

  const handleOpenView = (trans) => {
    setViewingTransfusion(trans);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create a copy of formData and remove hora_fin if it's empty
      const payload = { ...formData };
      if (!payload.hora_fin) {
        payload.hora_fin = null;
      }
      
      if (editingTransfusion) {
        await updateTransfusion(editingTransfusion.id, payload);
      } else {
        await createTransfusion(payload);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      let errorMsg = 'Error al guardar. Verifica los datos.';
      if (error.response?.data) {
        errorMsg += '\n\n' + JSON.stringify(error.response.data);
      }
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta transfusión?')) {
      try {
        await deleteTransfusion(id);
        fetchData();
      } catch (error) {
        alert('Error al eliminar.');
      }
    }
  };

  const filtered = transfusiones.filter(t => 
    (t.nro_bolsa?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (t.paciente_nombre?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('es-ES', { 
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ActivitySquare className="text-blue-600" />
              Gestión de Transfusiones
            </h1>
            <p className="text-gray-500 text-sm mt-1">Registro de aplicación de hemocomponentes a pacientes</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="text" placeholder="Buscar Bolsa, Paciente..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl outline-none"
            />
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl">
              <Plus className="w-4 h-4" /> Registrar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
              <tr>
                <th className="px-6 py-4">Bolsa</th>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Servicio</th>
                <th className="px-6 py-4">Horario</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-bold">{t.nro_bolsa}</td>
                  <td className="px-6 py-4 font-semibold text-indigo-700">{t.paciente_nombre}</td>
                  <td className="px-6 py-4">{t.servicio}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex flex-col text-xs font-medium">
                      <span><span className="text-green-600">Inicio:</span> {formatDateTime(t.hora_inicio)}</span>
                      <span><span className="text-red-500">Fin:</span> {formatDateTime(t.hora_fin)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenView(t)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-blue-50 rounded-lg" title="Ver Detalles"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleOpenModal(t)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-blue-50 rounded-lg" title="Editar"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-red-50 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingTransfusion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ActivitySquare className="text-blue-600 w-5 h-5" />
                Detalle de Transfusión #{viewingTransfusion.id}
              </h2>
              <button onClick={() => setViewingTransfusion(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                
                <div className="col-span-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Información General</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div><p className="text-xs text-gray-500">Paciente</p><p className="font-bold text-gray-900">{viewingTransfusion.paciente_nombre} ({viewingTransfusion.ci_paciente})</p></div>
                    <div><p className="text-xs text-gray-500">Bolsa</p><p className="font-bold text-gray-900">{viewingTransfusion.nro_bolsa}</p></div>
                    <div><p className="text-xs text-gray-500">Servicio/Cama</p><p className="font-bold text-gray-900">{viewingTransfusion.servicio}</p></div>
                    <div><p className="text-xs text-gray-500">Grupo Cabecera</p><p className="font-bold text-gray-900">{viewingTransfusion.grupo_cabecera_h}</p></div>
                    <div className="col-span-2"><p className="text-xs text-gray-500">Diagnóstico</p><p className="font-bold text-gray-900">{viewingTransfusion.diagnostico}</p></div>
                  </div>
                </div>

                <div className="col-span-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Horarios</h3>
                  <div className="grid grid-cols-2 gap-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
                    <div><p className="text-xs text-gray-500">Hora Inicio</p><p className="font-bold text-green-700">{formatDateTime(viewingTransfusion.hora_inicio)}</p></div>
                    <div><p className="text-xs text-gray-500">Hora Fin</p><p className="font-bold text-red-600">{formatDateTime(viewingTransfusion.hora_fin)}</p></div>
                  </div>
                </div>

                <div className="col-span-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Condiciones Especiales</h3>
                  <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${viewingTransfusion.ate_trans_alerg ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                      <span className="text-sm font-medium text-gray-700">Antecedentes Transfusionales o Alergias: <span className="font-bold">{viewingTransfusion.ate_trans_alerg ? 'SÍ' : 'NO'}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${viewingTransfusion.fraccionado ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                      <span className="text-sm font-medium text-gray-700">Hemocomponente Fraccionado (Pediátrico): <span className="font-bold">{viewingTransfusion.fraccionado ? 'SÍ' : 'NO'}</span></span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setViewingTransfusion(null)} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2"><ActivitySquare className="text-blue-600" /> {editingTransfusion ? 'Editar' : 'Registrar Transfusión'}</h2>
              <button onClick={handleCloseModal}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="transForm" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700">Bolsa Hemocomponente *</label>
                  <select required value={formData.nro_bolsa} onChange={(e) => setFormData({...formData, nro_bolsa: e.target.value})} className="w-full p-2 border rounded-lg font-mono outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Seleccionar --</option>
                    {bolsas.map(b => <option key={b.nro_bolsa} value={b.nro_bolsa}>{b.nro_bolsa} - {b.tipo}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700">Paciente Receptor *</label>
                  <select required value={formData.ci_paciente} onChange={(e) => setFormData({...formData, ci_paciente: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Seleccionar --</option>
                    {pacientes.map(p => <option key={p.ci} value={p.ci}>{p.ci} - {p.nombre} {p.apellido_paterno}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-700">Servicio / Cama *</label>
                  <input type="text" required maxLength="120" value={formData.servicio} onChange={(e) => setFormData({...formData, servicio: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Terapia Intensiva, Cama 4" />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-700">Grupo Cabecera *</label>
                  <input type="text" required maxLength="20" value={formData.grupo_cabecera_h} onChange={(e) => setFormData({...formData, grupo_cabecera_h: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: O+" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700">Diagnóstico *</label>
                  <textarea required value={formData.diagnostico} onChange={(e) => setFormData({...formData, diagnostico: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Diagnóstico de ingreso..." />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-700">Hora Inicio *</label>
                  <input type="datetime-local" required value={formData.hora_inicio} onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-700">Hora Fin</label>
                  <input type="datetime-local" value={formData.hora_fin} onChange={(e) => setFormData({...formData, hora_fin: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div className="col-span-2 flex flex-col gap-2 mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.ate_trans_alerg} onChange={(e) => setFormData({...formData, ate_trans_alerg: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-medium text-gray-700">Antecedentes Transfusionales / Alergias</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.fraccionado} onChange={(e) => setFormData({...formData, fraccionado: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-medium text-gray-700">Hemocomponente Fraccionado (Uso pediátrico)</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl">Cancelar</button>
              <button type="submit" form="transForm" className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-xl shadow-sm shadow-blue-600/20">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default TransfusionManagement;
