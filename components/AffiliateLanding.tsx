import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../services/translations';
import { ArrowRight, Check, Sparkles, Users, DollarSign, TrendingUp, Share2, Award } from 'lucide-react';

interface AffiliateLandingProps {
  lang: Language;
  onGoToHome?: () => void;
}

const AffiliateLanding: React.FC<AffiliateLandingProps> = ({
  lang,
  onGoToHome,
}) => {
  const t = getTranslation(lang);

  const translations = {
    ES: {
      title: 'PROGRAMA DE AFILIADOS',
      subtitle: 'Gana dinero recomendando PDF Wizardz',
      description: 'Únete a nuestro programa de afiliados y gana comisiones por cada venta que generes. Perfecto para influencers, creadores de contenido y profesionales del marketing.',
      mainFeature: '¿Por qué ser afiliado?',
      features: [
        'Comisiones atractivas por cada venta',
        'Herramientas de seguimiento en tiempo real',
        'Materiales de marketing listos para usar',
        'Soporte dedicado para afiliados',
        'Pagos rápidos y confiables',
        'Sin límite de ganancias'
      ],
      benefits: [
        'Gana dinero pasivo recomendando una herramienta que realmente funciona',
        'Acceso a materiales promocionales profesionales (banners, textos, etc.)',
        'Dashboard personalizado para ver tus estadísticas y ganancias',
        'Comunidad de afiliados activa con tips y estrategias',
        'Producto de alta calidad con excelente tasa de conversión'
      ],
      ctaText: 'UNIRME AL PROGRAMA',
      ctaLink: 'https://pdfwizardzapp.gumroad.com/affiliates'
    },
    EN: {
      title: 'AFFILIATE PROGRAM',
      subtitle: 'Earn money by recommending PDF Wizardz',
      description: 'Join our affiliate program and earn commissions on every sale you generate. Perfect for influencers, content creators, and marketing professionals.',
      mainFeature: 'Why become an affiliate?',
      features: [
        'Attractive commissions on every sale',
        'Real-time tracking tools',
        'Ready-to-use marketing materials',
        'Dedicated affiliate support',
        'Fast and reliable payments',
        'Unlimited earnings'
      ],
      benefits: [
        'Earn passive income by recommending a tool that really works',
        'Access to professional promotional materials (banners, texts, etc.)',
        'Personalized dashboard to view your statistics and earnings',
        'Active affiliate community with tips and strategies',
        'High-quality product with excellent conversion rate'
      ],
      ctaText: 'JOIN THE PROGRAM',
      ctaLink: 'https://pdfwizardzapp.gumroad.com/affiliates'
    },
    DE: {
      title: 'AFFILIATE-PROGRAMM',
      subtitle: 'Verdiene Geld durch Empfehlung von PDF Wizardz',
      description: 'Tritt unserem Affiliate-Programm bei und verdiene Provisionen bei jedem Verkauf, den du generierst. Perfekt für Influencer, Content-Ersteller und Marketing-Profis.',
      mainFeature: 'Warum Affiliate werden?',
      features: [
        'Attraktive Provisionen bei jedem Verkauf',
        'Echtzeit-Tracking-Tools',
        'Einsatzbereite Marketing-Materialien',
        'Dedizierter Affiliate-Support',
        'Schnelle und zuverlässige Zahlungen',
        'Unbegrenzte Einnahmen'
      ],
      benefits: [
        'Verdiene passives Einkommen durch Empfehlung eines wirklich funktionierenden Tools',
        'Zugang zu professionellen Werbematerialien (Banner, Texte, etc.)',
        'Personalisierte Dashboard zur Anzeige Ihrer Statistiken und Einnahmen',
        'Aktive Affiliate-Community mit Tipps und Strategien',
        'Hochwertiges Produkt mit ausgezeichneter Conversion-Rate'
      ],
      ctaText: 'PROGRAMM BEITRETEN',
      ctaLink: 'https://pdfwizardzapp.gumroad.com/affiliates'
    },
    FR: {
      title: 'PROGRAMME D\'AFFILIATION',
      subtitle: 'Gagnez de l\'argent en recommandant PDF Wizardz',
      description: 'Rejoignez notre programme d\'affiliation et gagnez des commissions sur chaque vente que vous générez. Parfait pour les influenceurs, créateurs de contenu et professionnels du marketing.',
      mainFeature: 'Pourquoi devenir affilié?',
      features: [
        'Commissions attractives sur chaque vente',
        'Outils de suivi en temps réel',
        'Matériaux marketing prêts à l\'emploi',
        'Support dédié aux affiliés',
        'Paiements rapides et fiables',
        'Gains illimités'
      ],
      benefits: [
        'Gagnez un revenu passif en recommandant un outil qui fonctionne vraiment',
        'Accès à des matériaux promotionnels professionnels (bannières, textes, etc.)',
        'Tableau de bord personnalisé pour voir vos statistiques et gains',
        'Communauté d\'affiliés active avec conseils et stratégies',
        'Produit de haute qualité avec excellent taux de conversion'
      ],
      ctaText: 'REJOINDRE LE PROGRAMME',
      ctaLink: 'https://pdfwizardzapp.gumroad.com/affiliates'
    }
  };

  const content = translations[lang];

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
        <div className="bg-yellow-900/30 border-4 border-yellow-500 rounded-lg p-8 md:p-12 mb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-yellow-900/30 border-4 border-yellow-500 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 pixel-font-header">
            {content.title}
          </h1>
          <p className="text-2xl md:text-3xl font-bold mb-6 text-gray-300">
            {content.subtitle}
          </p>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            {content.description}
          </p>
          <a
            href={content.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-600 hover:bg-yellow-500 text-black border-2 border-yellow-500 font-bold py-4 px-8 text-xl rounded-lg transition-colors inline-flex items-center gap-3"
          >
            <Sparkles className="w-6 h-6" />
            {content.ctaText}
          </a>
        </div>

        {/* Main Feature Highlight */}
        <div className="bg-gray-800 border-4 border-gray-700 rounded-lg p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-900/30 border-2 border-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {content.mainFeature}
              </h2>
              <p className="text-gray-300 text-lg">
                {lang === 'ES' 
                  ? 'Convierte tu audiencia en ingresos. Cada recomendación que resulte en una venta te genera una comisión. Sin límites, sin restricciones.'
                  : lang === 'EN'
                  ? 'Turn your audience into income. Every recommendation that results in a sale generates a commission for you. No limits, no restrictions.'
                  : lang === 'DE'
                  ? 'Verwandeln Sie Ihr Publikum in Einkommen. Jede Empfehlung, die zu einem Verkauf führt, generiert eine Provision für Sie. Keine Limits, keine Einschränkungen.'
                  : 'Transformez votre audience en revenus. Chaque recommandation qui aboutit à une vente génère une commission pour vous. Aucune limite, aucune restriction.'}
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {content.features.map((feature, idx) => (
            <div key={idx} className="bg-yellow-900/30 border-4 border-yellow-500 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <p className="text-gray-200 text-lg font-bold">{feature}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-800 border-4 border-gray-700 rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            {lang === 'ES' ? 'Beneficios exclusivos' : lang === 'EN' ? 'Exclusive benefits' : lang === 'DE' ? 'Exklusive Vorteile' : 'Avantages exclusifs'}
          </h2>
          <div className="space-y-4">
            {content.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-yellow-900/30 border-2 border-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-yellow-400 font-bold">{idx + 1}</span>
                </div>
                <p className="text-gray-300 text-lg">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-yellow-900/30 border-4 border-yellow-500 rounded-lg p-6 text-center">
            <TrendingUp className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {lang === 'ES' ? 'Sin límites' : lang === 'EN' ? 'No limits' : lang === 'DE' ? 'Keine Limits' : 'Aucune limite'}
            </h3>
            <p className="text-gray-300">
              {lang === 'ES' ? 'Gana tanto como quieras' : lang === 'EN' ? 'Earn as much as you want' : lang === 'DE' ? 'Verdiene so viel du willst' : 'Gagnez autant que vous voulez'}
            </p>
          </div>
          <div className="bg-yellow-900/30 border-4 border-yellow-500 rounded-lg p-6 text-center">
            <Share2 className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {lang === 'ES' ? 'Fácil de compartir' : lang === 'EN' ? 'Easy to share' : lang === 'DE' ? 'Einfach zu teilen' : 'Facile à partager'}
            </h3>
            <p className="text-gray-300">
              {lang === 'ES' ? 'Enlaces y materiales listos' : lang === 'EN' ? 'Links and materials ready' : lang === 'DE' ? 'Links und Materialien bereit' : 'Liens et matériaux prêts'}
            </p>
          </div>
          <div className="bg-yellow-900/30 border-4 border-yellow-500 rounded-lg p-6 text-center">
            <Award className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {lang === 'ES' ? 'Pagos rápidos' : lang === 'EN' ? 'Fast payments' : lang === 'DE' ? 'Schnelle Zahlungen' : 'Paiements rapides'}
            </h3>
            <p className="text-gray-300">
              {lang === 'ES' ? 'Recibe tus comisiones rápido' : lang === 'EN' ? 'Receive your commissions fast' : lang === 'DE' ? 'Erhalte deine Provisionen schnell' : 'Recevez vos commissions rapidement'}
            </p>
          </div>
        </div>

        {/* CTA Final */}
        <div className="bg-yellow-900/30 border-4 border-yellow-500 rounded-lg p-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {lang === 'ES' 
              ? '¿Listo para empezar a ganar?' 
              : lang === 'EN'
              ? 'Ready to start earning?'
              : lang === 'DE'
              ? 'Bereit anzufangen zu verdienen?'
              : 'Prêt à commencer à gagner?'}
          </h2>
          <p className="text-gray-300 text-lg mb-6">
            {lang === 'ES'
              ? 'Únete ahora y comienza a generar ingresos recomendando PDF Wizardz.'
              : lang === 'EN'
              ? 'Join now and start generating income by recommending PDF Wizardz.'
              : lang === 'DE'
              ? 'Tritt jetzt bei und beginne Einnahmen zu generieren, indem du PDF Wizardz empfiehlst.'
              : 'Rejoignez maintenant et commencez à générer des revenus en recommandant PDF Wizardz.'}
          </p>
          <a
            href={content.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-600 hover:bg-yellow-500 text-black border-2 border-yellow-500 font-bold py-4 px-8 text-xl rounded-lg transition-colors inline-flex items-center gap-3"
          >
            <Sparkles className="w-6 h-6" />
            {content.ctaText}
          </a>
        </div>
      </div>
    </div>
  );
};

export default AffiliateLanding;

