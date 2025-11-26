import React, { useState, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PixelCard from './components/PixelCard';
import ProgressBar from './components/ProgressBar';
import FileQueue from './components/FileQueue';
import StudySession from './components/StudySession';
import CookieBanner from './components/CookieBanner';
import DonationBanner from './components/DonationBanner';
import OracleView from './components/OracleView';
import FeatureCard from './components/FeatureCard';
import ChatSession from './components/ChatSession';
import PricingPage from './components/PricingPage';
import LandingPage from './components/LandingPage';
import TemplateEditor from './components/TemplateEditor';
import ToolPage from './components/ToolPage';
import { getPremiumStatus, getFeatureAccessStatus, consumeFreeTrialUse, getPlanLimits } from './services/gumroadService';
import { usePdfProcessor } from './hooks/usePdfProcessor';
import { mergePdfs, imagesToPdf, splitPdf, addWatermark, convertToText, convertToImages, convertToDocx, convertToExcel, convertToPptx } from './services/pdfTools';
import { generateQuiz, generateFlashcards, generateMindMapData } from './services/geminiService';
import { extractTextFromPdf } from './services/pdfService';
import { fillExcelTemplate, getTemplateKeys } from './services/excelTemplateService';
import { getTranslation } from './services/translations';
import { ViewType, Language, DocumentContext, StudyMaterial, MindMapData } from './types';
import { useSEO } from './hooks/useSEO';
import { Upload, Wand2, Download, Trash2, FileText, Layers, Image as ImageIcon, Sparkles, ArrowRight, Scissors, PenTool, Type, FileStack, Repeat, FileSpreadsheet, Briefcase, GraduationCap, Scale, BookOpen, BrainCircuit, Presentation, Lock, Calculator } from 'lucide-react';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Mapeo de rutas a ViewType para SEO
  const routeToViewType: Record<string, ViewType> = {
    '/': 'HOME',
    '/organizar-pdf': 'AI_ORGANIZER',
    '/unir-pdf': 'MERGE',
    '/dividir-pdf': 'SPLIT',
    '/editar-pdf': 'EDIT',
    '/convertir-pdf': 'CONVERT',
    '/imagenes-a-pdf': 'IMG_TO_PDF',
    '/plantillas-excel': 'EXCEL_TEMPLATE',
    '/generar-test': 'STUDY',
    '/mapa-mental': 'ORACLE',
    '/chat-pdf': 'CHAT',
    '/precios': 'PRICING',
    '/editor-plantillas': 'TEMPLATE_EDITOR',
    '/facturas-excel': 'LANDING_FACTURAS_EXCEL',
    '/generador-test': 'LANDING_GENERADOR_TEST',
    '/modelo-tributario': 'LANDING_MODELO_TRIBUTARIO',
  };
  
  const currentView = routeToViewType[location.pathname] || 'HOME';
  const [lang, setLang] = useState<Language>('ES');
  const t = getTranslation(lang);
  
  // SEO: Actualizar título y meta tags según la vista
  useSEO(currentView, lang);
  
  // Helper para navegar
  const setCurrentView = (view: ViewType) => {
    const viewToRoute: Record<ViewType, string> = {
      'HOME': '/',
      'AI_ORGANIZER': '/organizar-pdf',
      'MERGE': '/unir-pdf',
      'SPLIT': '/dividir-pdf',
      'EDIT': '/editar-pdf',
      'CONVERT': '/convertir-pdf',
      'IMG_TO_PDF': '/imagenes-a-pdf',
      'EXCEL_TEMPLATE': '/plantillas-excel',
      'STUDY': '/generar-test',
      'ORACLE': '/mapa-mental',
      'CHAT': '/chat-pdf',
      'PRICING': '/precios',
      'TEMPLATE_EDITOR': '/editor-plantillas',
      'LANDING_FACTURAS_EXCEL': '/facturas-excel',
      'LANDING_GENERADOR_TEST': '/generador-test',
      'LANDING_MODELO_TRIBUTARIO': '/modelo-tributario',
    };
    navigate(viewToRoute[view] || '/');
  };
  
  // AI Processor State
  const { 
    files, isProcessing, progress, addFiles, updateFileMetadata, startProcessing, handleDownload, clearQueue 
  } = usePdfProcessor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docContext, setDocContext] = useState<DocumentContext>('GENERAL');

  // Simple Tool State
  const [toolFiles, setToolFiles] = useState<File[]>([]);
  const [isToolProcessing, setIsToolProcessing] = useState(false);
  const toolInputRef = useRef<HTMLInputElement>(null);
  
  // PRO Features State
  const [splitRange, setSplitRange] = useState("");
  const [watermarkText, setWatermarkText] = useState("Confidencial");
  const [textColor, setTextColor] = useState("red");
  const [watermarkPos, setWatermarkPos] = useState<'diagonal' | 'top' | 'bottom'>('diagonal');
  const [addPageNums, setAddPageNums] = useState(false);
  const [fitToA4, setFitToA4] = useState(false);
  const [convertFormat, setConvertFormat] = useState<'JPG' | 'TXT' | 'DOCX' | 'XLSX' | 'PPTX'>('JPG');
  
  // Editor Image Overlay State
  const [overlayImage, setOverlayImage] = useState<File | null>(null);
  const [imgScale, setImgScale] = useState(50);
  const [imgPos, setImgPos] = useState<'center' | 'tl' | 'tr' | 'bl' | 'br'>('center');
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Study State
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  
  // Oracle (Mind Map) State
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  
  // Chat State
  const [chatPdfText, setChatPdfText] = useState<string>('');
  const [chatPdfFileName, setChatPdfFileName] = useState<string>('');
  
  // Premium State - Cargar desde localStorage al iniciar
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    const premiumStatus = getPremiumStatus();
    return premiumStatus.isPremium;
  });
  
  // Category Tabs State
  const [activeCategory, setActiveCategory] = useState<'all' | 'education' | 'b2b' | 'tools'>('all');
  
  // Excel Template State
  const [pdfsForTemplate, setPdfsForTemplate] = useState<File[]>([]);
  const [excelTemplate, setExcelTemplate] = useState<File | null>(null);
  const [isTemplateProcessing, setIsTemplateProcessing] = useState(false);
  const [templateProgress, setTemplateProgress] = useState({ current: 0, total: 0 });
  const [showFullTutorial, setShowFullTutorial] = useState(false);
  const [showTargetedTip, setShowTargetedTip] = useState(false); // Tip de extracción dirigida
  const [detectedKeys, setDetectedKeys] = useState<string[]>([]); // Runas detectadas
  const [isScanningKeys, setIsScanningKeys] = useState(false);
  const pdfTemplateInputRef = useRef<HTMLInputElement>(null);
  const excelTemplateInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const handleAiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) addFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToolFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setToolFiles(Array.from(e.target.files));
    if (toolInputRef.current) toolInputRef.current.value = '';
  };

  const handleAiStart = () => {
      startProcessing(lang, docContext);
  }

  const executeMerge = async () => {
    try {
      setIsToolProcessing(true);
      await mergePdfs(toolFiles);
      setToolFiles([]);
      alert("Success!");
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsToolProcessing(false);
    }
  };

  const executeImgToPdf = async () => {
    try {
      setIsToolProcessing(true);
      await imagesToPdf(toolFiles, fitToA4);
      setToolFiles([]);
      alert("Success!");
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsToolProcessing(false);
    }
  };

  const executeSplit = async () => {
    try {
      setIsToolProcessing(true);
      if(toolFiles.length !== 1) throw new Error("1 file only.");
      await splitPdf(toolFiles[0], splitRange);
      setToolFiles([]);
      alert("Success!");
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsToolProcessing(false);
    }
  };

  const executeEdit = async () => {
    try {
        setIsToolProcessing(true);
        if(toolFiles.length !== 1) throw new Error("1 file only.");
        await addWatermark(
            toolFiles[0], 
            watermarkText, 
            textColor, 
            watermarkPos, 
            addPageNums,
            overlayImage || undefined,
            imgScale,
            imgPos
        );
        setToolFiles([]);
        setOverlayImage(null);
        alert("Success!");
      } catch (e: any) {
        alert("Error: " + e.message);
      } finally {
        setIsToolProcessing(false);
      }
  };

  const executeConvert = async () => {
      try {
          setIsToolProcessing(true);
          if (toolFiles.length !== 1) throw new Error("1 file only.");
          
          if (convertFormat === 'TXT') await convertToText(toolFiles[0]);
          else if (convertFormat === 'DOCX') await convertToDocx(toolFiles[0]);
          else if (convertFormat === 'XLSX') await convertToExcel(toolFiles[0]);
          else if (convertFormat === 'PPTX') await convertToPptx(toolFiles[0], lang);
          else await convertToImages(toolFiles[0]);
          
          setToolFiles([]);
          alert("Success!");
      } catch (e: any) {
          alert("Error: " + e.message);
      } finally {
          setIsToolProcessing(false);
      }
  };

  const executeStudy = async (mode: 'QUIZ' | 'FLASHCARDS') => {
      try {
          setIsToolProcessing(true);
          if (toolFiles.length !== 1) throw new Error("Please select 1 PDF file.");
          
          const text = await extractTextFromPdf(toolFiles[0], 20); // Limit to 20 pages for study to avoid token limits
          
          if (mode === 'QUIZ') {
              const quiz = await generateQuiz(text, lang);
              setStudyMaterial({ type: 'QUIZ', quiz });
          } else {
              const flashcards = await generateFlashcards(text, lang);
              setStudyMaterial({ type: 'FLASHCARDS', flashcards });
          }
      } catch (e: any) {
          alert("Study Gen Error: " + e.message);
      } finally {
          setIsToolProcessing(false);
      }
  };

  const executeOracle = async () => {
      try {
          setIsToolProcessing(true);
          if (toolFiles.length !== 1) throw new Error(lang === 'ES' ? "Por favor, selecciona 1 archivo PDF." : "Please select 1 PDF file.");
          
          const text = await extractTextFromPdf(toolFiles[0], 50); // Hasta 50 páginas para mapas mentales
          const mindMap = await generateMindMapData(text, lang);
          setMindMapData(mindMap);
      } catch (e: any) {
          alert(lang === 'ES' ? "Error generando mapa mental: " + e.message : "Error generating mind map: " + e.message);
      } finally {
          setIsToolProcessing(false);
      }
  };

  const executeChat = async () => {
      try {
          setIsToolProcessing(true);
          if (toolFiles.length !== 1) throw new Error(lang === 'ES' ? "Por favor, selecciona 1 archivo PDF." : "Please select 1 PDF file.");
          
          // Extraer todo el texto del PDF (sin límite de páginas para chat)
          const text = await extractTextFromPdf(toolFiles[0], Infinity);
          setChatPdfText(text);
          setChatPdfFileName(toolFiles[0].name);
          navigate('/chat-pdf');
      } catch (e: any) {
          alert(lang === 'ES' ? "Error extrayendo texto: " + e.message : "Error extracting text: " + e.message);
      } finally {
          setIsToolProcessing(false);
      }
  };

  // Handler para escanear las claves cuando se sube el Excel
  const handleExcelTemplateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setExcelTemplate(file);
    setDetectedKeys([]);
    
    if (file) {
      try {
        setIsScanningKeys(true);
        const keys = await getTemplateKeys(file);
        setDetectedKeys(keys);
      } catch (error) {
        console.error('Error escaneando claves:', error);
        alert(lang === 'ES' 
          ? 'Error al escanear la plantilla. Continuando sin extracción dirigida...' 
          : 'Error scanning template. Continuing without targeted extraction...');
      } finally {
        setIsScanningKeys(false);
      }
    }
  };

  const executeExcelTemplate = async () => {
      // Verificar acceso antes de procesar
      const accessStatus = getFeatureAccessStatus('excel_template');
      const premiumStatus = getPremiumStatus();
      
      if (accessStatus.isLocked) {
          alert(lang === 'ES' 
              ? 'Has agotado tus 3 usos gratuitos de Plantillas Excel. ¡Actualiza a Premium para continuar!' 
              : 'You have exhausted your 3 free uses of Excel Templates. Upgrade to Premium to continue!');
          navigate('/precios');
          return;
      }

      // Consumir un uso gratuito si no es premium
      if (!accessStatus.isPremium) {
          const useConsumed = consumeFreeTrialUse('excel_template');
          if (!useConsumed) {
              alert(lang === 'ES' 
                  ? 'Has agotado tus 3 usos gratuitos de Plantillas Excel. ¡Actualiza a Premium para continuar!' 
                  : 'You have exhausted your 3 free uses of Excel Templates. Upgrade to Premium to continue!');
              navigate('/precios');
              return;
          }
      }

      try {
          setIsTemplateProcessing(true);
          setTemplateProgress({ current: 0, total: pdfsForTemplate.length });
          
          if (pdfsForTemplate.length === 0) throw new Error(lang === 'ES' ? "Por favor, sube al menos un archivo PDF." : "Please upload at least one PDF file.");
          if (!excelTemplate) throw new Error(lang === 'ES' ? "Por favor, sube una plantilla Excel." : "Please upload an Excel template.");
          
          // Verificar límite de documentos según el plan
          if (premiumStatus.isPremium && premiumStatus.maxExcelDocuments) {
              if (pdfsForTemplate.length > premiumStatus.maxExcelDocuments) {
                  throw new Error(
                      lang === 'ES' 
                          ? `Límite de documentos excedido. Tu plan permite máximo ${premiumStatus.maxExcelDocuments} documentos. Has seleccionado ${pdfsForTemplate.length}.` 
                          : `Document limit exceeded. Your plan allows a maximum of ${premiumStatus.maxExcelDocuments} documents. You selected ${pdfsForTemplate.length}.`
                  );
              }
          }
          
          // Usar las claves detectadas para extracción dirigida
          await fillExcelTemplate(
            pdfsForTemplate, 
            excelTemplate, 
            lang,
            (current, total) => setTemplateProgress({ current, total }),
            detectedKeys.length > 0 ? detectedKeys : undefined
          );
          
          alert(lang === 'ES' 
            ? `¡${pdfsForTemplate.length} factura(s) procesada(s) exitosamente! Revisa tu descarga.` 
            : `${pdfsForTemplate.length} invoice(s) processed successfully! Check your downloads.`);
          
          // Limpiar después de procesar
          setPdfsForTemplate([]);
          setExcelTemplate(null);
          setDetectedKeys([]);
      } catch (e: any) {
          alert("Error: " + e.message);
      } finally {
          setIsTemplateProcessing(false);
          setTemplateProgress({ current: 0, total: 0 });
      }
  };

  // --- Renders ---

  const renderHome = () => (
    <div className="flex flex-col items-center w-full animate-fade-in">
      {/* Hero Section */}
      <div className="w-full bg-gray-900 border-b-4 border-black mb-12 py-16 px-4 relative overflow-hidden">
         <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-900 rounded-full blur-[100px] opacity-30"></div>
         
         <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="md:w-1/3 flex justify-center order-1">
                {/* 
                   PARA PONER TU PROPIA IMAGEN:
                   1. Guarda tu imagen (ej: mago.png) en la misma carpeta que index.html
                   2. Cambia el src de abajo así: src="./mago.png"
                */}
                <div className="w-58 h-58 bg-indigo-900 border-4 border-black rounded-full overflow-hidden relative shadow-[0_0_20px_rgba(99,102,241,0.6)] hover:scale-105 transition-transform duration-300">
                   <img 
                     src="/Images/cabeza mago.png" 
                     alt="Gran Mago PDF" 
                     className="w-full h-full object-cover p-2"
                   />
                </div>
            </div>
            <div className="md:w-2/3 text-center md:text-left order-2">
                <div className="bg-indigo-900/50 inline-block px-2 py-1 border border-indigo-500 mb-4 text-indigo-300 font-bold text-sm tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                   ✨ {t.new}: WORD, EXCEL & QUIZZES
                </div>
                <h1 className="text-5xl md:text-7xl pixel-font-header text-gray-100 leading-tight mb-4 drop-shadow-md neon-glow-text">
                   {t.heroTitle}<br/>
                   <span className="text-indigo-400 bg-gray-900 px-2 border-4 border-gray-700 transform -skew-x-6 inline-block mt-2 shadow-[4px_4px_0_0_rgba(79,70,229,0.5)]">{t.heroSubtitle}</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 mb-4 max-w-lg">
                   {t.heroDesc}
                </p>
                {/* SEO Content - Visible but subtle */}
                <div className="text-sm text-gray-500 mb-6 max-w-lg">
                  <p className="mb-2">
                    <strong className="text-emerald-400">{t.heroPrivacy}</strong>
                  </p>
                  <p>
                    <strong className="text-indigo-400">{t.heroAutomation}</strong>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                   <button 
                     onClick={() => navigate('/chat-pdf')}
                     className="bg-indigo-600 text-white text-xl px-8 py-3 border-4 border-black retro-shadow hover:bg-indigo-500 hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all font-bold font-vt323"
                   >
                     {t.startBtn}
                   </button>
                   <button 
                     onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth'})}
                     className="bg-gray-800 text-gray-200 text-xl px-8 py-3 border-4 border-black retro-shadow hover:bg-gray-700 hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all font-bold font-vt323"
                   >
                     {t.toolsBtn}
                   </button>
                </div>
            </div>
         </div>
      </div>

      {/* Category Tabs in Header */}
      <div className="w-full bg-gray-900 border-b-4 border-black sticky top-16 z-40 mb-6">
         <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex flex-wrap gap-2 justify-center">
               <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-4 py-2 text-sm font-bold border-2 border-black transition-all ${
                     activeCategory === 'all'
                        ? 'bg-indigo-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
               >
                  {lang === 'ES' ? '🔮 TODAS' : lang === 'EN' ? '🔮 ALL' : lang === 'DE' ? '🔮 ALLE' : '🔮 TOUTES'}
               </button>
               <button
                  onClick={() => setActiveCategory('education')}
                  className={`px-4 py-2 text-sm font-bold border-2 border-black transition-all flex items-center gap-2 ${
                     activeCategory === 'education'
                        ? 'bg-yellow-600 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
               >
                  <GraduationCap className="w-4 h-4" />
                  {lang === 'ES' ? '📚 EDUCACIÓN' : lang === 'EN' ? '📚 EDUCATION' : lang === 'DE' ? '📚 BILDUNG' : '📚 ÉDUCATION'}
               </button>
               <button
                  onClick={() => setActiveCategory('b2b')}
                  className={`px-4 py-2 text-sm font-bold border-2 border-black transition-all flex items-center gap-2 ${
                     activeCategory === 'b2b'
                        ? 'bg-emerald-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
               >
                  <Briefcase className="w-4 h-4" />
                  {lang === 'ES' ? '💼 B2B HERRAMIENTAS IA' : lang === 'EN' ? '💼 B2B AI TOOLS' : lang === 'DE' ? '💼 B2B AI TOOLS' : '💼 B2B AI OUTILS'}
               </button>
               <button
                  onClick={() => setActiveCategory('tools')}
                  className={`px-4 py-2 text-sm font-bold border-2 border-black transition-all flex items-center gap-2 ${
                     activeCategory === 'tools'
                        ? 'bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
               >
                  <FileText className="w-4 h-4" />
                  {lang === 'ES' ? '🛠️ HERRAMIENTAS' : lang === 'EN' ? '🛠️ TOOLS' : lang === 'DE' ? '🛠️ TOOLS' : '🛠️ OUTILS'}
               </button>
            </div>
         </div>
         </div>

      {/* SEO Landing Pages Section - B2B Specific Solutions */}
      <div className="w-full bg-gradient-to-b from-gray-900 to-gray-800 border-b-4 border-black py-12 mb-8">
         <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
               <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 pixel-font-header">
                  {lang === 'ES' ? '🎯 Soluciones B2B Específicas' : lang === 'EN' ? '🎯 Specific B2B Solutions' : lang === 'DE' ? '🎯 Spezifische B2B-Lösungen' : '🎯 Solutions B2B Spécifiques'}
               </h2>
               <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  {lang === 'ES' 
                     ? 'Herramientas especializadas para casos de uso empresariales específicos'
                     : lang === 'EN'
                     ? 'Specialized tools for specific business use cases'
                     : lang === 'DE'
                     ? 'Spezialisierte Tools für spezifische Geschäftsanwendungsfälle'
                     : 'Outils spécialisés pour des cas d\'utilisation métier spécifiques'}
               </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
               {/* Landing Page 1: Facturas a Excel */}
               <div 
                  onClick={() => navigate('/facturas-excel')}
                  className="bg-emerald-900/30 border-4 border-emerald-500 rounded-lg p-6 cursor-pointer hover:bg-emerald-900/50 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
               >
                  <div className="flex items-center gap-3 mb-4">
                     <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                     <h3 className="text-xl font-bold text-emerald-300">
                        {lang === 'ES' ? 'Facturas a Excel' : lang === 'EN' ? 'Invoices to Excel' : lang === 'DE' ? 'Rechnungen zu Excel' : 'Factures vers Excel'}
                     </h3>
                  </div>
                  <p className="text-gray-300 mb-4">
                     {lang === 'ES' 
                        ? 'Cómo pasar facturas a Excel con IA gratis. Extrae datos automáticamente.'
                        : lang === 'EN'
                        ? 'How to convert invoices to Excel with free AI. Extract data automatically.'
                        : lang === 'DE'
                        ? 'Rechnungen zu Excel mit kostenloser KI konvertieren. Daten automatisch extrahieren.'
                        : 'Comment convertir factures en Excel avec IA gratuite. Extraire données automatiquement.'}
                  </p>
                  <div className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                     {lang === 'ES' ? 'Ver solución →' : lang === 'EN' ? 'View solution →' : lang === 'DE' ? 'Lösung ansehen →' : 'Voir solution →'}
                  </div>
               </div>

               {/* Landing Page 2: Generador de Test */}
               <div 
                  onClick={() => navigate('/generador-test')}
                  className="bg-indigo-900/30 border-4 border-indigo-500 rounded-lg p-6 cursor-pointer hover:bg-indigo-900/50 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
               >
                  <div className="flex items-center gap-3 mb-4">
                     <FileText className="w-8 h-8 text-indigo-400" />
                     <h3 className="text-xl font-bold text-indigo-300">
                        {lang === 'ES' ? 'Generador de Test' : lang === 'EN' ? 'Test Generator' : lang === 'DE' ? 'Test-Generator' : 'Générateur de Test'}
                     </h3>
                  </div>
                  <p className="text-gray-300 mb-4">
                     {lang === 'ES'
                        ? 'Generador de preguntas tipo test desde PDF. Crea exámenes con IA.'
                        : lang === 'EN'
                        ? 'Test question generator from PDF. Create exams with AI.'
                        : lang === 'DE'
                        ? 'Testfragen-Generator aus PDF. Erstellen Sie Prüfungen mit KI.'
                        : 'Générateur de questions type test depuis PDF. Créez examens avec IA.'}
                  </p>
                  <div className="text-indigo-400 font-bold text-sm flex items-center gap-2">
                     {lang === 'ES' ? 'Ver solución →' : lang === 'EN' ? 'View solution →' : lang === 'DE' ? 'Lösung ansehen →' : 'Voir solution →'}
                  </div>
               </div>

               {/* Landing Page 3: Modelo Tributario */}
               <div 
                  onClick={() => navigate('/modelo-tributario')}
                  className="bg-purple-900/30 border-4 border-purple-500 rounded-lg p-6 cursor-pointer hover:bg-purple-900/50 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
               >
                  <div className="flex items-center gap-3 mb-4">
                     <Calculator className="w-8 h-8 text-purple-400" />
                     <h3 className="text-xl font-bold text-purple-300">
                        {lang === 'ES' ? 'Modelo Tributario' : lang === 'EN' ? 'Tax Model' : lang === 'DE' ? 'Steuermodell' : 'Modèle Fiscal'}
                     </h3>
                  </div>
                  <p className="text-gray-300 mb-4">
                     {lang === 'ES'
                        ? 'Rellenar modelo tributario desde PDF automáticamente. Extrae datos fiscales.'
                        : lang === 'EN'
                        ? 'Fill tax model from PDF automatically. Extract tax data.'
                        : lang === 'DE'
                        ? 'Steuermodell aus PDF automatisch ausfüllen. Steuerdaten extrahieren.'
                        : 'Remplir modèle fiscal depuis PDF automatiquement. Extraire données fiscales.'}
                  </p>
                  <div className="text-purple-400 font-bold text-sm flex items-center gap-2">
                     {lang === 'ES' ? 'Ver solución →' : lang === 'EN' ? 'View solution →' : lang === 'DE' ? 'Lösung ansehen →' : 'Voir solution →'}
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Feature Grid - Organized by Categories */}
      <div id="tools" className="max-w-6xl mx-auto px-4 pb-20">
         
         {/* CATEGORÍA: B2B Y EDUCACIÓN JUNTAS cuando es "all" - Priorizando B2B */}
         {activeCategory === 'all' ? (
            <div className="mb-8">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* B2B primero */}
                  <FeatureCard
                     title={t.excelTemplateTitle}
                     description={t.excelTemplateDesc}
                     shortDescription="Rellena plantillas Excel desde PDFs automáticamente."
                     onClick={() => navigate('/plantillas-excel')}
                     icon={FileSpreadsheet}
                     color="bg-emerald-900"
                     badge="B2B"
                     badgeColor="bg-emerald-500"
                     tags="Extraer datos • Rellenar plantillas • Múltiples facturas"
                     borderColor="border-t-emerald-500"
                     hoverShadow="8px_8px_0px_0px_rgba(16,185,129,0.5)"
                     lang={lang}
                  />
                  <FeatureCard
                     title={t.templateEditorTitle}
                     description={t.templateEditorDesc}
                     shortDescription="Editor de plantillas Excel - Inserta runas (variables) sin Excel instalado."
                     onClick={() => navigate('/editor-plantillas')}
                     icon={Sparkles}
                     color="bg-purple-900"
                     badge="NEW"
                     badgeColor="bg-purple-500"
                     tags="Editor plantillas • Insertar variables • Sin Excel"
                     borderColor="border-t-purple-500"
                     hoverShadow="8px_8px_0px_0px_rgba(168,85,247,0.5)"
                     lang={lang}
                  />
                  <FeatureCard
                     title={t.aiTitle}
                     description={t.aiDesc}
                     shortDescription="Renombra PDFs automáticamente por contenido con IA."
                     onClick={() => navigate('/organizar-pdf')}
                     icon={Sparkles}
                     color="bg-indigo-900"
                     tags="Renombrar masivo • Organizar facturas • Procesamiento local"
                     borderColor="border-t-indigo-500"
                     hoverShadow="8px_8px_0px_0px_rgba(99,102,241,0.5)"
                     lang={lang}
                  />
                  {/* Educación después */}
                  <FeatureCard
                     title={t.studyTitle}
                     description={t.studyDesc}
                     shortDescription="Crea test tipo examen y flashcards automáticamente desde PDFs."
                     onClick={() => navigate('/generar-test')}
                     icon={BrainCircuit}
                     color="bg-yellow-900"
                     badge="NEW"
                     badgeColor="bg-yellow-500"
                     tags="Crear test • Generar flashcards • Gamificación"
                     borderColor="border-t-yellow-500"
                     hoverShadow="8px_8px_0px_0px_rgba(234,179,8,0.5)"
                     lang={lang}
                  />
                  <FeatureCard
                     title={t.oracleTitle}
                     description={t.oracleDesc}
                     shortDescription="Genera mapas mentales interactivos desde PDFs."
                     onClick={() => navigate('/mapa-mental')}
                     icon={BrainCircuit}
                     color="bg-violet-900"
                     badge="NEW"
                     badgeColor="bg-violet-500"
                     tags="Mapas mentales • Visualizar conocimiento • Grafos"
                     borderColor="border-t-violet-500"
                     hoverShadow="8px_8px_0px_0px_rgba(139,92,246,0.5)"
                     lang={lang}
                  />
                  <FeatureCard
                     title={t.chatTitle}
                     description={t.chatDesc}
                     shortDescription="Haz preguntas sobre el contenido del PDF y obtén respuestas precisas."
                     onClick={() => navigate('/chat-pdf')}
                     icon={FileText}
                     color="bg-purple-900"
                     badge="NEW"
                     badgeColor="bg-purple-500"
                     tags="Preguntas • Interrogación • IA conversacional"
                     borderColor="border-t-purple-500"
                     hoverShadow="8px_8px_0px_0px_rgba(168,85,247,0.5)"
                     lang={lang}
                  />
               </div>
            </div>
         ) : (
            <>
               {/* CATEGORÍA: CONTABLES / B2B - Solo cuando se selecciona B2B */}
               {activeCategory === 'b2b' && (
                  <div className="mb-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FeatureCard
                           title={t.excelTemplateTitle}
                           description={t.excelTemplateDesc}
                           shortDescription="Rellena plantillas Excel desde PDFs automáticamente."
                           onClick={() => navigate('/plantillas-excel')}
                           icon={FileSpreadsheet}
                           color="bg-emerald-900"
                           badge="B2B"
                           badgeColor="bg-emerald-500"
                           tags="Extraer datos • Rellenar plantillas • Múltiples facturas"
                           borderColor="border-t-emerald-500"
                           hoverShadow="8px_8px_0px_0px_rgba(16,185,129,0.5)"
                           lang={lang}
                        />
                        <FeatureCard
                           title={t.templateEditorTitle}
                           description={t.templateEditorDesc}
                           shortDescription="Editor de plantillas Excel - Inserta runas (variables) sin Excel instalado."
                           onClick={() => navigate('/editor-plantillas')}
                           icon={Sparkles}
                           color="bg-purple-900"
                           badge="NEW"
                           badgeColor="bg-purple-500"
                           tags="Editor plantillas • Insertar variables • Sin Excel"
                           borderColor="border-t-purple-500"
                           hoverShadow="8px_8px_0px_0px_rgba(168,85,247,0.5)"
                           lang={lang}
                        />
                        <FeatureCard
                           title={t.aiTitle}
                           description={t.aiDesc}
                           shortDescription="Renombra PDFs automáticamente por contenido con IA."
                           onClick={() => navigate('/organizar-pdf')}
                           icon={Sparkles}
                           color="bg-indigo-900"
                           tags="Renombrar masivo • Organizar facturas • Procesamiento local"
                           borderColor="border-t-indigo-500"
                           hoverShadow="8px_8px_0px_0px_rgba(99,102,241,0.5)"
                           lang={lang}
                        />
                     </div>
                  </div>
               )}

               {/* CATEGORÍA: EDUCACIÓN - Solo cuando se selecciona Educación */}
               {activeCategory === 'education' && (
                  <div className="mb-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FeatureCard
                           title={t.studyTitle}
                           description={t.studyDesc}
                           shortDescription="Crea test tipo examen y flashcards automáticamente desde PDFs."
                           onClick={() => navigate('/generar-test')}
                           icon={BrainCircuit}
                           color="bg-yellow-900"
                           badge="NEW"
                           badgeColor="bg-yellow-500"
                           tags="Crear test • Generar flashcards • Gamificación"
                           borderColor="border-t-yellow-500"
                           hoverShadow="8px_8px_0px_0px_rgba(234,179,8,0.5)"
                           lang={lang}
                        />
                        <FeatureCard
                           title={t.oracleTitle}
                           description={t.oracleDesc}
                           shortDescription="Genera mapas mentales interactivos desde PDFs."
                           onClick={() => navigate('/mapa-mental')}
                           icon={BrainCircuit}
                           color="bg-violet-900"
                           badge="NEW"
                           badgeColor="bg-violet-500"
                           tags="Mapas mentales • Visualizar conocimiento • Grafos"
                           borderColor="border-t-violet-500"
                           hoverShadow="8px_8px_0px_0px_rgba(139,92,246,0.5)"
                           lang={lang}
                        />
                        <FeatureCard
                           title={t.chatTitle}
                           description={t.chatDesc}
                           shortDescription="Haz preguntas sobre el contenido del PDF y obtén respuestas precisas."
                           onClick={() => navigate('/chat-pdf')}
                           icon={FileText}
                           color="bg-purple-900"
                           badge="NEW"
                           badgeColor="bg-purple-500"
                           tags="Preguntas • Interrogación • IA conversacional"
                           borderColor="border-t-purple-500"
                           hoverShadow="8px_8px_0px_0px_rgba(168,85,247,0.5)"
                           lang={lang}
                        />
                     </div>
                  </div>
               )}
            </>
         )}

         {/* CATEGORÍA: HERRAMIENTAS BÁSICAS */}
         {(activeCategory === 'all' || activeCategory === 'tools') && (
            <div className="mb-8">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FeatureCard
                     title={t.mergeTitle}
                     description={t.mergeDesc}
                     onClick={() => setCurrentView('MERGE')}
                     icon={Layers}
                     color="bg-emerald-900"
                     borderColor="border-t-emerald-500"
                     hoverShadow="8px_8px_0px_0px_rgba(16,185,129,0.5)"
                     lang={lang}
                  />
                  <FeatureCard
                     title={t.splitTitle}
                     description={t.splitDesc}
                     onClick={() => setCurrentView('SPLIT')}
                     icon={Scissors}
                     color="bg-rose-900"
                     borderColor="border-t-rose-500"
                     hoverShadow="8px_8px_0px_0px_rgba(239,68,68,0.5)"
                     lang={lang}
                  />
                  <FeatureCard
                     title={t.convertTitle}
                     description={t.convertDesc}
                     onClick={() => setCurrentView('CONVERT')}
                     icon={Repeat}
                     color="bg-pink-900"
                     borderColor="border-t-pink-500"
                     hoverShadow="8px_8px_0px_0px_rgba(236,72,153,0.5)"
                     lang={lang}
                  />
                  <FeatureCard
                     title={t.imgTitle}
                     description={t.imgDesc}
                     onClick={() => setCurrentView('IMG_TO_PDF')}
                     icon={ImageIcon}
                     color="bg-amber-900"
                     borderColor="border-t-amber-500"
                     hoverShadow="8px_8px_0px_0px_rgba(245,158,11,0.5)"
                     lang={lang}
                  />
                  <FeatureCard
                     title={t.editTitle}
                     description={t.editDesc}
                     onClick={() => setCurrentView('EDIT')}
                     icon={PenTool}
                     color="bg-purple-900"
                     borderColor="border-t-purple-500"
                     hoverShadow="8px_8px_0px_0px_rgba(168,85,247,0.5)"
                     lang={lang}
                  />
               </div>
            </div>
         )}
         </div>

      {/* Google AdSense Placeholder - Reemplazar con código de AdSense después de aprobación */}
      <div className="w-full max-w-4xl bg-gray-900 border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 mb-8 mx-auto font-mono text-sm tracking-widest min-h-[100px]">
         <div className="text-center p-4">
            <p className="mb-2">[{t.ads}]</p>
            <p className="text-xs text-gray-500">Anunciate aqui</p>
         </div>
         {/* 
         INSTRUCCIONES PARA ADDSENSE:
         1. Una vez aprobado por AdSense, reemplaza este div con:
         <div className="w-full max-w-4xl mb-8 mx-auto">
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-TU_ID_AQUI" crossOrigin="anonymous"></script>
            <ins className="adsbygoogle"
                 style={{display:"block"}}
                 data-ad-client="ca-pub-TU_ID_AQUI"
                 data-ad-slot="TU_SLOT_AQUI"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>
              (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
         </div>
         */}
      </div>
      
      {/* SEO Content - Hidden but readable by search engines */}
      <div className="hidden">
        <h2>Organizar Facturas PDF sin Subir a Internet</h2>
        <p>Herramienta de procesamiento PDF 100% local. Tus archivos nunca salen de tu PC. Procesamiento completamente en tu navegador sin necesidad de conexión a servidores externos. Alternativa segura a otros editores de PDF con privacidad RGPD garantizada.</p>
        
        <h2>Renombrar 100 PDFs Automáticamente por Contenido</h2>
        <p>Usa IA para renombrar masivamente archivos PDF. Extrae automáticamente fecha, entidad y categoría del contenido. Organiza carpetas desordenadas de escaneos. Perfecto para contables, administrativos y secretarios que manejan documentos confidenciales.</p>
        
        <h2>Extraer Datos de Facturas a Excel Gratis</h2>
        <p>Pasa datos de PDF a plantilla Excel automáticamente. Rellena formularios gubernamentales y reportes corporativos. Procesa múltiples facturas a la vez. Extrae fecha, total, impuesto, empresa y más sin subir archivos.</p>
        
        <h2>Crear Test Tipo Examen de un PDF Automáticamente</h2>
        <p>Genera preguntas de opción múltiple desde tus apuntes PDF. Crea flashcards de estudio con IA. Resumir temario de oposición a preguntas y respuestas. Estudiar PDF con gamificación. Perfecto para estudiantes universitarios y opositores.</p>
        
        <h2>IA para PDF Privada y Segura</h2>
        <p>Procesamiento de documentos con inteligencia artificial sin comprometer tu privacidad. Todos los archivos se procesan localmente en tu navegador. No se almacenan en servidores externos. Cumplimiento total con RGPD y normativas de privacidad.</p>
      </div>
    </div>
  );

  const renderAiOrganizer = () => {
    const hasFiles = files.length > 0;
    const isAllDone = hasFiles && !isProcessing && progress.current === progress.total && progress.total > 0;
    
    return (
      <div className="max-w-4xl w-full mx-auto p-4 md:p-8">
        <div className="mb-6 flex items-center gap-2 text-indigo-400 cursor-pointer hover:underline" onClick={() => navigate('/')}>
            <ArrowRight className="transform rotate-180" /> {t.back}
        </div>
        
        <PixelCard title={t.aiTitle} color="blue" className="text-center mb-8">
          
          {/* Context Selector */}
          <div className="mb-6 bg-gray-900 p-3 border border-indigo-900/50 flex flex-col md:flex-row items-center justify-center gap-4">
             <span className="text-indigo-300 font-bold uppercase tracking-wider text-sm">{t.contextLabel}</span>
             <div className="flex gap-2 flex-wrap justify-center">
                 <button onClick={() => setDocContext('GENERAL')} className={`px-3 py-1 text-sm border border-gray-600 ${docContext === 'GENERAL' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>{t.ctxGeneral}</button>
                 <button onClick={() => setDocContext('FINANCE')} className={`flex items-center gap-1 px-3 py-1 text-sm border border-gray-600 ${docContext === 'FINANCE' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}><Briefcase className="w-3 h-3"/> {t.ctxFinance}</button>
                 <button onClick={() => setDocContext('LEGAL')} className={`flex items-center gap-1 px-3 py-1 text-sm border border-gray-600 ${docContext === 'LEGAL' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}><Scale className="w-3 h-3"/> {t.ctxLegal}</button>
                 <button onClick={() => setDocContext('EDUCATION')} className={`flex items-center gap-1 px-3 py-1 text-sm border border-gray-600 ${docContext === 'EDUCATION' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}><GraduationCap className="w-3 h-3"/> {t.ctxEdu}</button>
             </div>
          </div>

          <input type="file" multiple accept=".pdf" onChange={handleAiFileChange} className="hidden" ref={fileInputRef} />
          {!hasFiles ? (
             <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-indigo-900 bg-indigo-900/20 p-12 cursor-pointer hover:bg-indigo-900/30 flex flex-col items-center gap-4 transition-colors">
                 <Upload className="w-16 h-16 text-indigo-500" />
                 <div className="text-2xl font-bold text-indigo-200">{t.dragDrop}</div>
              </div>
          ) : (
            <div className="space-y-6">
                <div className="flex flex-wrap gap-4 justify-center">
                    <button onClick={handleAiStart} disabled={isProcessing || isAllDone} className={`border-4 border-black px-6 py-3 font-bold text-xl retro-shadow flex items-center gap-2 ${isProcessing || isAllDone ? 'bg-gray-700 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
                        <Wand2 /> {isProcessing ? t.processing : isAllDone ? t.completed : t.processBtn}
                    </button>
                    {files.some(f => f.status === 'COMPLETED') && (
                        <button onClick={handleDownload} className="bg-emerald-600 text-white border-4 border-black px-6 py-3 font-bold text-xl retro-shadow hover:bg-emerald-500 flex items-center gap-2">
                            <Download /> {t.downloadBtn}
                        </button>
                    )}
                    <button onClick={clearQueue} className="bg-rose-600 text-white border-4 border-black px-4 py-3 retro-shadow hover:bg-rose-500"><Trash2 /></button>
                </div>
                {(isProcessing || progress.total > 0) && <ProgressBar current={progress.current} total={progress.total} label={isProcessing ? t.processing : t.completed} />}
                
                {/* INTERACTIVE TABLE */}
                <div className="bg-gray-900 border-4 border-gray-700 p-2 text-left">
                    <FileQueue files={files} onRename={updateFileMetadata} t={t} />
                </div>
            </div>
          )}
        </PixelCard>
      </div>
    );
  };

  const renderSimpleTool = (title: string, desc: string, accept: string, actionLabel: string, onAction: () => void, color: 'green' | 'yellow' | 'red' | 'blue' | 'pink', extraControls?: React.ReactNode, maxFiles: number = 20) => {
    return (
    <div className="max-w-3xl w-full mx-auto p-4 md:p-8">
        <div className="mb-6 flex items-center gap-2 text-gray-500 cursor-pointer hover:underline" onClick={() => setCurrentView('HOME')}>
            <ArrowRight className="transform rotate-180" /> {t.back}
        </div>
        <div className="text-center mb-8">
            <h2 className={`text-4xl pixel-font-header text-gray-200 mb-2 neon-glow-text`}>{title}</h2>
            <p className="text-xl text-gray-400 font-bold">{desc}</p>
        </div>
        <PixelCard title="WORKBENCH" color={color} className="text-center">
            <input type="file" multiple={maxFiles > 1} accept={accept} onChange={handleToolFileChange} className="hidden" ref={toolInputRef} />
            {toolFiles.length === 0 ? (
                 <div onClick={() => toolInputRef.current?.click()} className={`border-4 border-dashed border-gray-700 bg-gray-900/50 p-12 cursor-pointer hover:bg-gray-800 flex flex-col items-center gap-4`}>
                     <Upload className={`w-16 h-16 text-gray-500`} />
                     <div className="text-2xl font-bold text-gray-300">{maxFiles === 1 ? 'SELECT 1 FILE' : t.dragDrop}</div>
                  </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-gray-900 border-2 border-black p-4 max-h-60 overflow-y-auto custom-scrollbar text-left">
                        {toolFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 border-b border-gray-800 py-2 last:border-0 text-gray-300">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="truncate">{f.name}</span>
                                <span className="text-xs text-gray-500 ml-auto">{(f.size / 1024).toFixed(0)} KB</span>
                            </div>
                        ))}
                    </div>
                    {extraControls}
                    <div className="flex gap-4 justify-center">
                         <button onClick={onAction} disabled={isToolProcessing} className={`bg-gray-900 text-white border-4 border-gray-600 px-6 py-3 font-bold text-xl retro-shadow flex items-center gap-2 hover:bg-gray-800 hover:border-gray-500 ${isToolProcessing ? 'opacity-50' : ''}`}>
                            {isToolProcessing ? <Sparkles className="animate-spin" /> : <Download />}
                            {isToolProcessing ? '...' : actionLabel}
                        </button>
                        <button onClick={() => setToolFiles([])} disabled={isToolProcessing} className="bg-rose-600 text-white border-4 border-black px-4 py-3 font-bold retro-shadow hover:bg-rose-500"><Trash2 /></button>
                    </div>
                </div>
            )}
        </PixelCard>
    </div>
  )};

  return (
    <div className="min-h-screen flex flex-col font-vt323 bg-[#111827] text-gray-200">
      <Navbar lang={lang} setLang={setLang} t={t} />
      
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={renderHome()} />
          <Route path="/organizar-pdf" element={renderAiOrganizer()} />
          
          <Route path="/unir-pdf" element={
            <ToolPage
              title={t.mergeTitle}
              desc={t.mergeDesc}
              accept=".pdf"
              actionLabel={t.mergeTitle}
              onAction={executeMerge}
              color="green"
              toolFiles={toolFiles}
              setToolFiles={setToolFiles}
              isToolProcessing={isToolProcessing}
              handleToolFileChange={handleToolFileChange}
              toolInputRef={toolInputRef}
              toolKey="merge"
              lang={lang}
            />
          } />
          
          <Route path="/imagenes-a-pdf" element={
            <ToolPage
              title={t.imgTitle}
              desc={t.imgDesc}
              accept="image/*"
              actionLabel={t.convertTitle}
              onAction={executeImgToPdf}
              color="yellow"
              extraControls={
                <label className="flex items-center justify-center gap-2 bg-amber-900/30 p-2 border border-amber-800 text-amber-200">
                  <input type="checkbox" checked={fitToA4} onChange={(e) => setFitToA4(e.target.checked)} className="w-5 h-5 accent-amber-500" />
                  <span className="font-bold">A4 Fit</span>
                </label>
              }
              toolFiles={toolFiles}
              setToolFiles={setToolFiles}
              isToolProcessing={isToolProcessing}
              handleToolFileChange={handleToolFileChange}
              toolInputRef={toolInputRef}
              toolKey="imagesToPdf"
              lang={lang}
            />
          } />

          <Route path="/dividir-pdf" element={
            <ToolPage
              title={t.splitTitle}
              desc={t.splitDesc}
              accept=".pdf"
              actionLabel={splitRange ? "EXTRACT" : "ZIP SPLIT"}
              onAction={executeSplit}
              color="red"
              extraControls={
                <div className="bg-rose-900/30 p-4 border border-rose-800 text-left">
                  <label className="text-rose-300 font-bold block mb-1">Pages (Opt):</label>
                  <input type="text" value={splitRange} onChange={(e) => setSplitRange(e.target.value)} placeholder="1-5, 8" className="border-2 border-black bg-gray-900 text-white p-2 w-full font-bold focus:border-rose-500 outline-none" />
                </div>
              }
              maxFiles={1}
              toolFiles={toolFiles}
              setToolFiles={setToolFiles}
              isToolProcessing={isToolProcessing}
              handleToolFileChange={handleToolFileChange}
              toolInputRef={toolInputRef}
              toolKey="split"
              lang={lang}
            />
          } />

          <Route path="/editar-pdf" element={
            <ToolPage
              title={t.editTitle}
              desc={t.editDesc}
              accept=".pdf"
              actionLabel={t.editTitle}
              onAction={executeEdit}
              color="blue"
              extraControls={
                <div className="bg-purple-900/30 p-4 border border-purple-800 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-purple-300 font-bold">Text Watermark:</label>
                      <div className="flex gap-2">
                        <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="Confidential..." className="border-2 border-black bg-gray-900 text-white p-2 flex-1 font-bold focus:border-purple-500 outline-none" />
                        <div className="flex gap-1">
                          {['red', 'blue', 'green', 'white'].map(c => <div key={c} onClick={() => setTextColor(c)} className={`w-8 h-8 cursor-pointer border-2 border-black ${textColor === c ? 'ring-2 ring-gray-400' : ''}`} style={{ backgroundColor: c }} />)}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-purple-300 font-bold">Image Overlay (Logo):</label>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg" 
                        onChange={(e) => setOverlayImage(e.target.files?.[0] || null)} 
                        ref={imgInputRef}
                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-bold file:bg-purple-700 file:text-white hover:file:bg-purple-600"
                      />
                      {overlayImage && (
                        <div className="flex items-center gap-2">
                          <input type="range" min="10" max="100" value={imgScale} onChange={(e) => setImgScale(Number(e.target.value))} className="flex-1" />
                          <span className="text-xs">{imgScale}%</span>
                          <select value={imgPos} onChange={(e) => setImgPos(e.target.value as any)} className="bg-gray-900 border border-gray-700 text-xs p-1">
                            <option value="center">Center</option>
                            <option value="tl">Top-Left</option>
                            <option value="tr">Top-Right</option>
                            <option value="bl">Bot-Left</option>
                            <option value="br">Bot-Right</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 items-center pt-2 border-t border-purple-800">
                    <select value={watermarkPos} onChange={(e) => setWatermarkPos(e.target.value as any)} className="border-2 border-black bg-gray-900 text-white p-1 font-bold">
                      <option value="diagonal">Diagonal</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                    <label className="flex items-center gap-2 font-bold text-purple-300"><input type="checkbox" checked={addPageNums} onChange={(e) => setAddPageNums(e.target.checked)} className="w-5 h-5 accent-purple-500" /> Page Nums</label>
                  </div>
                </div>
              }
              maxFiles={1}
              toolFiles={toolFiles}
              setToolFiles={setToolFiles}
              isToolProcessing={isToolProcessing}
              handleToolFileChange={handleToolFileChange}
              toolInputRef={toolInputRef}
              toolKey="edit"
              lang={lang}
            />
          } />

          <Route path="/convertir-pdf" element={
            <ToolPage
              title={t.convertTitle}
              desc={t.convertDesc}
              accept=".pdf"
              actionLabel={t.convertTitle}
              onAction={executeConvert}
              color="pink"
              extraControls={
                <div className="flex flex-col gap-4 bg-pink-900/30 p-4 border border-pink-800">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <button onClick={() => setConvertFormat('DOCX')} className={`flex flex-col items-center p-2 border-2 border-black font-bold transition-all ${convertFormat === 'DOCX' ? 'bg-blue-600 text-white transform -translate-y-1 retro-shadow' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                      <FileText className="mb-1" /> WORD
                    </button>
                    <button onClick={() => setConvertFormat('XLSX')} className={`flex flex-col items-center p-2 border-2 border-black font-bold transition-all ${convertFormat === 'XLSX' ? 'bg-emerald-600 text-white transform -translate-y-1 retro-shadow' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                      <FileSpreadsheet className="mb-1" /> EXCEL
                    </button>
                    <button onClick={() => setConvertFormat('PPTX')} className={`flex flex-col items-center p-2 border-2 border-black font-bold transition-all ${convertFormat === 'PPTX' ? 'bg-orange-600 text-white transform -translate-y-1 retro-shadow' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                      <Presentation className="mb-1" /> PPTX
                    </button>
                    <button onClick={() => setConvertFormat('JPG')} className={`flex flex-col items-center p-2 border-2 border-black font-bold transition-all ${convertFormat === 'JPG' ? 'bg-pink-600 text-white transform -translate-y-1 retro-shadow' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                      <ImageIcon className="mb-1" /> JPG
                    </button>
                    <button onClick={() => setConvertFormat('TXT')} className={`flex flex-col items-center p-2 border-2 border-black font-bold transition-all ${convertFormat === 'TXT' ? 'bg-gray-600 text-white transform -translate-y-1 retro-shadow' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                      <FileText className="mb-1" /> TXT
                    </button>
                  </div>
                </div>
              }
              maxFiles={1}
              toolFiles={toolFiles}
              setToolFiles={setToolFiles}
              isToolProcessing={isToolProcessing}
              handleToolFileChange={handleToolFileChange}
              toolInputRef={toolInputRef}
              toolKey="convert"
              lang={lang}
            />
          } />

          {/* Rutas para otras vistas */}
          <Route path="/plantillas-excel" element={(() => {
            const accessStatus = getFeatureAccessStatus('excel_template');
            return (
            <div className="max-w-3xl w-full mx-auto p-4 md:p-8">
                <div className="mb-6 flex items-center gap-2 text-gray-500 cursor-pointer hover:underline" onClick={() => navigate('/')}>
                    <ArrowRight className="transform rotate-180" /> {t.back}
                </div>
                <div className="text-center mb-8">
                    <h2 className="text-4xl pixel-font-header text-gray-200 mb-2 neon-glow-text">{t.excelTemplateTitle}</h2>
                    <p className="text-xl text-gray-400 font-bold">{t.excelTemplateDesc}</p>
                </div>

                {/* Indicador de acceso premium/trial */}
                <div className="mb-4 p-4 bg-gray-800 border-4 border-emerald-600 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            {accessStatus.isPremium ? (
                                <span className="text-yellow-400 font-bold text-lg">
                                    ⭐ PREMIUM ACTIVO
                                </span>
                            ) : accessStatus.freeTrialUses > 0 ? (
                                <span className="text-blue-400 font-bold text-lg">
                                    🎁 PRUEBA GRATIS: {accessStatus.freeTrialUses} de {accessStatus.maxFreeTrialUses} usos restantes
                                </span>
                            ) : (
                                <span className="text-red-400 font-bold text-lg">
                                    🔒 Usos gratuitos agotados
                                </span>
                            )}
                        </div>
                        {!accessStatus.isPremium && (
                            <button
                                onClick={() => navigate('/precios')}
                                className="px-4 py-2 bg-yellow-600 text-black font-bold border-2 border-yellow-500 hover:bg-yellow-500 transition-colors"
                            >
                                {t.pricingActivateLicense || 'ACTIVAR PREMIUM'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Si está bloqueado, mostrar mensaje de bloqueo */}
                {accessStatus.isLocked && (
                    <div className="bg-red-900/50 border-4 border-red-600 rounded-lg p-8 text-center mb-6">
                        <Lock className="w-16 h-16 mx-auto mb-4 text-red-400" />
                        <p className="text-red-200 font-bold text-xl md:text-2xl mb-2">
                            {lang === 'ES' ? 'Funcionalidad Bloqueada' : 'Feature Locked'}
                        </p>
                        <p className="text-red-300 text-base md:text-lg mb-6">
                            {lang === 'ES' 
                                ? 'Has agotado tus 3 usos gratuitos de Plantillas Excel. ¡Actualiza a Premium para desbloquear esta funcionalidad!' 
                                : 'You have exhausted your 3 free uses of Excel Templates. Upgrade to Premium to unlock this feature!'}
                        </p>
                        <button
                            onClick={() => setCurrentView('PRICING')}
                            className="px-8 py-4 bg-yellow-600 text-black font-bold border-2 border-yellow-500 hover:bg-yellow-500 transition-colors text-lg"
                        >
                            {t.pricingActivateLicense || 'ACTIVAR PREMIUM'}
                        </button>
                    </div>
                )}

                <PixelCard title="PLANTILLA EXCEL INTELIGENTE" color="emerald" className="text-center">
                    <div className="space-y-6">
                        {/* PDF Input - Multiple */}
                        <div>
                            <label className="block text-left text-emerald-300 font-bold mb-2">
                                1. Sube tus PDFs (Facturas/Documentos) - Múltiples archivos:
                            </label>
                            <input 
                                type="file" 
                                accept=".pdf" 
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setPdfsForTemplate(Array.from(e.target.files));
                                    }
                                }} 
                                ref={pdfTemplateInputRef}
                                className="hidden"
                            />
                            <div 
                                onClick={() => pdfTemplateInputRef.current?.click()} 
                                className="border-4 border-dashed border-emerald-700 bg-emerald-900/20 p-8 cursor-pointer hover:bg-emerald-900/30 flex flex-col items-center gap-2"
                            >
                                <FileText className="w-12 h-12 text-emerald-400" />
                                <div className="text-lg font-bold text-emerald-300">
                                    {pdfsForTemplate.length > 0 
                                        ? `${pdfsForTemplate.length} PDF(s) seleccionado(s)` 
                                        : 'SELECCIONAR PDFs (MÚLTIPLES)'}
                                </div>
                                {(() => {
                                    const premiumStatus = getPremiumStatus();
                                    if (premiumStatus.isPremium && premiumStatus.maxExcelDocuments) {
                                        return (
                                            <div className="text-sm text-emerald-400 mt-2">
                                                {lang === 'ES' 
                                                    ? `Límite: ${premiumStatus.maxExcelDocuments} documentos` 
                                                    : `Limit: ${premiumStatus.maxExcelDocuments} documents`}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                {pdfsForTemplate.length > 0 && (
                                    <div className="mt-2 text-sm text-emerald-400 max-h-32 overflow-y-auto w-full text-left px-4">
                                        {pdfsForTemplate.map((file, idx) => (
                                            <div key={idx} className="truncate">• {file.name}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Excel Template Input */}
                        <div>
                            <label className="block text-left text-emerald-300 font-bold mb-2">2. Sube tu Plantilla Excel con Marcadores:</label>
                            <input 
                                type="file" 
                                accept=".xlsx,.xls" 
                                onChange={handleExcelTemplateChange} 
                                ref={excelTemplateInputRef}
                                className="hidden"
                            />
                            <div 
                                onClick={() => excelTemplateInputRef.current?.click()} 
                                className="border-4 border-dashed border-emerald-700 bg-emerald-900/20 p-8 cursor-pointer hover:bg-emerald-900/30 flex flex-col items-center gap-2"
                            >
                                <FileSpreadsheet className="w-12 h-12 text-emerald-400" />
                                <div className="text-lg font-bold text-emerald-300">
                                    {excelTemplate ? excelTemplate.name : 'SELECCIONAR PLANTILLA EXCEL'}
                                </div>
                                {isScanningKeys && (
                                    <div className="text-sm text-emerald-400 flex items-center gap-2 mt-2">
                                        <Sparkles className="w-4 h-4 animate-spin" />
                                        {lang === 'ES' ? 'Escaneando Runas...' : 'Scanning Runes...'}
                                    </div>
                                )}
                            </div>
                            
                            {/* Mostrar Runas Detectadas */}
                            {detectedKeys.length > 0 && (
                                <div className="mt-4 bg-indigo-900/40 border-4 border-indigo-600 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-6 h-6 text-indigo-400" />
                                        <h3 className="text-lg font-bold text-indigo-300 pixel-font-header">
                                            {lang === 'ES' ? '🔮 RUNAS DETECTADAS' : '🔮 DETECTED RUNES'}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-indigo-200 mb-3">
                                        {lang === 'ES' 
                                            ? 'La IA buscará específicamente estos campos en tus PDFs:' 
                                            : 'The AI will specifically search for these fields in your PDFs:'}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {detectedKeys.map((key, idx) => (
                                            <div 
                                                key={idx}
                                                className="bg-indigo-800 border-2 border-indigo-500 px-3 py-1.5 rounded font-mono text-sm font-bold text-indigo-200"
                                            >
                                                {`{{${key}}}`}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-indigo-400 mt-3 italic">
                                        {lang === 'ES' 
                                            ? '✨ Modo Extracción Dirigida activado - La IA será más precisa' 
                                            : '✨ Targeted Extraction Mode activated - AI will be more precise'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Tutorial Section - Compact */}
                        <div className="bg-emerald-900/30 border-2 border-emerald-800 p-4 text-left space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="text-emerald-200 font-bold text-lg">📚 {t.excelTemplateTutorial}</div>
                                <button
                                    onClick={() => setShowFullTutorial(!showFullTutorial)}
                                    className="text-emerald-400 hover:text-emerald-300 text-sm font-bold underline"
                                >
                                    {showFullTutorial ? (lang === 'ES' ? 'Ver menos' : 'Show less') : (lang === 'ES' ? 'Ver más' : 'Show more')}
                                </button>
                            </div>
                            <div className="text-sm text-emerald-300">
                                {t.excelTemplateTutorialDesc}
                            </div>
                            
                            {/* Example 1 - Always Visible */}
                            <div>
                                <div className="text-emerald-200 font-bold mb-2 text-xs">Ejemplo 1: Plantilla con 1 fila (para 1 factura)</div>
                                <div className="bg-gray-900 border border-emerald-700 p-3 rounded">
                                    <table className="w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-emerald-900/50">
                                                <th className="border border-emerald-700 p-2 text-left">FECHA</th>
                                                <th className="border border-emerald-700 p-2 text-left">EMPRESA</th>
                                                <th className="border border-emerald-700 p-2 text-left">TOTAL</th>
                                                <th className="border border-emerald-700 p-2 text-left">IMPUESTO</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="border border-emerald-700 p-2 bg-emerald-800/30"><code>{"{{FECHA}}"}</code></td>
                                                <td className="border border-emerald-700 p-2 bg-emerald-800/30"><code>{"{{EMPRESA}}"}</code></td>
                                                <td className="border border-emerald-700 p-2 bg-emerald-800/30"><code>{"{{TOTAL}}"}</code></td>
                                                <td className="border border-emerald-700 p-2 bg-emerald-800/30"><code>{"{{IMPUESTO}}"}</code></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            {/* Example 2 - Collapsible */}
                            {showFullTutorial && (
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-emerald-200 font-bold mb-2 text-xs">Ejemplo 2: Plantilla con 6 filas (para 6 facturas)</div>
                                        <div className="bg-gray-900 border border-emerald-700 p-3 rounded max-h-64 overflow-y-auto">
                                            <table className="w-full text-xs border-collapse">
                                                <thead className="sticky top-0 bg-emerald-900/50">
                                                    <tr>
                                                        <th className="border border-emerald-700 p-2 text-left">FECHA</th>
                                                        <th className="border border-emerald-700 p-2 text-left">EMPRESA</th>
                                                        <th className="border border-emerald-700 p-2 text-left">TOTAL</th>
                                                        <th className="border border-emerald-700 p-2 text-left">IMPUESTO</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[1, 2, 3, 4, 5, 6].map((row) => (
                                                        <tr key={row}>
                                                            <td className="border border-emerald-700 p-2 bg-emerald-800/30"><code>{"{{FECHA}}"}</code></td>
                                                            <td className="border border-emerald-700 p-2 bg-emerald-800/30"><code>{"{{EMPRESA}}"}</code></td>
                                                            <td className="border border-emerald-700 p-2 bg-emerald-800/30"><code>{"{{TOTAL}}"}</code></td>
                                                            <td className="border border-emerald-700 p-2 bg-emerald-800/30"><code>{"{{IMPUESTO}}"}</code></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="text-xs text-emerald-400 mt-2 italic">
                                            ⚠️ Importante: Si subes 6 PDFs, tu plantilla debe tener 6 filas con marcadores. Cada fila será reemplazada con los datos de una factura.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Info Box - Marcadores y Extracción Dirigida (Side by Side) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Marcadores Disponibles */}
                            <div className="bg-emerald-900/30 border-2 border-emerald-800 p-4 text-left">
                                <div className="text-emerald-200 font-bold mb-2">💡 Marcadores Disponibles:</div>
                                <div className="text-sm text-emerald-300 space-y-1">
                                    <div><code className="bg-black px-2 py-1">{"{{FECHA}}"}</code> - Fecha del documento</div>
                                    <div><code className="bg-black px-2 py-1">{"{{TOTAL}}"}</code> - Monto total</div>
                                    <div><code className="bg-black px-2 py-1">{"{{IMPUESTO}}"}</code> - IVA/Impuesto</div>
                                    <div><code className="bg-black px-2 py-1">{"{{EMPRESA}}"}</code> - Nombre de la empresa</div>
                                    <div><code className="bg-black px-2 py-1">{"{{CLIENTE}}"}</code> - Nombre del cliente</div>
                                    <div><code className="bg-black px-2 py-1">{"{{NUMERO}}"}</code> - Número de factura</div>
                                    <div><code className="bg-black px-2 py-1">{"{{CONCEPTO}}"}</code> - Descripción/Concepto</div>
                                </div>
                            </div>
                            
                            {/* Extracción Dirigida - Más Visible */}
                            <div className="bg-indigo-900/40 border-2 border-indigo-600 p-4 text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                    <div className="text-indigo-200 font-bold">
                                        {lang === 'ES' ? '✨ Extracción Dirigida' : '✨ Targeted Extraction'}
                                    </div>
                                </div>
                                <div className="text-sm text-indigo-300 mb-3">
                                    {lang === 'ES' ? (
                                        <>
                                            <p className="mb-2">El sistema detecta <strong>automáticamente</strong> todas tus variables personalizadas al subir la plantilla.</p>
                                            <p className="mb-2">La IA buscará <strong>específicamente</strong> esos campos para máxima precisión.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mb-2">The system <strong>automatically detects</strong> all your custom variables when you upload the template.</p>
                                            <p className="mb-2">The AI will <strong>specifically search</strong> for those fields for maximum precision.</p>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowTargetedTip(!showTargetedTip)}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 w-full text-left font-semibold"
                                >
                                    <span className="flex-1">
                                        {lang === 'ES' 
                                            ? '📖 Ver ejemplo de campos personalizados' 
                                            : '📖 See custom fields example'}
                                    </span>
                                    <span className="text-indigo-500">
                                        {showTargetedTip ? '▼' : '▶'}
                                    </span>
                                </button>
                                {showTargetedTip && (
                                    <div className="mt-3 text-xs text-indigo-300/90 bg-indigo-950/50 p-3 rounded border border-indigo-700">
                                        {lang === 'ES' ? (
                                            <>
                                                <p className="mb-2 font-semibold">Ejemplos de campos personalizados:</p>
                                                <div className="space-y-1 mb-2">
                                                    <div><code className="bg-black px-2 py-1">{"{{CODIGO_SWIFT}}"}</code> → busca "SWIFT Code", "Código SWIFT"</div>
                                                    <div><code className="bg-black px-2 py-1">{"{{NUMERO_LOTE}}"}</code> → busca "Número de Lote", "Lot Number"</div>
                                                    <div><code className="bg-black px-2 py-1">{"{{CLIENTE_VIP}}"}</code> → busca "Cliente VIP", "VIP Client"</div>
                                                </div>
                                                <p className="text-indigo-400/80 italic">Puedes usar <strong>cualquier nombre</strong> entre llaves dobles.</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="mb-2 font-semibold">Custom fields examples:</p>
                                                <div className="space-y-1 mb-2">
                                                    <div><code className="bg-black px-2 py-1">{"{{SWIFT_CODE}}"}</code> → searches "SWIFT Code", "Código SWIFT"</div>
                                                    <div><code className="bg-black px-2 py-1">{"{{LOT_NUMBER}}"}</code> → searches "Lot Number", "Número de Lote"</div>
                                                    <div><code className="bg-black px-2 py-1">{"{{VIP_CLIENT}}"}</code> → searches "VIP Client", "Cliente VIP"</div>
                                                </div>
                                                <p className="text-indigo-400/80 italic">You can use <strong>any name</strong> between double braces.</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {isTemplateProcessing && templateProgress.total > 0 && (
                            <div className="bg-emerald-900/30 border-2 border-emerald-800 p-4">
                                <div className="text-emerald-200 font-bold mb-2 text-center">
                                    Procesando {templateProgress.current} de {templateProgress.total} facturas...
                                </div>
                                <div className="w-full bg-gray-800 border-2 border-black h-6 relative">
                                    <div 
                                        className="bg-emerald-600 h-full transition-all duration-300"
                                        style={{ width: `${(templateProgress.current / templateProgress.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="flex gap-4 justify-center">
                            <button 
                                onClick={executeExcelTemplate} 
                                disabled={isTemplateProcessing || pdfsForTemplate.length === 0 || !excelTemplate || accessStatus.isLocked}
                                className="bg-emerald-600 text-white border-4 border-emerald-800 px-8 py-4 font-bold text-xl retro-shadow flex items-center gap-2 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isTemplateProcessing ? <Sparkles className="animate-spin" /> : <Wand2 />}
                                {isTemplateProcessing 
                                    ? (lang === 'ES' ? `PROCESANDO ${templateProgress.current}/${templateProgress.total}...` : `PROCESSING ${templateProgress.current}/${templateProgress.total}...`) 
                                    : (lang === 'ES' ? `RELLENAR PLANTILLA (${pdfsForTemplate.length} PDFs)` : `FILL TEMPLATE (${pdfsForTemplate.length} PDFs)`)}
                            </button>
                            <button 
                                onClick={() => { 
                                  setPdfsForTemplate([]); 
                                  setExcelTemplate(null); 
                                  setDetectedKeys([]);
                                }} 
                                disabled={isTemplateProcessing}
                                className="bg-rose-600 text-white border-4 border-black px-4 py-3 font-bold retro-shadow hover:bg-rose-500 disabled:opacity-50"
                            >
                                <Trash2 />
                            </button>
                        </div>
                    </div>
                </PixelCard>
            </div>
            );
         })()} />

          <Route path="/generar-test" element={(
             studyMaterial ? (
                 <div className="max-w-4xl mx-auto p-8">
                     <StudySession 
                        material={studyMaterial} 
                        t={t} 
                        onExit={() => { setStudyMaterial(null); setToolFiles([]); }}
                     />
                 </div>
             ) : (
                renderSimpleTool(t.studyTitle, t.studyDesc, ".pdf", "GENERATE", () => {}, 'yellow', (
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => executeStudy('QUIZ')} 
                            disabled={isToolProcessing}
                            className="bg-yellow-600 text-black border-4 border-black px-6 py-4 retro-shadow font-bold hover:bg-yellow-500 w-full md:w-auto"
                        >
                            {isToolProcessing ? t.processing : t.genQuiz}
                        </button>
                        <button 
                            onClick={() => executeStudy('FLASHCARDS')} 
                            disabled={isToolProcessing}
                            className="bg-indigo-600 text-white border-4 border-black px-6 py-4 retro-shadow font-bold hover:bg-indigo-500 w-full md:w-auto"
                        >
                            {isToolProcessing ? t.processing : t.genCards}
                        </button>
                    </div>
                ), 1)
             )
          )} />

          <Route path="/mapa-mental" element={(
             mindMapData ? (
                 <OracleView 
                    mindMapData={mindMapData} 
                    onClose={() => { setMindMapData(null); setToolFiles([]); }}
                    lang={lang}
                 />
             ) : (
                renderSimpleTool(t.oracleTitle, t.oracleDesc, ".pdf", lang === 'ES' ? "GENERAR MAPA MENTAL" : "GENERATE MIND MAP", executeOracle, 'blue', undefined, 1)
             )
          )} />

          <Route path="/chat-pdf" element={(
             chatPdfText ? (
                 <ChatSession 
                    pdfText={chatPdfText}
                    pdfFileName={chatPdfFileName}
                    onClose={() => { setChatPdfText(''); setChatPdfFileName(''); setToolFiles([]); navigate('/'); }}
                    lang={lang}
                    isPremium={isPremium}
                 />
             ) : (
                renderSimpleTool(t.chatTitle, t.chatDesc, ".pdf", lang === 'ES' ? "INVOCAR ESPÍRITU" : "INVOKE SPIRIT", executeChat, 'pink', undefined, 1)
             )
          )} />

          <Route path="/precios" element={
             <PricingPage
                lang={lang}
                isPremium={isPremium}
                onPremiumActivated={() => {
                    setIsPremium(true);
                    navigate('/');
                }}
                onGoToHome={() => navigate('/')}
             />
          } />

          <Route path="/editor-plantillas" element={
             <TemplateEditor
                lang={lang}
                onGoToHome={() => navigate('/')}
             />
          } />

          {/* Landing Pages SEO */}
          <Route path="/facturas-excel" element={
             <LandingPage
                lang={lang}
                viewType="LANDING_FACTURAS_EXCEL"
                title={lang === 'ES' ? 'Cómo Pasar Facturas a Excel con IA Gratis' : lang === 'EN' ? 'How to Convert Invoices to Excel with Free AI' : lang === 'DE' ? 'Rechnungen zu Excel mit kostenloser KI konvertieren' : 'Comment Convertir Factures en Excel avec IA Gratuite'}
                subtitle={lang === 'ES' ? 'Extrae Datos de Facturas Automáticamente' : lang === 'EN' ? 'Extract Invoice Data Automatically' : lang === 'DE' ? 'Rechnungsdaten automatisch extrahieren' : 'Extraire Données de Factures Automatiquement'}
                description={lang === 'ES' 
                    ? 'Pasa facturas PDF a Excel automáticamente con IA. Extrae fecha, total, IVA, proveedor y más datos sin escribir. Procesa múltiples facturas a la vez. 100% gratis y privado. Sin subir archivos.'
                    : lang === 'EN'
                    ? 'Convert invoice PDFs to Excel automatically with AI. Extract date, total, VAT, supplier and more data without typing. Process multiple invoices at once. 100% free and private. No file uploads.'
                    : lang === 'DE'
                    ? 'Konvertieren Sie Rechnungs-PDFs automatisch mit KI zu Excel. Extrahieren Sie Datum, Gesamtbetrag, MwSt, Lieferant und weitere Daten ohne Tippen. Verarbeiten Sie mehrere Rechnungen gleichzeitig. 100% kostenlos und privat.'
                    : 'Convertissez les factures PDF en Excel automatiquement avec IA. Extrayez la date, le total, la TVA, le fournisseur et plus de données sans taper. Traitez plusieurs factures à la fois. 100% gratuit et privé.'}
                mainFeature={lang === 'ES' 
                    ? 'Extracción Inteligente de Datos de Facturas'
                    : lang === 'EN'
                    ? 'Smart Invoice Data Extraction'
                    : lang === 'DE'
                    ? 'Intelligente Rechnungsdatenextraktion'
                    : 'Extraction Intelligente de Données de Factures'}
                features={lang === 'ES' ? [
                    'Extrae fecha, total, IVA y proveedor automáticamente',
                    'Rellena plantillas Excel sin escribir',
                    'Procesa múltiples facturas a la vez',
                    '100% gratis y privado',
                    'Sin subir archivos a internet',
                    'Reconoce diferentes formatos de factura'
                ] : lang === 'EN' ? [
                    'Extract date, total, VAT and supplier automatically',
                    'Fill Excel templates without typing',
                    'Process multiple invoices at once',
                    '100% free and private',
                    'No uploading files to internet',
                    'Recognizes different invoice formats'
                ] : lang === 'DE' ? [
                    'Datum, Gesamtbetrag, MwSt und Lieferant automatisch extrahieren',
                    'Excel-Vorlagen ohne Tippen ausfüllen',
                    'Mehrere Rechnungen gleichzeitig verarbeiten',
                    '100% kostenlos und privat',
                    'Keine Datei-Uploads ins Internet',
                    'Erkennt verschiedene Rechnungsformate'
                ] : [
                    'Extraire date, total, TVA et fournisseur automatiquement',
                    'Remplir modèles Excel sans taper',
                    'Traiter plusieurs factures à la fois',
                    '100% gratuit et privé',
                    'Pas de téléchargement de fichiers',
                    'Reconnaît différents formats de facture'
                ]}
                benefits={lang === 'ES' ? [
                    'Ahorra horas de trabajo manual copiando datos',
                    'Elimina errores de transcripción',
                    'Procesa cientos de facturas en minutos',
                    'Privacidad total: tus documentos nunca salen de tu PC',
                    'Compatible con cualquier formato de factura',
                    'Resultados instantáneos sin esperas'
                ] : lang === 'EN' ? [
                    'Save hours of manual work copying data',
                    'Eliminate transcription errors',
                    'Process hundreds of invoices in minutes',
                    'Total privacy: your documents never leave your PC',
                    'Compatible with any invoice format',
                    'Instant results without waiting'
                ] : lang === 'DE' ? [
                    'Sparen Sie Stunden manueller Arbeit beim Kopieren von Daten',
                    'Beseitigen Sie Transkriptionsfehler',
                    'Verarbeiten Sie Hunderte von Rechnungen in Minuten',
                    'Vollständige Privatsphäre: Ihre Dokumente verlassen nie Ihren PC',
                    'Kompatibel mit jedem Rechnungsformat',
                    'Sofortige Ergebnisse ohne Warten'
                ] : [
                    'Économisez des heures de travail manuel de copie de données',
                    'Éliminez les erreurs de transcription',
                    'Traitez des centaines de factures en minutes',
                    'Confidentialité totale: vos documents ne quittent jamais votre PC',
                    'Compatible avec tout format de facture',
                    'Résultats instantanés sans attente'
                ]}
                ctaText={lang === 'ES' ? 'PROBAR GRATIS AHORA' : lang === 'EN' ? 'TRY FREE NOW' : lang === 'DE' ? 'JETZT KOSTENLOS TESTEN' : 'ESSAYER GRATUITEMENT'}
                ctaAction={() => navigate('/plantillas-excel')}
                onGoToHome={() => navigate('/')}
                icon={<FileSpreadsheet className="w-10 h-10 text-emerald-400" />}
                color="emerald"
             />
          } />

          <Route path="/generador-test" element={
             <LandingPage
                lang={lang}
                viewType="LANDING_GENERADOR_TEST"
                title={lang === 'ES' ? 'Generador de Preguntas Tipo Test desde PDF Gratis' : lang === 'EN' ? 'Test Question Generator from PDF Free' : lang === 'DE' ? 'Testfragen-Generator aus PDF kostenlos' : 'Générateur de Questions Type Test depuis PDF Gratuit'}
                subtitle={lang === 'ES' ? 'Crea Exámenes con IA' : lang === 'EN' ? 'Create Exams with AI' : lang === 'DE' ? 'Prüfungen mit KI erstellen' : 'Créer Examens avec IA'}
                description={lang === 'ES'
                    ? 'Genera preguntas tipo test automáticamente desde PDFs. Crea exámenes de opción múltiple, flashcards y quizzes desde tus apuntes. Perfecto para estudiantes, opositores y profesores. 100% gratis.'
                    : lang === 'EN'
                    ? 'Generate test questions automatically from PDFs. Create multiple choice exams, flashcards and quizzes from your notes. Perfect for students, exam takers and teachers. 100% free.'
                    : lang === 'DE'
                    ? 'Generieren Sie automatisch Testfragen aus PDFs. Erstellen Sie Multiple-Choice-Prüfungen, Karteikarten und Quizze aus Ihren Notizen. Perfekt für Studenten und Lehrer. 100% kostenlos.'
                    : 'Générez automatiquement des questions de test à partir de PDFs. Créez des examens à choix multiples, des cartes mémoire et des quiz à partir de vos notes. Parfait pour les étudiants et les enseignants. 100% gratuit.'}
                mainFeature={lang === 'ES'
                    ? 'Generación Automática de Preguntas de Examen'
                    : lang === 'EN'
                    ? 'Automatic Exam Question Generation'
                    : lang === 'DE'
                    ? 'Automatische Prüfungsfragenerstellung'
                    : 'Génération Automatique de Questions d\'Examen'}
                features={lang === 'ES' ? [
                    'Genera preguntas de opción múltiple automáticamente',
                    'Crea flashcards para memorización',
                    'Genera quizzes interactivos',
                    'Extrae conceptos clave del PDF',
                    '100% gratis sin límites',
                    'Procesamiento local privado'
                ] : lang === 'EN' ? [
                    'Generate multiple choice questions automatically',
                    'Create flashcards for memorization',
                    'Generate interactive quizzes',
                    'Extract key concepts from PDF',
                    '100% free without limits',
                    'Private local processing'
                ] : lang === 'DE' ? [
                    'Generieren Sie automatisch Multiple-Choice-Fragen',
                    'Erstellen Sie Karteikarten zum Auswendiglernen',
                    'Generieren Sie interaktive Quizze',
                    'Extrahieren Sie Schlüsselkonzepte aus PDF',
                    '100% kostenlos ohne Limits',
                    'Private lokale Verarbeitung'
                ] : [
                    'Générez automatiquement des questions à choix multiples',
                    'Créez des cartes mémoire pour la mémorisation',
                    'Générez des quiz interactifs',
                    'Extrayez les concepts clés du PDF',
                    '100% gratuit sans limites',
                    'Traitement local privé'
                ]}
                benefits={lang === 'ES' ? [
                    'Ahorra horas creando preguntas manualmente',
                    'Mejora tu estudio con material personalizado',
                    'Genera exámenes de práctica ilimitados',
                    'Perfecto para opositores y estudiantes',
                    'Adapta el nivel de dificultad',
                    'Exporta tus exámenes y flashcards'
                ] : lang === 'EN' ? [
                    'Save hours creating questions manually',
                    'Improve your study with personalized material',
                    'Generate unlimited practice exams',
                    'Perfect for exam takers and students',
                    'Adjust difficulty level',
                    'Export your exams and flashcards'
                ] : lang === 'DE' ? [
                    'Sparen Sie Stunden beim manuellen Erstellen von Fragen',
                    'Verbessern Sie Ihr Studium mit personalisiertem Material',
                    'Generieren Sie unbegrenzte Übungsprüfungen',
                    'Perfekt für Prüflinge und Studenten',
                    'Passen Sie den Schwierigkeitsgrad an',
                    'Exportieren Sie Ihre Prüfungen und Karteikarten'
                ] : [
                    'Économisez des heures à créer des questions manuellement',
                    'Améliorez votre étude avec du matériel personnalisé',
                    'Générez des examens de pratique illimités',
                    'Parfait pour les candidats et les étudiants',
                    'Ajustez le niveau de difficulté',
                    'Exportez vos examens et cartes mémoire'
                ]}
                ctaText={lang === 'ES' ? 'CREAR MI PRIMER EXAMEN' : lang === 'EN' ? 'CREATE MY FIRST EXAM' : lang === 'DE' ? 'MEINE ERSTE PRÜFUNG ERSTELLEN' : 'CRÉER MON PREMIER EXAMEN'}
                ctaAction={() => navigate('/generar-test')}
                onGoToHome={() => navigate('/')}
                icon={<FileText className="w-10 h-10 text-indigo-400" />}
                color="indigo"
             />
          } />

          <Route path="/modelo-tributario" element={
             <LandingPage
                lang={lang}
                viewType="LANDING_MODELO_TRIBUTARIO"
                title={lang === 'ES' ? 'Rellenar Modelo Tributario desde PDF Automáticamente' : lang === 'EN' ? 'Fill Tax Model from PDF Automatically' : lang === 'DE' ? 'Steuermodell aus PDF automatisch ausfüllen' : 'Remplir Modèle Fiscal depuis PDF Automatiquement'}
                subtitle={lang === 'ES' ? 'Extraer Datos Fiscales con IA' : lang === 'EN' ? 'Extract Tax Data with AI' : lang === 'DE' ? 'Steuerdaten mit KI extrahieren' : 'Extraire Données Fiscales avec IA'}
                description={lang === 'ES'
                    ? 'Rellena modelos tributarios y declaraciones fiscales automáticamente desde PDFs. Extrae datos fiscales (NIF, importes, fechas) y completa formularios Hacienda sin escribir. Procesamiento 100% local y privado.'
                    : lang === 'EN'
                    ? 'Fill tax models and tax returns automatically from PDFs. Extract tax data (tax ID, amounts, dates) and complete tax forms without typing. 100% local and private processing.'
                    : lang === 'DE'
                    ? 'Füllen Sie Steuermodelle und Steuererklärungen automatisch aus PDFs aus. Extrahieren Sie Steuerdaten (Steuer-ID, Beträge, Daten) und vervollständigen Sie Steuerformulare ohne Tippen. 100% lokale und private Verarbeitung.'
                    : 'Remplissez les modèles fiscaux et les déclarations fiscales automatiquement à partir de PDFs. Extrayez les données fiscales (numéro fiscal, montants, dates) et complétez les formulaires fiscaux sans taper. Traitement 100% local et privé.'}
                mainFeature={lang === 'ES'
                    ? 'Automatización de Formularios Fiscales'
                    : lang === 'EN'
                    ? 'Tax Form Automation'
                    : lang === 'DE'
                    ? 'Automatisierung von Steuerformularen'
                    : 'Automatisation des Formulaires Fiscaux'}
                features={lang === 'ES' ? [
                    'Extrae NIF, importes y fechas automáticamente',
                    'Rellena modelos tributarios sin escribir',
                    'Completa declaraciones fiscales',
                    'Procesa múltiples documentos a la vez',
                    '100% privado y seguro',
                    'Sin subir documentos sensibles'
                ] : lang === 'EN' ? [
                    'Extract tax ID, amounts and dates automatically',
                    'Fill tax models without typing',
                    'Complete tax returns',
                    'Process multiple documents at once',
                    '100% private and secure',
                    'No uploading sensitive documents'
                ] : lang === 'DE' ? [
                    'Steuer-ID, Beträge und Daten automatisch extrahieren',
                    'Steuermodelle ohne Tippen ausfüllen',
                    'Steuererklärungen vervollständigen',
                    'Mehrere Dokumente gleichzeitig verarbeiten',
                    '100% privat und sicher',
                    'Keine Uploads sensibler Dokumente'
                ] : [
                    'Extraire numéro fiscal, montants et dates automatiquement',
                    'Remplir modèles fiscaux sans taper',
                    'Compléter déclarations fiscales',
                    'Traiter plusieurs documents à la fois',
                    '100% privé et sécurisé',
                    'Pas de téléchargement de documents sensibles'
                ]}
                benefits={lang === 'ES' ? [
                    'Ahorra días completando formularios manualmente',
                    'Elimina errores de transcripción fiscal',
                    'Cumple con plazos de forma eficiente',
                    'Privacidad total: documentos fiscales nunca salen de tu PC',
                    'Compatible con modelos de Hacienda',
                    'Resultados precisos y verificables'
                ] : lang === 'EN' ? [
                    'Save days completing forms manually',
                    'Eliminate tax transcription errors',
                    'Meet deadlines efficiently',
                    'Total privacy: tax documents never leave your PC',
                    'Compatible with tax office models',
                    'Accurate and verifiable results'
                ] : lang === 'DE' ? [
                    'Sparen Sie Tage beim manuellen Ausfüllen von Formularen',
                    'Beseitigen Sie Steuertranskriptionsfehler',
                    'Erfüllen Sie Fristen effizient',
                    'Vollständige Privatsphäre: Steuerdokumente verlassen nie Ihren PC',
                    'Kompatibel mit Finanzamt-Modellen',
                    'Präzise und überprüfbare Ergebnisse'
                ] : [
                    'Économisez des jours à remplir des formulaires manuellement',
                    'Éliminez les erreurs de transcription fiscale',
                    'Respectez les délais efficacement',
                    'Confidentialité totale: les documents fiscaux ne quittent jamais votre PC',
                    'Compatible avec les modèles du fisc',
                    'Résultats précis et vérifiables'
                ]}
                ctaText={lang === 'ES' ? 'AUTOMATIZAR MI MODELO TRIBUTARIO' : lang === 'EN' ? 'AUTOMATE MY TAX MODEL' : lang === 'DE' ? 'MEIN STEUERMODELL AUTOMATISIEREN' : 'AUTOMATISER MON MODÈLE FISCAL'}
                ctaAction={() => navigate('/plantillas-excel')}
                onGoToHome={() => navigate('/')}
                icon={<Calculator className="w-10 h-10 text-purple-400" />}
                color="purple"
             />
          } />
        </Routes>
      </main>

      <footer className="text-center py-8 text-gray-600 border-t-2 border-black mt-auto bg-gray-900">
          <p className="mb-4">© {new Date().getFullYear()} {t.footer}</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a 
              href="/privacy-policy.html" 
              target="_blank" 
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {lang === 'ES' ? 'Política de Privacidad' : lang === 'EN' ? 'Privacy Policy' : lang === 'DE' ? 'Datenschutzerklärung' : 'Politique de Confidentialité'}
            </a>
            <span className="text-gray-500">|</span>
            <a 
              href="/terms.html" 
              target="_blank" 
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {lang === 'ES' ? 'Términos y Condiciones' : lang === 'EN' ? 'Terms and Conditions' : lang === 'DE' ? 'Nutzungsbedingungen' : 'Conditions Générales'}
            </a>
            <span className="text-gray-500">|</span>
            <a 
              href="/cookies.html" 
              target="_blank" 
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {lang === 'ES' ? 'Política de Cookies' : lang === 'EN' ? 'Cookie Policy' : lang === 'DE' ? 'Cookie-Richtlinie' : 'Politique des Cookies'}
            </a>
          </div>
      </footer>
      
      <CookieBanner lang={lang} />
      <DonationBanner lang={lang} />
    </div>
  );
};

export default App;