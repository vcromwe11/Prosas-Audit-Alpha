
import { GoogleGenAI } from "@google/genai";
import { DEFAULT_DOCUMENT_CRITERIA } from "../constants";
import { PROMPTS } from "../prompts";
import { getGlobalPrompt } from "./storageService";
import { fileToBase64 } from "./pdfService";
import { AuditResult, DocumentAuthRule } from "../types";

const getClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper para economizar tokens removendo espaços vazios excessivos
const sanitizeText = (text: string) => {
    return text.replace(/\s+/g, ' ').trim();
};

export type PromptGenerationMode = 'standard' | 'economical' | 'specialized';
export interface AuthRulesGenerationResult {
    rules: DocumentAuthRule[];
    referenceDate: string;
}

export const generateAuthRulesFromRegulation = async (regulationText: string, formTemplateText: string, referenceDate: string): Promise<AuthRulesGenerationResult> => {
    const ai = getClient();    const model = 'gemini-3.1-pro-preview'; 
    
    const basePrompt = await getGlobalPrompt('AUTH_RULES_GENERATION', PROMPTS.AUTH_RULES_GENERATION);

    const prompt = `
${basePrompt}

REGULAMENTO:
${regulationText.substring(0, 20000)}

MODELO DE FORMULÁRIO:
${formTemplateText.substring(0, 15000)}
`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        });
        const text = response.text || "{}";
        const result = JSON.parse(text);
        const rules = (result.rules || []) as DocumentAuthRule[];
        return {
            rules: rules.map(r => ({ ...r, id: Math.random().toString(36).substring(7) })),
            referenceDate: result.referenceDate || ""
        };
    } catch (error) {
        console.error("Error generating auth rules:", error);
        return { rules: [], referenceDate: "" };
    }
};

export const generateCriteriaFromRegulation = async (regulationText: string, mode: PromptGenerationMode = 'standard'): Promise<string> => {
    const ai = getClient();
    const model = 'gemini-3.1-pro-preview'; 
    
    let promptInstruction = '';
    
    if (mode === 'economical') {
        promptInstruction = await getGlobalPrompt('CRITERIA_GENERATION_ECONOMICAL', PROMPTS.CRITERIA_GENERATION_ECONOMICAL);
    } else if (mode === 'specialized') {
        promptInstruction = await getGlobalPrompt('CRITERIA_GENERATION_SPECIALIZED', PROMPTS.CRITERIA_GENERATION_SPECIALIZED);
    } else {
        promptInstruction = await getGlobalPrompt('CRITERIA_GENERATION_STANDARD', PROMPTS.CRITERIA_GENERATION_STANDARD);
    }

    const prompt = `
${promptInstruction}

Regulamento:
"""
${regulationText.substring(0, 30000)}
"""

Gere os critérios de análise com base APENAS no regulamento acima.
`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text || "";
    } catch (error) {
        console.error("Erro ao gerar critérios:", error);
        throw new Error("Falha ao gerar critérios com a IA.");
    }
};

export const runDocumentAudit = async (
    regulation: string,
    formTemplate: string,
    miscFiles: string,
    criteria: string,
    candidateFiles: File[],
    authRules: DocumentAuthRule[] = [],
    signal?: AbortSignal
): Promise<{ result: AuditResult, promptText: string }> => {
    const ai = getClient();
    // UPGRADE: Utilizando o modelo Pro para maior capacidade de raciocínio (Thinking)
    const model = 'gemini-3.1-pro-preview'; 
    
    // 1. Construção do Payload Intercalado (Texto + Arquivo)
    // Isso é CRUCIAL para a IA saber qual arquivo é qual.
    const userTaskPromptText = await getGlobalPrompt('AUDIT_USER_TASK', PROMPTS.AUDIT_USER_TASK);
    const parts: any[] = [{ text: userTaskPromptText }];

    const filePromises = candidateFiles.map(async (file) => {
        if (signal?.aborted) throw new Error("AbortError");
        try {
            const base64Data = await fileToBase64(file);
            return [
                { text: `\n\n=== INÍCIO DO ARQUIVO DO CANDIDATO: "${file.name}" ===\n(O conteúdo binário a seguir pertence a este arquivo)\n` },
                { inlineData: { data: base64Data, mimeType: "application/pdf" } }
            ];
        } catch (err) {
            console.error(`Erro ao processar arquivo para envio: ${file.name}`, err);
            return [];
        }
    });

    const filePartsArrays = await Promise.all(filePromises);
    for (const fileParts of filePartsArrays) {
        parts.push(...fileParts);
    }
    
    if (signal?.aborted) throw new Error("AbortError");

    // 2. Configuração do Contexto (System Instruction)
    const baseSystemInstruction = await getGlobalPrompt('AUDIT_SYSTEM_INSTRUCTION', PROMPTS.AUDIT_SYSTEM_INSTRUCTION);
    const systemInstructionText = baseSystemInstruction
        .replace('{{regulation}}', sanitizeText(regulation))
        .replace('{{formTemplate}}', sanitizeText(formTemplate) ? sanitizeText(formTemplate) : 'N/A')
        .replace('{{miscFiles}}', sanitizeText(miscFiles) ? sanitizeText(miscFiles) : 'N/A')
        .replace('{{criteria}}', criteria);

    const jsonString = await generateContentWithSmartRetry(ai, model, parts, systemInstructionText, 3, 8000, signal);
    
    const fullPromptText = `INSTRUÇÕES DO SISTEMA:\n${systemInstructionText}\n\nPROMPT DO USUÁRIO:\n${userTaskPromptText}`;

    try {
        const cleaned = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        return { result: JSON.parse(cleaned) as AuditResult, promptText: fullPromptText };
    } catch (e) {
        console.error("JSON Parse Error", jsonString);
        throw new Error("A IA retornou um formato inválido. Verifique se os arquivos não estão corrompidos.");
    }
};

/**
 * Lógica de Retry Otimizada
 */
const generateContentWithSmartRetry = async (
    ai: GoogleGenAI, 
    model: string, 
    parts: any[], 
    systemInstruction: string,
    retries = 3, 
    baseDelay = 8000,
    signal?: AbortSignal
): Promise<string> => {
    for (let i = 0; i < retries; i++) {
        if (signal?.aborted) throw new Error("AbortError");
        try {
            const generatePromise = ai.models.generateContent({
                model: model,
                contents: { parts: parts },
                config: {
                    systemInstruction: systemInstruction,
                    // Removido temperatura fixa para permitir que o modelo Pro use seu raciocínio padrão
                    candidateCount: 1,
                    responseMimeType: "application/json"
                }
            });
            
            const abortPromise = new Promise<never>((_, reject) => {
                if (signal) {
                    signal.addEventListener('abort', () => reject(new Error("AbortError")));
                }
            });

            const response = await Promise.race([generatePromise, abortPromise]) as any;
            return response.text || "";
        } catch (error: any) {
            if (error.message === "AbortError") throw error;
            
            let status = error.status || error.response?.status;
            let errorMessage = error.message || JSON.stringify(error);

            if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) {
                status = 429;
            }

            const isRateLimit = status === 429;
            const isServerOverload = status === 503;
            
            if ((isRateLimit || isServerOverload) && i < retries - 1) {
                const waitTime = baseDelay * Math.pow(2, i);
                console.warn(`Erro ${status} (Tentativa ${i + 1}/${retries}). Aguardando ${waitTime/1000}s...`);
                
                await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(resolve, waitTime);
                    if (signal) {
                        signal.addEventListener('abort', () => {
                            clearTimeout(timeout);
                            reject(new Error("AbortError"));
                        });
                    }
                });
                continue;
            }

            console.error("Erro fatal na API Gemini:", error);
            
            if (isRateLimit) {
                throw new Error("Cota de uso da IA excedida (Erro 429). O modelo Pro tem limites mais estritos no plano gratuito. Aguarde alguns minutos.");
            }
            if (errorMessage.includes("400")) {
                throw new Error("Erro nos arquivos enviados (Bad Request). Verifique se os PDFs são válidos.");
            }
            if (errorMessage.startsWith('{') && errorMessage.includes('"message":')) {
                try {
                    const parsed = JSON.parse(errorMessage);
                    throw new Error(parsed.error?.message || "Erro desconhecido na API.");
                } catch (e) {
                    throw new Error("Erro técnico na comunicação com a IA.");
                }
            }
            throw error; 
        }
    }
    throw new Error("O servidor da IA está muito ocupado no momento. Tente novamente em 2 minutos.");
};
