const fs = require('fs');
const content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

let updated = content;

// Replace 1: generateAuthRulesFromRegulation
updated = updated.replace(
  `        const response = await callGeminiWithRetry(ai, {
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        });`,
  `        const response = await callGeminiWithRetry(ai, {
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        }, 5, 10000, 'geracao_regras_auth');`
);

// Replace 2: generatePromptFromRegulation
updated = updated.replace(
  `        const response = await callGeminiWithRetry(ai, {
            model,
            contents: prompt,
            config: {
                temperature: 0.2
            }
        });`,
  `        const response = await callGeminiWithRetry(ai, {
            model,
            contents: prompt,
            config: {
                temperature: 0.2
            }
        }, 5, 10000, 'geracao_criterios');`
);

// Replace 3: runDocumentAudit
updated = updated.replace(
  `            const triageResponse = await callGeminiWithRetry(ai, {
                model: modelEconomico,
                contents: triagePrompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            }, 3, 5000);`,
  `            const triageResponse = await callGeminiWithRetry(ai, {
                model: modelEconomico,
                contents: triagePrompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            }, 3, 5000, 'triagem_documentos');`
);

// Replace 4: modulo evaluation
updated = updated.replace(
  `                const response = await callGeminiWithRetry(ai, {
                    model: modelEconomico,
                    contents: modulePrompt,
                    config: {
                        responseMimeType: "application/json",
                        temperature: 0.1
                    }
                }, 3, 5000);`,
  `                const response = await callGeminiWithRetry(ai, {
                    model: modelEconomico,
                    contents: modulePrompt,
                    config: {
                        responseMimeType: "application/json",
                        temperature: 0.1
                    }
                }, 3, 5000, 'modulo_' + sanitizeText(mod.documentType).substring(0,20));`
);

// Replace 5: orchestration
updated = updated.replace(
  `            const orchestrationResponse = await callGeminiWithRetry(ai, {
                model: modelPotente,
                contents: [
                    { text: orchestrationPrompt },
                    ...fileParts
                ],
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            }, maxAiRetries, 8000);`,
  `            const orchestrationResponse = await callGeminiWithRetry(ai, {
                model: modelPotente,
                contents: [
                    { text: orchestrationPrompt },
                    ...fileParts
                ],
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            }, maxAiRetries, 8000, 'orquestracao');`
);

fs.writeFileSync('src/services/geminiService.ts', updated);
