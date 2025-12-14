import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import JSZip from 'jszip';
import { extractTextFromPdf } from './pdfService';
import { extractStructuredData } from './geminiService';

/**
 * Genera una plantilla Excel automáticamente desde campos sugeridos
 * @param fields - Array de campos sugeridos con sus nombres
 * @param filename - Nombre del archivo a generar
 */
export const generateTemplateFromFields = (fields: string[], filename: string = 'plantilla_auto.xlsx'): void => {
  try {
    // Crear un nuevo workbook
    const workbook = XLSX.utils.book_new();
    
    // Crear worksheet con encabezados
    const headers = fields.map(field => field);
    const data = [headers, fields.map(() => '')]; // Fila de encabezados + fila vacía con marcadores
    
    // Agregar marcadores en la segunda fila
    for (let col = 0; col < fields.length; col++) {
      data[1][col] = `{{${fields[col]}}}`;
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Estilizar encabezados (fila 1)
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } }, // Indigo
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    
    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');
    
    // Generar archivo
    const excelBuffer = XLSX.write(workbook, {
      type: 'array',
      bookType: 'xlsx',
      cellStyles: true
    });
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error generando plantilla:', error);
    throw new Error(`Error al generar la plantilla: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

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
  forceOCR: boolean = false, // Forzar OCR para PDFs escaneados
  renameFiles: boolean = false, // Renombrar archivos basándose en datos extraídos
  normalizePercentages: boolean = false // Normalizar porcentajes (21% -> 0.21)
): Promise<{ workbook: XLSX.WorkBook; extractedData: Array<{pdfName: string; data: Record<string, any>}> }> => {
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
    
    // 1.5. MEJORA UX: Duplicar automáticamente filas plantilla si solo hay una
    // Esto elimina la necesidad de que el usuario copie y pegue manualmente
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const templateRow = findTemplateRow(worksheet);
      
      if (templateRow !== -1) {
        // Contar cuántas filas con marcadores existen
        const rowsWithMarkers = countRowsWithMarkers(worksheet);
        
        // Si solo hay una fila plantilla y hay más PDFs que filas, duplicar automáticamente
        if (rowsWithMarkers === 1 && pdfFiles.length > 1) {
          const currentRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          let lastRow = currentRange.e.r;
          
          // Duplicar la fila plantilla hasta tener suficientes filas
          for (let i = 1; i < pdfFiles.length; i++) {
            lastRow++;
            copyAndFillRow(worksheet, templateRow, lastRow, {}); // Copiar sin rellenar aún
          }
          
          // Actualizar el rango del worksheet
          const newRange = {
            s: { r: 0, c: 0 },
            e: { r: lastRow, c: currentRange.e.c }
          };
          worksheet['!ref'] = XLSX.utils.encode_range(newRange);
        }
      }
    });
    
    // 2. Procesar cada PDF y agregarlo como fila
    const renamedFiles: Array<{ originalName: string; newName: string; file: File }> = [];
    const allExtractedData: Array<{pdfName: string; data: Record<string, any>}> = [];
    
    for (let pdfIndex = 0; pdfIndex < pdfFiles.length; pdfIndex++) {
      const pdfFile = pdfFiles[pdfIndex];
      
      if (onProgress) {
        onProgress(pdfIndex + 1, pdfFiles.length);
      }
      
      // 2.1. Extraer texto del PDF
      const pdfText = await extractTextFromPdf(pdfFile, Infinity, forceOCR);
      
      // 2.2. Extraer datos estructurados usando Gemini (con claves dirigidas si se proporcionan)
      const extractedData = await extractStructuredData(pdfText, lang, targetKeys);
      
      // Guardar datos extraídos para revisión
      allExtractedData.push({
        pdfName: pdfFile.name,
        data: extractedData
      });
      
      // 2.2.5. Generar nombre de archivo si está habilitado el renombrado
      // (Se hará después de la revisión si el usuario confirma)
      
      // 2.3. Procesar todas las hojas del workbook
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        
        // Encontrar todas las filas con marcadores
        const templateRows = findAllTemplateRows(worksheet);
        
        if (templateRows.length === 0) {
          console.warn(`No se encontró fila plantilla en la hoja ${sheetName}`);
          return;
        }
        
        // MEJORA 2: Colocar datos de forma continua, saltando solo celdas ocupadas individualmente
        // Usar la fila correspondiente al índice del PDF (o la primera si hay más PDFs que filas)
        const sourceRowIndex = Math.min(pdfIndex, templateRows.length - 1);
        const sourceRow = templateRows[sourceRowIndex];
        
        // Para la primera factura, empezar justo debajo de la fila plantilla
        // Para facturas siguientes, encontrar dónde terminó la anterior
        let startDataRow = sourceRow + 1;
        
        if (pdfIndex > 0) {
          // Encontrar la última fila donde se colocaron datos en la factura anterior
          // Buscar en todas las columnas para encontrar la fila más baja con datos
          startDataRow = findLastDataRowForPreviousInvoice(worksheet, sourceRow, pdfIndex) + 1;
        }
        
        // Rellenar la fila con los datos extraídos (cada columna busca su propia celda vacía)
        copyAndFillRowContinuous(worksheet, sourceRow, startDataRow, extractedData, normalizePercentages);
        
        // Actualizar el rango del worksheet
        const currentRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const lastDataRow = findLastDataRowForPreviousInvoice(worksheet, sourceRow, pdfIndex + 1);
        const newRange = {
          s: { r: 0, c: 0 },
          e: { r: Math.max(currentRange.e.r, lastDataRow), c: currentRange.e.c }
        };
        worksheet['!ref'] = XLSX.utils.encode_range(newRange);
      });
    }
    
    // 3. Retornar workbook y datos extraídos para revisión (no descargar aún)
    return {
      workbook,
      extractedData: allExtractedData
    };
    
  } catch (error) {
    console.error('Error procesando plantilla Excel:', error);
    throw new Error(`Error al procesar la plantilla: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Descarga el workbook como archivo Excel
 */
export const downloadExcelWorkbook = (
  workbook: XLSX.WorkBook,
  excelTemplate: File,
  pdfFilesCount: number,
  renameFiles: boolean = false,
  renamedFiles: Array<{ originalName: string; newName: string; file: File }> = []
): void => {
  try {
    // Generar el archivo Excel
    const excelBuffer = XLSX.write(workbook, {
      type: 'array',
      bookType: 'xlsx',
      cellStyles: true
    });
    
    // Crear blob
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Generar nombre de archivo asegurando extensión .xlsx
    let outputFileName = excelTemplate.name;
    // Remover cualquier extensión existente (.xlsx, .xls, .xlsxx, etc.)
    outputFileName = outputFileName.replace(/\.(xlsx|xls|xlss?x?)$/i, '');
    // Agregar el sufijo y la extensión correcta
    outputFileName = `${outputFileName}_relleno_${pdfFilesCount}_facturas.xlsx`;
    
    // Si está habilitado el renombrado, crear ZIP con archivos renombrados
    if (renameFiles && renamedFiles.length > 0) {
      const zip = new JSZip();
      
      // Agregar Excel al ZIP
      zip.file(outputFileName, excelBuffer);
      
      // Agregar PDFs renombrados al ZIP
      for (const renamedFile of renamedFiles) {
        zip.file(renamedFile.newName, renamedFile.file);
      }
      
      // Generar y descargar ZIP
      zip.generateAsync({ type: 'blob' }).then(zipBlob => {
        saveAs(zipBlob, `facturas_procesadas_${Date.now()}.zip`);
      });
    } else {
      // Solo descargar Excel
      saveAs(blob, outputFileName);
    }
  } catch (error) {
    console.error('Error descargando Excel:', error);
    throw new Error(`Error al descargar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Genera un nombre de archivo basado en los datos extraídos
 * Formato: YYYY-MM-DD_Empresa_Numero.pdf
 */
export function generateFileNameFromData(data: Record<string, any>, originalName: string, lang: 'ES' | 'EN' = 'ES'): string {
  // Extraer componentes
  let fecha = data.fecha || data.date || '';
  let empresa = data.empresa || data.company || data.proveedor || data.supplier || '';
  let numero = data.numero || data.number || data.numero_factura || data.invoice_number || '';
  let total = data.total || data.total_amount || '';
  
  // Normalizar fecha (convertir a YYYY-MM-DD)
  if (fecha) {
    // Intentar parsear diferentes formatos
    const dateMatch = fecha.match(/(\d{4})[-\/](\d{2})[-\/](\d{2})/) || fecha.match(/(\d{2})[-\/](\d{2})[-\/](\d{4})/);
    if (dateMatch) {
      if (dateMatch[1].length === 4) {
        fecha = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      } else {
        fecha = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      }
    } else {
      fecha = fecha.replace(/[^0-9]/g, '').substring(0, 8);
      if (fecha.length === 8) {
        fecha = `${fecha.substring(0, 4)}-${fecha.substring(4, 6)}-${fecha.substring(6, 8)}`;
      }
    }
  }
  
  // Normalizar empresa (limpiar caracteres especiales, limitar longitud)
  if (empresa) {
    empresa = empresa
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)
      .trim();
  }
  
  // Normalizar número (limpiar caracteres especiales)
  if (numero) {
    numero = numero
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 20)
      .trim();
  }
  
  // Construir nombre
  const parts: string[] = [];
  if (fecha) parts.push(fecha);
  if (empresa) parts.push(empresa);
  if (numero) parts.push(numero);
  
  // Si no hay datos suficientes, usar nombre original con timestamp
  if (parts.length === 0) {
    return `factura_${Date.now()}.pdf`;
  }
  
  let newName = parts.join('_');
  
  // Asegurar extensión .pdf
  if (!newName.toLowerCase().endsWith('.pdf')) {
    newName += '.pdf';
  }
  
  // Limitar longitud total
  if (newName.length > 200) {
    newName = newName.substring(0, 200) + '.pdf';
  }
  
  return newName;
}

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
 * Cuenta cuántas filas tienen marcadores ({{CLAVE}})
 */
function countRowsWithMarkers(worksheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const markerRegex = /\{\{([^}]+)\}\}/;
  const rowsWithMarkers = new Set<number>();
  
  // Escanear todas las filas
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v && typeof cell.v === 'string' && markerRegex.test(cell.v)) {
        rowsWithMarkers.add(row);
        break; // Solo necesitamos saber que esta fila tiene marcadores
      }
    }
  }
  
  return rowsWithMarkers.size;
}

/**
 * Encuentra todas las filas que contienen marcadores (filas plantilla)
 */
function findAllTemplateRows(worksheet: XLSX.WorkSheet): number[] {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const markerRegex = /\{\{([^}]+)\}\}/;
  const templateRows: number[] = [];
  
  // Escanear todas las filas
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v && typeof cell.v === 'string' && markerRegex.test(cell.v)) {
        templateRows.push(row);
        break; // Solo necesitamos saber que esta fila tiene marcadores
      }
    }
  }
  
  return templateRows.sort((a, b) => a - b); // Ordenar por número de fila
}

/**
 * Normaliza valores para Excel (números, fechas, porcentajes, etc.)
 * Convierte números con punto decimal a formato con coma para Excel en español
 * Normaliza fechas a formato estándar
 * Normaliza porcentajes si está habilitado (21% -> 0.21)
 */
export function normalizeValueForExcel(
  value: any,
  markerName: string,
  normalizePercentages: boolean = false
): XLSX.CellObject {
  // Si el valor es null o undefined, retornar celda vacía
  if (value === null || value === undefined) {
    return {
      v: '',
      t: 's',
      w: ''
    };
  }

  // Convertir a string para análisis
  let valueStr = String(value).trim();
  
  // MEJORA: Normalizar porcentajes si está habilitado
  if (normalizePercentages) {
    // Detectar porcentajes (21%, 21 %, etc.)
    const percentagePattern = /^(\d+([.,]\d+)?)\s*%$/;
    const percentageMatch = valueStr.match(percentagePattern);
    if (percentageMatch) {
      // Convertir porcentaje a decimal (21% -> 0.21)
      const percentageValue = parseFloat(percentageMatch[1].replace(',', '.'));
      if (!isNaN(percentageValue)) {
        const decimalValue = percentageValue / 100;
        valueStr = String(decimalValue);
        // Continuar procesamiento como número
      }
    }
  }
  
  // Detectar si es un número (incluyendo decimales con punto o coma)
  // También detectar números con separadores de miles (1.234,56 o 1,234.56)
  const numberPattern = /^-?\d{1,3}([.,]\d{3})*([.,]\d+)?$|^-?\d+([.,]\d+)?$/;
  const isNumber = numberPattern.test(valueStr.replace(/\s/g, '')); // Eliminar espacios
  
  // Detectar si es una fecha (varios formatos comunes)
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // D/M/YYYY o DD/MM/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // D-M-YYYY o DD-MM-YYYY
  ];
  
  const isDate = datePatterns.some(pattern => pattern.test(valueStr));
  
  // Si es un número, normalizar decimales (punto -> coma) y convertir a número
  if (isNumber) {
    // Limpiar el string (eliminar espacios y caracteres no numéricos excepto punto y coma)
    const cleanValue = valueStr.replace(/\s/g, '').replace(/[^\d.,-]/g, '');
    
    // Detectar si tiene separador de miles (punto) y decimales (coma) -> formato europeo: 1.234,56
    // O si tiene separador de miles (coma) y decimales (punto) -> formato americano: 1,234.56
    const hasThousandsSeparator = /^\d{1,3}([.,]\d{3})+([.,]\d+)?$/.test(cleanValue);
    
    let numberValue: number;
    let normalizedNumberStr: string;
    
    if (hasThousandsSeparator) {
      // Tiene separador de miles, necesitamos determinar cuál es cuál
      const lastComma = cleanValue.lastIndexOf(',');
      const lastDot = cleanValue.lastIndexOf('.');
      
      if (lastComma > lastDot) {
        // Formato europeo: 1.234,56 (punto = miles, coma = decimales)
        normalizedNumberStr = cleanValue; // Ya está en formato correcto
        numberValue = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
      } else {
        // Formato americano: 1,234.56 (coma = miles, punto = decimales)
        normalizedNumberStr = cleanValue.replace(/,/g, '').replace('.', ','); // Convertir a formato español
        numberValue = parseFloat(cleanValue.replace(/,/g, ''));
      }
      } else {
        // No tiene separador de miles, solo decimales
        // Si tiene punto, asumir que es decimal (formato inglés/estándar) -> convertir a número
        if (cleanValue.includes('.')) {
          numberValue = parseFloat(cleanValue);
          // Para display, convertir a formato español (coma)
          normalizedNumberStr = cleanValue.replace('.', ',');
        } else if (cleanValue.includes(',')) {
          // Ya tiene coma (formato español) -> convertir a número reemplazando coma por punto
          numberValue = parseFloat(cleanValue.replace(',', '.'));
          normalizedNumberStr = cleanValue; // Mantener formato español
        } else {
          // Entero sin decimales
          numberValue = parseFloat(cleanValue);
          normalizedNumberStr = cleanValue;
        }
      }
      
      // Si es un número válido, retornar como número
      if (!isNaN(numberValue)) {
        // IMPORTANTE: Excel internamente siempre usa punto para números en el campo 'v'
        // Esto es crítico para que las fórmulas funcionen correctamente
        // El campo 'w' (display) puede tener coma, pero Excel lo regenerará según formato de celda
        // Guardamos el número real en 'v' (con punto interno) para compatibilidad con fórmulas
        return {
          v: numberValue, // Valor numérico real (Excel internamente usa punto, fórmulas funcionarán)
          t: 'n', // Tipo numérico (CRÍTICO: permite que las fórmulas funcionen)
          w: normalizedNumberStr // Display con formato español (coma), pero Excel puede regenerarlo
        };
      }
  }
  
  // Si es una fecha, normalizar a formato estándar
  if (isDate) {
    try {
      // Intentar parsear la fecha
      let date: Date | null = null;
      
      // Probar diferentes formatos
      if (valueStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD
        date = new Date(valueStr);
      } else if (valueStr.match(/^\d{2}\/\d{2}\/\d{4}$/) || valueStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
        // DD/MM/YYYY o DD-MM-YYYY
        const parts = valueStr.split(/[\/\-]/);
        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else if (valueStr.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        // YYYY/MM/DD
        const parts = valueStr.split('/');
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else if (valueStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) || valueStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
        // D/M/YYYY o D-M-YYYY
        const parts = valueStr.split(/[\/\-]/);
        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      
      if (date && !isNaN(date.getTime())) {
        // Excel usa números de serie para fechas (días desde 1900-01-01)
        // Pero podemos guardarlo como string formateado o como número de serie
        // Por simplicidad, guardamos como string formateado en formato estándar
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        return {
          v: formattedDate,
          t: 's', // Tipo string (Excel puede convertirlo a fecha si tiene formato de celda)
          w: formattedDate
        };
      }
    } catch (e) {
      // Si falla el parseo de fecha, continuar como texto
    }
  }
  
  // Si no es número ni fecha, retornar como texto
  return {
    v: valueStr,
    t: 's',
    w: valueStr
  };
}

/**
 * Copia una fila plantilla y la rellena con datos extraídos de forma continua
 * MEJORA: Preserva los marcadores {{}} originales y coloca los datos en celdas vacías consecutivas
 * Cada columna busca su propia celda vacía, saltando solo las ocupadas individualmente
 */
function copyAndFillRowContinuous(
  worksheet: XLSX.WorkSheet,
  sourceRow: number,
  startDataRow: number,
  extractedData: Record<string, any>,
  normalizePercentages: boolean = false
): void {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const markerRegex = /\{\{([^}]+)\}\}/g;
  
  // Rastrear la fila actual para cada columna (empezar todas desde startDataRow)
  const columnCurrentRows: Map<number, number> = new Map();
  
  // Copiar cada celda de la fila plantilla
  for (let col = range.s.c; col <= range.e.c; col++) {
    const sourceCellAddress = XLSX.utils.encode_cell({ r: sourceRow, c: col });
    const sourceCell = worksheet[sourceCellAddress];
    
    if (sourceCell) {
      // Preservar la celda original con el marcador (no modificar)
      const targetCellAddress = XLSX.utils.encode_cell({ r: sourceRow, c: col });
      const newCell: XLSX.CellObject = {
        ...sourceCell,
        v: sourceCell.v,
        t: sourceCell.t,
        f: sourceCell.f,
        s: sourceCell.s ? { ...sourceCell.s } : undefined
      };
      worksheet[targetCellAddress] = newCell;
      
      // Si la celda tiene marcadores, buscar valor y colocarlo en celda vacía
      if (newCell.v && typeof newCell.v === 'string') {
        const cellValue = String(newCell.v);
        const markers = [];
        let match;
        
        // Resetear regex para esta celda
        markerRegex.lastIndex = 0;
        
        // Encontrar todos los marcadores en la celda
        while ((match = markerRegex.exec(cellValue)) !== null) {
          const markerName = match[1].trim().toUpperCase();
          const normalizedMarker = markerName.replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
          const value = findValueInData(extractedData, normalizedMarker);
          
          if (value !== null && value !== undefined) {
            markers.push({ markerName, value, originalMatch: match[0] });
          }
        }
        
        // Si hay marcadores, colocar el valor en la siguiente celda vacía de esta columna
        if (markers.length > 0) {
          const valueToPlace = markers[0].value;
          const markerName = markers[0].markerName;
          
          // Obtener la fila actual para esta columna (o empezar desde startDataRow)
          let currentRowForCol = columnCurrentRows.get(col) || startDataRow;
          
          // Buscar la siguiente celda vacía en esta columna específica
          let foundEmpty = false;
          const maxSearchRows = 100; // Limitar búsqueda
          
          for (let i = 0; i < maxSearchRows; i++) {
            const checkRow = currentRowForCol + i;
            const checkAddress = XLSX.utils.encode_cell({ r: checkRow, c: col });
            const checkCell = worksheet[checkAddress];
            
            // Celda está vacía si no existe, o tiene valor vacío/cero y no tiene fórmula
            const isEmpty = !checkCell || (
              (checkCell.v === '' || checkCell.v === 0 || checkCell.v === '0' || checkCell.v === null || checkCell.v === undefined) &&
              !checkCell.f
            );
            
            if (isEmpty) {
              // Normalizar el valor antes de colocarlo (números, fechas, etc.)
              const normalizedValue = normalizeValueForExcel(valueToPlace, markerName);
              
              // Colocar el valor aquí
              worksheet[checkAddress] = normalizedValue;
              
              // Actualizar la fila actual para esta columna (siguiente fila para el próximo dato)
              columnCurrentRows.set(col, checkRow + 1);
              foundEmpty = true;
              break;
            }
          }
          
          if (!foundEmpty) {
            // Si no se encuentra celda vacía, colocar en la siguiente disponible
            const fallbackRow = currentRowForCol + maxSearchRows;
            const fallbackAddress = XLSX.utils.encode_cell({ r: fallbackRow, c: col });
            
            // Normalizar el valor antes de colocarlo
            const normalizedValue = normalizeValueForExcel(valueToPlace, markerName, normalizePercentages);
            worksheet[fallbackAddress] = normalizedValue;
            
            columnCurrentRows.set(col, fallbackRow + 1);
          }
        }
      }
    }
  }
}

/**
 * Función legacy para compatibilidad (ya no se usa pero la mantenemos por si acaso)
 */
function copyAndFillRow(
  worksheet: XLSX.WorkSheet,
  sourceRow: number,
  targetRow: number,
  extractedData: Record<string, any>
): void {
  copyAndFillRowContinuous(worksheet, sourceRow, targetRow + 1, extractedData);
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
}

/**
 * Encuentra la última fila donde se colocaron datos para una factura específica
 * Busca en todas las columnas para encontrar la fila más baja con datos de esa factura
 */
function findLastDataRowForPreviousInvoice(
  worksheet: XLSX.WorkSheet,
  templateRow: number,
  currentPdfIndex: number
): number {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Si es la primera factura, retornar la fila plantilla
  if (currentPdfIndex === 0) {
    return templateRow;
  }
  
  // Buscar desde la fila plantilla hacia abajo
  let lastDataRow = templateRow;
  const maxSearchRows = 200; // Limitar búsqueda
  
  // Buscar la fila más baja que tenga datos en cualquier columna
  // (excluyendo celdas con fórmulas, que no deben contarse)
  for (let row = templateRow + 1; row <= Math.min(range.e.r, templateRow + maxSearchRows); row++) {
    let hasDataInRow = false;
    
    // Verificar todas las columnas de esta fila
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell && !cell.f) { // No contar fórmulas
        // Verificar si tiene datos (no vacío, no cero, no null)
        if (cell.v !== undefined && 
            cell.v !== null && 
            cell.v !== '' && 
            cell.v !== 0 && 
            cell.v !== '0') {
          hasDataInRow = true;
          break; // Solo necesitamos saber que esta fila tiene datos
        }
      }
    }
    
    // Si encontramos datos en esta fila, actualizar lastDataRow
    if (hasDataInRow) {
      lastDataRow = row;
    }
  }
  
  return lastDataRow;
}

/**
 * Verifica si una fila tiene marcadores {{}}
 */
function hasMarkersInRow(worksheet: XLSX.WorkSheet, row: number): boolean {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const markerRegex = /\{\{([^}]+)\}\}/;
  
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && typeof cell.v === 'string' && markerRegex.test(cell.v)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Encuentra la siguiente fila plantilla disponible después de una fila dada
 */
function findNextTemplateRow(
  worksheet: XLSX.WorkSheet,
  startRow: number,
  templateRows: number[]
): number {
  // Buscar la siguiente fila plantilla que esté después de startRow
  for (const templateRow of templateRows) {
    if (templateRow > startRow) {
      return templateRow;
    }
  }
  
  return -1;
}

/**
 * Duplica una fila plantilla en una nueva posición
 */
function duplicateTemplateRow(
  worksheet: XLSX.WorkSheet,
  sourceRow: number,
  targetRow: number
): void {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  for (let col = range.s.c; col <= range.e.c; col++) {
    const sourceCellAddress = XLSX.utils.encode_cell({ r: sourceRow, c: col });
    const targetCellAddress = XLSX.utils.encode_cell({ r: targetRow, c: col });
    const sourceCell = worksheet[sourceCellAddress];
    
    if (sourceCell) {
      // Crear una copia de la celda
      const newCell: XLSX.CellObject = {
        ...sourceCell,
        v: sourceCell.v,
        t: sourceCell.t,
        f: sourceCell.f ? adjustFormulaRow(sourceCell.f, sourceRow, targetRow) : undefined,
        s: sourceCell.s ? { ...sourceCell.s } : undefined
      };
      
      worksheet[targetCellAddress] = newCell;
    }
  }
}

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