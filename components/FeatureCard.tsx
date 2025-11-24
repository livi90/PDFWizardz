import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  shortDescription?: string;
  onClick: () => void;
  icon: LucideIcon;
  color: string;
  badge?: string;
  badgeColor?: string;
  tags?: string;
  borderColor: string;
  hoverShadow: string;
  lang?: 'ES' | 'EN' | 'DE' | 'FR';
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  shortDescription,
  onClick,
  icon: Icon,
  color,
  badge,
  badgeColor = 'bg-gray-500',
  tags,
  borderColor,
  hoverShadow,
  lang = 'ES',
}) => {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const displayDesc = showFullDesc ? description : (shortDescription || description.substring(0, 80) + '...');
  
  const translations = {
    ES: { showMore: 'Ver más', showLess: 'Ver menos' },
    EN: { showMore: 'Show more', showLess: 'Show less' },
    DE: { showMore: 'Mehr anzeigen', showLess: 'Weniger anzeigen' },
    FR: { showMore: 'Voir plus', showLess: 'Voir moins' },
  };
  const t = translations[lang];

  // Mapeo de colores a clases de Tailwind
  const colorMap: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
    'bg-yellow-900': { bg: 'bg-yellow-900/40', border: 'border-yellow-700', icon: 'text-yellow-400', hover: 'group-hover:bg-yellow-900/60' },
    'bg-violet-900': { bg: 'bg-violet-900/40', border: 'border-violet-700', icon: 'text-violet-400', hover: 'group-hover:bg-violet-900/60' },
    'bg-emerald-900': { bg: 'bg-emerald-900/40', border: 'border-emerald-700', icon: 'text-emerald-400', hover: 'group-hover:bg-emerald-900/60' },
    'bg-indigo-900': { bg: 'bg-indigo-900/40', border: 'border-indigo-700', icon: 'text-indigo-400', hover: 'group-hover:bg-indigo-900/60' },
    'bg-rose-900': { bg: 'bg-rose-900/40', border: 'border-rose-700', icon: 'text-rose-400', hover: 'group-hover:bg-rose-900/60' },
    'bg-pink-900': { bg: 'bg-pink-900/40', border: 'border-pink-700', icon: 'text-pink-400', hover: 'group-hover:bg-pink-900/60' },
    'bg-amber-900': { bg: 'bg-amber-900/40', border: 'border-amber-700', icon: 'text-amber-400', hover: 'group-hover:bg-amber-900/60' },
    'bg-purple-900': { bg: 'bg-purple-900/40', border: 'border-purple-700', icon: 'text-purple-400', hover: 'group-hover:bg-purple-900/60' },
  };

  const colorClasses = colorMap[color] || { bg: 'bg-gray-900/40', border: 'border-gray-700', icon: 'text-gray-400', hover: '' };

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer bg-gray-800 border-4 border-black p-4 hover:-translate-y-1 transition-all retro-shadow ${borderColor} relative overflow-hidden`}
      style={{ boxShadow: hoverShadow ? `0 0 0 0 ${hoverShadow}` : undefined }}
    >
      {badge && (
        <div className={`absolute top-0 right-0 ${badgeColor} text-black px-2 py-0.5 text-xs font-bold z-10`}>
          {badge}
        </div>
      )}
      <div className={`${colorClasses.bg} w-12 h-12 flex items-center justify-center border-2 ${colorClasses.border} mb-3 ${colorClasses.hover}`}>
        <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
      </div>
      <h3 className="text-lg font-bold mb-1 pixel-font-header">{title}</h3>
      <p className="text-gray-400 text-sm mb-2">{displayDesc}</p>
      {description.length > 80 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowFullDesc(!showFullDesc);
          }}
          className="text-xs text-indigo-400 hover:text-indigo-300 underline mb-1"
        >
          {showFullDesc ? t.showLess : t.showMore}
        </button>
      )}
      {tags && (
        <p className="text-xs text-gray-500 mt-1">{tags}</p>
      )}
    </div>
  );
};

export default FeatureCard;

