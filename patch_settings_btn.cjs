const fs = require('fs');
const content = fs.readFileSync('src/components/SettingsScreen.tsx', 'utf8');

const target = `            {user?.role === 'admin' && (
                <button
                    onClick={() => setActiveTab('advanced')}
                    className={\`py-2 px-4 border-b-2 font-medium text-sm transition-colors \${
                        activeTab === 'advanced'
                            ? 'border-prosas-blue text-prosas-blue dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }\`}
                >
                    <i className="fas fa-code mr-2"></i>Avançado
                </button>
            )}`;

const replacement = target + `\n            {user?.role === 'admin' && (
                <button
                    onClick={() => setActiveTab('ai_logs')}
                    className={\`py-2 px-4 border-b-2 font-medium text-sm transition-colors \${
                        activeTab === 'ai_logs'
                            ? 'border-prosas-blue text-prosas-blue dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }\`}
                >
                    <i className="fas fa-chart-line mr-2"></i>Uso e Erros de IA
                </button>
            )}`;

const updated = content.replace(target, replacement);
fs.writeFileSync('src/components/SettingsScreen.tsx', updated);
