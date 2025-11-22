import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label }) => {
  const percentage = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between mb-2 font-bold text-lg">
        <span>{label || "MANA CHARGING..."}</span>
        <span>{current}/{total}</span>
      </div>
      <div className="h-8 w-full border-4 border-black bg-gray-200 p-1 relative">
        {/* Stripes background effect */}
        <div 
            className="h-full bg-indigo-500 transition-all duration-300 ease-out" 
            style={{ width: `${percentage}%` }}
        >
            {/* Gloss effect */}
            <div className="w-full h-1/3 bg-indigo-400 opacity-50"></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;