import { PDFDocument, StandardFonts, rgb, degrees, PageSizes } from 'pdf-lib';
import saveAs from 'file-saver';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';
import { extractTextFromPdf } from './pdfService';
import { generatePresentationData } from './geminiService';
import { Language } from '../types';

// --- Helpers ---
const parsePageRanges = (rangeStr: string, totalPages: number): number[] => {
  const pages = new Set<number>();
  const parts = rangeStr.split(',');

  parts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (i > 0 && i <= totalPages) pages.add(i - 1);
        }
      }
    } else {
      const page = Number(trimmed);
      if (!isNaN(page) && page > 0 && page <= totalPages) {
        pages.add(page - 1);
      }
    }
  });

  return Array.from(pages).sort((a, b) => a - b);
};

// Convierte cualquier imagen soportada por el navegador a PNG para poder incrustarla
const convertImageToPngBytes = async (arrayBuffer: ArrayBuffer, mimeType: string): Promise<Uint8Array> => {
  const blob = new Blob([arrayBuffer], { type: mimeType || 'application/octet-stream' });

  // Fallback a <img> si createImageBitmap no está disponible
  const loadImageElement = (b: Blob) => new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(b);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });

  const renderable: ImageBitmap | HTMLImageElement = ('createImageBitmap' in window)
    ? await createImageBitmap(blob)
    : await loadImageElement(blob);

  const width = (renderable as any).width || 1;
  const height = (renderable as any).height || 1;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar el lienzo para convertir la imagen.');

  ctx.drawImage(renderable as any, 0, 0, width, height);

  const pngBlob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('No se pudo generar PNG.')), 'image/png')
  );

  const pngArrayBuffer = await pngBlob.arrayBuffer();
  return new Uint8Array(pngArrayBuffer);
};

// --- Merge PDFs ---
export const mergePdfs = async (files: File[]): Promise<void> => {
  if (files.length < 2) throw new Error("Necesitas al menos 2 archivos para fusionar.");

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  saveAs(blob, `fusion_mago_${Date.now()}.pdf`);
};

// --- Images to PDF ---
export const imagesToPdf = async (files: File[], fitToA4: boolean = false): Promise<void> => {
  if (files.length === 0) throw new Error("No hay imágenes seleccionadas.");

  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    let image;

    if (file.type.includes('jpeg') || file.type.includes('jpg')) {
      image = await pdfDoc.embedJpg(arrayBuffer);
    } else if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      // Soporte ampliado (webp, gif, bmp, svg, etc.) convirtiendo a PNG
      const pngBytes = await convertImageToPngBytes(arrayBuffer, file.type);
      image = await pdfDoc.embedPng(pngBytes);
    }

    if (fitToA4) {
        const page = pdfDoc.addPage(PageSizes.A4);
        const { width, height } = page.getSize();
        
        // Scale to fit nicely with margin
        const margin = 40;
        const availableWidth = width - (margin * 2);
        const availableHeight = height - (margin * 2);
        
        const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
        
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        
        page.drawImage(image, {
            x: (width - drawWidth) / 2,
            y: (height - drawHeight) / 2,
            width: drawWidth,
            height: drawHeight,
        });
    } else {
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
  }

  if (pdfDoc.getPageCount() === 0) {
    throw new Error("Formato de imagen no soportado. Intenta con PNG o JPG.");
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  saveAs(blob, `album_imagenes_${Date.now()}.pdf`);
};

// --- Split PDF ---
export const splitPdf = async (file: File, rangeString: string = ""): Promise<void> => {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const totalPages = sourcePdf.getPageCount();
  
  // Mode 1: Range Extraction
  if (rangeString.trim()) {
      const indicesToExtract = parsePageRanges(rangeString, totalPages);
      if (indicesToExtract.length === 0) throw new Error("Rango de páginas inválido.");

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(sourcePdf, indicesToExtract);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      saveAs(blob, `extracto_${file.name}`);
      return;
  }

  // Mode 2: Zip Explosion
  const zip = new JSZip();
  for (let i = 0; i < totalPages; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
    newPdf.addPage(copiedPage);
    
    const pdfBytes = await newPdf.save();
    zip.file(`Pagina_${i + 1}_${file.name}`, pdfBytes);
  }

  const zipContent = await zip.generateAsync({ type: "blob" });
  saveAs(zipContent, `paginas_separadas_${Date.now()}.zip`);
};

// --- Add Watermark/Edit ---
export const addWatermark = async (
    file: File, 
    text: string, 
    color: string = 'red',
    position: 'diagonal' | 'top' | 'bottom' = 'diagonal',
    withPageNumbers: boolean = false,
    overlayImage?: File,
    imgScale: number = 50,
    imgPos: 'center' | 'tl' | 'tr' | 'bl' | 'br' = 'center'
): Promise<void> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  let embeddedImage = null;
  if (overlayImage) {
      const imgBuffer = await overlayImage.arrayBuffer();
      if (overlayImage.type === 'image/png') embeddedImage = await pdfDoc.embedPng(imgBuffer);
      else if (overlayImage.type.includes('jpeg') || overlayImage.type.includes('jpg')) embeddedImage = await pdfDoc.embedJpg(imgBuffer);
  }

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  let rgbColor = rgb(0.95, 0.1, 0.1); 
  if (color === 'blue') rgbColor = rgb(0.1, 0.1, 0.95);
  if (color === 'green') rgbColor = rgb(0.1, 0.8, 0.1);
  if (color === 'black') rgbColor = rgb(0, 0, 0);
  if (color === 'white') rgbColor = rgb(1, 1, 1);

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    
    // 1. Text Watermark
    if (text) {
        if (position === 'diagonal') {
            const textSize = 50;
            const textWidth = font.widthOfTextAtSize(text, textSize);
            page.drawText(text, {
                x: width / 2 - textWidth / 4,
                y: height / 2,
                size: textSize,
                font: font,
                color: rgbColor,
                opacity: 0.3,
                rotate: degrees(45),
            });
        } else if (position === 'top') {
            const textSize = 18;
            const textWidth = font.widthOfTextAtSize(text, textSize);
            page.drawText(text, {
                x: (width - textWidth) / 2,
                y: height - 40,
                size: textSize,
                font: font,
                color: rgbColor,
                opacity: 0.8,
            });
        } else if (position === 'bottom') {
            const textSize = 12;
            const textWidth = font.widthOfTextAtSize(text, textSize);
            page.drawText(text, {
                x: (width - textWidth) / 2,
                y: 40,
                size: textSize,
                font: font,
                color: rgbColor,
                opacity: 0.8,
            });
        }
    }

    // 2. Page Numbers
    if (withPageNumbers) {
        const numText = `${i + 1} / ${totalPages}`;
        const numSize = 10;
        const numWidth = regularFont.widthOfTextAtSize(numText, numSize);
        page.drawText(numText, {
            x: (width - numWidth) / 2,
            y: 15,
            size: numSize,
            font: regularFont,
            color: rgb(0, 0, 0),
        });
    }

    // 3. Image Overlay
    if (embeddedImage) {
        const scaleFactor = imgScale / 100; // 0.1 to 1.0
        const imgW = embeddedImage.width * scaleFactor;
        const imgH = embeddedImage.height * scaleFactor;
        
        let x = (width - imgW) / 2;
        let y = (height - imgH) / 2;
        
        const margin = 20;
        if (imgPos === 'tl') { x = margin; y = height - imgH - margin; }
        if (imgPos === 'tr') { x = width - imgW - margin; y = height - imgH - margin; }
        if (imgPos === 'bl') { x = margin; y = margin; }
        if (imgPos === 'br') { x = width - imgW - margin; y = margin; }
        
        page.drawImage(embeddedImage, {
            x, y, width: imgW, height: imgH, opacity: 0.9
        });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  saveAs(blob, `editado_${file.name}`);
};

// --- Converters ---

export const convertToText = async (file: File) => {
    // Infinity for full text extraction
    const text = await extractTextFromPdf(file, Infinity);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${file.name.replace('.pdf', '')}.txt`);
};

export const convertToDocx = async (file: File) => {
    // Infinity for full text extraction
    const text = await extractTextFromPdf(file, Infinity);
    const lines = text.split('\n');

    // Create a new Document
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: lines.map(line => 
                    new Paragraph({
                        children: [new TextRun(line)],
                        spacing: { after: 120 }
                    })
                ),
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${file.name.replace('.pdf', '')}.docx`);
};

export const convertToExcel = async (file: File) => {
    try {
        // Dynamic import to avoid breaking the app if xlsx fails to load
        const XLSX = await import('xlsx');
        
        // Infinity for full text extraction
        const text = await extractTextFromPdf(file, Infinity);
        const lines = text.split('\n').filter(line => line.trim() !== '');

        // Map each line to an array (Row)
        // We try to split by multiple spaces to guess columns, or just dump text
        const rows = lines.map(line => {
            // Simple heuristic: 3 or more spaces is a column break
            return line.split(/\s{3,}/); 
        });

        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "PDF Data");
        
        XLSX.writeFile(workbook, `${file.name.replace('.pdf', '')}.xlsx`);
    } catch (error) {
        console.error('Error converting to Excel:', error);
        alert('Error al convertir a Excel. Por favor, inténtalo de nuevo.');
    }
};

export const convertToImages = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    // Using global pdfjsLib defined in index.html
    const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const zip = new JSZip();
    
    // Iterate pages
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x for better quality
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport: viewport }).promise;
        
        // Canvas to Blob
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
        if (blob) {
            zip.file(`pagina_${i}.jpg`, blob);
        }
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `imagenes_${file.name}.zip`);
};

// --- PPTX Converter ---
export const convertToPptx = async (file: File, lang: Language) => {
    // 1. Extract Text (Limit to ~20 pages to save AI tokens and avoid limits)
    const text = await extractTextFromPdf(file, 20);
    
    // 2. Get Structure from AI
    const structure = await generatePresentationData(text, lang);
    
    // 3. Generate PPTX
    const pptx = new PptxGenJS();
    
    // Set Metadata
    pptx.title = structure.mainTitle;
    
    // Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: '1e293b' }; // Dark Slate Blue background
    titleSlide.addText(structure.mainTitle, { 
        x: 1, y: '40%', w: '80%', h: 1, 
        fontSize: 36, color: 'FFFFFF', bold: true, align: 'center' 
    });
    titleSlide.addText(structure.subtitle || 'Generated by PDF Wizardz.app', {
        x: 1, y: '55%', w: '80%', h: 1,
        fontSize: 18, color: 'cbd5e1', align: 'center'
    });

    // Content Slides
    structure.slides.forEach(s => {
        const slide = pptx.addSlide();
        slide.background = { color: 'F1F5F9' }; // Light Gray
        
        // Header
        slide.addText(s.title, {
            x: 0.5, y: 0.5, w: '90%', h: 0.5,
            fontSize: 24, color: '1e293b', bold: true
        });

        // Bullet Points
        slide.addText(s.bulletPoints.map(bp => `• ${bp}`).join('\n'), {
            x: 0.5, y: 1.2, w: '90%', h: '70%',
            fontSize: 16, color: '334155', lineSpacing: 30
        });
        
        // Speaker Notes
        if (s.speakerNotes) {
            slide.addNotes(s.speakerNotes);
        }
    });

    pptx.writeFile({ fileName: `${file.name.replace('.pdf', '')}_presentation.pptx` });
};