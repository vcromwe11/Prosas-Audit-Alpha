const fs = require('fs');
const content = fs.readFileSync('src/hooks/useAnalysisRunner.ts', 'utf8');

const target = `                let criteriaForAi = context.criteriaText;

                if (isOtimizada) {`;

const replacement = `                let criteriaForAi = (!isOtimizada || context.useGlobalInstructions !== false) ? context.criteriaText : "";

                if (isOtimizada) {`;

const updated = content.replace(target, replacement);
fs.writeFileSync('src/hooks/useAnalysisRunner.ts', updated);
