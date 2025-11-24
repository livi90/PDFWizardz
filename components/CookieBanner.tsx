import React, { useState, useEffect } from 'react';

interface CookieBannerProps {
  lang: 'ES' | 'EN' | 'DE' | 'FR';
}

const CookieBanner: React.FC<CookieBannerProps> = ({ lang }) => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya aceptó las cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setShowBanner(false);
  };

  const translations = {
    ES: {
      title: '🍪 Uso de Cookies',
      message: 'Utilizamos cookies para mejorar tu experiencia. Al continuar, aceptas nuestro uso de cookies.',
      accept: 'Aceptar',
      reject: 'Rechazar',
      learnMore: 'Más información'
    },
    EN: {
      title: '🍪 Cookie Usage',
      message: 'We use cookies to improve your experience. By continuing, you accept our use of cookies.',
      accept: 'Accept',
      reject: 'Reject',
      learnMore: 'Learn more'
    },
    DE: {
      title: '🍪 Cookie-Verwendung',
      message: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern. Durch Fortfahren akzeptieren Sie unsere Cookie-Verwendung.',
      accept: 'Akzeptieren',
      reject: 'Ablehnen',
      learnMore: 'Mehr erfahren'
    },
    FR: {
      title: '🍪 Utilisation des Cookies',
      message: 'Nous utilisons des cookies pour améliorer votre expérience. En continuant, vous acceptez notre utilisation des cookies.',
      accept: 'Accepter',
      reject: 'Refuser',
      learnMore: 'En savoir plus'
    }
  };

  const t = translations[lang];

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t-4 border-indigo-500 p-4 z-50 shadow-2xl">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-bold text-indigo-400 mb-1">{t.title}</h3>
          <p className="text-sm text-gray-300">
            {t.message}{' '}
            <a 
              href="/cookies.html" 
              target="_blank" 
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {t.learnMore}
            </a>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-gray-700 text-white border-2 border-gray-600 hover:bg-gray-600 transition-colors font-bold"
          >
            {t.reject}
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-indigo-600 text-white border-2 border-indigo-500 hover:bg-indigo-500 transition-colors font-bold"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;

