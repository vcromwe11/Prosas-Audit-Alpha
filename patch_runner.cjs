const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAnalysisRunner.ts', 'utf8');

const targetCall = `                const aiData = await runDocumentAudit(
                    context.regulationText,
                    context.formTemplateText,
                    context.miscFilesText,`;

const replacementCall = `                const aiData = await runDocumentAudit(
                    context.excludeContextInAnalysis ? "" : context.regulationText,
                    context.excludeContextInAnalysis ? "" : context.formTemplateText,
                    context.excludeContextInAnalysis ? "" : context.miscFilesText,`;

code = code.replace(targetCall, replacementCall);
fs.writeFileSync('src/hooks/useAnalysisRunner.ts', code);
