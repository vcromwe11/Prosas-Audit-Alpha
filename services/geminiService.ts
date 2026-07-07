
import { GoogleGenAI } from "@google/genai";

const getAiModel = () => {
    try {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('prosas_app_settings');
            if (stored) {
                const settings = JSON.parse(stored);
                if (settings.aiModel) return settings.aiModel;
            }
        }
    } catch (e) {}
    return 'gemini-2.5-flash'; // Fallback
};

import { DEFAULT_DOCUMENT_CRITERIA } from "../constants";
import { PROMPTS } from "../prompts";
import { getGlobalPrompt } from "./storageService";
import { fileToBase64 } from "./pdfService";
import { AuditResult, DocumentAuthRule, DocumentPromptModule } from "../types";
import { RULE_TEMPLATES } from "./ruleTemplates";

const getClient = () => {
    return new GoogleGenAI({ 
        apiKey: "proxy", // API key is injected by the proxy server
        httpOptions: { baseUrl: window.location.origin + "/api/genai" }
    });
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
    const ai = getClient();    const model = getAiModel(); 
    
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
        
        const generatedDocs = result.requiredDocuments || [];
        const builtRules: DocumentAuthRule[] = [];
        
        for (const doc of generatedDocs) {
            const template = RULE_TEMPLATES.find(t => t.name === doc.templateName);
            if (template) {
                builtRules.push({
                    id: Math.random().toString(36).substring(7),
                    questionPrefix: doc.questionPrefix || template.rule.questionPrefix,
                    documentType: template.rule.documentType,
                    dataToScrape: template.rule.dataToScrape,
                    formatRegex: template.rule.formatRegex,
                    validationRule: doc.customValidationRule || template.rule.validationRule,
                    approvalTrigger: doc.customApprovalTrigger || template.rule.approvalTrigger,
                    rejectionTrigger: doc.customRejectionTrigger || template.rule.rejectionTrigger
                });
            }
        }

        return {
            rules: builtRules,
            referenceDate: result.referenceDate || ""
        };
    } catch (error) {
        console.error("Error generating auth rules:", error);
        return { rules: [], referenceDate: "" };
    }
};

export const generateCriteriaFromRegulation = async (regulationText: string, mode: PromptGenerationMode = 'standard', authRules: DocumentAuthRule[] = []): Promise<string> => {
    const ai = getClient();
    const model = getAiModel(); 
    
    let promptInstruction = '';
    
    if (mode === 'economical') {
        promptInstruction = await getGlobalPrompt('CRITERIA_GENERATION_ECONOMICAL', PROMPTS.CRITERIA_GENERATION_ECONOMICAL);
    } else if (mode === 'specialized') {
        promptInstruction = await getGlobalPrompt('CRITERIA_GENERATION_SPECIALIZED', PROMPTS.CRITERIA_GENERATION_SPECIALIZED);
    } else {
        promptInstruction = await getGlobalPrompt('CRITERIA_GENERATION_STANDARD', PROMPTS.CRITERIA_GENERATION_STANDARD);
    }

    let extraInstruction = '';
    if (authRules.length > 0) {
        const docList = authRules.map(r => r.documentType).join(', ');
        extraInstruction = `

Atenção: Os validadores automáticos do sistema já vão cobrir a data de validade, emissão e status primário para os seguintes documentos: [${docList}].
Portanto, para estes documentos, VOCÊ NÃO PRECISA criar regras para checar se eles estão dentro do prazo ou válidos.
Apenas crie regras de CRUZAMENTO DE DADOS para eles (exemplo: "O CNPJ do 'Cartão CNPJ' precisa ser igual ao do 'Contrato Social'").`;
    }

    const prompt = `
${promptInstruction}${extraInstruction}

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

import { generateCacheKey, getCachedAudit, setCachedAudit } from './cacheService';

export const runDocumentAudit = async (
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
): Promise<{ result: AuditResult, promptText: string }> => {
    const ai = getClient();
    // UPGRADE: Utilizando o modelo Pro para maior capacidade de raciocínio (Thinking)
    const model = getAiModel(); 
    
    // 1. Construção do Payload Intercalado (Texto + Arquivo)
    // Isso é CRUCIAL para a IA saber qual arquivo é qual.
    const userTaskPromptText = await getGlobalPrompt('AUDIT_USER_TASK', PROMPTS.AUDIT_USER_TASK);
    const parts: any[] = [{ text: userTaskPromptText }];

    const filePromises = candidateFiles.map(async (file) => {
        if (signal?.aborted) throw new Error("AbortError");
        try {
            const base64Data = await fileToBase64(file);
            let mimeType = file.type || "application/pdf";
            if (!file.type) {
                if (file.name.endsWith('.docx')) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                else if (file.name.endsWith('.txt')) mimeType = "text/plain";
            }
            return [
                { text: `\n\n=== INÍCIO DO ARQUIVO DO CANDIDATO: "${file.name}" ===\n(O conteúdo binário a seguir pertence a este arquivo)\n` },
                { inlineData: { data: base64Data, mimeType: mimeType } }
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

    // CACHE LOGIC
    const fullPromptText = `INSTRUÇÕES DO SISTEMA:\n${systemInstructionText}\n\nPROMPT DO USUÁRIO:\n${userTaskPromptText}`;
    const cacheData = fullPromptText + JSON.stringify(parts);
    const cacheKey = await generateCacheKey(cacheData);
    
    const cachedResult = await getCachedAudit(cacheKey);
    if (cachedResult) {
        if (onProgress) onProgress("Usando análise em cache para este conjunto de documentos...");
        return { result: cachedResult, promptText: fullPromptText };
    }

    
    if (isOtimizada && promptModules && promptModules.length > 0) {
        // Triage Step
        onProgress?.('TRIAGEM: Identificando documentos com Gemini 1.5 Flash...');
        
        const triageClient = new GoogleGenAI({
            apiKey: "proxy",
            httpOptions: { baseUrl: window.location.origin + "/api/genai" }
        });
        const triageModel = 'gemini-1.5-flash';
        
        const activeModulesList = promptModules.map(m => `- ${m.documentType}: ${m.description}`).join("\n");
        const candidateDocumentsList = candidateFiles.map(f => `- ${f.name}`).join("\n");
        
        const triagePrompt = (await getGlobalPrompt('TRIAGE_DOCUMENTS', PROMPTS.TRIAGE_DOCUMENTS))
            .replace('{{activeModulesList}}', activeModulesList)
            .replace('{{candidateDocuments}}', candidateDocumentsList);
            
        const triageParts: any[] = [{ text: triagePrompt }];
        for (const fileParts of filePartsArrays) {
            triageParts.push(...fileParts);
        }
        
        let documentMapping: any = {};
        try {
            const triageResponse = await triageClient.models.generateContent({
                model: triageModel,
                contents: triageParts,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.1
                }
            });
            const textResponse = triageResponse.text;
            const jsonResponse = JSON.parse(textResponse || '{}');
            documentMapping = jsonResponse.documentMapping || {};
        } catch (e) {
            console.error("Erro na triagem de documentos:", e);
        }
        
        onProgress?.('ANÁLISE: Processando módulos específicos...');
        let allPoints = [];
        let orgData = {
            cnpj: "00.000.000/0000-00",
            foundationDate: "DD/MM/AAAA",
            legalStatus: "INCERTO",
            representativeName: "Não identificado"
        };
        
        for (const module of promptModules) {
            if (signal?.aborted) throw new Error("AbortError");
            onProgress?.(`ANÁLISE: Avaliando ${module.documentType}...`);
            
            const filesForModuleNames = documentMapping[module.documentType] || documentMapping[module.id] || [];
            
            const specificModulePrompt = `MÓDULO DE VALIDAÇÃO: ${module.documentType}\nDESCRIÇÃO: ${module.description}\n\nINSTRUÇÕES ESPECÍFICAS DESTE MÓDULO:\n${module.promptInstructions}\n\nATENÇÃO: A triagem indicou que o(s) seguinte(s) documento(s) pertence(m) a este módulo: ${filesForModuleNames.length > 0 ? filesForModuleNames.join(", ") : "NENHUM DOCUMENTO ENCONTRADO."}\nSe não houver documento, repita "NENHUM DOCUMENTO ENCONTRADO" no campo de evidência e reprove o ponto.\n\nREGRAS GERAIS E CONTEXTO:\n${criteria}`;

            const moduleParts: any[] = [{ text: systemInstructionText + "\n\n" + specificModulePrompt + "\n\n" + userTaskPromptText }];
            for (const fileParts of filePartsArrays) {
                const fileText = (fileParts[0] as any).text;
                const fileNameMatch = fileText.match(/=== INÍCIO DO ARQUIVO DO CANDIDATO: "([^"]+)" ===/);
                const fileName = fileNameMatch ? fileNameMatch[1] : null;
                
                if (fileName && filesForModuleNames.includes(fileName)) {
                    moduleParts.push(...fileParts);
                }
            }
            
            try {
                const response = await ai.models.generateContent({
                    model: model,
                    contents: moduleParts,
                    config: { responseMimeType: 'application/json', temperature: 0.1 }
                });
                const moduleResult = JSON.parse(response.text || '{}');
                if (moduleResult.points) allPoints.push(...moduleResult.points);
                if (moduleResult.organizationData) {
                    if (moduleResult.organizationData.cnpj && moduleResult.organizationData.cnpj !== "00.000.000/0000-00") orgData.cnpj = moduleResult.organizationData.cnpj;
                    if (moduleResult.organizationData.foundationDate && moduleResult.organizationData.foundationDate !== "DD/MM/AAAA") orgData.foundationDate = moduleResult.organizationData.foundationDate;
                    if (moduleResult.organizationData.legalStatus && moduleResult.organizationData.legalStatus !== "INCERTO") orgData.legalStatus = moduleResult.organizationData.legalStatus;
                    if (moduleResult.organizationData.representativeName && moduleResult.organizationData.representativeName !== "Não identificado") orgData.representativeName = moduleResult.organizationData.representativeName;
                }
            } catch (e) {
                console.error("Erro no módulo " + module.documentType, e);
                allPoints.push({ title: module.documentType, status: 'ERROR', evidence: 'Erro na análise da IA', justification: 'Falha ao processar o módulo.', sourceDocument: 'N/A' });
            }
        }
        
        onProgress?.('ORQUESTRAÇÃO: Gerando parecer final...');
        const orchestrationPrompt = `Você é um orquestrador de auditoria. Você recebeu os laudos individuais de múltiplos módulos de análise.
Sua tarefa é gerar o resumo final e determinar o status geral.

DADOS DA ORGANIZAÇÃO:
${JSON.stringify(orgData, null, 2)}

PONTOS ANALISADOS:
${JSON.stringify(allPoints, null, 2)}

REGRAS DE STATUS GERAL:
- Se houver QUALQUER ponto com status "ERROR", o status geral DEVE ser "REPROVADO".
- Se houver pontos com "WARNING" mas nenhum "ERROR", o status geral DEVE ser "RESSALVAS".
- Se todos os pontos forem "OK", o status geral DEVE ser "APROVADO".

Retorne EXCLUSIVAMENTE um JSON neste formato:
{ "candidateName": "Nome", "organizationData": { ... }, "overallStatus": "APROVADO" | "REPROVADO" | "RESSALVAS", "summary": "Resumo...", "points": [ ... pontos ] }`;

        const orchestrationResponse = await ai.models.generateContent({
            model: model,
            contents: [{ text: orchestrationPrompt }],
            config: { responseMimeType: 'application/json', temperature: 0.1 }
        });
        
        const finalResult = JSON.parse(orchestrationResponse.text || '{}');
        return { result: finalResult, promptText: "Fluxo de IA Otimizada (Triagem -> Análise por Módulo -> Orquestração)" };
    }

    const jsonString = await generateContentWithSmartRetry(ai, model, parts, systemInstructionText, 3, 8000, signal, onProgress);

    try {
        const cleaned = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(cleaned) as AuditResult;
        
        // SAVE TO CACHE
        await setCachedAudit(cacheKey, parsedResult, fullPromptText);
        
        return { result: parsedResult, promptText: fullPromptText };
    } catch (e) {
        console.error("JSON Parse Error", jsonString);
        throw new Error("A IA retornou um formato inválido. Verifique se os arquivos não estão corrompidos.");
    }
};

/**
 * Lógica de Retry Otimizada com Streaming
 */
const generateContentWithSmartRetry = async (
    ai: GoogleGenAI, 
    model: string, 
    parts: any[], 
    systemInstruction: string,
    retries = 3, 
    baseDelay = 8000,
    signal?: AbortSignal,
    onProgress?: (text: string) => void
): Promise<string> => {
    for (let i = 0; i < retries; i++) {
        if (signal?.aborted) throw new Error("AbortError");
        try {
            if (onProgress) {
                const streamPromise = async () => {
                    const responseStream = await ai.models.generateContentStream({
                        model: model,
                        contents: { parts: parts },
                        config: {
                            systemInstruction: systemInstruction,
                            candidateCount: 1,
                            responseMimeType: "application/json"
                        }
                    });
                    let fullText = "";
                    for await (const chunk of responseStream) {
                        if (signal?.aborted) throw new Error("AbortError");
                        const chunkText = chunk.text;
                        if (chunkText) {
                            fullText += chunkText;
                            onProgress(fullText);
                        }
                    }
                    return fullText;
                };

                const abortPromise = new Promise<never>((_, reject) => {
                    if (signal) {
                        signal.addEventListener('abort', () => reject(new Error("AbortError")));
                    }
                });

                return await Promise.race([streamPromise(), abortPromise]);
            } else {
                const generatePromise = ai.models.generateContent({
                    model: model,
                    contents: { parts: parts },
                    config: {
                        systemInstruction: systemInstruction,
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
            }
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
