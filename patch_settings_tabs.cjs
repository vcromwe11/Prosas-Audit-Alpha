const fs = require('fs');
let code = fs.readFileSync('components/SettingsScreen.tsx', 'utf8');

code = code.replace(
    /<button\s*onClick=\{([^}]+)\}\s*className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 \${activeTab === 'advanced' \? 'border-prosas-blue text-prosas-blue' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}\s*>\s*Avançado\s*<\/button>/g,
    `<button 
                            onClick={() => setActiveTab('advanced')}
                            className={\`px-4 py-3 text-sm font-medium transition-colors border-b-2 \${activeTab === 'advanced' ? 'border-prosas-blue text-prosas-blue' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}\`}
                        >
                            Avançado
                        </button>
                        <button 
                            onClick={() => setActiveTab('ai_workflow')}
                            className={\`px-4 py-3 text-sm font-medium transition-colors border-b-2 \${activeTab === 'ai_workflow' ? 'border-prosas-blue text-prosas-blue' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}\`}
                        >
                            Fluxo de IA e Modelos
                        </button>`
);

fs.writeFileSync('components/SettingsScreen.tsx', code);
