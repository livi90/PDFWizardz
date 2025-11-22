export interface PdfMetadata {
  originalName: string;
  suggestedName: string;
  date: string;
  entity: string;
  category: string;
  summary: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface FileItem {
  id: string;
  file: File;
  status: ProcessingStatus;
  metadata?: PdfMetadata;
  error?: string;
}

export interface AiResponseSchema {
  suggestedName: string;
  date: string;
  entity: string;
  category: string;
  summary: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number; // 0-3
}

export interface FlashcardItem {
  front: string; // Concept or Question
  back: string;  // Definition or Answer
}

export interface StudyMaterial {
  type: 'QUIZ' | 'FLASHCARDS';
  quiz?: QuizQuestion[];
  flashcards?: FlashcardItem[];
}

export interface PresentationSlide {
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
}

export interface PresentationStructure {
  mainTitle: string;
  subtitle: string;
  slides: PresentationSlide[];
}

export type ViewType = 'HOME' | 'AI_ORGANIZER' | 'MERGE' | 'IMG_TO_PDF' | 'SPLIT' | 'EDIT' | 'CONVERT' | 'STUDY';

export type Language = 'ES' | 'EN' | 'DE' | 'FR';

export type DocumentContext = 'GENERAL' | 'FINANCE' | 'LEGAL' | 'EDUCATION';