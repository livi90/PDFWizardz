import React, { useState } from 'react';
import { validateLicenseKey, savePremiumStatus, detectPlanType } from '../services/gumroadService';
import { getTranslation } from '../services/translations';
import { Language } from '../types';
import { Key, Check, X, Loader2, Sparkles } from 'lucide-react';

interface LicenseActivatorProps {
  lang: Language;
  onActivated: () => void;
  onClose?: () => void;
}

const LicenseActivator: React.FC<LicenseActivatorProps> = ({ lang, onActivated, onClose }) => {
  const t = getTranslation(lang);
  const [licenseKey, setLicenseKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError(t.licenseEnterKey || 'Por favor, ingresa tu clave de licencia');
      return;
    }

    setIsValidating(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await validateLicenseKey(licenseKey.trim());

      if (result.valid && result.licenseData) {
        const purchase = result.licenseData;
        
        // Detectar tipo de plan basado en el precio
        const planType = detectPlanType(purchase.price);
        
        // Determinar fecha de expiración basada en si es suscripción o no
        let expiresAt: string | null = null;
        let subscriptionEndsAt: string | null = null;
        
        if (purchase.recurrence) {
          // Es una suscripción, usar subscription_ended_at si existe
          subscriptionEndsAt = purchase.subscription_ended_at || null;
        } else {
          // No es suscripción, no tiene fecha de expiración (licencia permanente)
          expiresAt = null;
        }
        
        // Guardar estado premium con tipo de plan
        savePremiumStatus(purchase.license_key, planType, expiresAt, subscriptionEndsAt);
        setSuccess(true);
        
        // Notificar al componente padre
        setTimeout(() => {
          onActivated();
          if (onClose) onClose();
        }, 1500);
      } else {
        setError(result.error || t.licenseInvalid || 'Clave de licencia inválida');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.licenseError || 'Error al validar la licencia');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isValidating) {
      handleActivate();
    }
  };

  return (
    <div className="bg-gray-800 border-4 border-indigo-500 p-6 rounded-lg max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-indigo-600 border-2 border-indigo-400 flex items-center justify-center">
          <Key className="w-6 h-6 text-indigo-200" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-indigo-400 pixel-font-header">
            {t.licenseActivate || 'ACTIVAR PRO'}
          </h2>
          <p className="text-base md:text-lg text-gray-400">
            {t.licenseEnterKeyDesc || 'Ingresa tu clave de licencia de Gumroad'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-base md:text-lg font-bold text-gray-300 mb-3">
            {t.licenseKey || 'Clave de Licencia'}
          </label>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => {
              setLicenseKey(e.target.value.toUpperCase());
              setError(null);
              setSuccess(false);
            }}
            onKeyPress={handleKeyPress}
            placeholder="WIZARD-XXXX-XXXX"
            className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded px-4 py-4 font-mono text-base md:text-lg focus:outline-none focus:border-indigo-500"
            disabled={isValidating || success}
          />
        </div>

        {error && (
          <div className="bg-red-900/50 border-2 border-red-600 rounded p-4 flex items-center gap-3">
            <X className="w-6 h-6 text-red-400" />
            <p className="text-red-200 text-base md:text-lg">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-900/50 border-2 border-emerald-600 rounded p-4 flex items-center gap-3">
            <Check className="w-6 h-6 text-emerald-400" />
            <p className="text-emerald-200 text-base md:text-lg">
              {t.licenseActivated || '¡Licencia activada correctamente!'}
            </p>
          </div>
        )}

        <button
          onClick={handleActivate}
          disabled={isValidating || success || !licenseKey.trim()}
          className="w-full bg-indigo-600 text-white border-2 border-indigo-500 hover:bg-indigo-500 transition-colors font-bold py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isValidating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              {t.licenseValidating || 'Validando...'}
            </>
          ) : success ? (
            <>
              <Check className="w-6 h-6" />
              {t.licenseActivated || 'Activada'}
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              {t.licenseActivate || 'ACTIVAR'}
            </>
          )}
        </button>

        <div className="mt-4 pt-4 border-t-2 border-gray-700">
          <p className="text-base text-gray-400 text-center mb-3">
            {t.licenseBuyLink || '¿No tienes una clave?'}
          </p>
          <div className="space-y-2">
            <a
              href="https://pdfwizardzapp.gumroad.com/l/fhzoa"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block bg-indigo-600 text-white border-2 border-indigo-500 hover:bg-indigo-500 transition-colors font-bold py-3 text-base text-center rounded-lg"
            >
              💳 {t.licenseBuyPremium || 'COMPRAR PREMIUM (€4,99)'}
            </a>
            <p className="text-xs text-gray-400 text-center mt-1">
              {t.licensePremiumDiscount || 'Con código de descuento 40%: €2,99'}
            </p>
            <a
              href="https://pdfwizardzapp.gumroad.com/l/jdoam"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block bg-purple-600 text-white border-2 border-purple-500 hover:bg-purple-500 transition-colors font-bold py-3 text-base text-center rounded-lg"
            >
              ⭐ {t.licenseBuyPlatinum || 'COMPRAR PLATINUM+ (€8)'}
            </a>
            <p className="text-xs text-gray-400 text-center mt-1">
              {t.licensePlatinumDiscount || 'Con código de descuento 40%: €4,80'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseActivator;

