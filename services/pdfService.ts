// We use the global pdfjsLib loaded via CDN in index.html to avoid complex worker setups in this environment
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const extractTextFromPdf = async (file: File, pageLimit: number = 3): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Using the global window.pdfjsLib
    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    // If pageLimit is less than 0 or Infinity, use all pages
    const maxPages = (pageLimit <= 0 || pageLimit === Infinity) ? pdf.numPages : Math.min(pdf.numPages, pageLimit);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `Page ${i}: ${pageText}\n\n`; // Added extra newline for better parsing
    }

    return fullText;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw new Error("Failed to read PDF text.");
  }
};