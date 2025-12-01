// We use the global pdfjsLib loaded via CDN in index.html to avoid complex worker setups in this environment
import { isScannedPdf, extractTextFromScannedPdf } from './ocrService';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const extractTextFromPdf = async (file: File, pageLimit: number = 3, forceOCR: boolean = false): Promise<string> => {
  try {
    // Si forceOCR está activado, usar OCR directamente
    if (forceOCR) {
      console.log('OCR forzado por el usuario, usando OCR directamente...');
      return await extractTextFromScannedPdf(file, pageLimit, true);
    }

    // Primero intentar extraer texto normalmente
    const arrayBuffer = await file.arrayBuffer();
    // Using the global window.pdfjsLib
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    // If pageLimit is less than 0 or Infinity, use all pages
    const maxPages = (pageLimit <= 0 || pageLimit === Infinity) ? pdf.numPages : Math.min(pdf.numPages, pageLimit);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `Page ${i}: ${pageText}\n\n`; // Added extra newline for better parsing
    }

    // Si no se extrajo suficiente texto, verificar si es un PDF escaneado
    const extractedTextLength = fullText.trim().replace(/\n/g, ' ').length;
    if (extractedTextLength < 50) {
      console.log('Poco texto extraído, verificando si es PDF escaneado...');
      const scanned = await isScannedPdf(file, Math.min(2, maxPages));
      
      if (scanned) {
        console.log('PDF escaneado detectado, usando OCR...');
        return await extractTextFromScannedPdf(file, pageLimit, true);
      }
    }

    return fullText;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    
    // Si falla la extracción normal, intentar con OCR como último recurso
    try {
      console.log('Error en extracción normal, intentando con OCR...');
      return await extractTextFromScannedPdf(file, pageLimit, true);
    } catch (ocrError) {
      console.error("Error en OCR:", ocrError);
      throw new Error("Failed to read PDF text. El PDF podría estar corrupto o ser una imagen sin texto.");
    }
  }
};