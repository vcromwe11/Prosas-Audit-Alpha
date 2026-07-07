const fs = require('fs');
let code = fs.readFileSync('services/storageService.ts', 'utf8');

const newGet = `export const getGlobalPrompt = async (key: string, defaultText: string): Promise<string> => {
  return defaultText;
};`;

code = code.replace(/export const getGlobalPrompt = async \([\s\S]*?^};/m, newGet);

fs.writeFileSync('services/storageService.ts', code);
