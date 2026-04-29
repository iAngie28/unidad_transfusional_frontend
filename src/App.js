import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './modules/auth/views/Login';
import Dashboard from './modules/dashboard/views/Dashboard';
import MainLayout from './components/layout/MainLayout';
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
            {/* Otras rutas protegidas irán aquí: */}
            <Route path="pacientes" element={<div className="p-8"><h2>Pacientes</h2></div>} />
            <Route path="donaciones" element={<div className="p-8"><h2>Donaciones</h2></div>} />
            <Route path="transfusiones" element={<div className="p-8"><h2>Transfusiones</h2></div>} />
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
