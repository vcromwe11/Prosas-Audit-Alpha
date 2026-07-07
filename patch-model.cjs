const fs = require('fs');

function patchGetAiModel(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // Replace:
    // if (settings.aiModel) return settings.aiModel;
    // With:
    // if (settings.aiModel) {
    //     if (settings.aiModel === 'gemini-3.5-flash' || settings.aiModel === 'gemini-1.5-flash') return 'gemini-2.5-flash';
    //     return settings.aiModel;
    // }
    
    code = code.replace(/if \(settings\.aiModel\) return settings\.aiModel;/g, 
        "if (settings.aiModel) { if (settings.aiModel === 'gemini-3.5-flash' || settings.aiModel === 'gemini-1.5-flash') return 'gemini-2.5-flash'; return settings.aiModel; }");
    
    fs.writeFileSync(file, code);
}

patchGetAiModel('src/services/geminiService.ts');
patchGetAiModel('src/services/promptModules.ts');
