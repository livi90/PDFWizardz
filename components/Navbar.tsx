import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Language } from '../types';

interface NavbarProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
}

// Componentes SVG de banderas
const FlagES: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 640 480" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="640" height="480" fill="#AA151B"/>
    <rect y="120" width="640" height="120" fill="#F1BF00"/>
    <rect y="240" width="640" height="120" fill="#AA151B"/>
  </svg>
);

const FlagGB: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 640 480" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="640" height="480" fill="#012169"/>
    <path d="M0 0h640v480H0z" fill="#012169"/>
    <path d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z" fill="#FFF"/>
    <path d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" fill="#C8102E"/>
    <path d="M241 0v480h160V0H241zM0 160v160h640V160H0z" fill="#FFF"/>
    <path d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" fill="#C8102E"/>
  </svg>
);

const FlagDE: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 640 480" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="640" height="160" fill="#000"/>
    <rect y="160" width="640" height="160" fill="#DD0000"/>
    <rect y="320" width="640" height="160" fill="#FFCE00"/>
  </svg>
);

const FlagFR: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 640 480" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="213.3" height="480" fill="#002654"/>
    <rect x="213.3" width="213.3" height="480" fill="#FFF"/>
    <rect x="426.6" width="213.3" height="480" fill="#ED2939"/>
  </svg>
);

const Navbar: React.FC<NavbarProps> = ({ lang, setLang, t }) => {
  const location = useLocation();
  
  return (
    <nav className="w-full bg-gray-900 border-b-4 border-black py-4 px-4 md:px-8 flex justify-between items-center sticky top-0 z-50 shadow-lg">
      <Link 
        to="/"
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 group"
      >
        {/* 
           PARA PONER TU PROPIA IMAGEN:
           1. Guarda tu imagen (ej: logo.png) en la misma carpeta que index.html
           2. Cambia el src de abajo así: src="./logo.png"
        */}
        <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-black rounded-full overflow-hidden bg-indigo-900 relative shadow-[0_0_10px_rgba(99,102,241,0.5)] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.8)] transition-all">
             <img 
              src="Images/Logo_wizard-removebg-preview.png" 
              alt="Wizard Logo" 
              className="w-full h-full object-cover p-1" 
            />
        </div>
        <span className="text-xl md:text-2xl pixel-font-header text-indigo-400 neon-glow-text hidden sm:block">PDF WIZARDZ.APP</span>
      </Link>

      <div className="flex gap-4 items-center">
          {/* Blog Link */}
          <Link
            to="/blog"
            className="text-indigo-400 hover:text-indigo-300 font-bold font-vt323 text-sm md:text-base transition-colors hidden sm:block"
          >
            {lang === 'ES' ? '📝 BLOG' : lang === 'EN' ? '📝 BLOG' : lang === 'DE' ? '📝 BLOG' : '📝 BLOG'}
          </Link>
          
          {/* Lang Selector con banderas */}
          <div className="flex bg-black border border-gray-700 rounded p-1">
              {([
                { code: 'ES' as Language, Flag: FlagES, name: 'ES' },
                { code: 'EN' as Language, Flag: FlagGB, name: 'EN' },
                { code: 'DE' as Language, Flag: FlagDE, name: 'DE' },
                { code: 'FR' as Language, Flag: FlagFR, name: 'FR' }
              ]).map((item) => {
                const FlagComponent = item.Flag;
                return (
                  <button 
                    key={item.code}
                    onClick={() => setLang(item.code)}
                    className={`px-2 py-1 text-xs font-bold transition-colors flex items-center gap-1.5 ${lang === item.code ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    title={item.code === 'ES' ? 'Español' : item.code === 'EN' ? 'English' : item.code === 'DE' ? 'Deutsch' : 'Français'}
                  >
                      <FlagComponent className="w-4 h-3 flex-shrink-0" />
                      <span className="font-vt323">{item.name}</span>
                  </button>
                );
              })}
          </div>

          <Link 
            to="/precios"
            className="bg-yellow-600 text-black border-2 border-black px-4 py-1 retro-shadow hover:bg-yellow-500 active:translate-y-1 active:shadow-none transition-all font-bold font-vt323 mr-2"
          >
            {lang === 'ES' ? '💎 PREMIUM' : lang === 'EN' ? '💎 PREMIUM' : lang === 'DE' ? '💎 PREMIUM' : '💎 PREMIUM'}
          </Link>
          <Link 
            to="/chat-pdf"
            className="bg-indigo-600 text-white border-2 border-black px-4 py-1 retro-shadow hover:bg-indigo-500 active:translate-y-1 active:shadow-none transition-all font-bold font-vt323"
          >
            {t.startBtn}
          </Link>
      </div>
    </nav>
  );
};

export default Navbar;