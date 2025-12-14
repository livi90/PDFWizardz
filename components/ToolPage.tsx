import React from 'react';
import { useNavigate } from 'react-router-dom';
import PixelCard from './PixelCard';
import SEOContent from './SEOContent';
import { getTranslation } from '../services/translations';
import { Language } from '../types';
import { Upload, Download, Trash2, Sparkles, FileText, ArrowRight } from 'lucide-react';

interface ToolPageProps {
  title: string;
  desc: string;
  accept: string;
  actionLabel: string;
  onAction: () => void;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'pink';
  extraControls?: React.ReactNode;
  maxFiles?: number;
  toolFiles: File[];
  setToolFiles: (files: File[]) => void;
  isToolProcessing: boolean;
  handleToolFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toolInputRef: React.RefObject<HTMLInputElement>;
  toolKey: string; // Para SEOContent: 'merge', 'split', 'convert', 'edit', 'imagesToPdf'
  lang: Language;
}

const ToolPage: React.FC<ToolPageProps> = ({
  title,
  desc,
  accept,
  actionLabel,
  onAction,
  color,
  extraControls,
  maxFiles = 20,
  toolFiles,
  setToolFiles,
  isToolProcessing,
  handleToolFileChange,
  toolInputRef,
  toolKey,
  lang,
}) => {
  const navigate = useNavigate();
  const t = getTranslation(lang);

  return (
    <div className="max-w-3xl w-full mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6 flex items-center gap-2 text-gray-500 cursor-pointer hover:underline text-sm sm:text-base" onClick={() => navigate('/')}>
        <ArrowRight className="transform rotate-180 w-4 h-4 sm:w-5 sm:h-5" /> {t.back}
      </div>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className={`text-2xl sm:text-3xl md:text-4xl pixel-font-header text-gray-200 mb-2 neon-glow-text`}>{title}</h2>
        <p className="text-base sm:text-lg md:text-xl text-gray-400 font-bold">{desc}</p>
      </div>
      <PixelCard title="WORKBENCH" color={color} className="text-center">
        <input type="file" multiple={maxFiles > 1} accept={accept} onChange={handleToolFileChange} className="hidden" ref={toolInputRef} />
        {toolFiles.length === 0 ? (
          <div onClick={() => toolInputRef.current?.click()} className={`border-4 border-dashed border-gray-700 bg-gray-900/50 p-6 sm:p-8 md:p-12 cursor-pointer hover:bg-gray-800 flex flex-col items-center gap-3 sm:gap-4`}>
            <Upload className={`w-12 h-12 sm:w-16 sm:h-16 text-gray-500`} />
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-300 text-center">{maxFiles === 1 ? 'SELECT 1 FILE' : t.dragDrop}</div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gray-900 border-2 border-black p-3 sm:p-4 max-h-48 sm:max-h-60 overflow-y-auto custom-scrollbar text-left">
              {toolFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 border-b border-gray-800 py-2 last:border-0 text-gray-300 text-sm sm:text-base">
                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate flex-1 min-w-0">{f.name}</span>
                  <span className="text-xs text-gray-500 ml-auto flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
            {extraControls}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button onClick={onAction} disabled={isToolProcessing} className={`bg-gray-900 text-white border-4 border-gray-600 px-4 sm:px-6 py-2 sm:py-3 font-bold text-base sm:text-lg md:text-xl retro-shadow flex items-center justify-center gap-2 hover:bg-gray-800 hover:border-gray-500 ${isToolProcessing ? 'opacity-50' : ''}`}>
                {isToolProcessing ? <Sparkles className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                {isToolProcessing ? '...' : actionLabel}
              </button>
              <button onClick={() => setToolFiles([])} disabled={isToolProcessing} className="bg-rose-600 text-white border-4 border-black px-4 sm:px-6 py-2 sm:py-3 font-bold retro-shadow hover:bg-rose-500 flex items-center justify-center" aria-label="Limpiar archivos">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </PixelCard>
      
      {/* Contenido SEO Envolvente */}
      <SEOContent toolKey={toolKey} lang={lang} />
    </div>
  );
};

export default ToolPage;

