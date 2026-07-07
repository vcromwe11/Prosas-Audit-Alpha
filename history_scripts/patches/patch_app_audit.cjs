const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
    /const aiData = await runDocumentAudit\(\s*context\.regulationText,\s*context\.formTemplateText,\s*context\.miscFilesText,\s*criteriaForAi,\s*filesForAi,\s*\[\],\s*\/\/ Do not send auth rules to AI anymore\s*abortController\.signal,\s*\(streamedText\) => \{\s*setCandidates\(prev => prev\.map\(c =>\s*c\.slotId === slotId \? \{ \.\.\.c, partialStream: streamedText \} : c\s*\)\);\s*\}\s*\);/,
    `const aiData = await runDocumentAudit(
                context.regulationText,
                context.formTemplateText,
                context.miscFilesText,
                criteriaForAi,
                filesForAi,
                [], // Do not send auth rules to AI anymore
                abortController.signal,
                (streamedText) => {
                    setCandidates(prev => prev.map(c => 
                        c.slotId === slotId ? { ...c, partialStream: streamedText } : c
                    ));
                },
                isOtimizada ? context.promptModules?.filter(m => m.isActive) : undefined,
                isOtimizada
            );`
);

fs.writeFileSync('App.tsx', code);
