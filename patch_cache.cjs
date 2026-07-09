const fs = require('fs');
let code = fs.readFileSync('src/services/storageService.ts', 'utf8');

code = code.replace(
    "export const getNextPropostaId = async (): Promise<string> => {",
    "export const updateEditalIdCache = (editalName: string, newEditalId: string) => {\n    editalIdLocks.set(editalName, Promise.resolve(newEditalId));\n};\n\nexport const getNextPropostaId = async (): Promise<string> => {"
);

fs.writeFileSync('src/services/storageService.ts', code);
