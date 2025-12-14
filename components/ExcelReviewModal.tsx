import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Language } from '../types';
import { getTranslation } from '../services/translations';
import { X, Check, XCircle, AlertTriangle, Download, Edit2, Sparkles, Save, FileText } from 'lucide-react';
import { downloadExcelWorkbook, generateFileNameFromData, normalizeValueForExcel } from '../services/excelTemplateService';
import { analyzePdfContent } from '../services/geminiService';
import { extractTextFromPdf } from '../services/pdfService';
import { exportExcelToLegacyFormat, type ERPType, mapInvoiceToAccountingEntry, exportToLegacyFormat, type AccountingEntry } from '../services/legacyExportService';
import JSZip from 'jszip';
import saveAs from 'file-saver';

interface ExcelReviewModalProps {
  workbook: XLSX.WorkBook;
  extractedData: Array<{pdfName: string; data: Record<string, any>}>;
  excelTemplate: File;
  pdfFiles: File[];
  lang: Language;
  renameFiles: boolean;
  onClose: () => void;
  onDownload: () => void;
}

const ExcelReviewModal: React.FC<ExcelReviewModalProps> = ({
  workbook,
  extractedData,
  excelTemplate,
  pdfFiles,
  lang,
  renameFiles,
  onClose,
  onDownload
}) => {
  const t = getTranslation(lang);
  const [editingCell, setEditingCell] = useState<{pdfIndex: number; field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [reviewedData, setReviewedData] = useState<Array<{pdfName: string; data: Record<string, any>}>>(extractedData);
  const [reviewedWorkbook, setReviewedWorkbook] = useState<XLSX.WorkBook>(workbook);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'legacy'>('excel');
  const [legacyERPType, setLegacyERPType] = useState<ERPType>('a3');

  // Calcular estadísticas de revisión
  const getReviewStats = () => {
    let totalFields = 0;
    let filledFields = 0;
    let emptyFields = 0;
    
    reviewedData.forEach(item => {
      Object.values(item.data).forEach(value => {
        totalFields++;
        if (value !== null && value !== undefined && value !== '') {
          filledFields++;
        } else {
          emptyFields++;
        }
      });
    });
    
    return { totalFields, filledFields, emptyFields };
  };

  const stats = getReviewStats();
  const completionRate = stats.totalFields > 0 ? (stats.filledFields / stats.totalFields) * 100 : 0;

  // Editar un campo específico
  const handleEditField = (pdfIndex: number, field: string, currentValue: any) => {
    setEditingCell({ pdfIndex, field });
    setEditValue(String(currentValue || ''));
  };

  // Guardar edición
  const handleSaveEdit = () => {
    if (!editingCell) return;
    
    const newData = [...reviewedData];
    newData[editingCell.pdfIndex].data[editingCell.field] = editValue;
    setReviewedData(newData);
    
    // Actualizar workbook con el nuevo valor
    updateWorkbookWithValue(editingCell.pdfIndex, editingCell.field, editValue);
    
    setEditingCell(null);
    setEditValue('');
  };

  // Actualizar workbook con nuevo valor editado
  const updateWorkbookWithValue = (pdfIndex: number, field: string, newValue: any) => {
    try {
      // Buscar todas las hojas del workbook
      reviewedWorkbook.SheetNames.forEach(sheetName => {
        const worksheet = reviewedWorkbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const markerRegex = /\{\{([^}]+)\}\}/g;
        
        // Buscar la fila correspondiente a este PDF
        // Asumimos que cada PDF ocupa un bloque de filas
        // Necesitamos encontrar dónde están los datos de este PDF específico
        // Por simplicidad, actualizamos todas las celdas que coincidan con el campo
        
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellAddress];
            
            if (cell && cell.v && typeof cell.v === 'string') {
              // Buscar si esta celda tiene el marcador del campo que estamos editando
              markerRegex.lastIndex = 0;
              const match = markerRegex.exec(cell.v);
              if (match) {
                const markerName = match[1].trim().toUpperCase().replace(/\s+/g, '_');
                const normalizedField = field.toUpperCase().replace(/\s+/g, '_');
                
                if (markerName === normalizedField) {
                  // Encontrar la celda de datos correspondiente (debajo del marcador)
                  // Buscar hacia abajo desde esta celda hasta encontrar datos de este PDF
                  // Por simplicidad, actualizamos la primera celda con datos debajo del marcador
                  const dataRow = row + 1;
                  const dataCellAddress = XLSX.utils.encode_cell({ r: dataRow, c: col });
                  
                  // Normalizar el nuevo valor (importar función)
                  const normalizedValue = normalizeValueForExcel(newValue, field, false);
                  
                  worksheet[dataCellAddress] = normalizedValue;
                }
              }
            }
          }
        }
      });
      
      // Actualizar el workbook en el estado
      setReviewedWorkbook({ ...reviewedWorkbook });
    } catch (error) {
      console.error('Error actualizando workbook:', error);
    }
  };

  // Regenerar datos con IA para un PDF específico
  const handleRegenerateWithAI = async (pdfIndex: number) => {
    if (pdfIndex >= pdfFiles.length) return;
    
    setIsRegenerating(true);
    try {
      const pdfFile = pdfFiles[pdfIndex];
      const pdfText = await extractTextFromPdf(pdfFile, Infinity, false);
      const newData = await analyzePdfContent(pdfText, pdfFile.name, lang, 'FINANCE');
      
      const updatedData = [...reviewedData];
      updatedData[pdfIndex] = {
        pdfName: pdfFile.name,
        data: { ...updatedData[pdfIndex].data, ...newData }
      };
      setReviewedData(updatedData);
      
      alert(lang === 'ES' 
        ? 'Datos regenerados con IA exitosamente'
        : 'Data regenerated with AI successfully');
    } catch (error) {
      alert(lang === 'ES' 
        ? 'Error al regenerar datos: ' + (error instanceof Error ? error.message : 'Error desconocido')
        : 'Error regenerating data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRegenerating(false);
    }
  };

  // Descargar Excel final o formato Legacy
  const handleDownload = async () => {
    try {
      if (exportFormat === 'legacy') {
        // Exportar a formato Legacy ERP
        const entries: AccountingEntry[] = [];
        
        for (let i = 0; i < reviewedData.length; i++) {
          const entry = mapInvoiceToAccountingEntry(reviewedData[i].data, i + 1);
          entries.push(entry);
        }
        
        const filename = `asientos_${legacyERPType}_${Date.now()}.txt`;
        await exportToLegacyFormat(entries, legacyERPType, filename);
        
        // Si está habilitado el renombrado, crear ZIP con archivos renombrados
        if (renameFiles) {
          const zip = new JSZip();
          
          // Agregar archivo legacy al ZIP
          // Necesitamos regenerar el archivo legacy para el ZIP
          const legacyBlob = await generateLegacyBlob(entries, legacyERPType);
          zip.file(filename, legacyBlob);
          
          // Agregar PDFs renombrados
          for (let i = 0; i < pdfFiles.length; i++) {
            if (i < reviewedData.length) {
              const newFileName = generateFileNameFromData(reviewedData[i].data, pdfFiles[i].name, lang);
              zip.file(newFileName, pdfFiles[i]);
            }
          }
          
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          saveAs(zipBlob, `facturas_procesadas_${Date.now()}.zip`);
        }
        
        onDownload();
        onClose();
        return;
      }
      
      // Exportación Excel normal
      // Generar archivos renombrados si está habilitado
      const renamedFiles: Array<{ originalName: string; newName: string; file: File }> = [];
      
      if (renameFiles) {
        for (let i = 0; i < pdfFiles.length; i++) {
          if (i < reviewedData.length) {
            const newFileName = generateFileNameFromData(reviewedData[i].data, pdfFiles[i].name, lang);
            renamedFiles.push({
              originalName: pdfFiles[i].name,
              newName: newFileName,
              file: pdfFiles[i]
            });
          }
        }
      }
      
      // Generar el archivo Excel
      const excelBuffer = XLSX.write(reviewedWorkbook, {
        type: 'array',
        bookType: 'xlsx',
        cellStyles: true
      });
      
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Generar nombre de archivo
      let outputFileName = excelTemplate.name;
      outputFileName = outputFileName.replace(/\.(xlsx|xls|xlss?x?)$/i, '');
      outputFileName = `${outputFileName}_relleno_${pdfFiles.length}_facturas.xlsx`;
      
      // Si está habilitado el renombrado, crear ZIP
      if (renameFiles && renamedFiles.length > 0) {
        const zip = new JSZip();
        zip.file(outputFileName, excelBuffer);
        
        for (const renamedFile of renamedFiles) {
          zip.file(renamedFile.newName, renamedFile.file);
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `facturas_procesadas_${Date.now()}.zip`);
      } else {
        saveAs(blob, outputFileName);
      }
      
      onDownload();
      onClose();
    } catch (error) {
      alert(lang === 'ES' 
        ? 'Error al descargar: ' + (error instanceof Error ? error.message : 'Error desconocido')
        : 'Error downloading: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Helper para generar blob legacy (para ZIP)
  const generateLegacyBlob = async (entries: AccountingEntry[], erpType: ERPType): Promise<Blob> => {
    const legacyService = await import('../services/legacyExportService');
    const schema = await legacyService.loadERPSchema(erpType);
    const sortedColumns = [...schema.columns].sort((a, b) => a.position - b.position);
    const lines: string[] = [];
    
    for (const entry of entries) {
      let line = '';
      if (schema.fixedWidth) {
        for (const column of sortedColumns) {
          const value = entry[column.name as keyof AccountingEntry];
          const formatted = legacyService.formatValue(value, column);
          line += formatted;
        }
      } else {
        const values: string[] = [];
        for (const column of sortedColumns) {
          const value = entry[column.name as keyof AccountingEntry];
          const formatted = legacyService.formatValue(value, column);
          values.push(formatted);
        }
        line = values.join(schema.separator);
      }
      lines.push(line);
    }
    
    const textContent = lines.join(schema.lineEnding);
    const ansiBytes = legacyService.convertToANSI(textContent, schema.encoding);
    return new Blob([ansiBytes], { type: 'text/plain;charset=' + schema.encoding });
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gray-900 border-4 border-purple-500 rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b-4 border-purple-600 bg-purple-900/30 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-300 pixel-font-header truncate">
              {lang === 'ES' ? 'REVISIÓN PREVIA' : lang === 'EN' ? 'PREVIEW REVIEW' : lang === 'DE' ? 'VORSCHAU' : 'RÉVISION PRÉALABLE'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-red-600 text-white border-2 border-red-500 hover:bg-red-500 transition-colors font-bold py-1.5 px-2 sm:py-2 sm:px-4 flex-shrink-0 ml-2"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Estadísticas */}
        <div className="p-3 sm:p-4 bg-gray-800 border-b-2 border-gray-700 flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-blue-900/50 border-2 border-blue-600 rounded p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-300">{reviewedData.length}</div>
              <div className="text-xs sm:text-sm text-blue-200">{lang === 'ES' ? 'Facturas' : lang === 'EN' ? 'Invoices' : lang === 'DE' ? 'Rechnungen' : 'Factures'}</div>
            </div>
            <div className="bg-green-900/50 border-2 border-green-600 rounded p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-300">{stats.filledFields}</div>
              <div className="text-xs sm:text-sm text-green-200">{lang === 'ES' ? 'Campos llenos' : lang === 'EN' ? 'Filled fields' : lang === 'DE' ? 'Ausgefüllte Felder' : 'Champs remplis'}</div>
            </div>
            <div className="bg-yellow-900/50 border-2 border-yellow-600 rounded p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-300">{stats.emptyFields}</div>
              <div className="text-xs sm:text-sm text-yellow-200">{lang === 'ES' ? 'Campos vacíos' : lang === 'EN' ? 'Empty fields' : lang === 'DE' ? 'Leere Felder' : 'Champs vides'}</div>
            </div>
            <div className="bg-purple-900/50 border-2 border-purple-600 rounded p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-300">{Math.round(completionRate)}%</div>
              <div className="text-xs sm:text-sm text-purple-200">{lang === 'ES' ? 'Completitud' : lang === 'EN' ? 'Completion' : lang === 'DE' ? 'Vollständigkeit' : 'Complétude'}</div>
            </div>
          </div>
        </div>

        {/* Tabla de revisión */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 min-h-0">
          <div className="overflow-x-auto h-full">
            <table className="w-full border-collapse border border-gray-600 min-w-[600px]">
              <thead className="sticky top-0 bg-gray-800 z-10">
                <tr>
                  <th className="border border-gray-600 bg-gray-800 text-gray-300 p-1.5 sm:p-2 text-left text-xs sm:text-sm sticky left-0 z-20 bg-gray-800">
                    {lang === 'ES' ? 'PDF' : lang === 'EN' ? 'PDF' : lang === 'DE' ? 'PDF' : 'PDF'}
                  </th>
                  {Object.keys(reviewedData[0]?.data || {}).map(field => (
                    <th key={field} className="border border-gray-600 bg-gray-800 text-gray-300 p-1.5 sm:p-2 text-left text-xs sm:text-sm min-w-[120px] sm:min-w-[150px]">
                      <div className="truncate max-w-[120px] sm:max-w-[150px]" title={field}>
                        {field}
                      </div>
                    </th>
                  ))}
                  <th className="border border-gray-600 bg-gray-800 text-gray-300 p-1.5 sm:p-2 text-left text-xs sm:text-sm sticky right-0 z-20 bg-gray-800">
                    {lang === 'ES' ? 'Acciones' : lang === 'EN' ? 'Actions' : lang === 'DE' ? 'Aktionen' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviewedData.map((item, pdfIndex) => (
                  <tr key={pdfIndex} className="hover:bg-gray-800/50">
                    <td className="border border-gray-600 p-1.5 sm:p-2 text-gray-300 text-xs sm:text-sm sticky left-0 z-10 bg-gray-900">
                      <div className="max-w-[100px] sm:max-w-[150px] truncate" title={item.pdfName}>
                        {item.pdfName}
                      </div>
                    </td>
                    {Object.entries(item.data).map(([field, value]) => {
                      const isEditing = editingCell?.pdfIndex === pdfIndex && editingCell?.field === field;
                      const isEmpty = value === null || value === undefined || value === '';
                      
                      return (
                        <td 
                          key={field} 
                          className={`border border-gray-600 p-1.5 sm:p-2 ${
                            isEmpty ? 'bg-red-900/30' : 'bg-green-900/30'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveEdit();
                                  } else if (e.key === 'Escape') {
                                    setEditingCell(null);
                                    setEditValue('');
                                  }
                                }}
                                className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm focus:outline-none focus:border-purple-500"
                                autoFocus
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="bg-green-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hover:bg-green-500 flex-shrink-0"
                                title={lang === 'ES' ? 'Guardar' : lang === 'EN' ? 'Save' : lang === 'DE' ? 'Speichern' : 'Enregistrer'}
                              >
                                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-1 sm:gap-2">
                              <span className={`text-xs sm:text-sm truncate flex-1 ${isEmpty ? 'text-red-300' : 'text-green-300'}`} title={String(value)}>
                                {isEmpty ? (lang === 'ES' ? '(vacío)' : lang === 'EN' ? '(empty)' : lang === 'DE' ? '(leer)' : '(vide)') : String(value).length > 15 ? String(value).substring(0, 15) + '...' : String(value)}
                              </span>
                              <button
                                onClick={() => handleEditField(pdfIndex, field, value)}
                                className="text-gray-400 hover:text-purple-400 transition-colors flex-shrink-0"
                                title={lang === 'ES' ? 'Editar' : lang === 'EN' ? 'Edit' : lang === 'DE' ? 'Bearbeiten' : 'Éditer'}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-gray-600 p-1.5 sm:p-2 sticky right-0 z-10 bg-gray-900">
                      <button
                        onClick={() => handleRegenerateWithAI(pdfIndex)}
                        disabled={isRegenerating}
                        className="bg-indigo-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-bold hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                        title={lang === 'ES' ? 'Regenerar con IA' : lang === 'EN' ? 'Regenerate with AI' : lang === 'DE' ? 'Mit KI regenerieren' : 'Régénérer avec IA'}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span className="hidden sm:inline">{lang === 'ES' ? 'IA' : lang === 'EN' ? 'AI' : lang === 'DE' ? 'KI' : 'IA'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="p-3 sm:p-4 bg-gray-800 border-t-2 border-gray-700 flex flex-col gap-3 sm:gap-4 flex-shrink-0">
          {/* Selector de formato de exportación */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <label className="text-xs sm:text-sm text-gray-300 font-semibold whitespace-nowrap">
              {lang === 'ES' ? 'Formato de exportación:' : lang === 'EN' ? 'Export format:' : lang === 'DE' ? 'Exportformat:' : 'Format d\'exportation:'}
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setExportFormat('excel')}
                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-bold transition-colors ${
                  exportFormat === 'excel'
                    ? 'bg-blue-600 text-white border-2 border-blue-400'
                    : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                }`}
              >
                Excel
              </button>
              <button
                onClick={() => setExportFormat('legacy')}
                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-bold transition-colors flex items-center gap-1 ${
                  exportFormat === 'legacy'
                    ? 'bg-orange-600 text-white border-2 border-orange-400'
                    : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <FileText className="w-3 h-3" />
                {lang === 'ES' ? 'ERP Legacy' : lang === 'EN' ? 'Legacy ERP' : lang === 'DE' ? 'Legacy ERP' : 'ERP Legacy'}
              </button>
            </div>
            {exportFormat === 'legacy' && (
              <select
                value={legacyERPType}
                onChange={(e) => setLegacyERPType(e.target.value as ERPType)}
                className="bg-gray-700 text-white border-2 border-gray-600 rounded px-2 py-1.5 text-xs sm:text-sm font-bold focus:outline-none focus:border-orange-400"
              >
                <option value="a3">A3 Contabilidad</option>
                <option value="sage">Sage</option>
                <option value="contaplus">ContaPlus</option>
              </select>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 flex-1">
              {completionRate >= 80 ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
              ) : completionRate >= 50 ? (
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
              )}
              <span className="break-words">
                {lang === 'ES' 
                  ? `Estado: ${completionRate >= 80 ? 'Listo para descargar' : completionRate >= 50 ? 'Revisar campos vacíos' : 'Muchos campos vacíos - considerar regenerar'}`
                  : lang === 'EN'
                  ? `Status: ${completionRate >= 80 ? 'Ready to download' : completionRate >= 50 ? 'Review empty fields' : 'Many empty fields - consider regenerating'}`
                  : lang === 'DE'
                  ? `Status: ${completionRate >= 80 ? 'Bereit zum Herunterladen' : completionRate >= 50 ? 'Leere Felder überprüfen' : 'Viele leere Felder - Regenerierung erwägen'}`
                  : `Statut: ${completionRate >= 80 ? 'Prêt à télécharger' : completionRate >= 50 ? 'Vérifier les champs vides' : 'Beaucoup de champs vides - envisager de régénérer'}`}
              </span>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="bg-gray-700 text-white border-2 border-gray-600 hover:bg-gray-600 transition-colors font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base flex-1 sm:flex-initial"
              >
                {lang === 'ES' ? 'CANCELAR' : lang === 'EN' ? 'CANCEL' : lang === 'DE' ? 'ABBRECHEN' : 'ANNULER'}
              </button>
              <button
                onClick={handleDownload}
                className={`${
                  exportFormat === 'legacy' 
                    ? 'bg-orange-600 border-orange-500 hover:bg-orange-500' 
                    : 'bg-green-600 border-green-500 hover:bg-green-500'
                } text-white border-2 transition-colors font-bold py-2 px-3 sm:px-4 rounded flex items-center justify-center gap-2 text-sm sm:text-base flex-1 sm:flex-initial`}
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">
                  {exportFormat === 'legacy'
                    ? (lang === 'ES' ? 'DESCARGAR TXT' : lang === 'EN' ? 'DOWNLOAD TXT' : lang === 'DE' ? 'TXT HERUNTERLADEN' : 'TÉLÉCHARGER TXT')
                    : (lang === 'ES' ? 'DESCARGAR EXCEL' : lang === 'EN' ? 'DOWNLOAD EXCEL' : lang === 'DE' ? 'EXCEL HERUNTERLADEN' : 'TÉLÉCHARGER EXCEL')
                  }
                </span>
                <span className="sm:hidden">{lang === 'ES' ? 'DESCARGAR' : lang === 'EN' ? 'DOWNLOAD' : lang === 'DE' ? 'HERUNTERLADEN' : 'TÉLÉCHARGER'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelReviewModal;
