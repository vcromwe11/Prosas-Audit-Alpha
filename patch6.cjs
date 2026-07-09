const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{isOtimizada ? "3. Instruções Globais Complementares" : "2. Critérios da IA (Prompt)"}</h2>
                                        {isOtimizada && (
                                            <label className="flex items-center cursor-pointer ml-4">
                                                <div className="relative">
                                                    <input type="checkbox" className="sr-only" 
                                                        checked={context.useGlobalInstructions !== false} 
                                                        onChange={(e) => setContext({...context, useGlobalInstructions: e.target.checked})} 
                                                    />
                                                    <div className={\`block w-10 h-6 rounded-full transition-colors \${context.useGlobalInstructions !== false ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}\`}></div>
                                                    <div className={\`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform \${context.useGlobalInstructions !== false ? 'transform translate-x-4' : ''}\`}></div>
                                                </div>
                                                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {context.useGlobalInstructions !== false ? 'Habilitado' : 'Desabilitado'}
                                                </span>
                                            </label>
                                        )}
                                    </div>
                                    <Tooltip text={isOtimizada ? "Opcional. Instruções gerais que se aplicam a toda a análise, não a um documento específico. Como você está usando a IA Otimizada, o foco deve estar nos módulos acima." : "Edite as regras lógicas gerais que a IA usará para analisar todos os documentos."} enabled={appSettings.showTooltips} position="top">
                                        <i className="fas fa-info-circle text-gray-400 hover:text-emerald-500 cursor-help ml-2"></i>
                                    </Tooltip>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{isOtimizada ? "Regras gerais aplicadas a todo o processo (opcional)." : "Edite as regras lógicas que a IA usará para aprovar ou reprovar."}</p>`;

const replacement = `                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{isOtimizada ? "3. Instruções Globais Complementares" : "2. Critérios da IA (Prompt)"}</h2>
                                        <Tooltip text={isOtimizada ? "Opcional. Instruções gerais que se aplicam a toda a análise, não a um documento específico. Como você está usando a IA Otimizada, o foco deve estar nos módulos acima." : "Edite as regras lógicas gerais que a IA usará para analisar todos os documentos."} enabled={appSettings.showTooltips} position="top">
                                            <i className="fas fa-info-circle text-gray-400 hover:text-emerald-500 cursor-help"></i>
                                        </Tooltip>
                                        {isOtimizada && (
                                            <label className="flex items-center cursor-pointer ml-4">
                                                <div className="relative">
                                                    <input type="checkbox" className="sr-only" 
                                                        checked={context.useGlobalInstructions !== false} 
                                                        onChange={(e) => setContext({...context, useGlobalInstructions: e.target.checked})} 
                                                    />
                                                    <div className={\`block w-10 h-6 rounded-full transition-colors \${context.useGlobalInstructions !== false ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}\`}></div>
                                                    <div className={\`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform \${context.useGlobalInstructions !== false ? 'transform translate-x-4' : ''}\`}></div>
                                                </div>
                                                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {context.useGlobalInstructions !== false ? 'Habilitado' : 'Desabilitado'}
                                                </span>
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{isOtimizada ? "Regras gerais aplicadas a todo o processo (opcional)." : "Edite as regras lógicas que a IA usará para aprovar ou reprovar."}</p>`;

const updated = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', updated);
