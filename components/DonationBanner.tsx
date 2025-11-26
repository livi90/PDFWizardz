import React, { useState, useEffect } from 'react';
import { X, Coffee, Heart } from 'lucide-react';
import { Language } from '../types';
import { getPremiumStatus } from '../services/gumroadService';

interface DonationBannerProps {
  lang: Language;
}

const DonationBanner: React.FC<DonationBannerProps> = ({ lang }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  useEffect(() => {
    // Verificar si el usuario es premium
    const premiumStatus = getPremiumStatus();
    
    // Verificar si el banner fue descartado en esta sesión
    const dismissed = sessionStorage.getItem('donation_banner_dismissed') === 'true';
    
    // Solo mostrar si NO es premium y NO fue descartado
    if (!premiumStatus.isPremium && !dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('donation_banner_dismissed', 'true');
  };

  const translations = {
    ES: {
      message: 'Si no eres premium, ayúdanos a mantener la mayoría de las funcionalidades gratis donando',
      button: '☕ Donar',
      close: 'Cerrar'
    },
    EN: {
      message: 'If you\'re not premium, help us keep most features free by donating',
      button: '☕ Donate',
      close: 'Close'
    },
    DE: {
      message: 'Wenn Sie nicht Premium sind, helfen Sie uns, die meisten Funktionen kostenlos zu halten, indem Sie spenden',
      button: '☕ Spenden',
      close: 'Schließen'
    },
    FR: {
      message: 'Si vous n\'êtes pas premium, aidez-nous à garder la plupart des fonctionnalités gratuites en faisant un don',
      button: '☕ Faire un don',
      close: 'Fermer'
    }
  };

  const t = translations[lang];

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-amber-900/95 to-yellow-900/95 border-4 border-amber-600 rounded-lg p-4 shadow-2xl backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-white font-bold text-sm md:text-base mb-3 leading-relaxed">
              {t.message}
            </p>
            
            <div className="flex gap-2">
              <a
                href="https://www.buymeacoffee.com/pdfwizardz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border-2 border-amber-400 shadow-lg hover:shadow-xl"
              >
                <Coffee className="w-5 h-5" />
                {t.button}
              </a>
              
              <button
                onClick={handleDismiss}
                className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors border-2 border-gray-600"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DonationBanner;

