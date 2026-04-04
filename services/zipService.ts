import JSZip from 'jszip';

/**
 * Extracts all PDF files from a ZIP archive, including those in subdirectories.
 * Returns a flat array of File objects.
 */
export const extractPdfsFromZip = async (zipFile: File): Promise<File[]> => {
    try {
        const zip = new JSZip();
        const content = await zip.loadAsync(zipFile);
        const extractedFiles: File[] = [];

        // Iterate through every file in the zip
        // object contains the relative path (e.g., "folder/subfolder/file.pdf")
        const promises: Promise<void>[] = [];

        content.forEach((relativePath, zipEntry) => {
            // Skip directories and hidden files (like __MACOSX)
            if (zipEntry.dir || zipEntry.name.startsWith('__MACOSX') || zipEntry.name.startsWith('.')) {
                return;
            }

            // Check if it is a PDF
            if (zipEntry.name.toLowerCase().endsWith('.pdf')) {
                const promise = async () => {
                    const blob = await zipEntry.async('blob');
                    // Create a new File object. We replace slashes with underscores to keep context in filename
                    // e.g. "docs/finance/balanco.pdf" -> "docs_finance_balanco.pdf"
                    const flatName = zipEntry.name.replace(/\//g, '_');
                    const file = new File([blob], flatName, { type: 'application/pdf' });
                    extractedFiles.push(file);
                };
                promises.push(promise());
            }
        });

        await Promise.all(promises);
        return extractedFiles;
    } catch (error) {
        console.error("Error unzipping file:", error);
        throw new Error("Falha ao processar arquivo ZIP. Verifique se não está corrompido.");
    }
};
