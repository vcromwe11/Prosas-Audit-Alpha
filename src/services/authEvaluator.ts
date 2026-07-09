import { RULE_TEMPLATES } from "./ruleTemplates";
import { DocumentAuthRule } from '../types';
import { extractTextFromPdf } from './pdfService';
import { isValidCNPJ, isValidCPF } from '../utils/idValidator';

export interface AuthEvaluationResult {
    passed: boolean;
    report: string;
    processedFiles: string[];
}

// --- Helper Functions ---

const parseDate = (str: string) => {
    if (!str || str === 'N/A') return new Date(0);
    const parts = str.split('/');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    const isoParts = str.split('-');
    if (isoParts.length === 3) {
        // Handle YYYY-MM-DD locally to avoid UTC midnight shift (horário local)
        return new Date(parseInt(isoParts[0]), parseInt(isoParts[1]) - 1, parseInt(isoParts[2].substring(0, 2)));
    }
    return new Date(str);
};

const isWithinMonths = (dateStr: string, refDateStr: string, months: number = 3) => {
    const date = parseDate(dateStr);
    const refDate = refDateStr ? parseDate(refDateStr) : new Date();
    const diffTime = refDate.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= (months * 30);
};

const getAgeInYears = (dateStr: string, refDateStr: string) => {
    const date = parseDate(dateStr);
    const refDate = refDateStr ? parseDate(refDateStr) : new Date();
    if (date.getTime() === 0) return 0;
    let age = refDate.getFullYear() - date.getFullYear();
    const m = refDate.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && refDate.getDate() < date.getDate())) {
        age--;
    }
    return age;
};

// Evaluator that avoids eval/new Function
const safeEvaluate = (config: any, extractedValue: string, referenceDate: string, openingDate: string): boolean => {
    if (!config || typeof config !== 'object') return false;
    
    const valueStr = extractedValue ? extractedValue.trim() : '';
    
    if (config.type === "AND" && Array.isArray(config.rules)) {
        return config.rules.every((r: any) => safeEvaluate(r, valueStr, referenceDate, openingDate));
    }
    if (config.type === "OR" && Array.isArray(config.rules)) {
        return config.rules.some((r: any) => safeEvaluate(r, valueStr, referenceDate, openingDate));
    }
    if (config.type === "VALID_TO") {
        return isValidTo(valueStr, referenceDate);
    }
    if (config.type === "WITHIN_MONTHS") {
        return isWithinMonths(valueStr, referenceDate, config.months || 3);
    }
    if (config.type === "MIN_AGE_YEARS") {
        return getAgeInYears(openingDate, referenceDate) >= (config.years || 0);
    }
    if (config.type === "CONTAINS") {
        return valueStr.toLowerCase().includes((config.text || "").toLowerCase());
    }
    if (config.type === "NOT_CONTAINS") {
        return !valueStr.toLowerCase().includes((config.text || "").toLowerCase());
    }
    return false;
};

const isValidTo = (dateStr: string, refDateStr: string) => {
    const date = parseDate(dateStr);
    const refDate = refDateStr ? parseDate(refDateStr) : new Date();
    date.setHours(0,0,0,0);
    refDate.setHours(0,0,0,0);
    return date >= refDate;
};

const extractRegex = (text: string, regexStr: string | RegExp): string | null => {
    const regex = typeof regexStr === 'string' ? new RegExp(regexStr, 'i') : regexStr;
    const match = text.match(regex);
    if (!match) return null;
    return match[1] !== undefined ? match[1] : match[0];
};

const extractCnpj = (text: string): string | null => {
    // Busca preferencialmente por ocorrências próximas a um rótulo "CNPJ"
    const labelMatch = text.match(/CNPJ[^\d]*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i);
    if (labelMatch) return labelMatch[1];
    
    // Respaldo: pega a primeira ocorrência encontrada
    const match = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    return match ? match[0] : null;
};

const extractCpf = (text: string): string | null => {
    const match = text.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    return match ? match[0] : null;
};

// Check if certificate text has a valid positive-with-effects-of-negative or negative status
const hasValidCndStatus = (text: string): { isValid: boolean, status: string } => {
    const upperText = text.toUpperCase();
    if (upperText.includes("POSITIVA COM EFEITOS DE NEGATIVA") || upperText.includes("POSITIVA COM EFEITO DE NEGATIVA")) {
        return { isValid: true, status: "POSITIVA COM EFEITOS DE NEGATIVA" };
    }
    if (upperText.includes("CERTIDÃO NEGATIVA") || upperText.includes("NÃO CONSTA") || upperText.includes("INEXISTÊNCIA DE DÉBITOS")) {
        return { isValid: true, status: "NEGATIVA" };
    }
    if (upperText.includes("REGULARIDADE") && !upperText.includes("IRREGULARIDADE")) {
        // More specific to FGTS / CRF but good to have
        // Atesta situação regular apenas se não houver 'IRREGULARIDADE' no texto
        return { isValid: true, status: "REGULAR" };
    }
    return { isValid: false, status: "POSITIVA / IRREGULAR" };
};

export const runDeterministicAuth = async (
    files: File[],
    rules: DocumentAuthRule[],
    referenceDate: string = "",
    onProgress?: (msg: string) => void
): Promise<AuthEvaluationResult> => {
    let passed = true;
    let reportLines: string[] = [];
    const processedFiles: string[] = [];
    
    // Global state to track and cross-validate CNPJ
    let expectedCnpj: string | null = null;

    reportLines.push("=== RELATÓRIO DE PRÉ-ANÁLISE (AUTENTICAÇÃO DETERMINÍSTICA / IA OTIMIZADA) ===");
    reportLines.push(`Data de Referência: ${referenceDate || 'Data Atual'}`);

    for (const rule of rules) {
        if (!rule.documentType || !rule.dataToScrape) continue;

        const docLabel = rule.questionPrefix ? `[${rule.questionPrefix}] ${rule.documentType}` : `[${rule.documentType}]`;
        if (onProgress) onProgress(`Analisando ${docLabel}...`);

        // Find the file that matches the prefix or the document type
        const file = files.find(f => {
            const fileName = f.name.toLowerCase();
            const typeMatch = fileName.includes(rule.documentType.toLowerCase());
            const prefixMatch = rule.questionPrefix ? fileName.includes(rule.questionPrefix.toLowerCase()) : false;
            return typeMatch || prefixMatch;
        });
        
        if (!file) {
            passed = false;
            reportLines.push(`❌ ${docLabel} Arquivo não encontrado.`);
            reportLines.push(`   Motivo: ${rule.rejectionTrigger || 'Documento obrigatório ausente.'}`);
            continue;
        }

        if (!processedFiles.includes(file.name)) {
            processedFiles.push(file.name);
        }

        try {
            const text = await extractTextFromPdf(file);
            const docType = rule.documentType.toLowerCase();
            
            // Extract CNPJ from the document for cross-validation
            const documentCnpj = extractCnpj(text);
            const documentCpf = extractCpf(text);

            if (documentCnpj && !isValidCNPJ(documentCnpj)) {
                passed = false;
                reportLines.push(`❌ ${docLabel} Reprovado na validação do documento.`);
                reportLines.push(`   Justificativa: CNPJ encontrado no documento não é um número válido (dígitos verificadores incorretos).`);
                continue;
            }

            if (documentCpf && !isValidCPF(documentCpf)) {
                passed = false;
                reportLines.push(`❌ ${docLabel} Reprovado na validação do documento.`);
                reportLines.push(`   Justificativa: CPF encontrado no documento não é um número válido (dígitos verificadores incorretos).`);
                continue;
            }

            // ==========================================
            // SPECIALIZED VALIDATIONS BY DOCUMENT TYPE
            // ==========================================

            if (docType.includes('cnpj')) {
                // CNPJ Logic
                const statusMatch = text.match(/SITUAÇÃO CADASTRAL\s*\n?\s*(ATIVA|BAIXADA|SUSPENSA|INAPTA|NULA)/i);
                const status = statusMatch ? statusMatch[1].toUpperCase() : 'NÃO ENCONTRADA';
                
                if (documentCnpj && expectedCnpj && documentCnpj !== expectedCnpj) {
                    passed = false;
                    reportLines.push(`❌ ${docLabel} Reprovado por Divergência de CNPJ.`);
                    reportLines.push(`   Justificativa: O CNPJ deste Cartão CNPJ (${documentCnpj}) difere do CNPJ proponente base (${expectedCnpj}).`);
                    continue;
                } else if (documentCnpj && !expectedCnpj) {
                    expectedCnpj = documentCnpj; // Save as the reference CNPJ for the rest of the documents
                    reportLines.push(`📌 CNPJ Base Identificado: ${expectedCnpj}`);
                }
                
                // Extrai data de abertura
                const openingMatch = text.match(/DATA DE ABERTURA\s*\n?\s*([\d/]+)/i);
                const documentOpeningDate = openingMatch ? openingMatch[1] : 'N/A';

                const isStatusOk = status === 'ATIVA';

                if (!isStatusOk) {
                    passed = false;
                    reportLines.push(`⚠️ PONTO DE ATENÇÃO: ${docLabel} Reprovado na validação de status.`);
                    reportLines.push(`   Justificativa: Situação encontrada: ${status} (INVÁLIDA - Deve ser ATIVA).`);
                    continue; // Skip further evaluations
                }
                
                // Para manter a retroncompatibilidade e dar flexibilidade na UI,
                // vamos injetar a data de abertura no texto para que a regex primária ainda pegue a data de emissão,
                // ou simplesmente deixamos o evaluator lidar.
                // Na UI, o regex pega a Emissão. O Avaliador geral validará!
                
                // WE NOW FALL THROUGH to let the generic Regex and JS Condition take over!
                // Mas precisamos expor a 'openingDate' para o avaliador. Faremos isso mais abaixo.

            } else if (docType.includes('cnd') || docType.includes('fgts') || docType.includes('trabalhista') || docType.includes('estadual') || docType.includes('municipal')) {
                // CNDs & FGTS Logic (Federal, Estadual, Municipal, Trabalhista, FGTS)
                
                // 1. Cross-validate CNPJ
                if (expectedCnpj && documentCnpj && documentCnpj !== expectedCnpj) {
                    passed = false;
                    reportLines.push(`❌ ${docLabel} Reprovado por Divergência de CNPJ.`);
                    reportLines.push(`   Justificativa: O CNPJ do documento (${documentCnpj}) difere do CNPJ proponente (${expectedCnpj}).`);
                    continue;
                } else if (documentCnpj && !expectedCnpj) {
                    expectedCnpj = documentCnpj; // Set it if not set yet
                }

                // 2. Validate Date
                const dateRegexStr = rule.formatRegex || 'válida até\\s*(\\d{2}/\\d{2}/\\d{4})|validade:\\s*(\\d{2}/\\d{2}/\\d{4})';
                const dateMatch = extractRegex(text, dateRegexStr);
                const validityDate = dateMatch || 'N/A';
                const isDateOk = validityDate !== 'N/A' && isValidTo(validityDate, referenceDate);

                // 3. Validate Status (Negativa vs Positiva com efeitos vs Positiva)
                let isStatusOk = true;
                let statusFound = 'REGULAR / NÃO AVALIADO';
                
                if (docType.includes('fgts')) {
                     const upperText = text.toUpperCase();
                     // Atesta regularidade apenas se não houver IRREGULARIDADE
                     const hasRegularity = upperText.includes('REGULARIDADE') && !upperText.includes('IRREGULARIDADE');
                     isStatusOk = hasRegularity;
                     statusFound = hasRegularity ? 'SITUAÇÃO REGULAR DO FGTS' : 'SITUAÇÃO IRREGULAR';
                } else {
                     const statusCheck = hasValidCndStatus(text);
                     isStatusOk = statusCheck.isValid;
                     statusFound = statusCheck.status;
                }

                if (isDateOk && isStatusOk) {
                    reportLines.push(`✅ ${docLabel} Validado com sucesso.`);
                    reportLines.push(`   Justificativa: Situação fiscal "${statusFound}" (OK). Data de validade ${validityDate} está vigente em relação à data de referência.`);
                } else {
                    passed = false;
                    reportLines.push(`⚠️ PONTO DE ATENÇÃO: ${docLabel} Reprovado na validação.`);
                    reportLines.push(`   Justificativa: Validade do Doc: ${validityDate} ${isDateOk ? '(OK)' : '(VENCIDA OU NÃO ENCONTRADA)'}. Status: ${statusFound} ${isStatusOk ? '(OK)' : '(INVÁLIDO)'}.`);
                }
                continue;
            }

            // ==========================================
            // GENERAL FALLBACK EVALUATION
            // ==========================================
            let regexStr = rule.formatRegex;
            let flags = 'i';
            if (regexStr.startsWith('/') && regexStr.lastIndexOf('/') > 0) {
                const lastSlash = regexStr.lastIndexOf('/');
                flags = regexStr.substring(lastSlash + 1);
                regexStr = regexStr.substring(1, lastSlash);
            }
            
            const regex = new RegExp(regexStr, flags);
            const match = text.match(regex);

            if (!match) {
                passed = false;
                reportLines.push(`❌ ${docLabel} Falha na extração de dados.`);
                reportLines.push(`   Dado esperado: ${rule.dataToScrape}`);
                reportLines.push(`   Motivo: Padrão não encontrado no texto do documento.`);
                continue;
            }

            // Use capture group 1 if available, otherwise the whole match
            const extractedValue = match[1] !== undefined ? match[1] : match[0];

            // Extrai a data de abertura globalmente para poder usar em regras mais complexas de idade da empresa
            const genericOpeningMatch = text.match(/DATA DE ABERTURA\s*\n?\s*([\d/]+)/i);
            const genericOpeningDate = genericOpeningMatch ? genericOpeningMatch[1] : 'N/A';

            let isValid = false;
            try {
                let config: any;
                try {
                    config = JSON.parse(rule.validationRule);
                } catch (e) {
                    console.warn(`Regra em formato antigo (código livre) detectada para ${rule.documentType}. Isso apresenta risco de segurança. Caindo para regra padrão.`);
                    const template = RULE_TEMPLATES.find(t => rule.documentType.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(rule.documentType.toLowerCase()));
                    if (template) {
                        config = JSON.parse(template.rule.validationRule);
                    } else {
                        config = { type: "VALID_TO" }; // ultimate fallback
                    }
                }
                
                isValid = safeEvaluate(config, extractedValue.trim(), referenceDate, genericOpeningDate);
            } catch (evalError) {
                console.error(`Erro ao avaliar regra para ${rule.documentType}:`, evalError);
                passed = false;
                reportLines.push(`❌ ${docLabel} Erro de validação interna.`);
                reportLines.push(`   Regra: ${rule.validationRule}`);
                reportLines.push(`   Erro: ${evalError}`);
                continue;
            }

            if (isValid) {
                reportLines.push(`✅ ${docLabel} ${rule.approvalTrigger || 'Validado com sucesso.'}`);
                reportLines.push(`   Justificativa: O valor extraído ("${extractedValue.trim()}") atende ao padrão esperado e à regra de validação em relação à data de referência.`);
            } else {
                passed = false;
                const isDateRule = rule.validationRule.includes('WITHIN_MONTHS') || rule.validationRule.includes('VALID_TO') || rule.validationRule.includes('isWithinThreeMonths') || rule.validationRule.includes('isValidTo');
                const label = isDateRule ? '⚠️ PONTO DE ATENÇÃO' : '❌ Reprovado';
                reportLines.push(`${label}: ${docLabel} Falha na validação.`);
                reportLines.push(`   Justificativa: O valor extraído ("${extractedValue.trim()}") foi barrado pela regra ("${rule.validationRule}").`);
                reportLines.push(`   Motivo: ${rule.rejectionTrigger || 'Não atende aos critérios da regra.'}`);
            }

        } catch (error) {
            passed = false;
            reportLines.push(`❌ ${docLabel} Erro ao ler o arquivo.`);
            reportLines.push(`   Erro: ${error}`);
        }
    }

    reportLines.push("===============================================================");

    return {
        passed,
        report: reportLines.join('\n'),
        processedFiles
    };
};
