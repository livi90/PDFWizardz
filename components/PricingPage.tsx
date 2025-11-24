import React from 'react';
import { getTranslation } from '../services/translations';
import { Language } from '../types';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import LicenseActivator from './LicenseActivator';

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
      t.pricingFeature8 || 'Plantillas Excel Inteligentes',
      t.pricingFeature9 || 'Procesamiento de PDFs grandes (800k caracteres)',
      t.pricingFeature10 || 'Soporte prioritario',
      t.pricingFeature11 || 'Todas las funciones gratuitas',
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
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-gray-800 border-4 border-gray-700 rounded-lg p-8 relative">
            <div className="text-center mb-6">
              <div className="inline-block bg-gray-700 px-4 py-2 rounded mb-4">
                <Zap className="w-6 h-6 text-yellow-400 inline mr-2" />
                <span className="text-yellow-400 font-bold">{t.pricingFree || 'GRATIS'}</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{t.pricingFreePlan || 'Plan Gratuito'}</h2>
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

            {isPremium ? (
              <button
                disabled
                className="w-full bg-emerald-600 text-white border-2 border-emerald-500 font-bold py-3 opacity-75 cursor-not-allowed"
              >
                {t.pricingAlreadyPremium || 'YA ERES PREMIUM'}
              </button>
            ) : (
              <button
                onClick={() => setShowActivator(true)}
                className="w-full bg-indigo-600 text-white border-2 border-indigo-500 hover:bg-indigo-500 transition-colors font-bold py-4 text-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-6 h-6" />
                {t.pricingActivateLicense || 'ACTIVAR LICENCIA'}
              </button>
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
                  <th className="text-center py-4 px-4 text-gray-300 text-lg md:text-xl font-bold">{t.pricingFree || 'Gratis'}</th>
                  <th className="text-center py-4 px-4 text-indigo-400 text-lg md:text-xl font-bold">{t.pricingPremium || 'Premium'}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4 text-gray-300 text-base md:text-lg">{t.pricingChatQuestions || 'Preguntas en Chat'}</td>
                  <td className="text-center py-4 px-4 text-gray-400 text-base md:text-lg">3 por documento</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">Ilimitadas</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4 text-gray-300 text-base md:text-lg">{t.pricingTokens || 'Tokens por respuesta'}</td>
                  <td className="text-center py-4 px-4 text-gray-400 text-base md:text-lg">2k</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">8k</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4 text-gray-300 text-base md:text-lg">{t.pricingExcelTemplates || 'Plantillas Excel'}</td>
                  <td className="text-center py-4 px-4">
                    <X className="w-6 h-6 text-red-400 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-4 px-4 text-gray-300 text-base md:text-lg">{t.pricingPdfSize || 'Tamaño máximo PDF'}</td>
                  <td className="text-center py-4 px-4 text-gray-400 text-base md:text-lg">200k caracteres</td>
                  <td className="text-center py-4 px-4 text-emerald-400 font-bold text-base md:text-lg">800k caracteres</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-300 text-base md:text-lg">{t.pricingSupport || 'Soporte'}</td>
                  <td className="text-center py-4 px-4 text-gray-400 text-base md:text-lg">{t.pricingCommunity || 'Comunidad'}</td>
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

