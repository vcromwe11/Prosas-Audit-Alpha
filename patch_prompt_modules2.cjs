const fs = require('fs');
let code = fs.readFileSync('services/promptModules.ts', 'utf8');

if (!code.includes('getGlobalPrompt')) {
    code = code.replace(
        /import \{ GoogleGenAI \} from '@google\/genai';/,
        `import { GoogleGenAI } from '@google/genai';\nimport { getGlobalPrompt } from './storageService';\nimport { PROMPTS } from '../prompts';`
    );
}

const originalPromptRegex = /const prompt = \`Você é um especialista em análise de editais e regulamentos.[\s\S]*?\n\}\`;/;
const newPromptCode = `
    const basePrompt = await getGlobalPrompt('OPTIMIZED_AI_MODULE_DETECTOR', PROMPTS.OPTIMIZED_AI_MODULE_DETECTOR);
    const prompt = basePrompt
        .replace('{{availableModulesJson}}', availableModulesJson)
        .replace('{{regulationText}}', regulationText);
`;

if(code.match(originalPromptRegex)) {
    code = code.replace(originalPromptRegex, newPromptCode);
    fs.writeFileSync('services/promptModules.ts', code);
    console.log("Patched promptModules.ts successfully!");
} else {
    console.log("Could not find the original prompt regex!");
}

