import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { PdfPage } from '../types';

// pdfjsLib.version is sometimes undefined in ESM, causing the worker script to 404 and hang. Hardcode the version matching package.json.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs`;

/**
 * Converts a File object to a Base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data-URL declaration (e.g. "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Extracts text from a single file.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  if (file.name.toLowerCase().endsWith('.txt')) {
    return await file.text();
  } else if (file.name.toLowerCase().endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
  
  const pages = await processPdfFile(file);
  return pages.map(p => p.text).join('\n');
};

/**
 * Helper to process items in batches (Fila Assíncrona Loteada)
 * Prevents Memory Out Of Bounds errors by limiting concurrent operations.
 */
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((item, idx) => processor(item, i + idx)));
    results.push(...batchResults);
  }
  return results;
}

const processPdfFile = async (file: File): Promise<PdfPage[]> => {
  // Use ObjectURL for Lazy Loading instead of loading entire ArrayBuffer to RAM
  const fileUrl = URL.createObjectURL(file);
  
  try {
    const loadingTask = pdfjsLib.getDocument({ url: fileUrl });
    const pdf = await loadingTask.promise;
    
    const pageIndices = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
    
    // Extrai as páginas em lotes para evitar estouro de RAM em relatórios de +100 páginas
    const pagesWithNulls = await processInBatches(pageIndices, 5, async (i) => {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ') // normalize whitespace
          .trim();

        if (text.length > 20) { 
          return {
            pageNumber: i,
            text: text,
            fileName: file.name
          };
        }
        return null;
      } catch (error) {
        console.error(`Error processing page ${i} of ${file.name}:`, error);
        return null;
      }
    });

    const pages = pagesWithNulls.filter((p): p is NonNullable<typeof p> => p !== null);
    
    // Ensure pages are sorted by page number since Promise.all resolves concurrently
    pages.sort((a, b) => a.pageNumber - b.pageNumber);

    return pages;
  } finally {
    // Release the generic blob URL to free memory
    URL.revokeObjectURL(fileUrl);
  }
};

/**
 * Extracts text from multiple files, adding headers to identify the source file.
 */
export const extractTextFromMultipleFiles = async (files: File[]): Promise<string> => {
  const texts = await processInBatches(files, 3, async (file) => {
    try {
      const fileText = await extractTextFromPdf(file);
      return `\n\n=== INÍCIO DO ARQUIVO: ${file.name} ===\n${fileText}\n=== FIM DO ARQUIVO: ${file.name} ===\n`;
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      return `\n\n[ERRO AO LER O ARQUIVO: ${file.name}]\n\n`;
    }
  });

  return texts.join("");
};