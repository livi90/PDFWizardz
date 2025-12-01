import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { extractTextFromPdf } from './pdfService';
import { extractStructuredData } from './geminiService';

/**
 * Escanea un archivo Excel y extrae todas las claves (variables) definidas por el usuario
 * Busca patrones {{CLAVE}} en todas las celdas del workbook
 * @param excelFile - Archivo Excel a escanear
 * @returns Array de claves únicas encontradas (sin las llaves)
 */
export const getTemplateKeys = async (excelFile: File): Promise<string[]> => {
  try {
    const arrayBuffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellStyles: true,
      cellNF: true,
      cellHTML: false
    });
    
    const markerRegex = /\{\{([^}]+)\}\}/g;
    const foundKeys = new Set<string>();
    
    // Escanear todas las hojas del workbook
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      // Escanear todas las celdas
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          
          if (cell && cell.v && typeof cell.v === 'string') {
            // Buscar todos los marcadores en esta celda
            let match;
            while ((match = markerRegex.exec(cell.v)) !== null) {
              const key = match[1].trim().toUpperCase();
              if (key) {
                foundKeys.add(key);
              }
            }
            // Resetear el regex para la próxima celda
            markerRegex.lastIndex = 0;
          }
        }
      }
    });
    
    return Array.from(foundKeys).sort();
  } catch (error) {
    console.error('Error escaneando plantilla Excel:', error);
    throw new Error(`Error al escanear la plantilla: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Procesa múltiples PDFs y los agrega como filas en una plantilla Excel
 * @param pdfFiles - Array de archivos PDF a procesar
 * @param excelTemplate - Plantilla Excel con marcadores como {{FECHA}}, {{TOTAL}}, etc.
 * @param lang - Idioma para la extracción de datos
 * @param onProgress - Callback opcional para reportar progreso
 */
export const fillExcelTemplate = async (
  pdfFiles: File[],
  excelTemplate: File,
  lang: 'ES' | 'EN' = 'ES',
  onProgress?: (current: number, total: number) => void,
  targetKeys?: string[], // Claves específicas a buscar (extracción dirigida)
  forceOCR: boolean = false // Forzar OCR para PDFs escaneados
): Promise<void> => {
  try {
    if (pdfFiles.length === 0) {
      throw new Error('No se proporcionaron archivos PDF');
    }

    // 1. Leer la plantilla Excel
    const arrayBuffer = await excelTemplate.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellStyles: true,
      cellNF: true,
      cellHTML: false
    });
    
    // 2. Procesar cada PDF y agregarlo como fila
    for (let pdfIndex = 0; pdfIndex < pdfFiles.length; pdfIndex++) {
      const pdfFile = pdfFiles[pdfIndex];
      
      if (onProgress) {
        onProgress(pdfIndex + 1, pdfFiles.length);
      }
      
      // 2.1. Extraer texto del PDF
      const pdfText = await extractTextFromPdf(pdfFile, Infinity, forceOCR);
      
      // 2.2. Extraer datos estructurados usando Gemini (con claves dirigidas si se proporcionan)
      const extractedData = await extractStructuredData(pdfText, lang, targetKeys);
      
      // 2.3. Procesar todas las hojas del workbook
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        
        // Encontrar la fila plantilla (primera fila con marcadores)
        const templateRow = findTemplateRow(worksheet);
        
        if (templateRow === -1) {
          console.warn(`No se encontró fila plantilla en la hoja ${sheetName}`);
          return;
        }
        
        // Determinar la fila destino (después de la última fila con datos o después de la plantilla)
        const currentRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const targetRow = pdfIndex === 0 ? templateRow : currentRange.e.r + 1;
        
        // Copiar la fila plantilla y rellenarla con datos
        copyAndFillRow(worksheet, templateRow, targetRow, extractedData);
        
        // Actualizar el rango del worksheet
        const newRange = {
          s: { r: 0, c: 0 },
          e: { r: Math.max(currentRange.e.r, targetRow), c: currentRange.e.c }
        };
        worksheet['!ref'] = XLSX.utils.encode_range(newRange);
      });
    }
    
    // 3. Generar el archivo Excel relleno
    const excelBuffer = XLSX.write(workbook, {
      type: 'array',
      bookType: 'xlsx',
      cellStyles: true,
      cellNF: true
    });
    
    // 4. Descargar el archivo
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const outputFileName = excelTemplate.name.replace('.xlsx', `_relleno_${pdfFiles.length}_facturas.xlsx`)
      .replace('.xls', `_relleno_${pdfFiles.length}_facturas.xlsx`);
    
    saveAs(blob, outputFileName);
    
  } catch (error) {
    console.error('Error procesando plantilla Excel:', error);
    throw new Error(`Error al procesar la plantilla: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Encuentra la fila que contiene marcadores (fila plantilla)
 */
function findTemplateRow(worksheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const markerRegex = /\{\{([^}]+)\}\}/;
  
  // Buscar desde la primera fila hasta encontrar una con marcadores
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v && typeof cell.v === 'string' && markerRegex.test(cell.v)) {
        return row;
      }
    }
  }
  
  return -1;
}

/**
 * Copia una fila plantilla y la rellena con datos extraídos
 */
function copyAndFillRow(
  worksheet: XLSX.WorkSheet,
  sourceRow: number,
  targetRow: number,
  extractedData: Record<string, any>
): void {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const markerRegex = /\{\{([^}]+)\}\}/g;
  
  // Copiar cada celda de la fila plantilla
  for (let col = range.s.c; col <= range.e.c; col++) {
    const sourceCellAddress = XLSX.utils.encode_cell({ r: sourceRow, c: col });
    const targetCellAddress = XLSX.utils.encode_cell({ r: targetRow, c: col });
    const sourceCell = worksheet[sourceCellAddress];
    
    if (sourceCell) {
      // Crear una copia profunda de la celda
      const newCell: XLSX.CellObject = {
        ...sourceCell,
        v: sourceCell.v,
        t: sourceCell.t,
        f: sourceCell.f ? adjustFormulaRow(sourceCell.f, sourceRow, targetRow) : undefined,
        s: sourceCell.s ? { ...sourceCell.s } : undefined
      };
      
      // Si la celda tiene marcadores, reemplazarlos
      if (newCell.v && typeof newCell.v === 'string') {
        let cellValue = newCell.v;
        let hasMarkers = false;
        
        cellValue = cellValue.replace(markerRegex, (match, markerName) => {
          hasMarkers = true;
          const normalizedMarker = markerName.trim().toUpperCase();
          const value = findValueInData(extractedData, normalizedMarker);
          
          if (value !== null && value !== undefined) {
            return String(value);
          }
          
          return match;
        });
        
        if (hasMarkers) {
          newCell.v = cellValue;
          newCell.w = cellValue;
        }
      }
      
      worksheet[targetCellAddress] = newCell;
    }
  }
}

/**
 * Ajusta las referencias de fila en una fórmula
 */
function adjustFormulaRow(formula: string, sourceRow: number, targetRow: number): string {
  const rowDiff = targetRow - sourceRow;
  if (rowDiff === 0) return formula;
  
  // Reemplazar referencias de fila (ej: A2 -> A5 si rowDiff = 3)
  return formula.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
    const newRow = parseInt(row) + rowDiff;
    return col + newRow;
  });
};

/**
 * Busca un valor en los datos extraídos basándose en el nombre del marcador
 */
function findValueInData(data: Record<string, any>, markerName: string): any {
  // Normalizar el nombre del marcador (mayúsculas para búsqueda)
  const normalized = markerName.trim().toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
  
  // También normalizar a minúsculas (como la IA devuelve cuando hay targetKeys)
  const normalizedLower = normalized.toLowerCase();
  
  // Buscar coincidencias exactas o parciales (tanto en mayúsculas como minúsculas)
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toUpperCase().replace(/\s+/g, '_');
    const normalizedKeyLower = key.toLowerCase().replace(/\s+/g, '_');
    
    // Coincidencia exacta (mayúsculas)
    if (normalizedKey === normalized) {
      return value;
    }
    
    // Coincidencia exacta (minúsculas - para campos personalizados)
    if (normalizedKeyLower === normalizedLower) {
      return value;
    }
    
    // Coincidencia parcial (ej: "FECHA" coincide con "FECHA_EMISION")
    if (normalizedKey.includes(normalized) || normalized.includes(normalizedKey)) {
      return value;
    }
    
    // Coincidencia parcial (minúsculas)
    if (normalizedKeyLower.includes(normalizedLower) || normalizedLower.includes(normalizedKeyLower)) {
      return value;
    }
  }
  
  // Buscar variaciones comunes
  const variations: Record<string, string[]> = {
    'FECHA': ['FECHA', 'DATE', 'FECHA_EMISION', 'FECHA_FACTURA', 'FECHA_DOCUMENTO'],
    'TOTAL': ['TOTAL', 'TOTAL_AMOUNT', 'MONTO_TOTAL', 'IMPORTE_TOTAL', 'AMOUNT'],
    'IMPUESTO': ['IMPUESTO', 'TAX', 'IVA', 'IMPUESTO_IVA', 'TAX_AMOUNT'],
    'EMPRESA': ['EMPRESA', 'COMPANY', 'EMISOR', 'PROVEEDOR', 'VENDEDOR', 'SUPPLIER'],
    'CLIENTE': ['CLIENTE', 'CUSTOMER', 'COMPRADOR', 'BUYER'],
    'NUMERO': ['NUMERO', 'NUMBER', 'NUMERO_FACTURA', 'INVOICE_NUMBER', 'NUMERO_DOCUMENTO'],
    'CONCEPTO': ['CONCEPTO', 'CONCEPT', 'DESCRIPCION', 'DESCRIPTION', 'DETALLE'],
    'SUBTOTAL': ['SUBTOTAL', 'SUBTOTAL_AMOUNT', 'BASE_IMPONIBLE'],
  };
  
  for (const [standard, aliases] of Object.entries(variations)) {
    if (aliases.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
      // Buscar en los datos con estos nombres
      for (const alias of aliases) {
        for (const [key, value] of Object.entries(data)) {
          const normalizedKey = key.toUpperCase().replace(/\s+/g, '_');
          if (normalizedKey.includes(alias) || alias.includes(normalizedKey)) {
            return value;
          }
        }
      }
    }
  }
  
  return null;
}

