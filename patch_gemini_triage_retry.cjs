const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf8');

const triageLogic = `
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
            onProgress?.(\`ANÁLISE: Avaliando \${module.documentType}...\`);
            
            const filesForModuleNames = documentMapping[module.documentType] || documentMapping[module.id] || [];
            
            const specificModulePrompt = \`MÓDULO DE VALIDAÇÃO: \${module.documentType}\\nDESCRIÇÃO: \${module.description}\\n\\nINSTRUÇÕES ESPECÍFICAS DESTE MÓDULO:\\n\${module.promptInstructions}\\n\\nATENÇÃO: A triagem indicou que o(s) seguinte(s) documento(s) pertence(m) a este módulo: \${filesForModuleNames.length > 0 ? filesForModuleNames.join(", ") : "NENHUM DOCUMENTO ENCONTRADO."}\\nSe não houver documento, repita "NENHUM DOCUMENTO ENCONTRADO" no campo de evidência e reprove o ponto.\\n\\nREGRAS GERAIS E CONTEXTO:\\n\${criteria}\`;

            const moduleParts = [{ text: systemInstructionText + "\\n\\n" + specificModulePrompt + "\\n\\n" + userTaskPromptText }];
            for (const fileParts of filePartsArrays) {
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
                    config: { responseMimeType: 'application/json', temperature: 0.1 }
                });
                const moduleResult = JSON.parse(response.text());
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
        const orchestrationPrompt = \`Você é um orquestrador de auditoria. Você recebeu os laudos individuais de múltiplos módulos de análise.
Sua tarefa é gerar o resumo final e determinar o status geral.

DADOS DA ORGANIZAÇÃO:
\${JSON.stringify(orgData, null, 2)}

PONTOS ANALISADOS:
\${JSON.stringify(allPoints, null, 2)}

REGRAS DE STATUS GERAL:
- Se houver QUALQUER ponto com status "ERROR", o status geral DEVE ser "REPROVADO".
- Se houver pontos com "WARNING" mas nenhum "ERROR", o status geral DEVE ser "RESSALVAS".
- Se todos os pontos forem "OK", o status geral DEVE ser "APROVADO".

Retorne EXCLUSIVAMENTE um JSON neste formato:
{ "candidateName": "Nome", "organizationData": { ... }, "overallStatus": "APROVADO" | "REPROVADO" | "RESSALVAS", "summary": "Resumo...", "points": [ ... pontos ] }\`;

        const orchestrationResponse = await ai.models.generateContent({
            model: model,
            contents: [{ text: orchestrationPrompt }],
            config: { responseMimeType: 'application/json', temperature: 0.1 }
        });
        
        const finalResult = JSON.parse(orchestrationResponse.text());
        return { result: finalResult, promptText: "Fluxo de IA Otimizada (Triagem -> Análise por Módulo -> Orquestração)" };
    }
`;

code = code.replace(
    /const jsonString = await generateContentWithSmartRetry/,
    triageLogic + '\n    const jsonString = await generateContentWithSmartRetry'
);

fs.writeFileSync('services/geminiService.ts', code);
