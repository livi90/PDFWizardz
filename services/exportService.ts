import JSZip from 'jszip';
import saveAs from 'file-saver';
import { FileItem, ProcessingStatus } from '../types';

export const downloadResults = async (processedFiles: FileItem[]) => {
  const completedFiles = processedFiles.filter(f => f.status === ProcessingStatus.COMPLETED && f.metadata);
  
  if (completedFiles.length === 0) {
    alert("No processed files to export.");
    return;
  }

  const zip = new JSZip();
  const excelRows: any[] = [];

  // 1. Add Files to Zip and Prepare Excel Data
  for (const item of completedFiles) {
    if (item.metadata) {
      // Add renamed file to ZIP
      zip.file(item.metadata.suggestedName, item.file);

      // Add to Excel array
      excelRows.push({
        "Original Name": item.metadata.originalName,
        "New Name": item.metadata.suggestedName,
        "Date": item.metadata.date,
        "Entity": item.metadata.entity,
        "Category": item.metadata.category,
        "Summary": item.metadata.summary
      });
    }
  }

  // 2. Create Excel Sheet
  try {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PDF Log");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // 3. Add Excel to ZIP
    zip.file("Processing_Report.xlsx", excelBuffer);
  } catch (error) {
    console.error('Error creating Excel file:', error);
    alert('Error al crear el archivo Excel. Continuando sin el reporte Excel.');
  }

  // 4. Generate and Download ZIP
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "PDF_Wizard_Bundle.zip");
};