const fs = require('fs');
let code = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const targetRegex = `                const limitMatch = errorMessage.match(/"quotaValue"\\s*:\\s*"([^"]+)"/) || errorMessage.match(/limit:\\s*([^\\s,]+)/);`;
const replacementRegex = `                const limitMatch = errorMessage.match(/"quotaValue"\\s*:\\s*"?([^" ,}]+)"?/) || errorMessage.match(/limit:\\s*([^\\s,]+)/);`;
code = code.replace(targetRegex, replacementRegex);

fs.writeFileSync('src/services/geminiService.ts', code);
