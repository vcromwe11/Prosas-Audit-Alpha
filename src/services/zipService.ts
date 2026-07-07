import JSZip from 'jszip';

// Add batch processing helper
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((item) => processor(item)));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Extracts all PDF files from a ZIP archive, including those in subdirectories.
 * Returns a flat array of File objects.
 */
export const extractPdfsFromZip = async (zipFile: File): Promise<File[]> => {
    try {
        const zip = new JSZip();
        const content = await zip.loadAsync(zipFile);
        const extractedFiles: File[] = [];

        // Iterable list of files
        const fileEntries: JSZip.JSZipObject[] = [];

        content.forEach((relativePath, zipEntry) => {
            if (zipEntry.dir || zipEntry.name.startsWith('__MACOSX') || zipEntry.name.startsWith('.')) {
                return;
            }
            if (zipEntry.name.toLowerCase().endsWith('.pdf')) {
                fileEntries.push(zipEntry);
            }
        });

        // Process extraction in batches of 5 simultaneously to prevent memory overflow
        const files = await processInBatches(fileEntries, 5, async (zipEntry) => {
            const blob = await zipEntry.async('blob');
            const flatName = zipEntry.name.replace(/\//g, '_');
            return new File([blob], flatName, { type: 'application/pdf' });
        });

        extractedFiles.push(...files);
        return extractedFiles;
    } catch (error) {
        console.error("Error unzipping file:", error);
        throw new Error("Falha ao processar arquivo ZIP. Verifique se não está corrompido.");
    }
};
