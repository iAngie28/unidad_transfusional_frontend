import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Users, Activity, Droplets, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  
  const stats = [
    { name: 'Pacientes Registrados', value: '2,845', change: '+12.5%', isIncrease: true, icon: <Users className="text-blue-500" /> },
    { name: 'Donaciones del Mes', value: '452', change: '+5.2%', isIncrease: true, icon: <Activity className="text-green-500" /> },
    { name: 'Unidades Disponibles', value: '184', change: '-2.4%', isIncrease: false, icon: <Droplets className="text-red-500" /> },
    { name: 'Transfusiones Exitosas', value: '98.5%', change: '+0.5%', isIncrease: true, icon: <TrendingUp className="text-indigo-500" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-70"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Bienvenido, {user?.username || user?.first_name || 'Usuario'} 👋
            </h1>
            <p className="mt-2 text-gray-500 text-lg">
              Aquí tienes un resumen de la actividad de la Unidad Transfusional hoy.
            </p>
          </div>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center shadow-inner">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
            Sistema Operativo
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                stat.isIncrease ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{stat.name}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity placeholder */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Actividad Reciente</h2>
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Ver todo</button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Activity className="w-16 h-16 mb-4 text-gray-200" />
          <p>No hay actividad reciente para mostrar</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
