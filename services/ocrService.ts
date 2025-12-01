// Servicio de OCR para PDFs escaneados e imágenes
// Usa OpenCV.js para preprocesamiento y Tesseract.js para extracción de texto

import { createWorker } from 'tesseract.js';

// Declaraciones globales para OpenCV.js
declare global {
  interface Window {
    cv: any;
  }
}

/**
 * Convierte una página de PDF a imagen usando canvas
 */
const pdfPageToImage = async (page: any, scale: number = 2): Promise<HTMLImageElement> => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('No se pudo obtener el contexto del canvas');
  }

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };

  await page.render(renderContext).promise;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL('image/png');
  });
};

/**
 * Preprocesa una imagen usando OpenCV.js para mejorar el OCR
 * - Endereza la imagen si está rotada
 * - Aplica filtros para mejorar el contraste
 * - Convierte a escala de grises
 * - Aplica threshold para binarización
 */
const preprocessImageWithOpenCV = async (imageElement: HTMLImageElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.cv) {
      // Si OpenCV no está disponible, devolver la imagen original
      console.warn('OpenCV.js no está disponible, usando imagen sin preprocesamiento');
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('No se pudo crear el contexto del canvas'));
      }
      return;
    }

    try {
      const cv = window.cv;
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'));
        return;
      }

      ctx.drawImage(imageElement, 0, 0);
      const src = cv.imread(canvas);
      
      // Convertir a escala de grises
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Aplicar desenfoque gaussiano para reducir ruido
      const blurred = new cv.Mat();
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
      
      // Aplicar threshold adaptativo para binarización
      const thresh = new cv.Mat();
      cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
      
      // Detectar y corregir rotación usando detección de bordes
      const edges = new cv.Mat();
      cv.Canny(thresh, edges, 50, 150);
      
      // Encontrar contornos para detectar el documento
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
      // Buscar el contorno más grande (probablemente el documento)
      let maxArea = 0;
      let maxContourIdx = -1;
      for (let i = 0; i < contours.size(); i++) {
        const area = cv.contourArea(contours.get(i));
        if (area > maxArea) {
          maxArea = area;
          maxContourIdx = i;
        }
      }
      
      let processed = thresh;
      let needsRotation = false;
      
      // Si encontramos un contorno grande, intentar enderezar
      if (maxContourIdx >= 0 && maxArea > (src.rows * src.cols * 0.1)) {
        const contour = contours.get(maxContourIdx);
        const rect = cv.minAreaRect(contour);
        const angle = rect.angle;
        
        // Si la rotación es significativa (> 1 grado), corregirla
        if (Math.abs(angle) > 1 && Math.abs(angle) < 45) {
          const center = new cv.Point2f(src.cols / 2, src.rows / 2);
          const M = cv.getRotationMatrix2D(center, angle, 1.0);
          const rotated = new cv.Mat();
          cv.warpAffine(thresh, rotated, M, new cv.Size(src.cols, src.rows), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255));
          processed = rotated;
          needsRotation = true;
        }
      }
      
      // Escribir la imagen procesada en el canvas
      cv.imshow(canvas, processed);
      const processedDataUrl = canvas.toDataURL('image/png');
      
      // Limpiar memoria
      src.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();
      
      // Eliminar thresh solo si no se usó para rotación
      if (!needsRotation) {
        thresh.delete();
      } else {
        // Si se rotó, processed es rotated, así que eliminamos processed
        processed.delete();
      }
      
      resolve(processedDataUrl);
    } catch (error) {
      console.error('Error en preprocesamiento OpenCV:', error);
      // Si falla, devolver la imagen original
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(error);
      }
    }
  });
};

/**
 * Extrae texto de una imagen usando Tesseract.js
 */
const extractTextFromImage = async (imageDataUrl: string, language: string = 'spa+eng'): Promise<string> => {
  const worker = await createWorker(language);
  
  try {
    const { data: { text } } = await worker.recognize(imageDataUrl);
    return text;
  } finally {
    await worker.terminate();
  }
};

/**
 * Extrae texto de un PDF escaneado usando OCR
 * Convierte cada página a imagen, la preprocesa y extrae el texto
 */
export const extractTextFromScannedPdf = async (
  file: File,
  pageLimit: number = 3,
  usePreprocessing: boolean = true
): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const maxPages = (pageLimit <= 0 || pageLimit === Infinity) 
      ? pdf.numPages 
      : Math.min(pdf.numPages, pageLimit);

    // Inicializar worker de Tesseract una vez para todas las páginas
    const ocrLanguage = 'spa+eng'; // Español + Inglés
    const worker = await createWorker(ocrLanguage);

    try {
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        
        // Convertir página a imagen
        const imageElement = await pdfPageToImage(page, 2); // Escala 2x para mejor calidad
        
        // Preprocesar imagen si está habilitado y OpenCV está disponible
        let imageDataUrl: string;
        if (usePreprocessing && window.cv) {
          imageDataUrl = await preprocessImageWithOpenCV(imageElement);
        } else {
          const canvas = document.createElement('canvas');
          canvas.width = imageElement.width;
          canvas.height = imageElement.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(imageElement, 0, 0);
            imageDataUrl = canvas.toDataURL('image/png');
          } else {
            throw new Error('No se pudo crear el contexto del canvas');
          }
        }
        
        // Extraer texto usando Tesseract
        const { data: { text } } = await worker.recognize(imageDataUrl);
        fullText += `Page ${i}: ${text}\n\n`;
      }
    } finally {
      await worker.terminate();
    }

    return fullText;
  } catch (error) {
    console.error('Error en OCR de PDF escaneado:', error);
    throw new Error('Failed to extract text from scanned PDF using OCR.');
  }
};

/**
 * Detecta si un PDF es escaneado (no tiene texto extraíble)
 */
export const isScannedPdf = async (file: File, samplePages: number = 2): Promise<boolean> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const pagesToCheck = Math.min(samplePages, pdf.numPages);
    let totalTextLength = 0;
    
    for (let i = 1; i <= pagesToCheck; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      totalTextLength += pageText.trim().length;
    }
    
    // Si hay menos de 50 caracteres en las primeras páginas, probablemente es escaneado
    return totalTextLength < 50;
  } catch (error) {
    console.error('Error detectando si el PDF es escaneado:', error);
    // En caso de error, asumimos que es escaneado para intentar OCR
    return true;
  }
};

