import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { PdfPage } from '../types';

// Set the worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
 * Extracts text from multiple files, adding headers to identify the source file.
 * This is crucial for the AI to distinguish between the "Bylaws" and the "Project Form".
 */
export const extractTextFromMultipleFiles = async (files: File[]): Promise<string> => {
  let combinedText = "";

  for (const file of files) {
    try {
      let fileText = "";
      if (file.name.toLowerCase().endsWith('.txt')) {
        fileText = await file.text();
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        fileText = result.value;
      } else {
        const pages = await processPdfFile(file);
        fileText = pages.map(p => p.text).join('\n');
      }
      
      combinedText += `\n\n=== INÍCIO DO ARQUIVO: ${file.name} ===\n`;
      combinedText += fileText;
      combinedText += `\n=== FIM DO ARQUIVO: ${file.name} ===\n`;
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      combinedText += `\n\n[ERRO AO LER O ARQUIVO: ${file.name}]\n\n`;
    }
  }

  return combinedText;
};

const processPdfFile = async (file: File): Promise<PdfPage[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const pages: PdfPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ') // normalize whitespace
        .trim();

      if (text.length > 20) { 
        pages.push({
          pageNumber: i,
          text: text,
          fileName: file.name
        });
      }
    } catch (error) {
      console.error(`Error processing page ${i} of ${file.name}:`, error);
    }
  }

  return pages;
};