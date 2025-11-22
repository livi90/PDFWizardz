import React, { useState, useRef } from 'react';
import Navbar from './components/Navbar';
import PixelCard from './components/PixelCard';
import ProgressBar from './components/ProgressBar';
import FileQueue from './components/FileQueue';
import StudySession from './components/StudySession';
import { usePdfProcessor } from './hooks/usePdfProcessor';
import { mergePdfs, imagesToPdf, splitPdf, addWatermark, convertToText, convertToImages, convertToDocx, convertToExcel, convertToPptx } from './services/pdfTools';
import { generateQuiz, generateFlashcards } from './services/geminiService';
import { extractTextFromPdf } from './services/pdfService';
import { getTranslation } from './services/translations';
import { ViewType, Language, DocumentContext, StudyMaterial } from './types';
import { Upload, Wand2, Download, Trash2, FileText, Layers, Image as ImageIcon, Sparkles, ArrowRight, Scissors, PenTool, Type, FileStack, Repeat, FileSpreadsheet, Briefcase, GraduationCap, Scale, BookOpen, BrainCircuit, Presentation } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('HOME');
  const [lang, setLang] = useState<Language>('ES');
  const t = getTranslation(lang);
  
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
                <div className="w-48 h-48 bg-indigo-900 border-4 border-black rounded-full overflow-hidden relative shadow-[0_0_20px_rgba(99,102,241,0.6)] hover:scale-105 transition-transform duration-300">
                   <img 
                     src="Images/cabeza mago.png" 
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
                <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-lg">
                   {t.heroDesc}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                   <button 
                     onClick={() => setCurrentView('AI_ORGANIZER')}
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

      {/* Feature Grid */}
      <div id="tools" className="max-w-6xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         
         {/* STUDY CARD */}
         <div onClick={() => setCurrentView('STUDY')} className="group cursor-pointer bg-gray-800 border-4 border-black p-6 hover:-translate-y-2 transition-all retro-shadow hover:shadow-[8px_8px_0px_0px_rgba(234,179,8,0.5)] border-t-yellow-500 col-span-1 md:col-span-2 lg:col-span-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-500 text-black px-2 py-0.5 text-xs font-bold">NEW</div>
            <div className="bg-yellow-900/40 w-16 h-16 flex items-center justify-center border-2 border-yellow-700 mb-4 group-hover:bg-yellow-900/60">
               <BrainCircuit className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 pixel-font-header text-yellow-300">{t.studyTitle}</h3>
            <p className="text-gray-400 text-lg">{t.studyDesc}</p>
         </div>

         <div onClick={() => setCurrentView('AI_ORGANIZER')} className="group cursor-pointer bg-gray-800 border-4 border-black p-6 hover:-translate-y-2 transition-all retro-shadow hover:shadow-[8px_8px_0px_0px_rgba(99,102,241,0.5)] border-t-indigo-500">
            <div className="bg-indigo-900/40 w-16 h-16 flex items-center justify-center border-2 border-indigo-700 mb-4 group-hover:bg-indigo-900/60">
               <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 pixel-font-header text-indigo-300">{t.aiTitle}</h3>
            <p className="text-gray-400 text-lg">{t.aiDesc}</p>
         </div>

         <div onClick={() => setCurrentView('CONVERT')} className="group cursor-pointer bg-gray-800 border-4 border-black p-6 hover:-translate-y-2 transition-all retro-shadow hover:shadow-[8px_8px_0px_0px_rgba(236,72,153,0.5)] border-t-pink-500">
            <div className="bg-pink-900/40 w-16 h-16 flex items-center justify-center border-2 border-pink-700 mb-4 group-hover:bg-pink-900/60">
               <Repeat className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 pixel-font-header text-pink-300">{t.convertTitle}</h3>
            <p className="text-gray-400 text-lg">{t.convertDesc}</p>
         </div>

         <div onClick={() => setCurrentView('MERGE')} className="group cursor-pointer bg-gray-800 border-4 border-black p-6 hover:-translate-y-2 transition-all retro-shadow hover:shadow-[8px_8px_0px_0px_rgba(16,185,129,0.5)] border-t-emerald-500">
            <div className="bg-emerald-900/40 w-16 h-16 flex items-center justify-center border-2 border-emerald-700 mb-4 group-hover:bg-emerald-900/60">
               <Layers className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 pixel-font-header text-emerald-300">{t.mergeTitle}</h3>
            <p className="text-gray-400 text-lg">{t.mergeDesc}</p>
         </div>

         <div onClick={() => setCurrentView('SPLIT')} className="group cursor-pointer bg-gray-800 border-4 border-black p-6 hover:-translate-y-2 transition-all retro-shadow hover:shadow-[8px_8px_0px_0px_rgba(239,68,68,0.5)] border-t-rose-500">
            <div className="bg-rose-900/40 w-16 h-16 flex items-center justify-center border-2 border-rose-700 mb-4 group-hover:bg-rose-900/60">
               <Scissors className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 pixel-font-header text-rose-300">{t.splitTitle}</h3>
            <p className="text-gray-400 text-lg">{t.splitDesc}</p>
         </div>

         <div onClick={() => setCurrentView('IMG_TO_PDF')} className="group cursor-pointer bg-gray-800 border-4 border-black p-6 hover:-translate-y-2 transition-all retro-shadow hover:shadow-[8px_8px_0px_0px_rgba(245,158,11,0.5)] border-t-amber-500">
            <div className="bg-amber-900/40 w-16 h-16 flex items-center justify-center border-2 border-amber-700 mb-4 group-hover:bg-amber-900/60">
               <ImageIcon className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 pixel-font-header text-amber-300">{t.imgTitle}</h3>
            <p className="text-gray-400 text-lg">{t.imgDesc}</p>
         </div>

         <div onClick={() => setCurrentView('EDIT')} className="group cursor-pointer bg-gray-800 border-4 border-black p-6 hover:-translate-y-2 transition-all retro-shadow hover:shadow-[8px_8px_0px_0px_rgba(168,85,247,0.5)] border-t-purple-500">
            <div className="bg-purple-900/40 w-16 h-16 flex items-center justify-center border-2 border-purple-700 mb-4 group-hover:bg-purple-900/60">
               <PenTool className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 pixel-font-header text-purple-300">{t.editTitle}</h3>
            <p className="text-gray-400 text-lg">{t.editDesc}</p>
         </div>
      </div>
      
      {/* Ads Placeholder */}
      <div className="w-full max-w-4xl h-24 bg-gray-900 border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 mb-8 mx-auto font-mono text-sm tracking-widest">
         [{t.ads}]
      </div>
    </div>
  );

  const renderAiOrganizer = () => {
    const hasFiles = files.length > 0;
    const isAllDone = hasFiles && !isProcessing && progress.current === progress.total && progress.total > 0;
    
    return (
      <div className="max-w-4xl w-full mx-auto p-4 md:p-8">
        <div className="mb-6 flex items-center gap-2 text-indigo-400 cursor-pointer hover:underline" onClick={() => setCurrentView('HOME')}>
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
      <Navbar currentView={currentView} setView={setCurrentView} lang={lang} setLang={setLang} t={t} />
      
      <main className="flex-1 w-full">
         {currentView === 'HOME' && renderHome()}
         {currentView === 'AI_ORGANIZER' && renderAiOrganizer()}
         
         {currentView === 'MERGE' && renderSimpleTool(t.mergeTitle, t.mergeDesc, ".pdf", t.mergeTitle, executeMerge, 'green')}
         
         {currentView === 'IMG_TO_PDF' && renderSimpleTool(t.imgTitle, t.imgDesc, "image/*", t.convertTitle, executeImgToPdf, 'yellow', (
             <label className="flex items-center justify-center gap-2 bg-amber-900/30 p-2 border border-amber-800 text-amber-200">
                 <input type="checkbox" checked={fitToA4} onChange={(e) => setFitToA4(e.target.checked)} className="w-5 h-5 accent-amber-500" />
                 <span className="font-bold">A4 Fit</span>
             </label>
         ))}

         {currentView === 'SPLIT' && renderSimpleTool(t.splitTitle, t.splitDesc, ".pdf", splitRange ? "EXTRACT" : "ZIP SPLIT", executeSplit, 'red', (
             <div className="bg-rose-900/30 p-4 border border-rose-800 text-left">
                 <label className="text-rose-300 font-bold block mb-1">Pages (Opt):</label>
                 <input type="text" value={splitRange} onChange={(e) => setSplitRange(e.target.value)} placeholder="1-5, 8" className="border-2 border-black bg-gray-900 text-white p-2 w-full font-bold focus:border-rose-500 outline-none" />
             </div>
         ), 1)}

         {currentView === 'EDIT' && renderSimpleTool(t.editTitle, t.editDesc, ".pdf", t.editTitle, executeEdit, 'blue', (
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
         ), 1)}

         {currentView === 'CONVERT' && renderSimpleTool(t.convertTitle, t.convertDesc, ".pdf", t.convertTitle, executeConvert, 'pink', (
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
         ), 1)}

         {/* STUDY MODE */}
         {currentView === 'STUDY' && (
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
         )}

      </main>

      <footer className="text-center py-8 text-gray-600 border-t-2 border-black mt-auto bg-gray-900">
          <p>© {new Date().getFullYear()} {t.footer}</p>
      </footer>
    </div>
  );
};

export default App;