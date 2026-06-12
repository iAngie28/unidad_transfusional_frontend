import React, { useState, useEffect } from 'react';

const GlobalAlert = () => {
  const [alertData, setAlertData] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    // Sobrescribir el alert nativo del navegador de forma global
    window.alert = (message) => {
      setAlertData({ isOpen: true, message: String(message) });
    };
  }, []);

  if (!alertData.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col scale-100 transition-transform">
        <div className="px-6 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50/50">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <span className="font-bold text-xl">!</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Atención</h2>
        </div>
        <div className="p-6 text-sm text-gray-700 whitespace-pre-wrap">
          {alertData.message}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={() => setAlertData({ isOpen: false, message: '' })}
            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalAlert;
