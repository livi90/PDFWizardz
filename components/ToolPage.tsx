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
    <div className="max-w-3xl w-full mx-auto p-4 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-gray-500 cursor-pointer hover:underline" onClick={() => navigate('/')}>
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
      
      {/* Contenido SEO Envolvente */}
      <SEOContent toolKey={toolKey} lang={lang} />
    </div>
  );
};

export default ToolPage;

