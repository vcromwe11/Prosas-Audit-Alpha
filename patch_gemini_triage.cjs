const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf8');

const triageLogic = `
    let finalPromptText = "";
    
    if (isOtimizada && promptModules && promptModules.length > 0) {
        // Triage Step
        onProgress?.('TRIAGEM: Identificando documentos com Gemini 1.5 Flash...');
        
        const triageClient = new GoogleGenAI({
            apiKey: "proxy",
            httpOptions: { baseUrl: window.location.origin + "/api/genai" }
        });
        const triageModel = 'gemini-1.5-flash';
        
        const activeModulesList = promptModules.map(m => \`- \${m.documentType}: \${m.description}\`).join("\\n");
        const candidateDocumentsList = candidateFiles.map(f => \`- \${f.name}\`).join("\\n");
        
        const triagePrompt = (await getGlobalPrompt('TRIAGE_DOCUMENTS', PROMPTS.TRIAGE_DOCUMENTS))
            .replace('{{activeModulesList}}', activeModulesList)
            .replace('{{candidateDocuments}}', candidateDocumentsList);
            
        // We only send the text of the files for triage to save cost, or we could just send the names, but sending the files gives better mapping.
        // Wait, sending all files to 1.5 Flash is cheap and allows it to read the contents to map properly.
        const triageParts = [{ text: triagePrompt }];
        for (const fileParts of filePartsArrays) {
            triageParts.push(...fileParts);
        }
        
        let documentMapping = {};
        try {
            const triageResponse = await triageClient.models.generateContent({
                model: triageModel,
                contents: triageParts,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.1
                }
            });
            const textResponse = triageResponse.text();
            const jsonResponse = JSON.parse(textResponse);
            documentMapping = jsonResponse.documentMapping || {};
        } catch (e) {
            console.error("Erro na triagem de documentos:", e);
        }
        
        // Now do specific analysis per module
        onProgress?.('ANÁLISE: Processando módulos com o modelo principal...');
        let allPoints = [];
        let orgData = {
            cnpj: "00.000.000/0000-00",
            foundationDate: "DD/MM/AAAA",
            legalStatus: "INCERTO",
            representativeName: "Não identificado"
        };
        
        for (const module of promptModules) {
            if (signal?.aborted) throw new Error("AbortError");
            onProgress?.(\`ANÁLISE: Avaliando módulo "\${module.documentType}"...\`);
            
            const filesForModuleNames = documentMapping[module.documentType] || documentMapping[module.id] || [];
            
            // If the array is empty, this module has no documents. We can mark it as ERROR directly, or let the AI do it.
            // Let's let the AI do it so it generates a proper Justification.
            const specificModulePrompt = \`MÓDULO DE VALIDAÇÃO: \${module.documentType}
DESCRIÇÃO: \${module.description}

INSTRUÇÕES ESPECÍFICAS DESTE MÓDULO:
\${module.promptInstructions}

ATENÇÃO: A triagem indicou que o(s) seguinte(s) documento(s) pertence(m) a este módulo: \${filesForModuleNames.length > 0 ? filesForModuleNames.join(", ") : "NENHUM DOCUMENTO ENCONTRADO."}
Se não houver documento, repita "NENHUM DOCUMENTO ENCONTRADO" no campo de evidência e reprove o ponto.

REGRAS GERAIS E CONTEXTO:
\${criteria}
\`;

            // Prepare parts for this module (only the mapped files)
            const moduleParts = [{ text: systemInstructionText + "\\n\\n" + specificModulePrompt + "\\n\\n" + userTaskPromptText }];
            for (const fileParts of filePartsArrays) {
                // The first element of fileParts is the text containing the file name
                const fileText = fileParts[0].text;
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
                    config: {
                        responseMimeType: 'application/json',
                        temperature: 0.1
                    }
                });
                
                const moduleText = response.text();
                const moduleResult = JSON.parse(moduleText);
                
                // Merge points
                if (moduleResult.points) {
                    allPoints.push(...moduleResult.points);
                }
                // Opportunistically grab org data
                if (moduleResult.organizationData) {
                    if (moduleResult.organizationData.cnpj && moduleResult.organizationData.cnpj !== "00.000.000/0000-00") {
                        orgData.cnpj = moduleResult.organizationData.cnpj;
                    }
                    if (moduleResult.organizationData.foundationDate && moduleResult.organizationData.foundationDate !== "DD/MM/AAAA") {
                        orgData.foundationDate = moduleResult.organizationData.foundationDate;
                    }
                    if (moduleResult.organizationData.legalStatus && moduleResult.organizationData.legalStatus !== "INCERTO") {
                        orgData.legalStatus = moduleResult.organizationData.legalStatus;
                    }
                    if (moduleResult.organizationData.representativeName && moduleResult.organizationData.representativeName !== "Não identificado") {
                        orgData.representativeName = moduleResult.organizationData.representativeName;
                    }
                }
            } catch (e) {
                console.error("Erro no módulo " + module.documentType, e);
                allPoints.push({
                    title: module.documentType,
                    status: 'ERROR',
                    evidence: 'Erro na análise da IA',
                    justification: 'Falha ao processar o módulo com a IA.',
                    sourceDocument: 'N/A'
                });
            }
        }
        
        onProgress?.('ORQUESTRAÇÃO: Gerando parecer final...');
        
        // Final orchestration step to generate the overall status and summary
        const orchestrationPrompt = \`Você é um orquestrador de auditoria. Você recebeu os laudos individuais de múltiplos módulos de análise.
Sua tarefa é gerar o resumo final, e determinar o status geral da organização.

DADOS DA ORGANIZAÇÃO COLETADOS:
\${JSON.stringify(orgData, null, 2)}

PONTOS ANALISADOS:
\${JSON.stringify(allPoints, null, 2)}

REGRAS GERAIS E CONTEXTO ORIGINAL:
\${criteria}

REGRAS DE STATUS GERAL:
- Se houver QUALQUER ponto com status "ERROR", o status geral DEVE ser "REPROVADO".
- Se houver pontos com "WARNING" mas nenhum "ERROR", o status geral DEVE ser "RESSALVAS".
- Se todos os pontos forem "OK", o status geral DEVE ser "APROVADO".

Retorne EXCLUSIVAMENTE um JSON neste formato:
{
  "candidateName": "Nome extraído dos dados ou 'Candidato'",
  "organizationData": { ... os mesmos dados acima ... },
  "overallStatus": "APROVADO" | "REPROVADO" | "RESSALVAS",
  "summary": "Resumo executivo citando os principais documentos analisados e se a organização está apta ou não.",
  "points": [ ... os mesmos pontos acima, preservados exatamente como recebidos ... ]
}\`;

        const orchestrationResponse = await ai.models.generateContent({
            model: model, // Default model for orchestration
            contents: [{ text: orchestrationPrompt }],
            config: {
                responseMimeType: 'application/json',
                temperature: 0.1
            }
        });
        
        const finalText = orchestrationResponse.text();
        const finalResult = JSON.parse(finalText);
        
        return { result: finalResult, promptText: "Fluxo de IA Otimizada (Triagem -> Análise por Módulo -> Orquestração)" };
    }
`;

code = code.replace(
    /\/\/ 3\. Chamada para a IA \(Streaming\)/,
    triageLogic + '\n    // 3. Chamada para a IA (Streaming)'
);

fs.writeFileSync('services/geminiService.ts', code);
