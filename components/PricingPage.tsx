import React from 'react';
import { getTranslation } from '../services/translations';
import { Language } from '../types';
import { Check, X, Sparkles, Zap, Crown, Star } from 'lucide-react';
import LicenseActivator from './LicenseActivator';
import { getPremiumStatus } from '../services/gumroadService';

interface PricingPageProps {
  lang: Language;
  isPremium: boolean;
  onPremiumActivated: () => void;
  onGoToHome: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({
  lang,
  isPremium,
  onPremiumActivated,
  onGoToHome,
}) => {
  const t = getTranslation(lang);
  const [showActivator, setShowActivator] = React.useState(false);
  const premiumStatus = getPremiumStatus();
  const currentPlanType = premiumStatus.planType;

  const features = {
    free: [
      t.pricingFeature1 || '3 preguntas por documento en Chat',
      t.pricingFeature2 || '2k tokens por respuesta',
      t.pricingFeature3 || 'Todas las herramientas básicas',
      t.pricingFeature4 || 'Procesamiento 100% local',
      t.pricingFeature5 || 'Sin límite de archivos',
    ],
    premium: [
      t.pricingFeature6 || 'Preguntas ilimitadas en Chat',
      t.pricingFeature7 || '8k tokens por respuesta',
      t.pricingFeature8 || 'Plantillas Excel Inteligentes (hasta 20 documentos)',
      t.pricingFeature9 || 'Procesamiento de PDFs grandes (800k caracteres)',
      t.pricingFeature10 || 'Soporte prioritario',
      t.pricingFeature11 || 'Todas las funciones gratuitas',
    ],
    platinum: [
      t.pricingFeature12 || 'Preguntas ilimitadas en Chat',
      t.pricingFeature13 || '8k tokens por respuesta',
      t.pricingFeature14 || 'Plantillas Excel Inteligentes (hasta 100 documentos)',
      t.pricingFeature15 || 'Procesamiento de PDFs grandes (800k caracteres)',
      t.pricingFeature16 || 'Soporte prioritario',
      t.pricingFeature17 || 'Todas las funciones Premium',
    ],
  };

  const useCases = {
    free: [
      t.pricingUseCase1 || 'Estudiantes que necesitan organizar apuntes',
      t.pricingUseCase2 || 'Usuarios ocasionales de PDFs',
      t.pricingUseCase3 || 'Probar funcionalidades antes de comprar',
    ],
    premium: [
      t.pricingUseCase4 || 'Contables que procesan múltiples facturas',
      t.pricingUseCase5 || 'Empresas que automatizan reportes',
      t.pricingUseCase6 || 'Profesionales que analizan documentos largos',
    ],
    platinum: [
      t.pricingUseCase7 || 'Grandes empresas con alto volumen',
      t.pricingUseCase8 || 'Procesamiento masivo de facturas',
      t.pricingUseCase9 || 'Automatización empresarial avanzada',
    ],
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-400 pixel-font-header mb-4">
            {t.pricingTitle || 'ELIGE TU PLAN'}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t.pricingSubtitle || 'Desbloquea todo el poder de PDF Wizardz'}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Free Plan */}
          <div className="bg-gray-800 border-4 border-gray-700 rounded-lg p-8 relative">
            <div className="text-center mb-6">
              <div className="inline-block bg-gray-700 px-4 py-2 rounded mb-4">
                <Zap className="w-6 h-6 text-yellow-400 inline mr-2" />
                <span className="text-yellow-400 font-bold">{t.pricingFree || 'GRATIS'}</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{t.pricingFreePlan || 'Plan Gratuito'}</h2>
              <div className="text-4xl font-bold text-yellow-400 mb-2">€0</div>
              <p className="text-gray-400">{t.pricingFreeDesc || 'Perfecto para empezar'}</p>
            </div>

            <div className="space-y-4 mb-8">
              {features.free.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-base md:text-lg">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-300 mb-4">
                {t.pricingUseCases || 'Casos de Uso:'}
              </h3>
              <ul className="space-y-3">
                {useCases.free.map((useCase, idx) => (
                  <li key={idx} className="text-base md:text-lg text-gray-400 flex items-start gap-3">
                    <span className="text-indigo-400 text-xl">•</span>
                    {useCase}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={onGoToHome}
              className="w-full bg-gray-700 text-white border-2 border-gray-600 hover:bg-gray-600 transition-colors font-bold py-4 text-lg"
            >
              {t.pricingStartFree || 'EMPEZAR GRATIS'}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-indigo-900/30 border-4 border-indigo-500 rounded-lg p-8 relative">
            {isPremium && (
              <div className="absolute top-4 right-4 bg-emerald-600 text-black px-3 py-1 rounded font-bold text-sm">
                {t.pricingActive || 'ACTIVO'}
              </div>
            )}
            <div className="text-center mb-6">
              <div className="inline-block bg-indigo-600 px-4 py-2 rounded mb-4">
                <Crown className="w-6 h-6 text-yellow-400 inline mr-2" />
                <span className="text-yellow-400 font-bold">{t.pricingPremium || 'PREMIUM'}</span>
              </div>
              <h2 className="text-3xl font-bold text-indigo-400 mb-2">
                {t.pricingPremiumPlan || 'Plan Premium'}
              </h2>
              <div className="text-4xl font-bold text-yellow-400 mb-2">€4,99</div>
              <p className="text-xs text-yellow-300 mb-1">
                {lang === 'ES' ? 'Con código de descuento 40%: €2,99' : 
                 lang === 'EN' ? 'With 40% discount code: €2.99' :
                 lang === 'DE' ? 'Mit 40% Rabattcode: €2,99' :
                 'Avec code de réduction 40%: €2,99'}
              </p>
              <p className="text-gray-400">{t.pricingPremiumDesc || 'Todo el poder desbloqueado'}</p>
            </div>

            <div className="space-y-4 mb-8">
              {features.premium.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-base md:text-lg">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-300 mb-4">
                {t.pricingUseCases || 'Casos de Uso:'}
              </h3>
              <ul className="space-y-3">
                {useCases.premium.map((useCase, idx) => (
                  <li key={idx} className="text-base md:text-lg text-gray-400 flex items-start gap-3">
                    <span className="text-indigo-400 text-xl">•</span>
                    {useCase}
                  </li>
                ))}
              </ul>
            </div>

            {isPremium && currentPlanType === 'premium' ? (
              <button
                disabled
                className="w-full bg-emerald-600 text-white border-2 border-emerald-500 font-bold py-3 opacity-75 cursor-not-allowed"
              >
                {t.pricingAlreadyPremium || 'YA ERES PREMIUM'}
              </button>
            ) : (
              <>
                <a
                  href="https://pdfwizardzapp.gumroad.com/l/fhzoa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block bg-indigo-600 text-white border-2 border-indigo-500 hover:bg-indigo-500 transition-colors font-bold py-4 text-lg text-center rounded-lg mb-2"
                >
                  💳 {t.pricingBuyPremium || 'COMPRAR PREMIUM (€4,99)'}
                </a>
                <p className="text-xs text-yellow-300 text-center mb-2">
                  {lang === 'ES' ? 'Con código de descuento 40%: €2,99' : 
                   lang === 'EN' ? 'With 40% discount code: €2.99' :
                   lang === 'DE' ? 'Mit 40% Rabattcode: €2,99' :
                   'Avec code de réduction 40%: €2,99'}
                </p>
                <button
                  onClick={() => setShowActivator(true)}
                  className="w-full bg-gray-700 text-white border-2 border-gray-600 hover:bg-gray-600 transition-colors font-bold py-3 text-base"
                >
                  {t.pricingActivateLicense || 'ACTIVAR LICENCIA'}
                </button>
              </>
            )}
          </div>

          {/* Platinum+ Plan */}
          <div className="bg-purple-900/30 border-4 border-purple-500 rounded-lg p-8 relative">
            {isPremium && currentPlanType === 'platinum_plus' && (
              <div className="absolute top-4 right-4 bg-emerald-600 text-black px-3 py-1 rounded font-bold text-sm">
                {t.pricingActive || 'ACTIVO'}
              </div>
            )}
            <div className="text-center mb-6">
              <div className="inline-block bg-purple-600 px-4 py-2 rounded mb-4">
                <Star className="w-6 h-6 text-yellow-400 inline mr-2" />
                <span className="text-yellow-400 font-bold">{t.pricingPlatinum || 'PLATINUM+'}</span>
              </div>
              <h2 className="text-3xl font-bold text-purple-400 mb-2">
                {t.pricingPlatinumPlan || 'Plan Platinum+'}
              </h2>
              <div className="text-4xl font-bold text-yellow-400 mb-2">€8</div>
              <p className="text-xs text-yellow-300 mb-1">
                {lang === 'ES' ? 'Con código de descuento 40%: €4,80' : 
                 lang === 'EN' ? 'With 40% discount code: €4.80' :
                 lang === 'DE' ? 'Mit 40% Rabattcode: €4,80' :
                 'Avec code de réduction 40%: €4,80'}
              </p>
              <p className="text-gray-400">{t.pricingPlatinumDesc || 'Máximo rendimiento'}</p>
            </div>

            <div className="space-y-4 mb-8">
              {features.platinum.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-base md:text-lg">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-300 mb-4">
                {t.pricingUseCases || 'Casos de Uso:'}
              </h3>
              <ul className="space-y-3">
                {useCases.platinum.map((useCase, idx) => (
                  <li key={idx} className="text-base md:text-lg text-gray-400 flex items-start gap-3">
                    <span className="text-purple-400 text-xl">•</span>
                    {useCase}
                  </li>
                ))}
              </ul>
            </div>

            {isPremium && currentPlanType === 'platinum_plus' ? (
              <button
                disabled
                className="w-full bg-emerald-600 text-white border-2 border-emerald-500 font-bold py-3 opacity-75 cursor-not-allowed"
              >
                {t.pricingAlreadyPlatinum || 'YA ERES PLATINUM+'}
              </button>
            ) : (
              <>
                <a
                  href="https://pdfwizardzapp.gumroad.com/l/jdoam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block bg-purple-600 text-white border-2 border-purple-500 hover:bg-purple-500 transition-colors font-bold py-4 text-lg text-center rounded-lg mb-2 flex items-center justify-center gap-2"
                >
                  <Star className="w-6 h-6" />
                  💳 {t.pricingBuyPlatinum || 'COMPRAR PLATINUM+ (€8)'}
                </a>
                <p className="text-xs text-yellow-300 text-center mb-2">
                  {lang === 'ES' ? 'Con código de descuento 40%: €4,80' : 
                   lang === 'EN' ? 'With 40% discount code: €4.80' :
                   lang === 'DE' ? 'Mit 40% Rabattcode: €4,80' :
                   'Avec code de réduction 40%: €4,80'}
                </p>
                <button
                  onClick={() => setShowActivator(true)}
                  className="w-full bg-gray-700 text-white border-2 border-gray-600 hover:bg-gray-600 transition-colors font-bold py-3 text-base"
                >
                  {t.pricingActivateLicense || 'ACTIVAR LICENCIA'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-gray-800 border-4 border-gray-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-indigo-400 mb-6 text-center">
            {t.pricingComparison || 'Comparación Detallada'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-300 text-lg md:text-xl font-bold">{t.pricingFeature || 'Característica'}</th>
                  <th className="text-center py-4 px-4 text-gray-300 text-lg md:text-xl font-bold">€0</th>
                  <th className="text-center py-4 px-4 text-indigo-400 text-lg md:text-xl font-bold">€4,99</th>
                  <th className="text-center py-4 px-4 text-purple-400 text-lg md:text-xl font-bold">€8</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4 text-gray-300 text-base md:text-lg">{t.pricingChatQuestions || 'Preguntas en Chat'}</td>
                  <td className="text-center py-4 px-4 text-gray-400 text-base md:text-lg">3 por documento</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">Ilimitadas</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">Ilimitadas</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4 text-gray-300 text-base md:text-lg">{t.pricingTokens || 'Tokens por respuesta'}</td>
                  <td className="text-center py-4 px-4 text-gray-400 text-base md:text-lg">2k</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">8k</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">8k</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4 text-gray-300 text-base md:text-lg">{t.pricingExcelTemplates || 'Plantillas Excel'}</td>
                  <td className="text-center py-4 px-4">
                    <X className="w-6 h-6 text-red-400 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">Hasta 20 docs</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">Hasta 100 docs</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4 text-gray-300 text-base md:text-lg">{t.pricingPdfSize || 'Tamaño máximo PDF'}</td>
                  <td className="text-center py-4 px-4 text-gray-400 text-base md:text-lg">200k caracteres</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">800k caracteres</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">800k caracteres</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-300 text-base md:text-lg">{t.pricingSupport || 'Soporte'}</td>
                  <td className="text-center py-4 px-4 text-gray-400 text-base md:text-lg">{t.pricingCommunity || 'Comunidad'}</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">{t.pricingPriority || 'Prioritario'}</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">{t.pricingPriority || 'Prioritario'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* License Activator Modal */}
        {showActivator && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative">
              <LicenseActivator
                lang={lang}
                onActivated={() => {
                  setShowActivator(false);
                  onPremiumActivated();
                }}
                onClose={() => setShowActivator(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPage;

