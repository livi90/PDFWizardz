import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Language } from '../types';
import { getTranslation } from '../services/translations';
import { ArrowRight, Download, Upload, Sparkles, X, Search, Trash2, FileText, ZoomIn, ZoomOut, List, ChevronLeft, ChevronRight, Plus, Rows, Columns } from 'lucide-react';
import saveAs from 'file-saver';

interface TemplateEditorProps {
  lang: Language;
  onGoToHome?: () => void;
}

interface CellData {
  value: string;
  address: string;
  row: number;
  col: number;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ lang, onGoToHome }) => {
  const t = getTranslation(lang);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [worksheet, setWorksheet] = useState<XLSX.WorkSheet | null>(null);
  const [sheetName, setSheetName] = useState<string>('');
  const [cells, setCells] = useState<CellData[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(100);
  const [showRunesList, setShowRunesList] = useState<boolean>(false);
  const [isCellSelectorMode, setIsCellSelectorMode] = useState<boolean>(false); // Modo selector de celdas
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Runas predefinidas (variables comunes)
  const commonRunes = lang === 'ES' ? [
    'FECHA', 'TOTAL', 'IVA', 'SUBTOTAL', 'EMPRESA', 'CLIENTE', 'NUMERO', 'CONCEPTO',
    'PROVEEDOR', 'COMPRADOR', 'MONTO', 'IMPORTE', 'DESCRIPCION', 'DIRECCION', 'TELEFONO',
    'EMAIL', 'NIF', 'CIF', 'CODIGO_POSTAL', 'CIUDAD', 'PAIS'
  ] : lang === 'EN' ? [
    'DATE', 'TOTAL', 'TAX', 'SUBTOTAL', 'COMPANY', 'CUSTOMER', 'NUMBER', 'CONCEPT',
    'SUPPLIER', 'BUYER', 'AMOUNT', 'DESCRIPTION', 'ADDRESS', 'PHONE', 'EMAIL',
    'TAX_ID', 'POSTAL_CODE', 'CITY', 'COUNTRY'
  ] : lang === 'DE' ? [
    'DATUM', 'GESAMT', 'STEUER', 'ZWISCHENSUMME', 'UNTERNEHMEN', 'KUNDE', 'NUMMER', 'KONZEPT',
    'LIEFERANT', 'KÄUFER', 'BETRAG', 'BESCHREIBUNG', 'ADRESSE', 'TELEFON', 'EMAIL',
    'STEUER_ID', 'POSTLEITZAHL', 'STADT', 'LAND'
  ] : [
    'DATE', 'TOTAL', 'TAXE', 'SOUS_TOTAL', 'ENTREPRISE', 'CLIENT', 'NUMERO', 'CONCEPT',
    'FOURNISSEUR', 'ACHETEUR', 'MONTANT', 'DESCRIPTION', 'ADRESSE', 'TELEPHONE', 'EMAIL',
    'NUMERO_FISCAL', 'CODE_POSTAL', 'VILLE', 'PAYS'
  ];

  const [customRunes, setCustomRunes] = useState<string[]>([]);
  const [newRuneName, setNewRuneName] = useState('');

  // Cargar archivo Excel
  const handleFileLoad = async (file: File) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellStyles: true,
        cellNF: true
      });
      
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      const firstSheetName = wb.SheetNames[0];
      setSheetName(firstSheetName);
      setCurrentSheetIndex(0);
      loadWorksheet(wb, firstSheetName);
      setExcelFile(file);
      
      // Activar modo selector automáticamente al cargar una plantilla
      setIsCellSelectorMode(true);
    } catch (error) {
      alert(lang === 'ES' 
        ? 'Error al cargar el archivo Excel: ' + (error instanceof Error ? error.message : 'Error desconocido')
        : 'Error loading Excel file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar worksheet y convertir a grid
  const loadWorksheet = (wb: XLSX.WorkBook, sheet: string) => {
    const ws = wb.Sheets[sheet];
    setWorksheet(ws);
    
    const existingRange = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : null;
    
    // Definir rango mínimo y máximo para mostrar
    // Si hay datos, usar el rango existente, pero asegurar mínimo de 20 filas x 10 columnas
    const minRows = 20;
    const minCols = 10;
    
    const range = existingRange ? {
      s: { r: 0, c: 0 },
      e: { 
        r: Math.max(existingRange.e.r, minRows - 1), 
        c: Math.max(existingRange.e.c, minCols - 1) 
      }
    } : {
      s: { r: 0, c: 0 },
      e: { r: minRows - 1, c: minCols - 1 }
    };
    
    const grid: CellData[][] = [];
    
    // Crear grid con datos (incluyendo celdas vacías)
    for (let row = range.s.r; row <= range.e.r; row++) {
      const rowData: CellData[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = ws[cellAddress];
        const value = cell ? (cell.w || cell.v || '') : '';
        
        rowData.push({
          value: String(value),
          address: cellAddress,
          row,
          col
        });
      }
      grid.push(rowData);
    }
    
    // Actualizar el rango del worksheet si es necesario
    if (!ws['!ref'] || existingRange) {
      ws['!ref'] = XLSX.utils.encode_range(range);
    }
    
    setCells(grid);
    
    // Extraer runas personalizadas del archivo
    const markerRegex = /\{\{([^}]+)\}\}/g;
    const foundRunes = new Set<string>();
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = ws[cellAddress];
        if (cell && cell.v && typeof cell.v === 'string') {
          let match;
          while ((match = markerRegex.exec(cell.v)) !== null) {
            foundRunes.add(match[1].trim().toUpperCase());
          }
        }
      }
    }
    setCustomRunes(Array.from(foundRunes).filter(r => !commonRunes.includes(r)));
  };

  // Cambiar de hoja
  const changeSheet = (index: number) => {
    if (!workbook || index < 0 || index >= sheetNames.length) return;
    const newSheetName = sheetNames[index];
    setSheetName(newSheetName);
    setCurrentSheetIndex(index);
    loadWorksheet(workbook, newSheetName);
    setSelectedCell(null);
    setEditingCell(null);
  };

  // Actualizar celda en worksheet y grid
  const updateCell = (row: number, col: number, value: string) => {
    if (!worksheet || !workbook) return;
    
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    
    if (value.trim() === '') {
      // Eliminar celda si está vacía
      delete worksheet[cellAddress];
    } else {
      // Actualizar celda
      worksheet[cellAddress] = {
        v: value,
        t: 's',
        w: value
      };
    }
    
    // Actualizar workbook
    if (sheetName) {
      workbook.Sheets[sheetName] = worksheet;
    }
    
    // Actualizar grid visual
    const newCells = [...cells];
    // Asegurar que la fila y columna existan
    while (newCells.length <= row) {
      const numCols = newCells[0]?.length || 10;
      const newRow: CellData[] = [];
      for (let c = 0; c < numCols; c++) {
        newRow.push({
          value: '',
          address: XLSX.utils.encode_cell({ r: newCells.length, c }),
          row: newCells.length,
          col: c
        });
      }
      newCells.push(newRow);
    }
    
    if (newCells[row]) {
      // Asegurar que la columna exista
      while (newCells[row].length <= col) {
        newCells[row].push({
          value: '',
          address: XLSX.utils.encode_cell({ r: row, c: newCells[row].length }),
          row,
          col: newCells[row].length
        });
      }
      
      if (newCells[row][col]) {
        newCells[row][col].value = value;
        newCells[row][col].address = cellAddress;
      }
      
      // Actualizar rango del worksheet si es necesario
      const currentRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const newRange = {
        s: { r: 0, c: 0 },
        e: { 
          r: Math.max(currentRange.e.r, row), 
          c: Math.max(currentRange.e.c, col) 
        }
      };
      worksheet['!ref'] = XLSX.utils.encode_range(newRange);
      
      setCells(newCells);
    }
    
    // Extraer runas del nuevo valor
    const markerRegex = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = markerRegex.exec(value)) !== null) {
      const runeName = match[1].trim().toUpperCase();
      if (runeName && !commonRunes.includes(runeName) && !customRunes.includes(runeName)) {
        setCustomRunes([...customRunes, runeName]);
      }
    }
  };

  // Insertar runa en celda seleccionada
  const insertRune = (runeName: string) => {
    if (!selectedCell || !worksheet || !workbook) return;
    
    const { row, col } = selectedCell;
    const runeText = `{{${runeName}}}`;
    updateCell(row, col, runeText);
    
    // Si es una runa personalizada nueva, agregarla a la lista
    if (!commonRunes.includes(runeName) && !customRunes.includes(runeName)) {
      setCustomRunes([...customRunes, runeName]);
    }
  };

  // Toggle automático de {{}} en modo selector
  const toggleCellMarker = (row: number, col: number) => {
    if (!worksheet || !workbook) return;
    
    const cell = cells[row]?.[col];
    if (!cell) return;
    
    const currentValue = cell.value;
    const hasMarker = currentValue.includes('{{') && currentValue.includes('}}');
    
    if (hasMarker) {
      // Remover marcadores existentes
      const cleanedValue = currentValue.replace(/\{\{([^}]+)\}\}/g, '$1').trim();
      updateCell(row, col, cleanedValue);
    } else {
      // Agregar marcadores si la celda tiene contenido
      if (currentValue.trim()) {
        // Si el contenido ya parece ser un nombre de variable (mayúsculas, sin espacios), usarlo directamente
        const cleanValue = currentValue.trim().toUpperCase().replace(/\s+/g, '_');
        const runeText = `{{${cleanValue}}}`;
        updateCell(row, col, runeText);
        
        // Agregar a runas personalizadas si no existe
        if (!commonRunes.includes(cleanValue) && !customRunes.includes(cleanValue)) {
          setCustomRunes([...customRunes, cleanValue]);
        }
      } else {
        // Si está vacía, permitir edición
        startEditing(row, col);
      }
    }
  };

  // Iniciar edición de celda
  const startEditing = (row: number, col: number) => {
    const cell = cells[row]?.[col];
    setEditingCell({ row, col });
    setEditValue(cell?.value || '');
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  // Finalizar edición
  const finishEditing = () => {
    if (editingCell) {
      updateCell(editingCell.row, editingCell.col, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Limpiar celda seleccionada
  const clearCell = () => {
    if (!selectedCell) return;
    updateCell(selectedCell.row, selectedCell.col, '');
    setSelectedCell(null);
  };

  // Insertar fila arriba de la seleccionada
  const insertRowAbove = () => {
    if (!selectedCell || !worksheet || !workbook) return;
    
    const { row } = selectedCell;
    const newCells = [...cells];
    
    // Crear nueva fila vacía
    const newRow: CellData[] = [];
    const numCols = cells[0]?.length || 0;
    for (let col = 0; col < numCols; col++) {
      newRow.push({
        value: '',
        address: XLSX.utils.encode_cell({ r: row, c: col }),
        row,
        col
      });
    }
    
    // Insertar fila en el grid
    newCells.splice(row, 0, newRow);
    
    // Actualizar índices de filas en todas las celdas siguientes
    for (let r = row + 1; r < newCells.length; r++) {
      for (let c = 0; c < newCells[r].length; c++) {
        newCells[r][c].row = r;
        newCells[r][c].address = XLSX.utils.encode_cell({ r: r, c: c });
      }
    }
    
    // Actualizar worksheet: desplazar todas las celdas hacia abajo
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const newRange = {
      s: range.s,
      e: { r: range.e.r + 1, c: range.e.c }
    };
    
    // Mover celdas existentes hacia abajo
    for (let r = range.e.r; r >= row; r--) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const oldAddress = XLSX.utils.encode_cell({ r, c });
        const newAddress = XLSX.utils.encode_cell({ r: r + 1, c });
        const cell = worksheet[oldAddress];
        if (cell) {
          worksheet[newAddress] = { ...cell };
          delete worksheet[oldAddress];
        }
      }
    }
    
    // Actualizar rango
    worksheet['!ref'] = XLSX.utils.encode_range(newRange);
    
    // Actualizar workbook
    if (sheetName) {
      workbook.Sheets[sheetName] = worksheet;
    }
    
    setCells(newCells);
    setSelectedCell({ row: row + 1, col: selectedCell.col }); // Mantener selección en la misma posición visual
  };

  // Insertar fila abajo de la seleccionada
  const insertRowBelow = () => {
    if (!selectedCell || !worksheet || !workbook) return;
    
    const { row } = selectedCell;
    const newCells = [...cells];
    
    // Crear nueva fila vacía
    const newRow: CellData[] = [];
    const numCols = cells[0]?.length || 0;
    for (let col = 0; col < numCols; col++) {
      newRow.push({
        value: '',
        address: XLSX.utils.encode_cell({ r: row + 1, c: col }),
        row: row + 1,
        col
      });
    }
    
    // Insertar fila en el grid
    newCells.splice(row + 1, 0, newRow);
    
    // Actualizar índices de filas en todas las celdas siguientes
    for (let r = row + 2; r < newCells.length; r++) {
      for (let c = 0; c < newCells[r].length; c++) {
        newCells[r][c].row = r;
        newCells[r][c].address = XLSX.utils.encode_cell({ r: r, c: c });
      }
    }
    
    // Actualizar worksheet: desplazar todas las celdas hacia abajo
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const newRange = {
      s: range.s,
      e: { r: range.e.r + 1, c: range.e.c }
    };
    
    // Mover celdas existentes hacia abajo
    for (let r = range.e.r; r > row; r--) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const oldAddress = XLSX.utils.encode_cell({ r, c });
        const newAddress = XLSX.utils.encode_cell({ r: r + 1, c });
        const cell = worksheet[oldAddress];
        if (cell) {
          worksheet[newAddress] = { ...cell };
          delete worksheet[oldAddress];
        }
      }
    }
    
    // Actualizar rango
    worksheet['!ref'] = XLSX.utils.encode_range(newRange);
    
    // Actualizar workbook
    if (sheetName) {
      workbook.Sheets[sheetName] = worksheet;
    }
    
    setCells(newCells);
    // Mantener selección en la misma celda
  };

  // Insertar columna a la izquierda de la seleccionada
  const insertColumnLeft = () => {
    if (!selectedCell || !worksheet || !workbook) return;
    
    const { col } = selectedCell;
    const newCells = cells.map((row, rowIndex) => {
      const newRow = [...row];
      const newCell: CellData = {
        value: '',
        address: XLSX.utils.encode_cell({ r: rowIndex, c: col }),
        row: rowIndex,
        col
      };
      newRow.splice(col, 0, newCell);
      
      // Actualizar índices de columnas en todas las celdas siguientes
      for (let c = col + 1; c < newRow.length; c++) {
        newRow[c].col = c;
        newRow[c].address = XLSX.utils.encode_cell({ r: rowIndex, c });
      }
      
      return newRow;
    });
    
    // Actualizar worksheet: desplazar todas las celdas hacia la derecha
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const newRange = {
      s: range.s,
      e: { r: range.e.r, c: range.e.c + 1 }
    };
    
    // Mover celdas existentes hacia la derecha
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.e.c; c >= col; c--) {
        const oldAddress = XLSX.utils.encode_cell({ r, c });
        const newAddress = XLSX.utils.encode_cell({ r, c: c + 1 });
        const cell = worksheet[oldAddress];
        if (cell) {
          worksheet[newAddress] = { ...cell };
          delete worksheet[oldAddress];
        }
      }
    }
    
    // Actualizar rango
    worksheet['!ref'] = XLSX.utils.encode_range(newRange);
    
    // Actualizar workbook
    if (sheetName) {
      workbook.Sheets[sheetName] = worksheet;
    }
    
    setCells(newCells);
    setSelectedCell({ row: selectedCell.row, col: col + 1 }); // Mantener selección en la misma posición visual
  };

  // Insertar columna a la derecha de la seleccionada
  const insertColumnRight = () => {
    if (!selectedCell || !worksheet || !workbook) return;
    
    const { col } = selectedCell;
    const newCells = cells.map((row, rowIndex) => {
      const newRow = [...row];
      const newCell: CellData = {
        value: '',
        address: XLSX.utils.encode_cell({ r: rowIndex, c: col + 1 }),
        row: rowIndex,
        col: col + 1
      };
      newRow.splice(col + 1, 0, newCell);
      
      // Actualizar índices de columnas en todas las celdas siguientes
      for (let c = col + 2; c < newRow.length; c++) {
        newRow[c].col = c;
        newRow[c].address = XLSX.utils.encode_cell({ r: rowIndex, c });
      }
      
      return newRow;
    });
    
    // Actualizar worksheet: desplazar todas las celdas hacia la derecha
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const newRange = {
      s: range.s,
      e: { r: range.e.r, c: range.e.c + 1 }
    };
    
    // Mover celdas existentes hacia la derecha
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.e.c; c > col; c--) {
        const oldAddress = XLSX.utils.encode_cell({ r, c });
        const newAddress = XLSX.utils.encode_cell({ r, c: c + 1 });
        const cell = worksheet[oldAddress];
        if (cell) {
          worksheet[newAddress] = { ...cell };
          delete worksheet[oldAddress];
        }
      }
    }
    
    // Actualizar rango
    worksheet['!ref'] = XLSX.utils.encode_range(newRange);
    
    // Actualizar workbook
    if (sheetName) {
      workbook.Sheets[sheetName] = worksheet;
    }
    
    setCells(newCells);
    // Mantener selección en la misma celda
  };

  // Obtener todas las runas usadas
  const getAllUsedRunes = (): string[] => {
    const runes = new Set<string>();
    const markerRegex = /\{\{([^}]+)\}\}/g;
    
    cells.forEach(row => {
      row.forEach(cell => {
        if (cell.value) {
          let match;
          while ((match = markerRegex.exec(cell.value)) !== null) {
            runes.add(match[1].trim().toUpperCase());
          }
        }
      });
    });
    
    return Array.from(runes).sort();
  };

  // Filtrar celdas por búsqueda
  const getFilteredCells = (): { row: number; col: number }[] => {
    if (!searchTerm.trim()) return [];
    
    const results: { row: number; col: number }[] = [];
    const searchLower = searchTerm.toLowerCase();
    
    cells.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.value.toLowerCase().includes(searchLower)) {
          results.push({ row: rowIndex, col: colIndex });
        }
      });
    });
    
    return results;
  };

  // Agregar runa personalizada
  const addCustomRune = () => {
    if (!newRuneName.trim()) return;
    const runeName = newRuneName.trim().toUpperCase();
    if (!commonRunes.includes(runeName) && !customRunes.includes(runeName)) {
      setCustomRunes([...customRunes, runeName]);
      setNewRuneName('');
    }
  };

  // Guardar y descargar plantilla
  const saveTemplate = () => {
    if (!workbook || !excelFile) {
      alert(lang === 'ES' ? 'Por favor, carga un archivo Excel primero' : 'Please load an Excel file first');
      return;
    }

    try {
      // Actualizar el worksheet en el workbook
      if (worksheet && sheetName) {
        workbook.Sheets[sheetName] = worksheet;
      }

      // Generar archivo
      const excelBuffer = XLSX.write(workbook, {
        type: 'array',
        bookType: 'xlsx',
        cellStyles: true
      });

      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const outputFileName = excelFile.name.replace('.xlsx', '_con_runas.xlsx')
        .replace('.xls', '_con_runas.xlsx');

      saveAs(blob, outputFileName);
      
      alert(lang === 'ES' 
        ? '¡Plantilla guardada exitosamente!' 
        : 'Template saved successfully!');
    } catch (error) {
      alert(lang === 'ES' 
        ? 'Error al guardar: ' + (error instanceof Error ? error.message : 'Error desconocido')
        : 'Error saving: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2 text-gray-500 cursor-pointer hover:underline" onClick={onGoToHome}>
          <ArrowRight className="transform rotate-180" /> {t.back || 'Volver'}
        </div>

        <div className="text-center mb-8">
          <div className="inline-block bg-purple-900/50 border-4 border-purple-500 rounded-lg px-6 py-3 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400 inline mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-purple-400 pixel-font-header inline">
              {lang === 'ES' ? 'LA FORJA DE PLANTILLAS EXCEL' : lang === 'EN' ? 'THE RUNE FORGE' : lang === 'DE' ? 'DIE RUNENSCHMIEDE' : 'LA FORGE DES RUNES'}
            </h1>
          </div>
          <p className="text-xl text-gray-400 font-bold">
            {lang === 'ES' 
              ? 'Editor de Plantillas Excel - Inserta Campos Personalizados (Variables) en tus Celdas'
              : lang === 'EN'
              ? 'Excel Template Editor - Insert Custom Fields (Variables) in your Cells'
              : lang === 'DE'
              ? 'Excel-Vorlagen-Editor - Fügen Sie custom fields (Variablen) in Ihre Zellen ein'
              : 'Éditeur de Modèles Excel - Insérer des custom fields (Variables) dans vos Cellules'}
          </p>
        </div>

        {/* File Upload */}
        {!excelFile && (
          <div className="bg-gray-800 border-4 border-purple-500 rounded-lg p-8 text-center mb-8">
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileLoad(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-purple-700 bg-purple-900/20 p-12 cursor-pointer hover:bg-purple-900/30 flex flex-col items-center gap-4"
            >
              <Upload className="w-16 h-16 text-purple-400" />
              <div className="text-2xl font-bold text-purple-300">
                {lang === 'ES' ? 'CARGAR PLANTILLA EXCEL' : lang === 'EN' ? 'UPLOAD EXCEL TEMPLATE' : lang === 'DE' ? 'EXCEL-VORLAGE HOCHLADEN' : 'TÉLÉCHARGER MODÈLE EXCEL'}
              </div>
              <p className="text-gray-400">
                {lang === 'ES' 
                  ? 'Sube tu archivo Excel (.xlsx o .xls) para comenzar a insertar runas'
                  : lang === 'EN'
                  ? 'Upload your Excel file (.xlsx or .xls) to start inserting runes'
                  : lang === 'DE'
                  ? 'Laden Sie Ihre Excel-Datei (.xlsx oder .xls) hoch, um Runen einzufügen'
                  : 'Téléchargez votre fichier Excel (.xlsx ou .xls) pour commencer à insérer des runes'}
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">
              {lang === 'ES' ? 'Cargando plantilla...' : lang === 'EN' ? 'Loading template...' : lang === 'DE' ? 'Vorlage wird geladen...' : 'Chargement du modèle...'}
            </p>
          </div>
        )}

        {/* Editor Grid */}
        {excelFile && cells.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Grid de Celdas */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800 border-4 border-purple-500 rounded-lg p-4 mb-4">
                {/* Barra de herramientas superior */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Navegación de hojas */}
                    {sheetNames.length > 1 && (
                      <div className="flex items-center gap-2 bg-gray-700 p-2 rounded border-2 border-gray-600">
                        <button
                          onClick={() => changeSheet(currentSheetIndex - 1)}
                          disabled={currentSheetIndex === 0}
                          className="p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4 text-purple-300" />
                        </button>
                        <span className="text-sm text-purple-300 font-bold px-2">
                          {sheetName} ({currentSheetIndex + 1}/{sheetNames.length})
                        </span>
                        <button
                          onClick={() => changeSheet(currentSheetIndex + 1)}
                          disabled={currentSheetIndex === sheetNames.length - 1}
                          className="p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4 text-purple-300" />
                        </button>
                      </div>
                    )}
                    
                    {/* Búsqueda */}
                    <div className="flex items-center gap-2 bg-gray-700 p-2 rounded border-2 border-gray-600">
                      <Search className="w-4 h-4 text-purple-300" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={lang === 'ES' ? 'Buscar...' : lang === 'EN' ? 'Search...' : lang === 'DE' ? 'Suchen...' : 'Rechercher...'}
                        className="bg-transparent text-white text-sm w-32 focus:outline-none"
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center gap-2 bg-gray-700 p-2 rounded border-2 border-gray-600">
                      <ZoomOut 
                        className="w-4 h-4 text-purple-300 cursor-pointer hover:text-purple-200" 
                        onClick={() => setZoom(Math.max(50, zoom - 10))}
                      />
                      <span className="text-sm text-purple-300 font-bold">{zoom}%</span>
                      <ZoomIn 
                        className="w-4 h-4 text-purple-300 cursor-pointer hover:text-purple-200" 
                        onClick={() => setZoom(Math.min(200, zoom + 10))}
                      />
                    </div>

                    {/* Contador de runas */}
                    <button
                      onClick={() => setShowRunesList(!showRunesList)}
                      className="bg-indigo-600 text-white border-2 border-indigo-500 hover:bg-indigo-500 transition-colors font-bold py-2 px-4 flex items-center gap-2 text-sm"
                    >
                      <List className="w-4 h-4" />
                      {getAllUsedRunes().length} {lang === 'ES' ? 'runas' : lang === 'EN' ? 'runes' : lang === 'DE' ? 'Runen' : 'runes'}
                    </button>

                    {/* Toggle modo selector de celdas */}
                    <button
                      onClick={() => setIsCellSelectorMode(!isCellSelectorMode)}
                      className={`border-2 font-bold py-2 px-4 flex items-center gap-2 text-sm transition-colors ${
                        isCellSelectorMode
                          ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                      }`}
                      title={lang === 'ES' 
                        ? 'Modo selector: Clic en celdas para agregar/quitar {{}}'
                        : lang === 'EN'
                        ? 'Selector mode: Click cells to add/remove {{}}'
                        : lang === 'DE'
                        ? 'Auswahlmodus: Klicken Sie auf Zellen, um {{}} hinzuzufügen/entfernen'
                        : 'Mode sélecteur: Cliquez sur les cellules pour ajouter/retirer {{}}'}
                    >
                      <Sparkles className="w-4 h-4" />
                      {isCellSelectorMode 
                        ? (lang === 'ES' ? 'Selector ON' : lang === 'EN' ? 'Selector ON' : lang === 'DE' ? 'Auswahl AN' : 'Sélecteur ON')
                        : (lang === 'ES' ? 'Selector OFF' : lang === 'EN' ? 'Selector OFF' : lang === 'DE' ? 'Auswahl AUS' : 'Sélecteur OFF')}
                    </button>
                  </div>

                  <button
                    onClick={saveTemplate}
                    className="bg-purple-600 text-white border-2 border-purple-500 hover:bg-purple-500 transition-colors font-bold py-2 px-6 flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {lang === 'ES' ? 'GUARDAR' : lang === 'EN' ? 'SAVE' : lang === 'DE' ? 'SPEICHERN' : 'ENREGISTRER'}
                  </button>
                </div>

                {/* Lista de runas usadas (modal) */}
                {showRunesList && (
                  <div className="mb-4 p-4 bg-gray-900 border-2 border-indigo-500 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-indigo-400">
                        {lang === 'ES' ? 'Runas Usadas en el Documento' : lang === 'EN' ? 'Runes Used in Document' : lang === 'DE' ? 'Verwendete Runen' : 'Runes Utilisées'}
                      </h3>
                      <button onClick={() => setShowRunesList(false)} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getAllUsedRunes().map((rune) => (
                        <span key={rune} className="bg-indigo-900/50 border-2 border-indigo-600 text-indigo-300 px-3 py-1 rounded text-sm font-bold">
                          {`{{${rune}}}`}
                        </span>
                      ))}
                      {getAllUsedRunes().length === 0 && (
                        <p className="text-gray-400 text-sm">
                          {lang === 'ES' ? 'No hay runas en el documento' : lang === 'EN' ? 'No runes in document' : lang === 'DE' ? 'Keine Runen im Dokument' : 'Aucune rune dans le document'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Grid Scrollable */}
                <div className="overflow-auto max-h-[600px] border-2 border-gray-700" style={{ zoom: `${zoom}%` }}>
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-900 z-10">
                      <tr>
                        <th className="border border-gray-600 bg-gray-800 text-gray-400 text-xs p-2 w-12"></th>
                        {cells[0]?.map((_, colIndex) => (
                          <th key={colIndex} className="border border-gray-600 bg-gray-800 text-gray-400 text-xs p-2 min-w-[120px]">
                            {XLSX.utils.encode_col(colIndex)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cells.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="border border-gray-600 bg-gray-800 text-gray-400 text-xs p-2 text-center font-bold">
                            {rowIndex + 1}
                          </td>
                          {row.map((cell, colIndex) => {
                            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                            const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                            const hasRune = cell.value.includes('{{') && cell.value.includes('}}');
                            const isSearchMatch = searchTerm && cell.value.toLowerCase().includes(searchTerm.toLowerCase());
                            const searchResults = getFilteredCells();
                            const isHighlighted = searchTerm && searchResults.some(r => r.row === rowIndex && r.col === colIndex);
                            
                            return (
                              <td
                                key={colIndex}
                                onClick={() => {
                                  if (!isEditing) {
                                    if (isCellSelectorMode) {
                                      // En modo selector, toggle automático de {{}}
                                      toggleCellMarker(rowIndex, colIndex);
                                    }
                                    setSelectedCell({ row: rowIndex, col: colIndex });
                                  }
                                }}
                                onDoubleClick={() => startEditing(rowIndex, colIndex)}
                                className={`border border-gray-600 p-2 cursor-pointer min-w-[120px] relative ${
                                  isSelected && !isEditing
                                    ? 'bg-purple-600 text-white font-bold'
                                    : isEditing
                                    ? 'bg-purple-800 text-white'
                                    : isHighlighted
                                    ? 'bg-yellow-600/30 text-yellow-200'
                                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                } ${
                                  hasRune && !isSelected
                                    ? 'text-emerald-400 font-bold border-emerald-500 border-2'
                                    : ''
                                } ${
                                  isCellSelectorMode && !hasRune && !isEditing
                                    ? 'hover:bg-emerald-900/30 hover:border-emerald-400'
                                    : ''
                                }`}
                                title={isCellSelectorMode && !hasRune ? (lang === 'ES' ? 'Clic para agregar {{}}' : lang === 'EN' ? 'Click to add {{}}' : lang === 'DE' ? 'Klicken zum Hinzufügen von {{}}' : 'Cliquer pour ajouter {{}}') : ''}
                              >
                                {isEditing ? (
                                  <input
                                    ref={editInputRef}
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={finishEditing}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        finishEditing();
                                      } else if (e.key === 'Escape') {
                                        setEditingCell(null);
                                        setEditValue('');
                                      }
                                    }}
                                    className="w-full bg-purple-800 text-white border-2 border-purple-500 rounded px-2 py-1 focus:outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span className={hasRune ? 'text-emerald-400' : ''}>
                                    {cell.value || ''}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedCell && !editingCell && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-purple-900/30 border-2 border-purple-600 rounded flex items-center justify-between">
                      <p className="text-purple-300 text-sm font-bold">
                        {lang === 'ES' 
                          ? `Celda seleccionada: ${XLSX.utils.encode_col(selectedCell.col)}${selectedCell.row + 1}`
                          : lang === 'EN'
                          ? `Selected cell: ${XLSX.utils.encode_col(selectedCell.col)}${selectedCell.row + 1}`
                          : lang === 'DE'
                          ? `Ausgewählte Zelle: ${XLSX.utils.encode_col(selectedCell.col)}${selectedCell.row + 1}`
                          : `Cellule sélectionnée: ${XLSX.utils.encode_col(selectedCell.col)}${selectedCell.row + 1}`}
                        {cells[selectedCell.row]?.[selectedCell.col]?.value && (
                          <span className="ml-2 text-purple-200">
                            = "{cells[selectedCell.row][selectedCell.col].value}"
                          </span>
                        )}
                      </p>
                      <button
                        onClick={clearCell}
                        className="bg-red-600 text-white border-2 border-red-500 hover:bg-red-500 transition-colors font-bold py-1 px-3 flex items-center gap-2 text-sm"
                        title={lang === 'ES' ? 'Limpiar celda' : lang === 'EN' ? 'Clear cell' : lang === 'DE' ? 'Zelle löschen' : 'Effacer cellule'}
                      >
                        <Trash2 className="w-4 h-4" />
                        {lang === 'ES' ? 'Limpiar' : lang === 'EN' ? 'Clear' : lang === 'DE' ? 'Löschen' : 'Effacer'}
                      </button>
                    </div>
                    
                    {/* Botones para agregar filas y columnas */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Agregar Filas */}
                      <div className="bg-gray-900/50 border-2 border-purple-600 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Rows className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-300 text-sm font-bold">
                            {lang === 'ES' ? 'Agregar Fila' : lang === 'EN' ? 'Add Row' : lang === 'DE' ? 'Zeile hinzufügen' : 'Ajouter Ligne'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={insertRowAbove}
                            className="flex-1 bg-purple-700 hover:bg-purple-600 text-white border-2 border-purple-500 transition-colors font-bold py-2 px-3 text-xs flex items-center justify-center gap-1"
                            title={lang === 'ES' ? 'Insertar fila arriba' : lang === 'EN' ? 'Insert row above' : lang === 'DE' ? 'Zeile oben einfügen' : 'Insérer ligne au-dessus'}
                          >
                            <Plus className="w-3 h-3" />
                            {lang === 'ES' ? 'Arriba' : lang === 'EN' ? 'Above' : lang === 'DE' ? 'Oben' : 'Au-dessus'}
                          </button>
                          <button
                            onClick={insertRowBelow}
                            className="flex-1 bg-purple-700 hover:bg-purple-600 text-white border-2 border-purple-500 transition-colors font-bold py-2 px-3 text-xs flex items-center justify-center gap-1"
                            title={lang === 'ES' ? 'Insertar fila abajo' : lang === 'EN' ? 'Insert row below' : lang === 'DE' ? 'Zeile unten einfügen' : 'Insérer ligne en-dessous'}
                          >
                            <Plus className="w-3 h-3" />
                            {lang === 'ES' ? 'Abajo' : lang === 'EN' ? 'Below' : lang === 'DE' ? 'Unten' : 'En-dessous'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Agregar Columnas */}
                      <div className="bg-gray-900/50 border-2 border-purple-600 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Columns className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-300 text-sm font-bold">
                            {lang === 'ES' ? 'Agregar Columna' : lang === 'EN' ? 'Add Column' : lang === 'DE' ? 'Spalte hinzufügen' : 'Ajouter Colonne'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={insertColumnLeft}
                            className="flex-1 bg-purple-700 hover:bg-purple-600 text-white border-2 border-purple-500 transition-colors font-bold py-2 px-3 text-xs flex items-center justify-center gap-1"
                            title={lang === 'ES' ? 'Insertar columna izquierda' : lang === 'EN' ? 'Insert column left' : lang === 'DE' ? 'Spalte links einfügen' : 'Insérer colonne à gauche'}
                          >
                            <Plus className="w-3 h-3" />
                            {lang === 'ES' ? 'Izquierda' : lang === 'EN' ? 'Left' : lang === 'DE' ? 'Links' : 'Gauche'}
                          </button>
                          <button
                            onClick={insertColumnRight}
                            className="flex-1 bg-purple-700 hover:bg-purple-600 text-white border-2 border-purple-500 transition-colors font-bold py-2 px-3 text-xs flex items-center justify-center gap-1"
                            title={lang === 'ES' ? 'Insertar columna derecha' : lang === 'EN' ? 'Insert column right' : lang === 'DE' ? 'Spalte rechts einfügen' : 'Insérer colonne à droite'}
                          >
                            <Plus className="w-3 h-3" />
                            {lang === 'ES' ? 'Derecha' : lang === 'EN' ? 'Right' : lang === 'DE' ? 'Rechts' : 'Droite'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {editingCell && (
                  <div className="mt-4 p-3 bg-purple-800 border-2 border-purple-500 rounded">
                    <p className="text-purple-200 text-sm">
                      {lang === 'ES' 
                        ? '💡 Presiona Enter para guardar o Esc para cancelar'
                        : lang === 'EN'
                        ? '💡 Press Enter to save or Esc to cancel'
                        : lang === 'DE'
                        ? '💡 Enter drücken zum Speichern oder Esc zum Abbrechen'
                        : '💡 Appuyez sur Entrée pour enregistrer ou Esc pour annuler'}
                    </p>
                  </div>
                )}

                {/* Indicador de modo selector */}
                {isCellSelectorMode && !editingCell && (
                  <div className="mt-4 p-3 bg-emerald-900/50 border-2 border-emerald-500 rounded">
                    <p className="text-emerald-200 text-sm font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {lang === 'ES' 
                        ? '✨ Modo Selector ACTIVO: Haz clic en las celdas para agregar/quitar marcadores {{}} automáticamente'
                        : lang === 'EN'
                        ? '✨ Selector Mode ACTIVE: Click cells to automatically add/remove {{}} markers'
                        : lang === 'DE'
                        ? '✨ Auswahlmodus AKTIV: Klicken Sie auf Zellen, um {{}}-Markierungen automatisch hinzuzufügen/entfernen'
                        : '✨ Mode Sélecteur ACTIF: Cliquez sur les cellules pour ajouter/retirer automatiquement les marqueurs {{}}'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Panel de Runas */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 border-4 border-purple-500 rounded-lg p-6 sticky top-4">
                <h3 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  {lang === 'ES' ? 'RUNAS' : lang === 'EN' ? 'RUNES' : lang === 'DE' ? 'RUNEN' : 'RUNES'}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {lang === 'ES' 
                    ? 'Haz clic en una celda y luego en una runa para insertarla. Doble clic para editar texto.'
                    : lang === 'EN'
                    ? 'Click on a cell then click on a rune to insert it. Double click to edit text.'
                    : lang === 'DE'
                    ? 'Klicken Sie auf eine Zelle und dann auf eine Rune, um sie einzufügen. Doppelklick zum Bearbeiten.'
                    : 'Cliquez sur une cellule puis sur une rune pour l\'insérer. Double-clic pour éditer.'}
                </p>

                {/* Runas Comunes */}
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-purple-400 mb-3">
                    {lang === 'ES' ? 'Runas Comunes' : lang === 'EN' ? 'Common Runes' : lang === 'DE' ? 'Häufige Runen' : 'Runes Communes'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {commonRunes.map((rune) => (
                      <button
                        key={rune}
                        onClick={() => insertRune(rune)}
                        disabled={!selectedCell}
                        className="bg-purple-900/50 border-2 border-purple-600 text-purple-300 px-3 py-2 rounded text-sm font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {`{{${rune}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Runas Personalizadas */}
                {customRunes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-emerald-400 mb-3">
                      {lang === 'ES' ? 'Runas Personalizadas' : lang === 'EN' ? 'Custom Runes' : lang === 'DE' ? 'Benutzerdefinierte Runen' : 'Runes Personnalisées'}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {customRunes.map((rune) => (
                        <button
                          key={rune}
                          onClick={() => insertRune(rune)}
                          disabled={!selectedCell}
                          className="bg-emerald-900/50 border-2 border-emerald-600 text-emerald-300 px-3 py-2 rounded text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {`{{${rune}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agregar Runa Personalizada */}
                <div className="border-t-2 border-gray-700 pt-4">
                  <h4 className="text-lg font-bold text-indigo-400 mb-3">
                    {lang === 'ES' ? 'Crear Nueva Runa' : lang === 'EN' ? 'Create New Rune' : lang === 'DE' ? 'Neue Rune erstellen' : 'Créer Nouvelle Rune'}
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRuneName}
                      onChange={(e) => setNewRuneName(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomRune()}
                      placeholder={lang === 'ES' ? 'NOMBRE_RUNA' : lang === 'EN' ? 'RUNE_NAME' : lang === 'DE' ? 'RUNEN_NAME' : 'NOM_RUNE'}
                      className="flex-1 bg-gray-700 text-white border-2 border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={addCustomRune}
                      className="bg-indigo-600 text-white border-2 border-indigo-500 hover:bg-indigo-500 transition-colors font-bold px-4 py-2 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Instrucciones */}
                <div className="mt-6 p-4 bg-gray-900/50 border-2 border-gray-700 rounded">
                  <p className="text-gray-400 text-xs leading-relaxed">
                    <strong className="text-purple-400">
                      {lang === 'ES' ? '💡 Cómo usar:' : lang === 'EN' ? '💡 How to use:' : lang === 'DE' ? '💡 So verwenden Sie:' : '💡 Comment utiliser:'}
                    </strong>
                    <br />
                    {lang === 'ES' 
                      ? '1. Haz clic en una celda del grid\n2. Haz clic en una runa para insertarla\n3. Guarda la plantilla cuando termines'
                      : lang === 'EN'
                      ? '1. Click on a cell in the grid\n2. Click on a rune to insert it\n3. Save the template when done'
                      : lang === 'DE'
                      ? '1. Klicken Sie auf eine Zelle im Grid\n2. Klicken Sie auf eine Rune, um sie einzufügen\n3. Speichern Sie die Vorlage, wenn Sie fertig sind'
                      : '1. Cliquez sur une cellule dans la grille\n2. Cliquez sur une rune pour l\'insérer\n3. Enregistrez le modèle lorsque vous avez terminé'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEditor;

