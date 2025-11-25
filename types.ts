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

export type ViewType = 'HOME' | 'AI_ORGANIZER' | 'MERGE' | 'IMG_TO_PDF' | 'SPLIT' | 'EDIT' | 'CONVERT' | 'STUDY' | 'EXCEL_TEMPLATE' | 'ORACLE' | 'CHAT' | 'PRICING' | 'LANDING_FACTURAS_EXCEL' | 'LANDING_GENERADOR_TEST' | 'LANDING_MODELO_TRIBUTARIO' | 'TEMPLATE_EDITOR';

export type Language = 'ES' | 'EN' | 'DE' | 'FR';

export type DocumentContext = 'GENERAL' | 'FINANCE' | 'LEGAL' | 'EDUCATION';

// --- MIND MAP / ORACLE VISUAL TYPES ---

export interface MindMapNode {
  id: string;
  label: string;
  description?: string; // Detalle que se muestra al hacer clic
  type?: 'concept' | 'person' | 'event' | 'process' | 'category'; // Tipo de nodo para estilos
}

export interface MindMapEdge {
  id: string;
  source: string; // ID del nodo origen
  target: string; // ID del nodo destino
  label: string; // Relación: "Causó", "Parte de", "Genera", etc.
  type?: 'default' | 'causal' | 'hierarchical' | 'temporal'; // Tipo de relación
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  title?: string; // Título del mapa mental
  summary?: string; // Resumen del documento
}

// --- CHAT / INTERROGATOR FEATURES ---

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  pdfText: string; // Texto completo del PDF extraído
  messages: ChatMessage[];
  questionCount: number; // Contador de preguntas realizadas
  isPremium: boolean; // Si el usuario es premium
}