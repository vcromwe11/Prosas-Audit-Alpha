import React from 'react';
import { useState, useRef } from 'react';
import { CandidateAnalysis, AuditContext, SavedReport, AppSettings } from '../types';
import { extractPdfsFromZip } from '../services/zipService';
import { runDocumentAudit } from '../services/geminiService';
import { savePrompt, saveReport } from '../services/storageService';

export const useAnalysisRunner = (
    context: AuditContext,
    appSettings: AppSettings,
    allReports: SavedReport[],
    analysisMode: 'IA_COMPLETA' | 'IA_OTIMIZADA'
) => {
    const [candidates, setCandidates] = useState<CandidateAnalysis[]>([]);
    const abortControllersRef = useRef<Record<string, AbortController>>({});

    const addNewSlot = () => {
        setCandidates(prev => [...prev, {
            slotId: Math.random().toString(36).substring(7),
            files: [],
            candidateName: "",
            status: 'pending'
        }]);
    };

    const removeSlot = (slotId: string) => {
        setCandidates(prev => prev.filter(c => c.slotId !== slotId));
    };

    const abortAnalysis = (slotId: string) => {
        setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, status: 'aborted', partialStream: 'Análise cancelada pelo usuário.' } : c));
        if (abortControllersRef.current[slotId]) {
            abortControllersRef.current[slotId].abort();
        }
    };

    const handleSlotFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>, slotId: string) => {
        const rawFiles = Array.from(event.target.files || []) as File[];
        if (rawFiles.length === 0) return;

        setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, isLoadingFiles: true } : c));

        // Extract ZIPs if necessary
        const processedFiles: File[] = [];
        for (const file of rawFiles) {
            if (file.name.endsWith('.zip')) {
                try {
                    const extracted = await extractPdfsFromZip(file);
                    processedFiles.push(...extracted);
                } catch (e: any) {
                    alert(`Erro ao extrair ZIP ${file.name}: ${e.message}`);
                }
            } else {
                processedFiles.push(file);
            }
        }

        if (processedFiles.length === 0) {
            alert("Nenhum arquivo PDF válido encontrado.");
            setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, candidateName: "", isLoadingFiles: false } : c));
            return;
        }
        
        setCandidates(prev => prev.map(c => {
            if (c.slotId === slotId) {
                const baseName = rawFiles[0].name.replace(/\.(pdf|zip)$/i, '');
                const displayName = processedFiles.length > 1 && rawFiles.length === 1 && rawFiles[0].name.endsWith('.zip')
                   ? `${baseName} (${processedFiles.length} docs)`
                   : baseName;

                return {
                    ...c,
                    files: processedFiles,
                    candidateName: displayName, 
                    status: 'pending',
                    isLoadingFiles: false
                };
            }
            return c;
        }));
    };

    // Need a ref for triggerAnalysis to get the latest candidates to avoid closure stale state
    const candidatesRef = useRef(candidates);
    candidatesRef.current = candidates;

    const triggerAnalysis = async (slotId: string, withAuth: boolean = false) => {
        const candidate = candidatesRef.current.find(c => c.slotId === slotId);
        if (!candidate || candidate.files.length === 0) return;

        // Limpar slots abortados antes de reiniciar
        if (abortControllersRef.current[slotId]) {
            delete abortControllersRef.current[slotId];
        }

        setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, status: 'analyzing', analysisPhase: 'AUTH', partialStream: 'Iniciando análise...', currentAuthTask: 'Iniciando verificações...', error: undefined } : c));
        
        const abortController = new AbortController();
        abortControllersRef.current[slotId] = abortController;

        try {
            const isOtimizada = analysisMode === 'IA_OTIMIZADA';
            let authReport = "";
            let deterministicAuthPassed = true;
            let filesForAi = candidate.files;

            // 1. Run Deterministic Auth if requested (and not bypassed)
            if (withAuth || isOtimizada) {
                const { runDeterministicAuth } = await import('../services/authEvaluator');
                const authResult = await runDeterministicAuth(candidate.files, context.authRules || [], context.referenceDate, (msg) => {
                    // Update specific slot progress
                    setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, currentAuthTask: msg } : c));
                });

                authReport = authResult.report;
                deterministicAuthPassed = authResult.passed;

                if (isOtimizada) {
                    filesForAi = candidate.files.filter(f => !authResult.processedFiles.includes(f.name));
                }
            }

            // Generate a robust hash based on file contents + analysis context
            let combinedFilesHash = '';
            for (const f of filesForAi) {
                const buffer = await f.arrayBuffer();
                const fileHashBuf = await crypto.subtle.digest('SHA-256', buffer);
                combinedFilesHash += Array.from(new Uint8Array(fileHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('') + '|';
            }

            const activeModulesStr = JSON.stringify((context.promptModules || []).filter(m => m.isActive).map(m => ({
                id: m.id,
                title: m.documentType,
                instructions: m.promptInstructions
            })));

            const hashPayload = combinedFilesHash
                 + context.regulationText
                 + "|" + context.criteriaText
                 + "|" + (withAuth ? "auth" : "no-auth")
                 + "|" + context.referenceDate
                 + "|" + analysisMode
                 + "|" + appSettings.aiModel
                 + "|" + activeModulesStr;
            
            const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashPayload));
            const documentHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            const cachedReport = allReports.find(r => r.documentHash === documentHash && r.documentHash !== undefined);

            let result: any;
            let promptText = "";

            if (cachedReport && cachedReport.result) {
                console.log("CACHE HIT: Reusing existing analysis for documentHash", documentHash);
                result = cachedReport.result;
                promptText = "Cached Request - Retirado do histórico para economizar tempo e cota.";
                
                for (let i = 0; i <= 10; i++) {
                    if (abortController.signal.aborted) throw new Error("AbortError");
                    setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, partialStream: "Recuperando dados em cache..." + ".".repeat(i) } : c));
                    await new Promise(r => setTimeout(r, 100));
                }
                
                setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, analysisPhase: 'DONE' } : c));
            } else if (!isOtimizada && !deterministicAuthPassed) {
                result = {
                    summary: authReport + "\n\n--- ANÁLISE INTERROMPIDA ---\n\nO candidato falhou nas triagens obrigatórias, sendo reprovado por Inabilitação Documental sem a necessidade de prosseguir com a fase de IA Completa.",
                    overallStatus: 'REPROVADO',
                    points: [{
                        title: "Inabilitação Documental (Pré-Análise)",
                        status: "ERROR",
                        justification: "Candidato retido na triagem automática de documentos institucionais obrigatórios."
                    }],
                    candidateName: "Candidato Identificado na Triagem",
                    organizationData: {}
                };
                promptText = "N/A (Reprovação Determinística)";
                setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, analysisPhase: 'DONE' } : c));
            } else {
                setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, analysisPhase: 'AI_PROMPT' } : c));
                
                let criteriaForAi = context.criteriaText;

                if (isOtimizada) {
                    const activeModules = (context.promptModules || []).filter(m => m.isActive);
                    if (activeModules.length > 0) {
                        const modulesPrompt = activeModules.map(m => `--- ${m.documentType} ---\n${m.promptInstructions}`).join("\n\n");
                        criteriaForAi += "\n\n=== INSTRUÇÕES ESPECÍFICAS DE DOCUMENTOS (IA OTIMIZADA) ===\n";
                        criteriaForAi += "⚠️ REGRAS OBRIGATÓRIAS PARA TODOS OS DOCUMENTOS:\n";
                        criteriaForAi += "1. CNPJ OBRIGATÓRIO: É IMPERATIVO que em TODOS os documentos analisados (sem exceção), os dados do CNPJ ou da Razão Social sejam correspondentes/iguais. Isso é para garantir que os documentos pertençam à mesma organização.\n";
                        criteriaForAi += "2. TRIAGEM DOS ARQUIVOS: O seu primeiro movimento nesta análise DEVE SER localizar entre os documentos enviados quais são aqueles exigidos pelos módulos abaixo.\n";
                        criteriaForAi += "   - DESCARTE imediatamente qualquer documento enviado que NÃO seja exigido pelos módulos (ex: se enviaram foto de projeto mas não há módulo pedindo isso, descarte).\n";
                        criteriaForAi += "   - No início do seu relatório final, você DEVE listar os arquivos enviados e sinalizar visualmente se foram utilizados ou descartados (ex: '✅ [Nome do Arquivo] - Utilizado', '❌ [Nome do Arquivo] - Descartado'). Arquivos descartados NÃO devem entrar na análise subsequente, e você NÃO DEVE gerar pontos de checagem (points) no JSON para eles. Eles devem ser sumariamente ignorados do banco de dados final.\n\n";
                        criteriaForAi += "Analise APENAS os documentos exigidos nos módulos a seguir utilizando as respectivas instruções:\n\n" + modulesPrompt;
                    }
                } else if (authReport) {
                    const optimizedInstruction = "1. Os documentos descritos no relatório acima JÁ FORAM AVALIADOS. Você os recebeu nos anexos, mas pode confiar no status de aprovação do laudo local.\n2.";

                    criteriaForAi = `${context.criteriaText}\n\n--- ⚠️ INSTRUÇÃO IMPORTANTE: TRIAGEM AUTOMÁTICA PRÉVIA ⚠️ ---\nO sistema de auditoria local (script) já validou alguns documentos cruciais. Segue o laudo técnico:\n${authReport}\n\nINSTRUÇÕES PARA A IA NESTA FASE COMPLEMENTAR:\n${optimizedInstruction} UTILIZE AS INFORMAÇÕES EXTRAÍDAS NO LAUDO ACIMA (ex: número do CNPJ) para CRUZAR com os demais documentos.`;
                }

                const aiData = await runDocumentAudit(
                    context.regulationText,
                    context.formTemplateText,
                    context.miscFilesText,
                    criteriaForAi,
                    filesForAi,
                    [], 
                    abortController.signal,
                    (streamedText) => {
                        setCandidates(prev => prev.map(c => 
                            c.slotId === slotId ? { ...c, partialStream: streamedText } : c
                        ));
                    },
                    isOtimizada ? context.promptModules?.filter(m => m.isActive) : undefined,
                    isOtimizada,
                    appSettings.extractTextLocal,
                    appSettings.maxAiRetries
                );
                
                result = aiData.result;
                promptText = aiData.promptText;

                if (authReport) {
                    result.summary = authReport + "\n\n--- ANÁLISE COMPLEMENTAR DA IA ---\n\n" + result.summary;
                }

                setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, analysisPhase: 'DONE' } : c));
            }

            const promptId = await savePrompt(promptText);
            const savedReport = await saveReport(context.editalTitle, result, promptId || undefined, documentHash);

            setCandidates(prev => prev.map(c => {
                if (c.slotId === slotId) {
                    return {
                        ...c,
                        id: savedReport ? savedReport.id : c.id,
                        status: 'completed',
                        result: result,
                        candidateName: result.candidateName || "Candidato Identificado"
                    };
                }
                return c;
            }));

        } catch (error: any) {
            console.error("Analysis Error:", error);
            if (error.message === 'AbortError' || abortController.signal.aborted) {
                setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, status: 'aborted', partialStream: 'Análise cancelada pelo usuário.' } : c));
            } else {
                setCandidates(prev => prev.map(c => c.slotId === slotId ? { 
                    ...c, 
                    status: 'error', 
                    error: "Erro durante a análise: " + error.message,
                    partialStream: (error as any).partialText || ''
                } : c));
            }
        } finally {
            if (abortControllersRef.current[slotId]) {
                delete abortControllersRef.current[slotId];
            }
        }
    };

const triggerAllPendingAnalyses = async () => {
        const pending = candidatesRef.current.filter(c => c.status === 'pending' && c.files.length > 0);
        const executing = new Set<Promise<void>>();

        for (const candidate of pending) {
            // triggerAnalysis returns a promise that resolves when the analysis is done (or fails)
            const p = triggerAnalysis(candidate.slotId, false).catch(e => console.error("Batch slot error:", e)).then(() => {
                executing.delete(p);
            });
            executing.add(p);
            if (executing.size >= appSettings.maxConcurrentSlots) {
                await Promise.race(executing);
            }
        }
        await Promise.all(executing);
    };

    return {
        candidates,
        setCandidates,
        addNewSlot,
        removeSlot,
        abortAnalysis,
        handleSlotFilesSelected,
        triggerAnalysis,
        triggerAllPendingAnalyses
    };
};
