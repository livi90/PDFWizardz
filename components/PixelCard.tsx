import React from 'react';

interface PixelCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'pink';
}

const PixelCard: React.FC<PixelCardProps> = ({ children, className = '', title, color = 'blue' }) => {
  const baseStyles = "bg-gray-800 border-4 border-black p-6 relative retro-shadow text-gray-200";
  
  let headerColor = "bg-indigo-600";
  let borderColor = "border-indigo-800";
  
  if (color === 'green') { headerColor = "bg-emerald-600"; borderColor = "border-emerald-800"; }
  if (color === 'red') { headerColor = "bg-rose-600"; borderColor = "border-rose-800"; }
  if (color === 'yellow') { headerColor = "bg-amber-500 text-black"; borderColor = "border-amber-700"; }
  if (color === 'pink') { headerColor = "bg-pink-600"; borderColor = "border-pink-800"; }

  return (
    <div className={`${baseStyles} ${className} shadow-[4px_4px_0_0_rgba(0,0,0,0.8)]`}>
      {title && (
        <div className={`
            absolute -top-5 left-1/2 transform -translate-x-1/2 
            ${headerColor} border-4 border-black px-6 py-1 
            text-white font-bold pixel-font-header text-sm md:text-base whitespace-nowrap
            shadow-[2px_2px_0_0_rgba(0,0,0,0.8)]
        `}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

export default PixelCard;