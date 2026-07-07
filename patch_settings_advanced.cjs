const fs = require('fs');
let code = fs.readFileSync('components/SettingsScreen.tsx', 'utf8');

const advancedModelHtml = `
                    <div className="pb-6 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Modelo de Inteligência Artificial</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Selecione o modelo do Gemini que será utilizado para as análises e extração de dados. Modelos mais avançados possuem maior custo e limites de cota mais estritos.
                        </p>
                        <select 
                            value={appSettings.aiModel || 'gemini-1.5-flash'}
                            onChange={(e) => setAppSettings((prev: any) => ({ ...prev, aiModel: e.target.value }))}
                            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded focus:ring-prosas-blue focus:border-prosas-blue block w-full p-2.5"
                        >
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido, Menor Custo, Ótimo para Triagem)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Raciocínio Complexo, Maior Custo)</option>
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Nova Geração, Rápido, Excelente Custo-Benefício)</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Padrão, Otimizado para Alta Performance)</option>
                        </select>
                    </div>

                    <div>
`;

code = code.replace(
    /<div className="p-6 space-y-6">\s*<div>\s*<h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Prompts da IA \(Repositório Mestre\)<\/h3>/,
    `<div className="p-6 space-y-6">` + advancedModelHtml + `                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Prompts da IA (Repositório Mestre)</h3>`
);

fs.writeFileSync('components/SettingsScreen.tsx', code);
