
import { GoogleGenAI } from "@google/genai";

export interface AiModelConfig {
    name: string;
    displayName: string;
}

export const getAvailableModels = async (): Promise<AiModelConfig[]> => {
    try {
        const response = await fetch('/v1beta/models');
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status}`);
        }
        const data = await response.json();
        
        if (data && data.models) {
            const models = data.models
                .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
                .map((m: any) => ({
                    name: m.name.replace('models/', ''),
                    displayName: m.displayName || m.name.replace('models/', '')
                }));
            return models;
        }
    } catch (e) {
        console.error("Error fetching models:", e);
    }
    
    // Fallback if network fails
    return [
        { name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash (Fallback Seguro)' }
    ];
};

export const getAiModelEconomico = () => {
    try {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('prosas_app_settings');
            if (stored) {
                const settings = JSON.parse(stored);
                if (settings.aiModelEconomico) return settings.aiModelEconomico;
                if (settings.aiModel) return settings.aiModel;
            }
        }
    } catch (e) {}
    return 'gemini-2.5-flash'; // Fallback
};

export const getAiModelPotente = () => {
    try {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('prosas_app_settings');
            if (stored) {
                const settings = JSON.parse(stored);
                if (settings.aiModelPotente) return settings.aiModelPotente;
                if (settings.aiModel) return settings.aiModel;
            }
        }
    } catch (e) {}
    return 'gemini-2.5-flash'; // Fallback
};

export const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    retries = 3,
    baseDelay = 8000,
    signal?: AbortSignal
): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        if (signal?.aborted) throw new Error("AbortError");
        try {
            return await operation();
        } catch (error: any) {
            if (error.message === "AbortError") throw error;
            
            let status = error.status || error.response?.status;
            let errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
            if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) {
                status = 429;
            }
            const isRateLimit = status === 429;
            const isServerOverload = status === 503;
            const isNetworkError = errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError");
            const isParsingError = errorMessage.includes("Unexpected token") || errorMessage.includes("SyntaxError: Unexpected token");
            
            // Verifica se é cota diária esgotada
            if (isRateLimit && errorMessage.includes("PerDay")) {
                let dailyQuotaModel = "o modelo atual";
                let dailyQuotaLimit = "desconhecido";
                
                const modelMatch = errorMessage.match(/"model"\s*:\s*"([^"]+)"/) || errorMessage.match(/model:\s*([^\s,]+)/);
                if (modelMatch && modelMatch[1]) dailyQuotaModel = modelMatch[1];
                
                const limitMatch = errorMessage.match(/"quotaValue"\s*:\s*"?([^" ,}]+)"?/) || errorMessage.match(/limit:\s*([^\s,]+)/);
                if (limitMatch && limitMatch[1]) dailyQuotaLimit = limitMatch[1];
                
                throw new Error(`Cota diária gratuita esgotada para o modelo ${dailyQuotaModel} (limite: ${dailyQuotaLimit} requisições/dia). Troque de modelo em Configurações > Avançado ou aguarde o próximo dia.`);
            }
            
            if ((isRateLimit || isServerOverload || isNetworkError || isParsingError) && i < retries - 1) {
                let waitTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
                
                // Try to parse explicit retry delay from error message (e.g., "Please retry in 11.75s")
                const retryMatch = errorMessage.match(/retry in ([0-9.]+)s/i) || errorMessage.match(/retryDelay["']?\s*:\s*["']?([0-9.]+)s/i);
                if (retryMatch && retryMatch[1]) {
                    const parsedDelay = parseFloat(retryMatch[1]) * 1000;
                    if (!isNaN(parsedDelay) && parsedDelay > 0) {
                        waitTime = Math.max(waitTime, parsedDelay + 2000); // add 2s buffer
                    }
                }
                
                // Force a longer wait if we hit free tier limits
                if (isRateLimit && waitTime < 15000) {
                    waitTime = 60000 + Math.random() * 5000;
                }
                
                console.warn(`Erro ${status || (isNetworkError ? 'Rede' : '429')} (Tentativa ${i + 1}/${retries}). Aguardando ${(waitTime/1000).toFixed(1)}s...`);
                
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
            
            throw error;
        }
    }
    throw new Error("Falha na API após múltiplas tentativas.");
};

export const callGeminiWithRetry = async (
    ai: any,
    options: {
        model: string;
        contents: any;
        config?: any;
    },
    retries = 5,
    baseDelay = 10000,
    taskType = 'padrao',
    editalName?: string
): Promise<any> => {
    let approxChars = 0;
    if (typeof options.contents === 'string') {
        approxChars = options.contents.length;
    } else if (Array.isArray(options.contents)) {
        approxChars = JSON.stringify(options.contents).length;
    } else if (options.contents?.parts) {
        approxChars = JSON.stringify(options.contents.parts).length;
    }

    try {
        const result = await executeWithRetry(() => ai.models.generateContent(options), retries, baseDelay);
        logAiUsage({
            model: options.model,
            taskType,
            success: true,
            approxChars,
            editalName
        });
        return result;
    } catch (e: any) {
        const errorMessage = typeof e === 'string' ? e : (e.message || JSON.stringify(e));
        logAiUsage({
            model: options.model,
            taskType,
            success: false,
            errorMessage,
            approxChars,
            editalName
        });
        throw e;
    }
};

import { DEFAULT_DOCUMENT_CRITERIA } from "../constants";
import { PROMPTS } from "../prompts";
import { getGlobalPrompt, logAiUsage } from "./storageService";
import { fileToBase64, extractTextFromPdf } from "./pdfService";
import { AuditResult, DocumentAuthRule, DocumentPromptModule } from "../types";
import { RULE_TEMPLATES } from "./ruleTemplates";

const getClient = () => {
    return new GoogleGenAI({ 
        apiKey: "proxy", // API key is injected by the proxy server
        httpOptions: { baseUrl: window.location.origin }
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
    const ai = getClient();    const model = getAiModelPotente(); 
    
    const basePrompt = await getGlobalPrompt('AUTH_RULES_GENERATION', PROMPTS.AUTH_RULES_GENERATION);

    const prompt = `
${basePrompt}

REGULAMENTO:
${regulationText.substring(0, 20000)}

MODELO DE FORMULÁRIO:
${formTemplateText.substring(0, 15000)}
`;

    try {
        const response = await callGeminiWithRetry(ai, {
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        }, 5, 10000, 'geracao_regras_auth');
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
    const model = getAiModelPotente(); 
    
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
        const response = await callGeminiWithRetry(ai, {
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
    isOtimizada?: boolean,
    extractTextLocal?: boolean,
    maxAiRetries: number = 3
): Promise<{ result: AuditResult, promptText: string }> => {
    const ai = getClient();
    // UPGRADE: Utilizando o modelo Pro para maior capacidade de raciocínio (Thinking)
    const model = getAiModelPotente(); 
    
    // 1. Construção do Payload Intercalado (Texto + Arquivo)
    // Isso é CRUCIAL para a IA saber qual arquivo é qual.
    const userTaskPromptText = await getGlobalPrompt('AUDIT_USER_TASK', PROMPTS.AUDIT_USER_TASK);
    const parts: any[] = [{ text: userTaskPromptText }];

    const filePromises = candidateFiles.map(async (file) => {
        if (signal?.aborted) throw new Error("AbortError");
        try {
            if (extractTextLocal) {
                const fileText = await extractTextFromPdf(file, extractTextLocal);
                return [
                    { text: `\n\n=== INÍCIO DO TEXTO EXTRAÍDO DO ARQUIVO DO CANDIDATO: "${file.name}" ===\n${fileText}\n=== FIM DO ARQUIVO: "${file.name}" ===\n` }
                ];
            } else {
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
            }
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
    const activeModulesStr = JSON.stringify((promptModules || []).filter(m => m.isActive).map(m => ({
        id: m.id,
        title: m.documentType,
        instructions: m.promptInstructions
    })));
    const cacheData = fullPromptText + JSON.stringify(parts) + "|" + (isOtimizada ? "otimizada" : "completa") + "|" + activeModulesStr;
    const cacheKey = await generateCacheKey(cacheData);
    
    const cachedResult = await getCachedAudit(cacheKey);
    if (cachedResult) {
        if (onProgress) onProgress("Usando análise em cache para este conjunto de documentos...");
        return { result: cachedResult, promptText: fullPromptText };
    }

    
    if (isOtimizada && promptModules && promptModules.length > 0) {
        // Triage Step
        onProgress?.('TRIAGEM: Identificando documentos com modelo ágil...');
        
        const modelEconomico = getAiModelEconomico();
        
        const baseModuleSystemInstruction = await getGlobalPrompt('AUDIT_MODULE_SYSTEM_INSTRUCTION', PROMPTS.AUDIT_MODULE_SYSTEM_INSTRUCTION);
        
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
            const triageResponse = await callGeminiWithRetry(ai, {
                model: modelEconomico,
                contents: triageParts,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.1
                }
            }, maxAiRetries);
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
            
            const specificModulePrompt = `MÓDULO DE VALIDAÇÃO: ${module.documentType}\nDESCRIÇÃO: ${module.description}\n\nINSTRUÇÕES ESPECÍFICAS DESTE MÓDULO:\n${module.promptInstructions}\n\nATENÇÃO: A triagem indicou que o(s) seguinte(s) documento(s) pertence(m) a este módulo: ${filesForModuleNames.length > 0 ? filesForModuleNames.join(", ") : "NENHUM DOCUMENTO ENCONTRADO."}\nSe este módulo exigir a presença de um documento e ele não estiver na lista, repita "NENHUM DOCUMENTO ENCONTRADO" no campo de evidência e reprove o ponto. Se este for um módulo lógico (ex: orquestração, regras globais) que não exige um arquivo específico por si só, ignore o aviso de documento não encontrado e faça a validação solicitada com base nas informações gerais.\n\nREGRAS GERAIS E CONTEXTO:\n${criteria}`;

            const moduleParts: any[] = [{ text: baseModuleSystemInstruction + "\n\n" + specificModulePrompt + "\n\n" + userTaskPromptText }];
            for (const fileParts of filePartsArrays) {
                const fileText = (fileParts[0] as any).text;
                const fileNameMatch = fileText.match(/=== INÍCIO DO (?:TEXTO EXTRAÍDO DO )?ARQUIVO DO CANDIDATO: "([^"]+)" ===/);
                const fileName = fileNameMatch ? fileNameMatch[1] : null;
                
                if (fileName && filesForModuleNames.includes(fileName)) {
                    moduleParts.push(...fileParts);
                }
            }
            
            try {
                const response = await callGeminiWithRetry(ai, {
                    model: modelEconomico,
                    contents: moduleParts,
                    config: { responseMimeType: 'application/json', temperature: 0.1 }
                }, maxAiRetries);
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

        let orchestrationResponseText = "";
        try {
            const orchestrationResponse = await callGeminiWithRetry(ai, {
                model: model,
                contents: [{ text: orchestrationPrompt }],
                config: { responseMimeType: 'application/json', temperature: 0.1 }
            }, maxAiRetries);
            orchestrationResponseText = orchestrationResponse.text || "{}";
        } catch (e: any) {
            console.error("Orchestration API call failed", e);
            orchestrationResponseText = JSON.stringify({
                candidateName: "Erro de Orquestração",
                overallStatus: "INCOMPLETO",
                summary: "Falha ao consolidar o resultado final.\n\nMotivo: " + e.message,
                points: allPoints
            });
        }
        
        let finalResult;
        try {
            finalResult = JSON.parse(orchestrationResponseText);
            if (!finalResult.overallStatus) finalResult.overallStatus = "INCOMPLETO";
        } catch (e) {
            console.error("Orchestration JSON parse error", orchestrationResponseText);
            finalResult = {
                candidateName: "Erro de Orquestração",
                organizationData: orgData,
                overallStatus: "INCOMPLETO",
                summary: "Falha ao consolidar o resultado final.\n\n" + (orchestrationResponseText?.substring(0, 500) || ""),
                points: allPoints
            };
        }
        await setCachedAudit(cacheKey, finalResult, fullPromptText);
        return { result: finalResult, promptText: "Fluxo de IA Otimizada (Triagem -> Análise por Módulo -> Orquestração)" };
    }

    let jsonString = "";
    try {
        jsonString = await generateContentWithSmartRetry(ai, model, parts, systemInstructionText, maxAiRetries, 8000, signal, onProgress, 'analise_tradicional');
    } catch (e: any) {
        if (e.message === "AbortError") throw e;
        if (e.partialText) {
            jsonString = e.partialText;
            console.warn("Análise interrompida, tentando recuperar dados parciais...", e.message);
        } else {
            console.error("Análise falhou completamente:", e);
            const fallbackResult: AuditResult = {
                candidateName: "Erro na Análise",
                organizationData: { cnpj: "00.000.000/0000-00", foundationDate: "DD/MM/AAAA", legalStatus: "INCERTO", representativeName: "Não identificado" },
                overallStatus: "INCOMPLETO",
                summary: "A análise falhou e não pôde ser concluída.\n\nMotivo: " + e.message,
                points: [{
                    title: "Status da Execução",
                    status: "PENDENTE",
                    evidence: "A análise falhou.",
                    justification: e.message,
                    sourceDocument: "Sistema"
                }]
            };
            return { result: fallbackResult, promptText: fullPromptText };
        }
    }

    try {
        let cleaned = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        let parsedResult: AuditResult;
        
        try {
            parsedResult = JSON.parse(cleaned) as AuditResult;
        } catch (parseError) {
            console.error("JSON Parse Error, attempting fallback", cleaned);
            // Fallback for incomplete JSON
            parsedResult = {
                candidateName: "Análise Incompleta",
                organizationData: { cnpj: "00.000.000/0000-00", foundationDate: "DD/MM/AAAA", legalStatus: "INCERTO", representativeName: "Não identificado" },
                overallStatus: "INCOMPLETO",
                summary: "A análise foi interrompida antes da conclusão (limite de tokens da IA excedido ou falha na rede). O resultado a seguir contém o que foi processado até o momento da interrupção.\n\n--- Texto Bruto Recuperado ---\n" + cleaned.substring(0, 1000) + "...",
                points: [{
                    title: "Status da Execução",
                    status: "PENDENTE",
                    evidence: "A análise não pôde ser finalizada.",
                    justification: "Houve uma interrupção na comunicação com a IA ou limite de resposta.",
                    sourceDocument: "Sistema"
                }]
            };
        }
        
        if (!parsedResult.overallStatus) {
             parsedResult.overallStatus = "INCOMPLETO";
        }
        
        // SAVE TO CACHE
        await setCachedAudit(cacheKey, parsedResult, fullPromptText);
        
        return { result: parsedResult, promptText: fullPromptText };
    } catch (e) {
        throw new Error("A IA retornou um formato inválido ou houve falha irrecuperável.");
    }
};

/**
 * Lógica de Retry Otimizada com Streaming
 */
const generateContentWithSmartRetry = async (
    ai: any, 
    model: string, 
    parts: any[], 
    systemInstruction: string,
    retries = 3, 
    baseDelay = 8000,
    signal?: AbortSignal,
    onProgress?: (text: string) => void,
    taskType = 'analise',
    editalName?: string
): Promise<string> => {
    let lastPartialText = "";
    const approxChars = JSON.stringify(parts).length + systemInstruction.length;
    
    try {
        const result = await executeWithRetry(async () => {
            if (onProgress) {
                const streamPromise = async () => {
                    lastPartialText = "";
                    const responseStream = await ai.models.generateContentStream({
                        model: model,
                        contents: { parts: parts },
                        config: {
                            systemInstruction: systemInstruction,
                            candidateCount: 1,
                            responseMimeType: "application/json"
                        }
                    });
                    for await (const chunk of responseStream) {
                        if (signal?.aborted) throw new Error("AbortError");
                        const chunkText = chunk.text;
                        if (chunkText) {
                            lastPartialText += chunkText;
                            onProgress(lastPartialText);
                        }
                    }
                    return lastPartialText;
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
        }, retries, baseDelay, signal);
        
        logAiUsage({ model, taskType, success: true, approxChars, editalName });
        return result;
    } catch (error: any) {
        if (error.message === "AbortError") throw error;
        const errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
        logAiUsage({ model, taskType, success: false, errorMessage, approxChars, editalName });

        
        let status = error.status || error.response?.status;
        
        if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) {
            status = 429;
        }
        const isRateLimit = status === 429;
        
        console.error("Erro fatal na API Gemini:", error);
        
        if (isRateLimit) {
            throw new Error("Cota de uso da IA excedida. Aguarde alguns minutos e tente novamente.");
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
        
        if (lastPartialText) {
             const partialError = new Error(`Interrupção na Análise: ${errorMessage}`);
             (partialError as any).partialText = lastPartialText;
             throw partialError;
        }
        
        throw error;
    }
};
