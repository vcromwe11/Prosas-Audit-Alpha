const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf8');

const importStatement = `import { generateCacheKey, getCachedAudit, setCachedAudit } from './cacheService';\n`;

code = code.replace(
    /export const runDocumentAudit = async \(/,
    importStatement + `\nexport const runDocumentAudit = async (`
);

const originalFunction = `
    const jsonString = await generateContentWithSmartRetry(ai, model, parts, systemInstructionText, 3, 8000, signal, onProgress);
    
    const fullPromptText = \`INSTRUÇÕES DO SISTEMA:\\n\${systemInstructionText}\\n\\nPROMPT DO USUÁRIO:\\n\${userTaskPromptText}\`;
`;

const updatedFunction = `
    // CACHE LOGIC
    const fullPromptText = \`INSTRUÇÕES DO SISTEMA:\\n\${systemInstructionText}\\n\\nPROMPT DO USUÁRIO:\\n\${userTaskPromptText}\`;
    const cacheData = fullPromptText + JSON.stringify(parts);
    const cacheKey = await generateCacheKey(cacheData);
    
    const cachedResult = await getCachedAudit(cacheKey);
    if (cachedResult) {
        if (onProgress) onProgress("Usando análise em cache para este conjunto de documentos...");
        return { result: cachedResult, promptText: fullPromptText };
    }

    const jsonString = await generateContentWithSmartRetry(ai, model, parts, systemInstructionText, 3, 8000, signal, onProgress);
`;

code = code.replace(originalFunction, updatedFunction);

const originalReturn = `
    try {
        const cleaned = jsonString.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        return { result: JSON.parse(cleaned) as AuditResult, promptText: fullPromptText };
    } catch (e) {
`;

const updatedReturn = `
    try {
        const cleaned = jsonString.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        const parsedResult = JSON.parse(cleaned) as AuditResult;
        
        // SAVE TO CACHE
        await setCachedAudit(cacheKey, parsedResult, fullPromptText);
        
        return { result: parsedResult, promptText: fullPromptText };
    } catch (e) {
`;

code = code.replace(originalReturn, updatedReturn);

fs.writeFileSync('services/geminiService.ts', code);
