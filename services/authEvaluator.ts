import { DocumentAuthRule } from '../types';
import { extractTextFromPdf } from './pdfService';

export interface AuthEvaluationResult {
    passed: boolean;
    report: string;
    processedFiles: string[];
}

export const runDeterministicAuth = async (
    files: File[],
    rules: DocumentAuthRule[],
    referenceDate: string = "",
    onProgress?: (msg: string) => void
): Promise<AuthEvaluationResult> => {
    let passed = true;
    let reportLines: string[] = [];
    const processedFiles: string[] = [];

    reportLines.push("=== RELATÓRIO DE PRÉ-ANÁLISE (AUTENTICAÇÃO DETERMINÍSTICA) ===");
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
            
            // Parse regex
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

            // SPECIALIZED DETERMINISTIC VALIDATION FOR CNPJ
            if (rule.documentType.toLowerCase().includes('cnpj')) {
                const statusMatch = text.match(/SITUAÇÃO CADASTRAL\s*\n?\s*(ATIVA|BAIXADA|SUSPENSA|INAPTA|NULA)/i);
                const status = statusMatch ? statusMatch[1].toUpperCase() : 'NÃO ENCONTRADA';
                const cnpjMatch = text.match(/NÚMERO DE INSCRIÇÃO\s*\n?\s*([\d./-]{18})/i);
                const cnpj = cnpjMatch ? cnpjMatch[1] : 'NÃO ENCONTRADO';
                
                // Re-evaluate validity with specialized logic
                const dateMatch = text.match(/Emitido no dia\s*(\d{2}\/\d{2}\/\d{4})/i);
                const emissionDate = dateMatch ? dateMatch[1] : extractedValue;

                const isStatusOk = status === 'ATIVA';
                
                // Helper functions for the evaluator
                const parseDate = (str: string) => {
                    if (!str) return new Date(0);
                    const parts = str.split('/');
                    if (parts.length === 3) {
                        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                    return new Date(str);
                };

                const isWithinThreeMonths = (dateStr: string, refDateStr: string) => {
                    const date = parseDate(dateStr);
                    const refDate = refDateStr ? parseDate(refDateStr) : new Date();
                    // Document must not be older than 90 days before reference date
                    const diffTime = refDate.getTime() - date.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    // If diffDays is negative, it means document was issued AFTER reference date (which is fine)
                    // If diffDays > 90, it's expired
                    return diffDays <= 90;
                };

                const isDateOk = isWithinThreeMonths(emissionDate, referenceDate);

                if (isStatusOk && isDateOk) {
                    reportLines.push(`✅ ${docLabel} Validado com sucesso.`);
                    reportLines.push(`   Justificativa: CNPJ ${cnpj} encontra-se com Situação ${status} (OK). O documento foi emitido na data ${emissionDate}, dentro do prazo de validade em relação à data de referência.`);
                } else {
                    passed = false;
                    reportLines.push(`⚠️ PONTO DE ATENÇÃO: ${docLabel} Reprovado na validação determinística.`);
                    reportLines.push(`   Justificativa: O CNPJ extraído não está regular. Situação encontrada: ${status} ${isStatusOk ? '(OK)' : '(INVÁLIDA - Deve ser ATIVA)'}. Data de emissão: ${emissionDate} ${isDateOk ? '(OK)' : '(FORA DO PRAZO - Emitido há mais de 3 meses)'}.`);
                    reportLines.push(`   Motivo: ${rule.rejectionTrigger || 'Documento irregular ou vencido.'}`);
                }
                continue;
            }

            // Evaluate validation rule (General Case)
            let isValid = false;
            try {
                // We wrap the rule in a function. We provide 'value' as the extracted string.
                // We also provide a helper 'parseDate' and 'isWithinThreeMonths'.
                const evaluator = new Function('value', 'referenceDate', `
                    function parseDate(str) {
                        if (!str || str === 'N/A') return new Date(0);
                        const parts = str.split('/');
                        if (parts.length === 3) {
                            return new Date(parts[2], parts[1] - 1, parts[0]);
                        }
                        return new Date(str);
                    }
                    function isWithinThreeMonths(dateStr, refDateStr) {
                        const date = parseDate(dateStr);
                        const refDate = refDateStr ? parseDate(refDateStr) : new Date();
                        const diffTime = refDate.getTime() - date.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 90;
                    }
                    function isValidTo(dateStr, refDateStr) {
                        const date = parseDate(dateStr);
                        const refDate = refDateStr ? parseDate(refDateStr) : new Date();
                        date.setHours(0,0,0,0);
                        refDate.setHours(0,0,0,0);
                        return date >= refDate;
                    }
                    return ${rule.validationRule};
                `);
                isValid = evaluator(extractedValue.trim(), referenceDate);
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
                const isDateRule = rule.validationRule.includes('isWithinThreeMonths') || rule.validationRule.includes('isValidTo');
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
