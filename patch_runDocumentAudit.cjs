const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf8');

code = code.replace(
    /export const runDocumentAudit = async \([\s\S]*?\): Promise<\{ result: AuditResult, promptText: string \}> => \{/,
    `export const runDocumentAudit = async (
    regulation: string,
    formTemplate: string,
    miscFiles: string,
    criteria: string,
    candidateFiles: File[],
    authRules: DocumentAuthRule[] = [],
    signal?: AbortSignal,
    onProgress?: (text: string) => void,
    promptModules?: DocumentPromptModule[],
    isOtimizada?: boolean
): Promise<{ result: AuditResult, promptText: string }> => {`
);

fs.writeFileSync('services/geminiService.ts', code);
