const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetContextTextarea = `                            {(!isOtimizada || context.useGlobalInstructions !== false) ? (
                                <>
                                    <textarea `;

const replacementContextTextarea = `                            <div className="mb-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                                <div>
                                    <div className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                        Enviar Arquivos de Contexto na Análise
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Se desativado, o Regulamento e o Formulário não serão enviados para a IA durante a análise, apenas estes critérios (prompt) e os documentos do candidato.
                                    </div>
                                </div>
                                <label className="flex items-center cursor-pointer ml-4 flex-shrink-0">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" 
                                            checked={context.excludeContextInAnalysis !== true} 
                                            onChange={(e) => setContext({...context, excludeContextInAnalysis: !e.target.checked})} 
                                        />
                                        <div className={\`block w-10 h-6 rounded-full transition-colors \${context.excludeContextInAnalysis !== true ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}\`}></div>
                                        <div className={\`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform \${context.excludeContextInAnalysis !== true ? 'transform translate-x-4' : ''}\`}></div>
                                    </div>
                                </label>
                            </div>

                            {(!isOtimizada || context.useGlobalInstructions !== false) ? (
                                <>
                                    <textarea `;

code = code.replace(targetContextTextarea, replacementContextTextarea);
fs.writeFileSync('src/App.tsx', code);
