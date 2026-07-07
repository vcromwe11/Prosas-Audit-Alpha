const fs = require('fs');
let code = fs.readFileSync('services/promptModules.ts', 'utf8');

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

code = code.replace(/import \{ PROMPTS \} from '\.\.\/prompts';/, "import { PROMPTS } from '../prompts';\n" + modelLogic);

code = code.replace(/model: 'gemini-2\.5-flash',/g, "model: getAiModel(),");

fs.writeFileSync('services/promptModules.ts', code);
