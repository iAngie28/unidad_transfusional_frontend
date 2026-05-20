import React from 'react';

const SegmentedControl = ({ value, onChange, options = [
  { value: 'POSITIVO', label: 'Positivo' },
  { value: 'NEGATIVO', label: 'Negativo' }
] }) => {
  return (
    <div className="relative flex w-full bg-purple-50/50 rounded-xl p-1 border border-purple-100 select-none h-10 items-center">
      {options.map((option, index) => {
        const isActive = value === option.value;
        return (
          <React.Fragment key={option.value}>
            <button
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex-1 h-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-200 rounded-lg focus:outline-none z-10 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'text-purple-600 hover:bg-purple-100/50 hover:text-purple-800'
              }`}
            >
              {option.label}
            </button>
            {/* Fine Separator */}
            {index < options.length - 1 && (
              <div className="w-[1px] h-5 bg-purple-200 pointer-events-none mx-0.5"></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
