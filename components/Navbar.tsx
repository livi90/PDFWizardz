import React from 'react';
import { ViewType, Language } from '../types';

interface NavbarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, lang, setLang, t }) => {
  return (
    <nav className="w-full bg-gray-900 border-b-4 border-black py-4 px-4 md:px-8 flex justify-between items-center sticky top-0 z-50 shadow-lg">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 group"
        onClick={() => setView('HOME')}
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
      </div>

      <div className="flex gap-4 items-center">
          {/* Lang Selector */}
          <div className="flex bg-black border border-gray-700 rounded p-1">
              {(['ES', 'EN', 'DE', 'FR'] as Language[]).map((l) => (
                  <button 
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2 py-1 text-xs font-bold font-vt323 transition-colors ${lang === l ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                      {l}
                  </button>
              ))}
          </div>

          <button 
            onClick={() => setView('PRICING')}
            className="bg-yellow-600 text-black border-2 border-black px-4 py-1 retro-shadow hover:bg-yellow-500 active:translate-y-1 active:shadow-none transition-all font-bold font-vt323 mr-2"
          >
            {lang === 'ES' ? '💎 PREMIUM' : lang === 'EN' ? '💎 PREMIUM' : lang === 'DE' ? '💎 PREMIUM' : '💎 PREMIUM'}
          </button>
          <button 
            onClick={() => setView('CHAT')}
            className="bg-indigo-600 text-white border-2 border-black px-4 py-1 retro-shadow hover:bg-indigo-500 active:translate-y-1 active:shadow-none transition-all font-bold font-vt323"
          >
            {t.startBtn}
          </button>
      </div>
    </nav>
  );
};

export default Navbar;