import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { getTranslation } from '../services/translations';

interface Gem {
  id: string;
  image: string;
  name: string;
  nameEn: string;
  nameDe: string;
  nameFr: string;
  description: string;
  descriptionEn: string;
  descriptionDe: string;
  descriptionFr: string;
  color: string;
  route: string;
  angle: number; // Ángulo en grados para posicionar en el círculo
}

interface CircularGemMenuProps {
  lang: Language;
  onNavigate: (route: string) => void;
}

const CircularGemMenu: React.FC<CircularGemMenuProps> = ({ lang, onNavigate }) => {
  const [hoveredGem, setHoveredGem] = useState<string | null>(null);
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; opacity: number; delay: number }>>([]);
  const [scrollRotation, setScrollRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Definir las gemas - IA arriba (0-180°), simples abajo (180-360°)
  // ARRIBA (IA): excel-template, ai-organizer, study, oracle, chat
  // ABAJO (Simples): merge, split, convert, edit
  const gems: Gem[] = [
    // ARRIBA - Funcionalidades con IA (prioritarias) - Distribuidas en la parte superior
    {
      id: 'excel-template',
      image: '/Images/imagenes funcionalidades/smart excel templates .png',
      name: 'Plantillas Excel',
      nameEn: 'Excel Templates',
      nameDe: 'Excel-Vorlagen',
      nameFr: 'Modèles Excel',
      description: 'Rellena plantillas Excel desde PDFs automáticamente. Extrae datos de facturas con IA.',
      descriptionEn: 'Fill Excel templates from PDFs automatically. Extract invoice data with AI.',
      descriptionDe: 'Füllen Sie Excel-Vorlagen aus PDFs automatisch aus. Extrahieren Sie Rechnungsdaten mit KI.',
      descriptionFr: 'Remplissez les modèles Excel depuis PDFs automatiquement. Extrayez les données de factures avec IA.',
      color: '#10b981', // emerald
      route: '/plantillas-excel',
      angle: -90, // 12 en punto (arriba) - ajustado para que esté en la cima
    },
    {
      id: 'ai-organizer',
      image: '/Images/imagenes funcionalidades/AI grimoire (organizer).png',
      name: 'Grimorio IA',
      nameEn: 'AI Grimoire',
      nameDe: 'KI-Grimoire',
      nameFr: 'Grimoire IA',
      description: 'Renombra PDFs automáticamente por contenido con IA. Organiza facturas sin subir a internet.',
      descriptionEn: 'Rename PDFs automatically by content with AI. Organize invoices without uploading to the internet.',
      descriptionDe: 'Benennen Sie PDFs automatisch nach Inhalt mit KI um. Organisieren Sie Rechnungen ohne Upload ins Internet.',
      descriptionFr: 'Renommez automatiquement les PDFs par contenu avec IA. Organisez les factures sans téléchargement.',
      color: '#6366f1', // indigo
      route: '/organizar-pdf',
      angle: -50, // 1:20 en punto (arriba-izquierda)
    },
    {
      id: 'study',
      image: '/Images/imagenes funcionalidades/Arcane wisdom.png',
      name: 'Sabiduría Arcana',
      nameEn: 'Arcane Wisdom',
      nameDe: 'Arkane Weisheit',
      nameFr: 'Sagesse Arcane',
      description: 'Crea test tipo examen y flashcards automáticamente desde PDFs. Perfecto para estudiantes.',
      descriptionEn: 'Create exam-type tests and flashcards automatically from PDFs. Perfect for students.',
      descriptionDe: 'Erstellen Sie Prüfungstests und Karteikarten automatisch aus PDFs. Perfekt für Studenten.',
      descriptionFr: 'Créez des tests type examen et flashcards automatiquement depuis PDFs. Parfait pour étudiants.',
      color: '#eab308', // yellow
      route: '/generar-test',
      angle: -10, // 2:40 en punto (arriba-derecha)
    },
    {
      id: 'oracle',
      image: '/Images/imagenes funcionalidades/visula oracle.png',
      name: 'Oráculo Visual',
      nameEn: 'Visual Oracle',
      nameDe: 'Visuelles Orakel',
      nameFr: 'Oracle Visuel',
      description: 'Genera mapas mentales interactivos desde PDFs. Visualiza conocimiento complejo.',
      descriptionEn: 'Generate interactive mind maps from PDFs. Visualize complex knowledge.',
      descriptionDe: 'Erstellen Sie interaktive Mindmaps aus PDFs. Visualisieren Sie komplexes Wissen.',
      descriptionFr: 'Générez des cartes mentales interactives depuis PDFs. Visualisez les connaissances complexes.',
      color: '#a855f7', // purple
      route: '/mapa-mental',
      angle: 30, // 4:00 en punto (derecha-arriba)
    },
    {
      id: 'chat',
      image: '/Images/imagenes funcionalidades/scroll interrogator.png',
      name: 'Interrogador',
      nameEn: 'Scroll Interrogator',
      nameDe: 'Schriftrollen-Befrager',
      nameFr: 'Interrogateur',
      description: 'Haz preguntas sobre el contenido del PDF y obtén respuestas precisas basadas en el texto completo.',
      descriptionEn: 'Ask questions about PDF content and get precise answers based on the full text.',
      descriptionDe: 'Stellen Sie Fragen zum PDF-Inhalt und erhalten Sie präzise Antworten basierend auf dem vollständigen Text.',
      descriptionFr: 'Posez des questions sur le contenu PDF et obtenez des réponses précises basées sur le texte complet.',
      color: '#ec4899', // pink
      route: '/chat-pdf',
      angle: 70, // 5:20 en punto (derecha)
    },
    // ABAJO - Funcionalidades simples - Distribuidas en la parte inferior
    {
      id: 'merge',
      image: '/Images/imagenes funcionalidades/binding.png',
      name: 'Vinculación',
      nameEn: 'Binding',
      nameDe: 'Bindung',
      nameFr: 'Liaison',
      description: 'Funde múltiples pergaminos en un solo tomo maestro. Une varios PDFs en uno.',
      descriptionEn: 'Fuse multiple scrolls into a single master tome. Merge several PDFs into one.',
      descriptionDe: 'Verschmelzen Sie mehrere Schriftrollen zu einem Meisterwerk. Mehrere PDFs zu einem zusammenführen.',
      descriptionFr: 'Fusionnez plusieurs parchemins en un tome maître. Fusionnez plusieurs PDFs en un.',
      color: '#14b8a6', // teal
      route: '/unir-pdf',
      angle: 110, // 6:40 en punto (derecha-abajo)
    },
    {
      id: 'split',
      image: '/Images/imagenes funcionalidades/split.png',
      name: 'División',
      nameEn: 'Split',
      nameDe: 'Teilen',
      nameFr: 'Diviser',
      description: 'Separa la esencia: extrae páginas o capítulos específicos de un PDF.',
      descriptionEn: 'Separate the essence: extract specific pages or chapters from a PDF.',
      descriptionDe: 'Trennen Sie die Essenz: Extrahieren Sie spezifische Seiten oder Kapitel aus einem PDF.',
      descriptionFr: 'Séparez l\'essence: extrayez des pages ou chapitres spécifiques d\'un PDF.',
      color: '#f43f5e', // rose
      route: '/dividir-pdf',
      angle: 150, // 8:00 en punto (abajo)
    },
    {
      id: 'convert',
      image: '/Images/imagenes funcionalidades/transmutation.png',
      name: 'Transmutación',
      nameEn: 'Transmutation',
      nameDe: 'Transmutation',
      nameFr: 'Transmutation',
      description: 'Alquimia pura: Convierte PDF en Word, Excel, Powerpoint o Imágenes.',
      descriptionEn: 'Pure alchemy: Convert PDF to Word, Excel, PowerPoint or Images.',
      descriptionDe: 'Reine Alchemie: Konvertieren Sie PDF in Word, Excel, PowerPoint oder Bilder.',
      descriptionFr: 'Alchimie pure: Convertissez PDF en Word, Excel, PowerPoint ou Images.',
      color: '#f97316', // orange
      route: '/convertir-pdf',
      angle: 190, // 9:20 en punto (izquierda-abajo)
    },
    {
      id: 'edit',
      image: '/Images/imagenes funcionalidades/enchantments.png',
      name: 'Encantamientos',
      nameEn: 'Enchantments',
      nameDe: 'Verzauberungen',
      nameFr: 'Enchantements',
      description: 'Inscribe runas (marcas de agua), sellos y numeración en tus PDFs.',
      descriptionEn: 'Inscribe runes (watermarks), seals and numbering on your PDFs.',
      descriptionDe: 'Inschreiben Sie Runen (Wasserzeichen), Siegel und Nummerierung auf Ihre PDFs.',
      descriptionFr: 'Inscrivez des runes (filigranes), sceaux et numérotation sur vos PDFs.',
      color: '#8b5cf6', // violet
      route: '/editar-pdf',
      angle: 230, // 10:40 en punto (izquierda)
    },
  ];

  // Generar estrellas aleatorias
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 100; i++) {
        newStars.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          opacity: Math.random(),
          delay: Math.random() * 3,
        });
      }
      setStars(newStars);
    };
    generateStars();
  }, []);

  // Animación de estrellas parpadeantes
  useEffect(() => {
    const animateStars = () => {
      setStars(prevStars =>
        prevStars.map(star => ({
          ...star,
          opacity: Math.random() * 0.8 + 0.2, // Parpadeo entre 0.2 y 1.0
        }))
      );
      animationFrameRef.current = requestAnimationFrame(animateStars);
    };

    const interval = setInterval(() => {
      animateStars();
    }, 2000); // Cambiar opacidad cada 2 segundos

    return () => {
      clearInterval(interval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Animación de rotación al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Rotación suave basada en el scroll (1 grado por cada 10px de scroll)
      const rotation = scrollY * 0.1;
      setScrollRotation(rotation);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calcular posición de cada gema en el círculo
  const getGemPosition = (angle: number, radius: number) => {
    const radian = (angle * Math.PI) / 180;
    const x = Math.cos(radian) * radius;
    const y = Math.sin(radian) * radius;
    return { x, y };
  };

  // Radio responsivo basado en el tamaño del contenedor - más separado
  const containerSize = 400; // Tamaño base reducido
  const radius = containerSize * 0.38; // Radio del círculo aumentado para separar más (38% del tamaño del contenedor)

  const getGemName = (gem: Gem) => {
    switch (lang) {
      case 'EN': return gem.nameEn;
      case 'DE': return gem.nameDe;
      case 'FR': return gem.nameFr;
      default: return gem.name;
    }
  };

  const getGemDescription = (gem: Gem) => {
    switch (lang) {
      case 'EN': return gem.descriptionEn;
      case 'DE': return gem.descriptionDe;
      case 'FR': return gem.descriptionFr;
      default: return gem.description;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ 
        background: '#050810', // Más oscuro
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)',
        minHeight: 'auto',
      }}
    >
      {/* Estrellas de fondo */}
      <div className="absolute inset-0">
        {stars.map((star, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: `twinkle ${2 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Partículas brillantes dispersas */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: `rgba(${Math.random() > 0.5 ? '99, 102, 241' : '16, 185, 129'}, ${Math.random() * 0.5 + 0.3})`,
              boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(${Math.random() > 0.5 ? '99, 102, 241' : '16, 185, 129'}, 0.8)`,
              animation: `float ${5 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>


      {/* Contenedor principal - Layout de dos columnas */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
          {/* Columna izquierda: Menú circular compacto */}
          <div className="flex-shrink-0">
            <h2 
              className="text-xl md:text-2xl font-bold mb-4 text-center lg:text-left"
              style={{
                fontFamily: 'monospace',
                textShadow: '0 0 10px rgba(99, 102, 241, 0.6)',
                color: '#60a5fa',
              }}
            >
              {lang === 'ES' ? '⚡ ACCESO RÁPIDO' : lang === 'EN' ? '⚡ QUICK ACCESS' : lang === 'DE' ? '⚡ SCHNELLZUGRIFF' : '⚡ ACCÈS RAPIDE'}
            </h2>
            
            {/* Menú circular compacto con rotación al scroll */}
            <div 
              ref={menuRef}
              className="relative transition-transform duration-100 ease-out"
              style={{
                width: 'min(400px, 80vw)',
                height: 'min(400px, 80vw)',
                aspectRatio: '1',
                transform: `rotate(${scrollRotation}deg)`,
              }}
            >
              {/* Círculo central decorativo - más pequeño */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/20"
                style={{
                  width: 'clamp(60px, 15%, 80px)',
                  height: 'clamp(60px, 15%, 80px)',
                  background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.3), inset 0 0 20px rgba(99, 102, 241, 0.15)',
                }}
              />

          {/* Gemas */}
          {gems.map((gem) => {
            const position = getGemPosition(gem.angle, radius);
            const isHovered = hoveredGem === gem.id;
            
            return (
              <div
                key={gem.id}
                className="absolute cursor-pointer transition-all duration-300"
                style={{
                  left: `calc(50% + ${position.x}px)`,
                  top: `calc(50% + ${position.y}px)`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isHovered ? 20 : 10,
                }}
                onMouseEnter={() => setHoveredGem(gem.id)}
                onMouseLeave={() => setHoveredGem(null)}
                onClick={() => onNavigate(gem.route)}
              >
                {/* Resplandor de neón al hacer hover - Más pequeño y sutil */}
                {isHovered && (
                  <>
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: '100px',
                        height: '100px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: `radial-gradient(circle, ${gem.color}30 0%, transparent 70%)`,
                        boxShadow: `0 0 20px ${gem.color}, 0 0 40px ${gem.color}60, 0 0 60px ${gem.color}30`,
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                    {/* Partículas de destello - Menos intrusivas */}
                    {[...Array(4)].map((_, i) => {
                      const particleAngle = (i * 90) * Math.PI / 180;
                      const particleDistance = 40;
                      return (
                        <div
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            width: '4px',
                            height: '4px',
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) translate(${Math.cos(particleAngle) * particleDistance}px, ${Math.sin(particleAngle) * particleDistance}px)`,
                            background: gem.color,
                            boxShadow: `0 0 8px ${gem.color}`,
                            animation: `sparkle 1s ease-in-out infinite`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      );
                    })}
                  </>
                )}

                {/* Imagen de la gema - Más pequeña y menos intrusiva */}
                <div
                  className="relative transition-all duration-300"
                  style={{
                    width: 'clamp(50px, 12vw, 65px)',
                    height: 'clamp(50px, 12vw, 65px)',
                    transform: isHovered ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
                    filter: isHovered ? `drop-shadow(0 0 15px ${gem.color}) drop-shadow(0 0 30px ${gem.color}80)` : 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))',
                    imageRendering: 'pixelated',
                  }}
                >
                  <img
                    src={gem.image}
                    alt={getGemName(gem)}
                    className="w-full h-full object-contain"
                    style={{
                      imageRendering: 'pixelated',
                      filter: isHovered ? 'brightness(1.3)' : 'brightness(1)',
                    }}
                    onError={(e) => {
                      // Fallback si la imagen no se carga
                      console.error(`Error loading image: ${gem.image}`);
                    }}
                  />
                </div>

                {/* Tooltip con descripción - Más compacto */}
                {isHovered && (
                  <div
                    className="absolute mt-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                    style={{
                      top: 'calc(100% + 10px)',
                    }}
                  >
                    <div
                      className="px-2 py-1.5 rounded border-2"
                      style={{
                        background: 'rgba(5, 8, 16, 0.98)',
                        borderColor: gem.color,
                        boxShadow: `0 0 15px ${gem.color}80, inset 0 0 8px ${gem.color}20`,
                        fontFamily: 'monospace',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <div
                        className="font-bold text-xs mb-0.5"
                        style={{
                          color: gem.color,
                          textShadow: `0 0 8px ${gem.color}`,
                        }}
                      >
                        {getGemName(gem)}
                      </div>
                      <div
                        className="text-xs text-cyan-200 leading-tight"
                        style={{
                          textShadow: '0 0 4px rgba(34, 211, 238, 0.5)',
                          whiteSpace: 'normal',
                          width: 'clamp(150px, 25vw, 200px)',
                          maxWidth: '200px',
                        }}
                      >
                        {getGemDescription(gem)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
            </div>
          </div>

          {/* Columna derecha: Descripción */}
          <div className="flex-1 text-center lg:text-left">
            <div className="bg-indigo-900/50 inline-block px-2 py-1 border border-indigo-500 mb-4 text-indigo-300 font-bold text-sm tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.3)]">
              ✨ {lang === 'ES' ? 'PODER' : lang === 'EN' ? 'POWER' : lang === 'DE' ? 'MACHT' : 'POUVOIR'}: WORD, EXCEL & QUIZZES
            </div>
            <h1 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              style={{
                fontFamily: 'monospace',
                textShadow: '0 0 15px rgba(99, 102, 241, 0.6)',
                color: '#60a5fa',
              }}
            >
              {lang === 'ES' ? 'MAGIA' : lang === 'EN' ? 'DIGITAL' : lang === 'DE' ? 'DIGITALE' : 'ALCHIMIE'}<br/>
              <span style={{ color: '#34d399' }}>
                {lang === 'ES' ? 'DE ARCHIVOS PDF' : lang === 'EN' ? 'FILE ALCHEMY' : lang === 'DE' ? 'DATEIEN-ALCHEMIE' : 'NUMÉRIQUE PDF'}
              </span>
            </h1>
            <p 
              className="text-lg md:text-xl text-gray-300 mb-4 max-w-2xl mx-auto lg:mx-0"
              style={{
                fontFamily: 'monospace',
                lineHeight: '1.6',
              }}
            >
              {lang === 'ES' 
                ? 'Domina tus documentos con Artes Arcanas Digitales. Convierte formatos, Fusiona documentos y organiza tu biblioteca con Inteligencia Artificial. Procesamiento 100% en tu navegador - Tus archivos nunca salen de tu PC.'
                : lang === 'EN'
                ? 'Master your docs with Arcane Arts. Transmute formats, bind scrolls, and organize your library with Artificial Intelligence.'
                : lang === 'DE'
                ? 'Meistere deine Dokumente mit arkanen Künsten. Formate umwandeln, Schriftrollen binden und Bibliothek organisieren.'
                : 'Maîtrisez vos docs avec les Arts Arcanes. Transmutez les formats, liez les parchemins et organisez votre bibliothèque.'}
            </p>
            {/* SEO Content - Visible but subtle */}
            <div className="text-sm text-gray-400 mb-6 max-w-2xl mx-auto lg:mx-0">
              <p className="mb-2">
                <strong className="text-emerald-400">
                  {lang === 'ES' 
                    ? '🔒 100% Privado: Procesamiento completamente en tu navegador. Tus archivos nunca salen de tu PC.'
                    : lang === 'EN'
                    ? '🔒 100% Private: Processing completely in your browser. Your files never leave your PC.'
                    : lang === 'DE'
                    ? '🔒 100% Privat: Verarbeitung vollständig in Ihrem Browser. Ihre Dateien verlassen nie Ihren PC.'
                    : '🔒 100% Privé: Traitement complètement dans votre navigateur. Vos fichiers ne quittent jamais votre PC.'}
                </strong>
              </p>
              <p>
                <strong className="text-indigo-400">
                  {lang === 'ES'
                    ? '✨ Automatización IA: Renombra 100 PDFs automáticamente por contenido. Extrae datos de facturas a Excel.'
                    : lang === 'EN'
                    ? '✨ AI Automation: Rename 100 PDFs automatically by content. Extract invoice data to Excel.'
                    : lang === 'DE'
                    ? '✨ KI-Automatisierung: Benennen Sie 100 PDFs automatisch nach Inhalt um. Extrahieren Sie Rechnungsdaten nach Excel.'
                    : '✨ Automatisation IA: Renommez 100 PDFs automatiquement par contenu. Extrayez les données de factures vers Excel.'}
                </strong>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={() => onNavigate('/chat-pdf')}
                className="bg-indigo-600 text-white text-lg px-6 py-3 border-2 border-indigo-500 font-bold transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                style={{ fontFamily: 'monospace' }}
              >
                {lang === 'ES' ? 'INVOCAR IA' : lang === 'EN' ? 'SUMMON AI' : lang === 'DE' ? 'KI BESCHWÖREN' : 'INVOQUER IA'}
              </button>
              <button 
                onClick={() => {
                  const toolsSection = document.getElementById('tools');
                  if (toolsSection) {
                    toolsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-gray-800 text-gray-200 text-lg px-6 py-3 border-2 border-gray-700 font-bold transition-all hover:bg-gray-700"
                style={{ fontFamily: 'monospace' }}
              >
                {lang === 'ES' ? 'ABRIR LIBRO DE HECHIZOS' : lang === 'EN' ? 'OPEN SPELLBOOK' : lang === 'DE' ? 'ZAUBERBUCH ÖFFNEN' : 'OUVRIR GRIMOIRE'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }
        
        @keyframes rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CircularGemMenu;

