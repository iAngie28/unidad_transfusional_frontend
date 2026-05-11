import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './modules/auth/views/Login';
import Dashboard from './modules/dashboard/views/Dashboard';
import MainLayout from './components/layout/MainLayout';
import UserManagement from './modules/users/views/UserManagement';
import RoleManagement from './modules/users/views/RoleManagement';
import PacienteManagement from './modules/admision/views/PacienteManagement';
import EspecialidadManagement from './modules/admision/views/EspecialidadManagement';
import MedicoManagement from './modules/admision/views/MedicoManagement';
import SolicitudManagement from './modules/admision/views/SolicitudManagement';
import CitacionManagement from './modules/admision/views/CitacionManagement';
import ConsentimientoManagement from './modules/admision/views/ConsentimientoManagement';
import PagoManagement from './modules/admision/views/PagoManagement';
import HemocomponenteManagement from './modules/inventario/views/HemocomponenteManagement';
import TrazabilidadManagement from './modules/inventario/views/TrazabilidadManagement';
import DescarteManagement from './modules/inventario/views/DescarteManagement';
import PruebaPacManagement from './modules/laboratorio/views/PruebaPacManagement';
import PruebaHemaManagement from './modules/laboratorio/views/PruebaHemaManagement';
import TransfusionManagement from './modules/laboratorio/views/TransfusionManagement';
import ReaccionManagement from './modules/laboratorio/views/ReaccionManagement';
import './App.css';

// Componente para proteger las rutas que requieren que el usuario no esté autenticado (ej: /login)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null; // or a spinner
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            
            {/* Módulo 1: Usuarios y Personal */}
            <Route path="usuarios" element={<UserManagement />} />
            <Route path="roles" element={<RoleManagement />} />
            
            {/* Módulo 2: Admisión */}
            <Route path="pacientes" element={<PacienteManagement />} />
            <Route path="especialidades" element={<EspecialidadManagement />} />
            <Route path="medicos" element={<MedicoManagement />} />
            <Route path="solicitudes" element={<SolicitudManagement />} />
            <Route path="citaciones" element={<CitacionManagement />} />
            <Route path="consentimientos" element={<ConsentimientoManagement />} />
            <Route path="pagos" element={<PagoManagement />} />
            
            {/* Módulo 3: Inventario */}
            <Route path="hemocomponentes" element={<HemocomponenteManagement />} />
            <Route path="trazabilidad" element={<TrazabilidadManagement />} />
            <Route path="descartes" element={<DescarteManagement />} />
            
            {/* Módulo 4: Laboratorio y Transfusiones */}
            <Route path="pruebas-paciente" element={<PruebaPacManagement />} />
            <Route path="pruebas-bolsa" element={<PruebaHemaManagement />} />
            <Route path="transfusiones" element={<TransfusionManagement />} />
            <Route path="reacciones" element={<ReaccionManagement />} />
            <Route path="reportes" element={<div className="p-8"><h2>Reportes</h2></div>} />
            <Route path="configuracion" element={<div className="p-8"><h2>Configuración</h2></div>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
