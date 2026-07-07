const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf8');

const modelLogic = `
const getAiModel = () => {
    try {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('prosas_app_settings');
            if (stored) {
                const settings = JSON.parse(stored);
                if (settings.aiModel) return settings.aiModel;
            }
        }
    } catch (e) {}
    return 'gemini-2.5-flash'; // Fallback
};
`;

code = code.replace(/import \{ GoogleGenAI \} from "@google\/genai";/, "import { GoogleGenAI } from \"@google/genai\";\n" + modelLogic);

code = code.replace(/const model = 'gemini-2\.5-flash';/g, "const model = getAiModel();");

fs.writeFileSync('services/geminiService.ts', code);
