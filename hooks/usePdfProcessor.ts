import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileItem, ProcessingStatus, Language, DocumentContext } from '../types';
import { extractTextFromFile } from '../services/fileTextExtractor';
import { analyzePdfContent } from '../services/geminiService';
import { downloadResults } from '../services/exportService';

const DELAY_MS = 4000; 

export const usePdfProcessor = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const addFiles = useCallback((newFiles: File[]) => {
    const fileItems: FileItem[] = newFiles.map(f => ({
      id: uuidv4(),
      file: f,
      status: ProcessingStatus.IDLE
    }));
    setFiles(prev => [...prev, ...fileItems]);
  }, []);

  const updateFileMetadata = useCallback((id: string, newName: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id && f.metadata) {
        return {
          ...f,
          metadata: {
            ...f.metadata,
            suggestedName: newName
          }
        };
      }
      return f;
    }));
  }, []);

  const startProcessing = useCallback(async (lang: Language, context: DocumentContext, forceOCR: boolean = false) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const pendingFiles = files.filter(f => f.status === ProcessingStatus.IDLE || f.status === ProcessingStatus.ERROR);
    const totalToProcess = pendingFiles.length;
    
    if (totalToProcess === 0) {
      setIsProcessing(false);
      return;
    }

    setProgress({ current: 0, total: totalToProcess });

    for (let i = 0; i < pendingFiles.length; i++) {
      const currentItem = pendingFiles[i];
      
      setFiles(prev => prev.map(f => f.id === currentItem.id ? { ...f, status: ProcessingStatus.PROCESSING } : f));

      try {
        const text = await extractTextFromFile(currentItem.file, 3, forceOCR);
        const aiResponse = await analyzePdfContent(text, currentItem.file.name, lang, context);
        
        setFiles(prev => prev.map(f => f.id === currentItem.id ? { 
          ...f, 
          status: ProcessingStatus.COMPLETED,
          metadata: {
            ...aiResponse,
            originalName: currentItem.file.name
          }
        } : f));

      } catch (error: any) {
        console.error(`Error processing ${currentItem.file.name}:`, error);
        setFiles(prev => prev.map(f => f.id === currentItem.id ? { 
          ...f, 
          status: ProcessingStatus.ERROR,
          error: error.message || "Spell failed" 
        } : f));
      }

      setProgress({ current: i + 1, total: totalToProcess });

      if (i < pendingFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    setIsProcessing(false);
  }, [files, isProcessing]);

  const handleDownload = () => {
    downloadResults(files);
  };

  const clearQueue = () => {
    if (isProcessing) return;
    setFiles([]);
    setProgress({ current: 0, total: 0 });
  };

  return {
    files,
    isProcessing,
    progress,
    addFiles,
    updateFileMetadata,
    startProcessing,
    handleDownload,
    clearQueue
  };
};