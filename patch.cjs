const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const targetString = `            let criteriaForAi = context.criteriaText;
            if (authReport) {
                const optimizedInstruction = analysisMode === 'IA_OTIMIZADA' 
                    ? "1. Os documentos descritos no relatório acima JÁ FORAM APROVADOS e não foram anexados agora para poupar processamento. NÃO cobre a existência ou validade deles novamente.\\n2."
                    : "1. Os documentos descritos no relatório acima JÁ FORAM AVALIADOS. Você os recebeu nos anexos, mas pode confiar no status de aprovação do laudo local.\\n2.";

                criteriaForAi = \`\${context.criteriaText}

--- ⚠️ INSTRUÇÃO IMPORTANTE: TRIAGEM AUTOMÁTICA PRÉVIA ⚠️ ---
O sistema de auditoria local (script) já validou alguns documentos cruciais. Segue o laudo técnico:

\${authReport}

INSTRUÇÕES PARA A IA NESTA FASE COMPLEMENTAR:
\${optimizedInstruction} UTILIZE AS INFORMAÇÕES EXTRAÍDAS NO LAUDO ACIMA (ex: número do CNPJ) para CRUZAR com os demais documentos.\`;
            }`;

const replacementString = `            let criteriaForAi = context.criteriaText;

            // Se for IA OTIMIZADA, anexa os módulos de prompt ativos!
            if (analysisMode === 'IA_OTIMIZADA') {
                const activeModules = (context.promptModules || []).filter(m => m.isActive);
                if (activeModules.length > 0) {
                    const modulesPrompt = activeModules.map(m => \`--- \${m.documentType} ---\\n\${m.promptInstructions}\`).join("\\n\\n");
                    criteriaForAi += "\\n\\n=== INSTRUÇÕES ESPECÍFICAS DE DOCUMENTOS (IA OTIMIZADA) ===\\n";
                    criteriaForAi += "⚠️ REGRAS OBRIGATÓRIAS PARA TODOS OS DOCUMENTOS:\\n";
                    criteriaForAi += "1. CNPJ OBRIGATÓRIO: É IMPERATIVO que em TODOS os documentos analisados (sem exceção), os dados do CNPJ ou da Razão Social sejam correspondentes/iguais. Isso é para garantir que os documentos pertençam à mesma organização.\\n";
                    criteriaForAi += "2. TRIAGEM DOS ARQUIVOS: O seu primeiro movimento nesta análise DEVE SER localizar entre os documentos enviados quais são aqueles exigidos pelos módulos abaixo.\\n";
                    criteriaForAi += "   - DESCARTE imediatamente qualquer documento enviado que NÃO seja exigido pelos módulos (ex: se enviaram foto de projeto mas não há módulo pedindo isso, descarte).\\n";
                    criteriaForAi += "   - No início do seu relatório final, você DEVE listar os arquivos enviados e sinalizar visualmente se foram utilizados ou descartados (ex: '✅ [Nome do Arquivo] - Utilizado', '❌ [Nome do Arquivo] - Descartado'). Arquivos descartados NÃO devem entrar na análise subsequente.\\n\\n";
                    criteriaForAi += "Analise APENAS os documentos exigidos nos módulos a seguir utilizando as respectivas instruções:\\n\\n" + modulesPrompt;
                }
            } else if (authReport) {
                const optimizedInstruction = analysisMode === 'IA_OTIMIZADA' 
                    ? "1. Os documentos descritos no relatório acima JÁ FORAM APROVADOS e não foram anexados agora para poupar processamento. NÃO cobre a existência ou validade deles novamente.\\n2."
                    : "1. Os documentos descritos no relatório acima JÁ FORAM AVALIADOS. Você os recebeu nos anexos, mas pode confiar no status de aprovação do laudo local.\\n2.";

                criteriaForAi = \`\${context.criteriaText}

--- ⚠️ INSTRUÇÃO IMPORTANTE: TRIAGEM AUTOMÁTICA PRÉVIA ⚠️ ---
O sistema de auditoria local (script) já validou alguns documentos cruciais. Segue o laudo técnico:

\${authReport}

INSTRUÇÕES PARA A IA NESTA FASE COMPLEMENTAR:
\${optimizedInstruction} UTILIZE AS INFORMAÇÕES EXTRAÍDAS NO LAUDO ACIMA (ex: número do CNPJ) para CRUZAR com os demais documentos.\`;
            }`;

if (code.includes(targetString)) {
    code = code.replace(targetString, replacementString);
    fs.writeFileSync('App.tsx', code);
    console.log("Success");
} else {
    console.log("String not found");
}
