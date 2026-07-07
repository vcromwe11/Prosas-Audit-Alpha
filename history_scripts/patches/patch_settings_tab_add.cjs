const fs = require('fs');
let code = fs.readFileSync('components/SettingsScreen.tsx', 'utf8');

const newTabHtml = `
            {user?.role === 'admin' && (
                <button
                    onClick={() => setActiveTab('ai_workflow')}
                    className={\`py-2 px-4 border-b-2 font-medium text-sm transition-colors \${
                        activeTab === 'ai_workflow'
                            ? 'border-prosas-blue text-prosas-blue dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }\`}
                >
                    <i className="fas fa-microchip mr-2"></i>Fluxo de IA e Modelos
                </button>
            )}
`;

code = code.replace(
    /Avançado\s*<\/button>\s*<\/div>\s*\)\}\s*<button/g,
    `Avançado
                </button>
            )}` + newTabHtml + `
            <button`
);

fs.writeFileSync('components/SettingsScreen.tsx', code);
