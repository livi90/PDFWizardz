import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface OcrSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  tooltip: string;
}

export const OcrSwitch: React.FC<OcrSwitchProps> = ({ checked, onChange, label, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex items-center gap-3 relative">
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-14 h-7 rounded-full transition-colors duration-200 ${
              checked ? 'bg-indigo-600' : 'bg-gray-700'
            }`}
          >
            <div
              className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                checked ? 'translate-x-7' : 'translate-x-1'
              }`}
              style={{ marginTop: '2px' }}
            />
          </div>
        </div>
        <span className="text-sm text-gray-300 font-bold">{label}</span>
      </label>
      
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Info className="w-4 h-4 text-gray-500 hover:text-indigo-400 cursor-help transition-colors" />
        
        {showTooltip && (
          <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-800 border-2 border-indigo-600 rounded-lg shadow-lg z-50">
            <p className="text-xs text-gray-200 leading-relaxed">{tooltip}</p>
            <div className="absolute bottom-0 left-4 transform translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-indigo-600"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

