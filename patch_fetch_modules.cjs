const fs = require('fs');
let code = fs.readFileSync('services/promptModules.ts', 'utf8');

const newFetch = `export async function fetchGlobalPromptModules(): Promise<Omit<DocumentPromptModule, 'id'>[]> {
  return FALLBACK_PROMPT_MODULE_TEMPLATES;
}`;

code = code.replace(/export async function fetchGlobalPromptModules\(\): Promise<Omit<DocumentPromptModule, 'id'>\[\]> {[\s\S]*?^}/m, newFetch);

fs.writeFileSync('services/promptModules.ts', code);
