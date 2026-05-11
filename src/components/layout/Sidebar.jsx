import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, Activity, Settings, FileText, ActivitySquare, ChevronDown, ChevronRight, Lock, Stethoscope, ClipboardList, CalendarClock, FileCheck, CreditCard, Package, ListTree, AlertTriangle, FlaskConical, Microscope, BookOpen } from 'lucide-react';

const NavGroup = ({ item, currentPath }) => {
  const isChildActive = item.subItems.some(sub => currentPath === sub.path);
  // Default to open if a child is active
  const [isOpen, setIsOpen] = useState(isChildActive);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-400 hover:bg-slate-800/50 hover:text-white ${isChildActive ? 'text-white' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className={`transition-transform duration-200 group-hover:scale-110 ${isChildActive ? 'text-blue-400' : ''}`}>
            {item.icon}
          </div>
          <span className="font-medium">{item.name}</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      
      {isOpen && (
        <div className="pl-11 pr-2 space-y-1 mt-1 animate-fade-in">
          {item.subItems.map(sub => (
            <NavLink
              key={sub.name}
              to={sub.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                }`
              }
            >
              <div className="transition-transform duration-200 group-hover:scale-110">
                {sub.icon}
              </div>
              <span className="font-medium text-sm">{sub.name}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { 
      name: 'Seguridad', 
      icon: <Lock size={20} />, 
      subItems: [
        { name: 'Personal', path: '/usuarios', icon: <Users size={16} /> },
        { name: 'Roles', path: '/roles', icon: <Shield size={16} /> },
      ]
    },
    { 
      name: 'Admisión', 
      icon: <ClipboardList size={20} />, 
      subItems: [
        { name: 'Pacientes', path: '/pacientes', icon: <Users size={16} /> },
        { name: 'Especialidades', path: '/especialidades', icon: <BookOpen size={16} /> },
        { name: 'Médicos', path: '/medicos', icon: <Stethoscope size={16} /> },
        { name: 'Solicitudes', path: '/solicitudes', icon: <FileText size={16} /> },
        { name: 'Citaciones', path: '/citaciones', icon: <CalendarClock size={16} /> },
        { name: 'Consentimientos', path: '/consentimientos', icon: <FileCheck size={16} /> },
        { name: 'Pagos', path: '/pagos', icon: <CreditCard size={16} /> },
      ]
    },
    { 
      name: 'Inventario', 
      icon: <Package size={20} />, 
      subItems: [
        { name: 'Hemocomponentes', path: '/hemocomponentes', icon: <Package size={16} /> },
        { name: 'Trazabilidad', path: '/trazabilidad', icon: <ListTree size={16} /> },
        { name: 'Descartes', path: '/descartes', icon: <AlertTriangle size={16} /> },
      ]
    },
    { 
      name: 'Laboratorio', 
      icon: <FlaskConical size={20} />, 
      subItems: [
        { name: 'Pruebas a Paciente', path: '/pruebas-paciente', icon: <Users size={16} /> },
        { name: 'Pruebas Cruzadas', path: '/pruebas-bolsa', icon: <Microscope size={16} /> },
        { name: 'Transfusiones', path: '/transfusiones', icon: <ActivitySquare size={16} /> },
        { name: 'Reacciones Adversas', path: '/reacciones', icon: <AlertTriangle size={16} /> },
      ]
    },
    { name: 'Reportes', path: '/reportes', icon: <FileText size={20} /> },
    { name: 'Configuración', path: '/configuracion', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="h-20 flex items-center justify-center border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Activity size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">SGT</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Unidad Transfusional</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              item.subItems ? (
                <NavGroup key={item.name} item={item} currentPath={location.pathname} />
              ) : (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`
                  }
                >
                  <div className="transition-transform duration-200 group-hover:scale-110">
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              )
            ))}
          </nav>
          
          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center text-center">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] mb-2 animate-pulse"></div>
              <p className="text-xs text-slate-300 font-medium">Sistema Operativo</p>
              <p className="text-[10px] text-slate-500 mt-1">v1.0.0-beta</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
