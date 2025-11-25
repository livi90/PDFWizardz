import React from 'react';
import { Language, ViewType } from '../types';
import { getTranslation } from '../services/translations';
import { ArrowRight, Check, Sparkles, FileSpreadsheet, FileText, Calculator, Zap } from 'lucide-react';

interface LandingPageProps {
  lang: Language;
  viewType: ViewType;
  title: string;
  subtitle: string;
  description: string;
  mainFeature: string;
  features: string[];
  benefits: string[];
  ctaText: string;
  ctaAction: () => void;
  onGoToHome?: () => void;
  icon: React.ReactNode;
  color: 'emerald' | 'indigo' | 'purple';
}

const LandingPage: React.FC<LandingPageProps> = ({
  lang,
  viewType,
  title,
  subtitle,
  description,
  mainFeature,
  features,
  benefits,
  ctaText,
  ctaAction,
  onGoToHome,
  icon,
  color,
}) => {
  const t = getTranslation(lang);
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-900/30',
      border: 'border-emerald-500',
      text: 'text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500',
      accent: 'text-emerald-300',
    },
    indigo: {
      bg: 'bg-indigo-900/30',
      border: 'border-indigo-500',
      text: 'text-indigo-400',
      button: 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500',
      accent: 'text-indigo-300',
    },
    purple: {
      bg: 'bg-purple-900/30',
      border: 'border-purple-500',
      text: 'text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-500 border-purple-500',
      accent: 'text-purple-300',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header con navegación */}
        {onGoToHome && (
          <div className="mb-6 flex items-center gap-2 text-gray-500 cursor-pointer hover:underline" onClick={onGoToHome}>
            <ArrowRight className="transform rotate-180" /> {t.back || 'Volver'}
          </div>
        )}

        {/* Hero Section */}
        <div className={`${colors.bg} border-4 ${colors.border} rounded-lg p-8 md:p-12 mb-8 text-center`}>
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 ${colors.bg} border-4 ${colors.border} rounded-full flex items-center justify-center`}>
              {icon}
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 pixel-font-header">
            {title}
          </h1>
          <p className="text-2xl md:text-3xl font-bold mb-6 text-gray-300">
            {subtitle}
          </p>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            {description}
          </p>
          <button
            onClick={ctaAction}
            className={`${colors.button} text-white border-2 font-bold py-4 px-8 text-xl rounded-lg transition-colors flex items-center gap-3 mx-auto`}
          >
            <Sparkles className="w-6 h-6" />
            {ctaText}
          </button>
        </div>

        {/* Main Feature Highlight */}
        <div className="bg-gray-800 border-4 border-gray-700 rounded-lg p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 ${colors.bg} border-2 ${colors.border} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Zap className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {mainFeature}
              </h2>
              <p className="text-gray-300 text-lg">
                {lang === 'ES' 
                  ? 'Procesa tus documentos sin subir archivos. Todo el procesamiento se realiza 100% en tu navegador. Privacidad total garantizada.'
                  : lang === 'EN'
                  ? 'Process your documents without uploading files. All processing happens 100% in your browser. Total privacy guaranteed.'
                  : lang === 'DE'
                  ? 'Verarbeiten Sie Ihre Dokumente ohne Dateien hochzuladen. Die gesamte Verarbeitung erfolgt zu 100% in Ihrem Browser. Vollständige Privatsphäre garantiert.'
                  : 'Traitez vos documents sans télécharger de fichiers. Tout le traitement se fait à 100% dans votre navigateur. Confidentialité totale garantie.'}
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {features.map((feature, idx) => (
            <div key={idx} className={`${colors.bg} border-4 ${colors.border} rounded-lg p-6`}>
              <div className="flex items-start gap-3">
                <Check className={`w-6 h-6 ${colors.text} flex-shrink-0 mt-1`} />
                <p className="text-gray-200 text-lg font-bold">{feature}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-800 border-4 border-gray-700 rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            {lang === 'ES' ? '¿Por qué elegir esta solución?' : lang === 'EN' ? 'Why choose this solution?' : lang === 'DE' ? 'Warum diese Lösung wählen?' : 'Pourquoi choisir cette solution?'}
          </h2>
          <div className="space-y-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className={`w-8 h-8 ${colors.bg} border-2 ${colors.border} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                  <span className={`${colors.text} font-bold`}>{idx + 1}</span>
                </div>
                <p className="text-gray-300 text-lg">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className={`${colors.bg} border-4 ${colors.border} rounded-lg p-8 text-center`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {lang === 'ES' 
              ? '¿Listo para empezar?' 
              : lang === 'EN'
              ? 'Ready to get started?'
              : lang === 'DE'
              ? 'Bereit loszulegen?'
              : 'Prêt à commencer?'}
          </h2>
          <p className="text-gray-300 text-lg mb-6">
            {lang === 'ES'
              ? 'Prueba gratis ahora. Sin tarjeta de crédito. Sin compromiso.'
              : lang === 'EN'
              ? 'Try it free now. No credit card. No commitment.'
              : lang === 'DE'
              ? 'Jetzt kostenlos testen. Keine Kreditkarte. Keine Verpflichtung.'
              : 'Essayez gratuitement maintenant. Pas de carte de crédit. Pas d\'engagement.'}
          </p>
          <button
            onClick={ctaAction}
            className={`${colors.button} text-white border-2 font-bold py-4 px-8 text-xl rounded-lg transition-colors inline-flex items-center gap-3`}
          >
            <Sparkles className="w-6 h-6" />
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

