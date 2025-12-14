import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Language } from '../types';
import { getTranslation } from '../services/translations';
import { X, Sparkles, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import saveAs from 'file-saver';

interface MiniTemplateEditorProps {
  excelFile: File;
  lang: Language;
  onClose: () => void;
  onSave: (updatedFile: File) => void;
}

interface CellData {
  value: string;
  address: string;
  row: number;
  col: number;
}

const MiniTemplateEditor: React.FC<MiniTemplateEditorProps> = ({ excelFile, lang, onClose, onSave }) => {
  const t = getTranslation(lang);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [worksheet, setWorksheet] = useState<XLSX.WorkSheet | null>(null);
  const [sheetName, setSheetName] = useState<string>('');
  const [cells, setCells] = useState<CellData[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(80);
  const [isCellSelectorMode, setIsCellSelectorMode] = useState<boolean>(true); // Activado por defecto
  const editInputRef = useRef<HTMLInputElement>(null);

  // Cargar archivo Excel
  useEffect(() => {
    const loadFile = async () => {
      setIsLoading(true);
      try {
        const arrayBuffer = await excelFile.arrayBuffer();
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
      } catch (error) {
        alert(lang === 'ES' 
          ? 'Error al cargar el archivo Excel: ' + (error instanceof Error ? error.message : 'Error desconocido')
          : 'Error loading Excel file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFile();
  }, [excelFile, lang]);

  // Cargar worksheet y convertir a grid
  const loadWorksheet = (wb: XLSX.WorkBook, sheet: string) => {
    const ws = wb.Sheets[sheet];
    setWorksheet(ws);
    
    const existingRange = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : null;
    
    const minRows = 15;
    const minCols = 8;
    
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
    
    if (!ws['!ref'] || existingRange) {
      ws['!ref'] = XLSX.utils.encode_range(range);
    }
    
    setCells(grid);
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
      delete worksheet[cellAddress];
    } else {
      worksheet[cellAddress] = {
        v: value,
        t: 's',
        w: value
      };
    }
    
    if (sheetName) {
      workbook.Sheets[sheetName] = worksheet;
    }
    
    const newCells = [...cells];
    while (newCells.length <= row) {
      const numCols = newCells[0]?.length || 8;
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
        const cleanValue = currentValue.trim().toUpperCase().replace(/\s+/g, '_');
        const runeText = `{{${cleanValue}}}`;
        updateCell(row, col, runeText);
      } else {
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

  // Guardar y actualizar archivo
  const handleSave = () => {
    if (!workbook) return;

    try {
      if (worksheet && sheetName) {
        workbook.Sheets[sheetName] = worksheet;
      }

      const excelBuffer = XLSX.write(workbook, {
        type: 'array',
        bookType: 'xlsx',
        cellStyles: true
      });

      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Crear nuevo File desde el blob
      const updatedFile = new File([blob], excelFile.name, { type: blob.type });
      onSave(updatedFile);
      
      alert(lang === 'ES' 
        ? '¡Plantilla actualizada exitosamente!' 
        : 'Template updated successfully!');
    } catch (error) {
      alert(lang === 'ES' 
        ? 'Error al guardar: ' + (error instanceof Error ? error.message : 'Error desconocido')
        : 'Error saving: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 border-4 border-purple-500 rounded-lg p-8 text-center">
          <Sparkles className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            {lang === 'ES' ? 'Cargando plantilla...' : lang === 'EN' ? 'Loading template...' : lang === 'DE' ? 'Vorlage wird geladen...' : 'Chargement du modèle...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gray-900 border-4 border-purple-500 rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b-4 border-purple-600 bg-purple-900/30 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-300 pixel-font-header truncate">
              {lang === 'ES' ? 'EDITOR DE PLANTILLA' : lang === 'EN' ? 'TEMPLATE EDITOR' : lang === 'DE' ? 'VORLAGEN-EDITOR' : 'ÉDITEUR DE MODÈLE'}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setIsCellSelectorMode(!isCellSelectorMode)}
              className={`border-2 font-bold py-2 px-4 flex items-center gap-2 text-sm transition-colors ${
                isCellSelectorMode
                  ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {isCellSelectorMode 
                ? (lang === 'ES' ? 'Selector ON' : lang === 'EN' ? 'Selector ON' : lang === 'DE' ? 'Auswahl AN' : 'Sélecteur ON')
                : (lang === 'ES' ? 'Selector OFF' : lang === 'EN' ? 'Selector OFF' : lang === 'DE' ? 'Auswahl AUS' : 'Sélecteur OFF')}
            </button>
            <button
              onClick={handleSave}
              className="bg-purple-600 text-white border-2 border-purple-500 hover:bg-purple-500 transition-colors font-bold py-1.5 sm:py-2 px-2 sm:px-4 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{lang === 'ES' ? 'GUARDAR' : lang === 'EN' ? 'SAVE' : lang === 'DE' ? 'SPEICHERN' : 'ENREGISTRER'}</span>
            </button>
            <button
              onClick={onClose}
              className="bg-red-600 text-white border-2 border-red-500 hover:bg-red-500 transition-colors font-bold py-1.5 sm:py-2 px-2 sm:px-4 flex-shrink-0"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-2 sm:p-3 bg-gray-800 border-b-2 border-gray-700 gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {sheetNames.length > 1 && (
              <div className="flex items-center gap-1 sm:gap-2 bg-gray-700 p-1.5 sm:p-2 rounded border-2 border-gray-600">
                <button
                  onClick={() => changeSheet(currentSheetIndex - 1)}
                  disabled={currentSheetIndex === 0}
                  className="p-0.5 sm:p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Hoja anterior"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 text-purple-300" />
                </button>
                <span className="text-xs sm:text-sm text-purple-300 font-bold px-1 sm:px-2 truncate max-w-[150px] sm:max-w-none">
                  {sheetName} ({currentSheetIndex + 1}/{sheetNames.length})
                </span>
                <button
                  onClick={() => changeSheet(currentSheetIndex + 1)}
                  disabled={currentSheetIndex === sheetNames.length - 1}
                  className="p-0.5 sm:p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Hoja siguiente"
                >
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-purple-300" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 sm:gap-2 bg-gray-700 p-1.5 sm:p-2 rounded border-2 border-gray-600">
              <ZoomOut 
                className="w-3 h-3 sm:w-4 sm:h-4 text-purple-300 cursor-pointer hover:text-purple-200" 
                onClick={() => setZoom(Math.max(50, zoom - 10))}
              />
              <span className="text-xs sm:text-sm text-purple-300 font-bold">{zoom}%</span>
              <ZoomIn 
                className="w-3 h-3 sm:w-4 sm:h-4 text-purple-300 cursor-pointer hover:text-purple-200" 
                onClick={() => setZoom(Math.min(150, zoom + 10))}
              />
            </div>
          </div>

          {isCellSelectorMode && (
            <div className="p-1.5 sm:p-2 bg-emerald-900/50 border-2 border-emerald-500 rounded">
              <p className="text-emerald-200 text-xs font-bold flex items-center gap-1 sm:gap-2">
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {lang === 'ES' 
                    ? '✨ Clic en celdas para agregar/quitar {{}}'
                    : lang === 'EN'
                    ? '✨ Click cells to add/remove {{}}'
                    : lang === 'DE'
                    ? '✨ Klicken Sie auf Zellen, um {{}} hinzuzufügen/entfernen'
                    : '✨ Cliquez sur les cellules pour ajouter/retirer {{}}'}
                </span>
                <span className="sm:hidden">
                  {lang === 'ES' ? '✨ Clic para {{}}' : lang === 'EN' ? '✨ Click for {{}}' : lang === 'DE' ? '✨ Klick für {{}}' : '✨ Cliquez pour {{}}'}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Grid Scrollable */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 min-h-0" style={{ zoom: `${zoom}%` }}>
          <div className="inline-block border-2 border-gray-700">
            <table className="border-collapse">
              <thead className="sticky top-0 bg-gray-900 z-10">
                <tr>
                  <th className="border border-gray-600 bg-gray-800 text-gray-400 text-xs p-2 w-12"></th>
                  {cells[0]?.map((_, colIndex) => (
                    <th key={colIndex} className="border border-gray-600 bg-gray-800 text-gray-400 text-xs p-2 min-w-[100px]">
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
                      
                      return (
                        <td
                          key={colIndex}
                          onClick={() => {
                            if (!isEditing) {
                              if (isCellSelectorMode) {
                                toggleCellMarker(rowIndex, colIndex);
                              }
                              setSelectedCell({ row: rowIndex, col: colIndex });
                            }
                          }}
                          onDoubleClick={() => startEditing(rowIndex, colIndex)}
                          className={`border border-gray-600 p-2 cursor-pointer min-w-[100px] relative ${
                            isSelected && !isEditing
                              ? 'bg-purple-600 text-white font-bold'
                              : isEditing
                              ? 'bg-purple-800 text-white'
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
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-800 border-t-2 border-gray-700 text-xs text-gray-400 text-center">
          {lang === 'ES' 
            ? '💡 Doble clic para editar texto | Clic simple en modo selector para agregar/quitar {{}}'
            : lang === 'EN'
            ? '💡 Double click to edit text | Single click in selector mode to add/remove {{}}'
            : lang === 'DE'
            ? '💡 Doppelklick zum Bearbeiten | Einfacher Klick im Auswahlmodus zum Hinzufügen/Entfernen von {{}}'
            : '💡 Double-clic pour éditer | Clic simple en mode sélecteur pour ajouter/retirer {{}}'}
        </div>
      </div>
    </div>
  );
};

export default MiniTemplateEditor;
