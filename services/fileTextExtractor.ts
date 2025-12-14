// Servicio para extraer texto de múltiples formatos de archivos
import { extractTextFromPdf } from './pdfService';
import * as XLSX from 'xlsx';

/**
 * Extrae texto de un archivo según su tipo
 */
export const extractTextFromFile = async (
  file: File, 
  pageLimit: number = 3, 
  forceOCR: boolean = false
): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // PDF
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractTextFromPdf(file, pageLimit, forceOCR);
  }

  // Word (.docx)
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    return await extractTextFromDocx(file);
  }

  // Word (.doc) - formato antiguo
  if (
    fileType === 'application/msword' ||
    fileName.endsWith('.doc')
  ) {
    return await extractTextFromDoc(file);
  }

  // Excel (.xlsx, .xls)
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    fileType === 'application/vnd.ms-excel' ||
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.xls')
  ) {
    return await extractTextFromExcel(file);
  }

  // PowerPoint (.pptx)
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    fileName.endsWith('.pptx')
  ) {
    return await extractTextFromPptx(file);
  }

  // Texto plano
  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return await file.text();
  }

  // Si no se reconoce el formato, intentar leer como texto
  try {
    return await file.text();
  } catch (error) {
    throw new Error(`Formato de archivo no soportado: ${fileType || 'desconocido'}`);
  }
};

/**
 * Extrae texto de un archivo Word (.docx)
 * DOCX es un archivo ZIP que contiene XML, extraemos el texto del XML
 */
const extractTextFromDocx = async (file: File): Promise<string> => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    
    let fullText = '';
    
    // Buscar el archivo principal del documento
    const documentXml = await zip.file('word/document.xml')?.async('string');
    
    if (!documentXml) {
      throw new Error('No se encontró el contenido del documento');
    }
    
    // Extraer texto de las etiquetas <w:t> que contienen el texto
    const textMatches = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
    
    if (textMatches) {
      for (const match of textMatches) {
        // Extraer solo el texto, sin las etiquetas XML
        const text = match.replace(/<[^>]*>/g, '');
        if (text.trim()) {
          fullText += text + ' ';
        }
      }
    }
    
    // También buscar en otros archivos XML que puedan contener texto
    const files = Object.keys(zip.files);
    for (const fileName of files) {
      if (fileName.startsWith('word/') && fileName.endsWith('.xml') && fileName !== 'word/document.xml') {
        try {
          const xmlContent = await zip.file(fileName)?.async('string');
          if (xmlContent) {
            const additionalText = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
            if (additionalText) {
              for (const match of additionalText) {
                const text = match.replace(/<[^>]*>/g, '');
                if (text.trim()) {
                  fullText += text + ' ';
                }
              }
            }
          }
        } catch (e) {
          // Ignorar errores en archivos XML secundarios
        }
      }
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extrayendo texto de DOCX:', error);
    throw new Error('No se pudo extraer texto del archivo Word. El archivo podría estar corrupto.');
  }
};

/**
 * Extrae texto de un archivo Word antiguo (.doc)
 * Nota: .doc es un formato binario complejo, esta es una implementación básica
 */
const extractTextFromDoc = async (file: File): Promise<string> => {
  // Para .doc necesitaríamos una librería especializada como mammoth
  // Por ahora, intentamos leerlo como texto (limitado)
  try {
    const text = await file.text();
    // Filtrar caracteres no imprimibles básicos
    return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ' ').trim();
  } catch (error) {
    throw new Error('El formato .doc no está completamente soportado. Por favor, convierte el archivo a .docx o .pdf.');
  }
};

/**
 * Extrae texto de un archivo Excel (.xlsx, .xls)
 */
const extractTextFromExcel = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellStyles: false,
      cellNF: false
    });
    
    let fullText = '';
    
    // Recorrer todas las hojas
    for (const sheetName of workbook.SheetNames) {
      fullText += `\n=== Hoja: ${sheetName} ===\n\n`;
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      // Limitar a las primeras 100 filas para no sobrecargar
      const maxRows = Math.min(range.e.r + 1, 100);
      
      for (let row = range.s.r; row < maxRows; row++) {
        const rowData: string[] = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          if (cell && cell.v !== undefined && cell.v !== null) {
            rowData.push(String(cell.v));
          } else {
            rowData.push('');
          }
        }
        fullText += rowData.join(' | ') + '\n';
      }
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extrayendo texto de Excel:', error);
    throw new Error('No se pudo extraer texto del archivo Excel. El archivo podría estar corrupto.');
  }
};

/**
 * Extrae texto de un archivo PowerPoint (.pptx)
 */
const extractTextFromPptx = async (file: File): Promise<string> => {
  try {
    // PowerPoint es un formato ZIP con XML, necesitamos extraer el texto de las diapositivas
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    
    let fullText = '';
    const slideFiles: string[] = [];
    
    // Encontrar todos los archivos de diapositivas
    zip.forEach((relativePath, file) => {
      if (relativePath.startsWith('ppt/slides/slide') && relativePath.endsWith('.xml')) {
        slideFiles.push(relativePath);
      }
    });
    
    // Ordenar por número de diapositiva
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
      return numA - numB;
    });
    
    // Limitar a las primeras 20 diapositivas
    const maxSlides = Math.min(slideFiles.length, 20);
    
    for (let i = 0; i < maxSlides; i++) {
      const slideFile = slideFiles[i];
      const slideContent = await zip.file(slideFile)?.async('string');
      
      if (slideContent) {
        fullText += `\n=== Diapositiva ${i + 1} ===\n\n`;
        // Extraer texto del XML (básico, busca etiquetas <a:t> que contienen texto)
        const textMatches = slideContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
        if (textMatches) {
          for (const match of textMatches) {
            const text = match.replace(/<[^>]*>/g, '');
            if (text.trim()) {
              fullText += text + ' ';
            }
          }
        }
        fullText += '\n';
      }
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extrayendo texto de PowerPoint:', error);
    throw new Error('No se pudo extraer texto del archivo PowerPoint. El archivo podría estar corrupto.');
  }
};
