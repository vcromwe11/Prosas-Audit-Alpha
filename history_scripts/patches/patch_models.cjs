const fs = require('fs');

function replaceModel(file) {
    if (fs.existsSync(file)) {
        let code = fs.readFileSync(file, 'utf8');
        code = code.replace(/gemini-3\.1-pro-preview/g, 'gemini-2.5-flash');
        code = code.replace(/gemini-2\.5-pro/g, 'gemini-2.5-flash'); // Just in case
        fs.writeFileSync(file, code);
        console.log(`Patched ${file}`);
    }
}

replaceModel('services/promptModules.ts');
replaceModel('services/geminiService.ts');
