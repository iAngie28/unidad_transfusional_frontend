import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder = 'Seleccionar...', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // Sync search term with selected value when closed or value changes from outside
  useEffect(() => {
    if (!isOpen) {
      const selectedOption = options.find(opt => String(opt.value) === String(value));
      setSearchTerm(selectedOption ? selectedOption.label : '');
    }
  }, [value, isOpen, options]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={searchTerm}
          onClick={() => !disabled && setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            // Si el usuario borra todo, limpiamos el valor seleccionado
            if (e.target.value === '') {
                onChange('', null);
            }
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white cursor-text'}`}
        />
        <div 
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[120] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto custom-scrollbar">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">No hay resultados</div>
          ) : (
             filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  setSearchTerm(opt.label);
                  onChange(opt.value, opt.data);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  String(opt.value) === String(value) 
                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
