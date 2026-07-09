const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                        <div className="relative">
                            {isOtimizada && (
                                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50 flex items-start gap-3">
                                    <i className="fas fa-lightbulb text-blue-500 mt-1"></i>
                                    <div className="text-sm text-blue-800 dark:text-blue-300">
                                        <strong>Dica de Fluxo de Trabalho:</strong> Na IA Otimizada, a maior parte das regras deve ficar nos <strong>Módulos Específicos</strong> acima. A IA fará uma triagem dos arquivos recebidos e <strong>descartará</strong> automaticamente qualquer arquivo que não corresponda a um dos módulos definidos. Use este campo apenas para orientações globais (ex: "Sempre formate datas como DD/MM/AAAA").
                                    </div>
                                </div>
                            )}
                            <textarea 
                                className={\`w-full h-96 p-6 text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 \${colorsStyle.accentFocusRing} focus:bg-white dark:focus:bg-gray-800 outline-none resize-y leading-relaxed shadow-inner transition-colors duration-200\`}
                                value={context.criteriaText}
                                onChange={(e) => setContext({...context, criteriaText: e.target.value})}
                                spellCheck={false}
                                maxLength={50000}
                            />
                            <div className="absolute bottom-4 right-4 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {context.criteriaText.length} caracteres
                            </div>
                        </div>`;

const replacement = `                        <div className="relative">
                            {isOtimizada && context.useGlobalInstructions !== false && (
                                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50 flex items-start gap-3">
                                    <i className="fas fa-lightbulb text-blue-500 mt-1"></i>
                                    <div className="text-sm text-blue-800 dark:text-blue-300">
                                        <strong>Dica de Fluxo de Trabalho:</strong> Na IA Otimizada, a maior parte das regras deve ficar nos <strong>Módulos Específicos</strong> acima. A IA fará uma triagem dos arquivos recebidos e <strong>descartará</strong> automaticamente qualquer arquivo que não corresponda a um dos módulos definidos. Use este campo apenas para orientações globais (ex: "Sempre formate datas como DD/MM/AAAA").
                                    </div>
                                </div>
                            )}
                            {(!isOtimizada || context.useGlobalInstructions !== false) ? (
                                <>
                                    <textarea 
                                        className={\`w-full h-96 p-6 text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 \${colorsStyle.accentFocusRing} focus:bg-white dark:focus:bg-gray-800 outline-none resize-y leading-relaxed shadow-inner transition-colors duration-200\`}
                                        value={context.criteriaText}
                                        onChange={(e) => setContext({...context, criteriaText: e.target.value})}
                                        spellCheck={false}
                                        maxLength={50000}
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {context.criteriaText.length} caracteres
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-40 p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-400">
                                    <div className="text-center">
                                        <i className="fas fa-eye-slash text-2xl mb-2"></i>
                                        <p>Instruções Globais Desabilitadas</p>
                                    </div>
                                </div>
                            )}
                        </div>`;

const updated = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', updated);
