const fs = require('fs');
const content = fs.readFileSync('src/components/SettingsScreen.tsx', 'utf8');

const replacement1 = `<select 
                                    value={appSettings.aiModelEconomico || appSettings.aiModel || 'gemini-2.5-flash'}
                                    onChange={(e) => setAppSettings((prev: any) => ({ ...prev, aiModelEconomico: e.target.value }))}
                                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded focus:ring-prosas-blue focus:border-prosas-blue block w-full p-2.5"
                                    disabled={isLoadingModels}
                                >
                                    {isLoadingModels ? (
                                        <option value="">Carregando modelos...</option>
                                    ) : availableModels.length > 0 ? (
                                        availableModels.map(m => (
                                            <option key={m.name} value={m.name}>{m.displayName}</option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Excelente Custo-Benefício)</option>
                                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Nova Geração, Rápido)</option>
                                        </>
                                    )}
                                </select>`;

const target1 = `<select 
                                    value={appSettings.aiModelEconomico || appSettings.aiModel || 'gemini-2.5-flash'}
                                    onChange={(e) => setAppSettings((prev: any) => ({ ...prev, aiModelEconomico: e.target.value }))}
                                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded focus:ring-prosas-blue focus:border-prosas-blue block w-full p-2.5"
                                >
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Excelente Custo-Benefício)</option>
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Nova Geração, Rápido)</option>
                                </select>`;

const replacement2 = `<select 
                                    value={appSettings.aiModelPotente || appSettings.aiModel || 'gemini-2.5-flash'}
                                    onChange={(e) => setAppSettings((prev: any) => ({ ...prev, aiModelPotente: e.target.value }))}
                                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded focus:ring-prosas-blue focus:border-prosas-blue block w-full p-2.5"
                                    disabled={isLoadingModels}
                                >
                                    {isLoadingModels ? (
                                        <option value="">Carregando modelos...</option>
                                    ) : availableModels.length > 0 ? (
                                        availableModels.map(m => (
                                            <option key={m.name} value={m.name}>{m.displayName}</option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rápido, Menor Custo)</option>
                                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Raciocínio Complexo, Maior Custo)</option>
                                        </>
                                    )}
                                </select>`;

const target2 = `<select 
                                    value={appSettings.aiModelPotente || appSettings.aiModel || 'gemini-2.5-flash'}
                                    onChange={(e) => setAppSettings((prev: any) => ({ ...prev, aiModelPotente: e.target.value }))}
                                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded focus:ring-prosas-blue focus:border-prosas-blue block w-full p-2.5"
                                >
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rápido, Menor Custo)</option>
                                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Raciocínio Complexo, Maior Custo)</option>
                                </select>`;


let updated = content.replace(target1, replacement1);
updated = updated.replace(target2, replacement2);
fs.writeFileSync('src/components/SettingsScreen.tsx', updated);
