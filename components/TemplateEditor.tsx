import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Language } from '../types';
import { getTranslation } from '../services/translations';
import { ArrowRight, Download, Upload, Sparkles, X } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const firstSheetName = wb.SheetNames[0];
      setSheetName(firstSheetName);
      loadWorksheet(wb, firstSheetName);
      setExcelFile(file);
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
    
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const grid: CellData[][] = [];
    
    // Crear grid con datos
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

  // Insertar runa en celda seleccionada
  const insertRune = (runeName: string) => {
    if (!selectedCell || !worksheet || !workbook) return;
    
    const { row, col } = selectedCell;
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const runeText = `{{${runeName}}}`;
    
    // Actualizar worksheet
    worksheet[cellAddress] = {
      v: runeText,
      t: 's',
      w: runeText
    };
    
    // Actualizar workbook
    if (sheetName) {
      workbook.Sheets[sheetName] = worksheet;
    }
    
    // Actualizar grid visual
    const newCells = [...cells];
    if (newCells[row] && newCells[row][col]) {
      newCells[row][col].value = runeText;
      setCells(newCells);
    }
    
    // Si es una runa personalizada nueva, agregarla a la lista
    if (!commonRunes.includes(runeName) && !customRunes.includes(runeName)) {
      setCustomRunes([...customRunes, runeName]);
    }
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
        cellStyles: true,
        cellNF: true
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-purple-300">
                    {lang === 'ES' ? 'Plantilla Excel' : lang === 'EN' ? 'Excel Template' : lang === 'DE' ? 'Excel-Vorlage' : 'Modèle Excel'}: {excelFile.name}
                  </h2>
                  <button
                    onClick={saveTemplate}
                    className="bg-purple-600 text-white border-2 border-purple-500 hover:bg-purple-500 transition-colors font-bold py-2 px-6 flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {lang === 'ES' ? 'GUARDAR PLANTILLA' : lang === 'EN' ? 'SAVE TEMPLATE' : lang === 'DE' ? 'VORLAGE SPEICHERN' : 'ENREGISTRER MODÈLE'}
                  </button>
                </div>

                {/* Grid Scrollable */}
                <div className="overflow-auto max-h-[600px] border-2 border-gray-700">
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
                          {row.map((cell, colIndex) => (
                            <td
                              key={colIndex}
                              onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                              className={`border border-gray-600 p-2 cursor-pointer min-w-[120px] ${
                                selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                                  ? 'bg-purple-600 text-white font-bold'
                                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                              } ${
                                cell.value.includes('{{') && cell.value.includes('}}')
                                  ? 'text-emerald-400 font-bold'
                                  : ''
                              }`}
                            >
                              {cell.value || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedCell && (
                  <div className="mt-4 p-3 bg-purple-900/30 border-2 border-purple-600 rounded">
                    <p className="text-purple-300 text-sm">
                      {lang === 'ES' 
                        ? `Celda seleccionada: ${XLSX.utils.encode_col(selectedCell.col)}${selectedCell.row + 1}`
                        : lang === 'EN'
                        ? `Selected cell: ${XLSX.utils.encode_col(selectedCell.col)}${selectedCell.row + 1}`
                        : lang === 'DE'
                        ? `Ausgewählte Zelle: ${XLSX.utils.encode_col(selectedCell.col)}${selectedCell.row + 1}`
                        : `Cellule sélectionnée: ${XLSX.utils.encode_col(selectedCell.col)}${selectedCell.row + 1}`}
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
                    ? 'Haz clic en una celda y luego en una runa para insertarla'
                    : lang === 'EN'
                    ? 'Click on a cell then click on a rune to insert it'
                    : lang === 'DE'
                    ? 'Klicken Sie auf eine Zelle und dann auf eine Rune, um sie einzufügen'
                    : 'Cliquez sur une cellule puis sur une rune pour l\'insérer'}
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

