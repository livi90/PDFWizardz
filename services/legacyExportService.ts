/**
 * Servicio de exportación Legacy para ERPs antiguos (A3, Sage, ContaPlus)
 * Genera archivos de texto plano con formato fijo o delimitado, codificados en ANSI
 */

import saveAs from 'file-saver';

// Tipos para los esquemas ERP
export interface ERPColumn {
  name: string;
  position: number;
  width: number;
  type: 'string' | 'numeric' | 'date';
  format?: string;
  decimals?: number;
  padding: 'zero' | 'space' | 'none';
  align: 'left' | 'right';
  required: boolean;
  description: string;
}

export interface ERPSchema {
  name: string;
  version: string;
  description: string;
  encoding: 'windows-1252' | 'iso-8859-1' | 'utf-8';
  lineEnding: '\r\n' | '\n' | '\r';
  columns: ERPColumn[];
  separator: string;
  fixedWidth: boolean;
}

export type ERPType = 'a3' | 'sage' | 'contaplus';

/**
 * Carga un esquema ERP desde los archivos JSON
 */
export const loadERPSchema = async (erpType: ERPType): Promise<ERPSchema> => {
  try {
    // Intentar cargar desde public/data primero, luego desde data como fallback
    let response = await fetch(`/data/erpSchemas/${erpType}.json`);
    if (!response.ok) {
      // Fallback: intentar cargar desde la ruta relativa
      response = await fetch(`./data/erpSchemas/${erpType}.json`);
    }
    if (!response.ok) {
      throw new Error(`No se pudo cargar el esquema para ${erpType}`);
    }
    const schema = await response.json() as ERPSchema;
    return schema;
  } catch (error) {
    console.error(`Error cargando esquema ${erpType}:`, error);
    throw new Error(`Error al cargar el esquema ERP: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Formatea un valor según las especificaciones de la columna
 */
export const formatValue = (value: any, column: ERPColumn): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  let formatted: string = '';

  switch (column.type) {
    case 'date':
      formatted = formatDate(value, column.format || 'YYYYMMDD');
      break;
    
    case 'numeric':
      if (column.format === 'decimal') {
        const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
        if (isNaN(num)) {
          formatted = '0';
        } else {
          const decimals = column.decimals || 2;
          formatted = num.toFixed(decimals).replace('.', ''); // Sin punto decimal para ERPs antiguos
        }
      } else {
        formatted = String(Math.floor(Number(value) || 0));
      }
      break;
    
    case 'string':
    default:
      formatted = String(value);
      break;
  }

  // Aplicar padding
  formatted = applyPadding(formatted, column);

  return formatted;
};

/**
 * Formatea una fecha según el formato especificado
 */
export const formatDate = (value: any, format: string): string => {
  let date: Date;
  
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    // Intentar parsear diferentes formatos de fecha
    const dateStr = value.trim();
    
    // Formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      date = new Date(year, month - 1, day);
    }
    // Formato DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/').map(Number);
      date = new Date(year, month - 1, day);
    }
    // Formato DD-MM-YYYY
    else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-').map(Number);
      date = new Date(year, month - 1, day);
    }
    else {
      date = new Date(value);
    }
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) {
    date = new Date(); // Fecha actual si no se puede parsear
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (format) {
    case 'YYYYMMDD':
      return `${year}${month}${day}`;
    case 'DDMMYYYY':
      return `${day}${month}${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    default:
      return `${year}${month}${day}`;
  }
};

/**
 * Aplica padding según las especificaciones de la columna
 */
export const applyPadding = (value: string, column: ERPColumn): string => {
  const maxLength = column.width;
  let padded = value;

  // Truncar si es muy largo
  if (padded.length > maxLength) {
    padded = padded.substring(0, maxLength);
  }

  // Aplicar padding según el tipo
  switch (column.padding) {
    case 'zero':
      if (column.align === 'right') {
        padded = padded.padStart(maxLength, '0');
      } else {
        padded = padded.padEnd(maxLength, '0');
      }
      break;
    
    case 'space':
      if (column.align === 'right') {
        padded = padded.padStart(maxLength, ' ');
      } else {
        padded = padded.padEnd(maxLength, ' ');
      }
      break;
    
    case 'none':
      // Sin padding, solo truncar si es necesario
      break;
  }

  return padded;
};

/**
 * Convierte una cadena UTF-8 a codificación ANSI (Windows-1252 o ISO-8859-1)
 */
export const convertToANSI = (text: string, encoding: 'windows-1252' | 'iso-8859-1'): Uint8Array => {
  // Mapeo básico de caracteres especiales comunes
  const charMap: Record<string, number> = {
    'á': 225, 'é': 233, 'í': 237, 'ó': 243, 'ú': 250,
    'Á': 193, 'É': 201, 'Í': 205, 'Ó': 211, 'Ú': 218,
    'ñ': 241, 'Ñ': 209,
    'ü': 252, 'Ü': 220,
    '€': 128, // Windows-1252
  };

  const bytes: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    // ASCII básico (0-127)
    if (code < 128) {
      bytes.push(code);
    }
    // Caracteres especiales mapeados
    else if (charMap[char] !== undefined) {
      bytes.push(charMap[char]);
    }
    // Intentar usar TextEncoder si está disponible (fallback)
    else {
      // Para caracteres no mapeados, usar el código UTF-8 truncado
      // Esto no es perfecto pero funciona para la mayoría de casos
      if (code < 256) {
        bytes.push(code);
      } else {
        // Reemplazar con espacio si no se puede mapear
        bytes.push(32);
      }
    }
  }
  
  return new Uint8Array(bytes);
};

/**
 * Genera un asiento contable desde datos extraídos
 * Mapea campos comunes de facturas a campos de asientos contables
 */
export interface AccountingEntry {
  fecha: string;
  cuenta_debe?: string;
  cuenta_haber?: string;
  concepto: string;
  debe?: number;
  haber?: number;
  numero_asiento?: number;
  ejercicio?: number;
  periodo?: number;
  apunte?: number;
}

/**
 * Mapea datos extraídos de facturas a un asiento contable básico
 */
export const mapInvoiceToAccountingEntry = (
  invoiceData: Record<string, any>,
  entryNumber: number = 1,
  exerciseYear?: number
): AccountingEntry => {
  const fecha = invoiceData.fecha || invoiceData.date || new Date().toISOString().split('T')[0];
  const total = parseFloat(String(invoiceData.total || invoiceData.total_amount || 0).replace(',', '.'));
  const empresa = invoiceData.empresa || invoiceData.company || invoiceData.proveedor || '';
  const numero = invoiceData.numero || invoiceData.number || invoiceData.numero_factura || '';
  
  // Concepto del asiento
  const concepto = `Factura ${numero} - ${empresa}`.substring(0, 60);
  
  // Obtener año del ejercicio
  const year = exerciseYear || new Date(fecha).getFullYear();
  const month = new Date(fecha).getMonth() + 1;
  
  return {
    fecha,
    concepto,
    debe: total > 0 ? total : undefined,
    haber: total > 0 ? undefined : Math.abs(total),
    numero_asiento: entryNumber,
    ejercicio: year,
    periodo: month,
    apunte: 1
  };
};

/**
 * Exporta datos a formato legacy para ERP
 */
export const exportToLegacyFormat = async (
  entries: AccountingEntry[],
  erpType: ERPType,
  filename?: string
): Promise<void> => {
  try {
    // Cargar esquema
    const schema = await loadERPSchema(erpType);
    
    // Ordenar columnas por posición
    const sortedColumns = [...schema.columns].sort((a, b) => a.position - b.position);
    
    // Generar líneas
    const lines: string[] = [];
    
    for (const entry of entries) {
      let line = '';
      
      if (schema.fixedWidth) {
        // Formato de ancho fijo
        for (const column of sortedColumns) {
          const value = entry[column.name as keyof AccountingEntry];
          const formatted = formatValue(value, column);
          line += formatted;
        }
      } else {
        // Formato delimitado (CSV)
        const values: string[] = [];
        for (const column of sortedColumns) {
          const value = entry[column.name as keyof AccountingEntry];
          const formatted = formatValue(value, column);
          values.push(formatted);
        }
        line = values.join(schema.separator);
      }
      
      lines.push(line);
    }
    
    // Unir líneas con el separador de línea correcto
    const textContent = lines.join(schema.lineEnding);
    
    // Convertir a ANSI
    const ansiBytes = convertToANSI(textContent, schema.encoding);
    
    // Crear blob y descargar
    const blob = new Blob([ansiBytes], { 
      type: 'text/plain;charset=' + schema.encoding 
    });
    
    const outputFilename = filename || `asientos_${erpType}_${Date.now()}.txt`;
    saveAs(blob, outputFilename);
    
  } catch (error) {
    console.error('Error exportando a formato legacy:', error);
    throw new Error(`Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Exporta datos desde un workbook Excel ya procesado
 * Extrae los datos y los convierte a formato legacy
 */
export const exportExcelToLegacyFormat = async (
  workbook: any, // XLSX.WorkBook
  erpType: ERPType,
  mapping: Record<string, string>, // Mapeo de columnas Excel a campos ERP
  filename?: string
): Promise<void> => {
  try {
    const XLSX = await import('xlsx');
    const entries: AccountingEntry[] = [];
    
    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('El archivo Excel no contiene datos suficientes');
    }
    
    // Primera fila son los encabezados
    const headers = jsonData[0] as string[];
    
    // Procesar filas de datos
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      const rowData: Record<string, any> = {};
      
      // Mapear datos según los encabezados
      headers.forEach((header, index) => {
        if (header && mapping[header]) {
          rowData[mapping[header]] = row[index];
        }
      });
      
      // Convertir a AccountingEntry
      const entry: AccountingEntry = {
        fecha: rowData.fecha || rowData.date || new Date().toISOString().split('T')[0],
        concepto: rowData.concepto || rowData.description || '',
        debe: rowData.debe ? parseFloat(String(rowData.debe).replace(',', '.')) : undefined,
        haber: rowData.haber ? parseFloat(String(rowData.haber).replace(',', '.')) : undefined,
        numero_asiento: rowData.numero_asiento || rowData.asiento || i,
        ejercicio: rowData.ejercicio || new Date().getFullYear(),
        periodo: rowData.periodo || new Date().getMonth() + 1,
        apunte: rowData.apunte || 1
      };
      
      entries.push(entry);
    }
    
    // Exportar a formato legacy
    await exportToLegacyFormat(entries, erpType, filename);
    
  } catch (error) {
    console.error('Error exportando Excel a formato legacy:', error);
    throw new Error(`Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};
