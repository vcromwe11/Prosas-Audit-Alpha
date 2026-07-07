const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Section 2: Módulos Específicos
code = code.replace(
    /<h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">\{isOtimizada \? "2. Módulos Específicos por Documento" : "Módulos Específicos"\}<\/h2>/,
    `<h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{isOtimizada ? "2. Módulos Específicos por Documento" : "Módulos Específicos"}</h2>
                                    <Tooltip text="Defina regras específicas para cada tipo de documento. A IA fará a triagem dos arquivos enviados pelos candidatos. Documentos que não se encaixarem em nenhum módulo serão DESCARTADOS e ignorados na análise, economizando processamento e evitando falsos positivos." enabled={appSettings.showTooltips} position="top">
                                        <i className="fas fa-info-circle text-gray-400 hover:text-emerald-500 cursor-help ml-2"></i>
                                    </Tooltip>`
);

code = code.replace(
    /<p className="text-sm text-gray-500 dark:text-gray-400">Escolha quais instruções em prompt utilizar para cada documento na IA Otimizada\.<\/p>/,
    `<p className="text-sm text-gray-500 dark:text-gray-400">Configure as instruções para cada documento exigido. Documentos não mapeados aqui serão descartados pela IA.</p>`
);

// Section 3: Prompt Global (Critérios)
code = code.replace(
    /<h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">\{isOtimizada \? "3. Critérios da IA \(Prompt\)" : "2. Critérios da IA \(Prompt\)"\}<\/h2>/,
    `<h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{isOtimizada ? "3. Instruções Globais Complementares" : "2. Critérios da IA (Prompt)"}</h2>
                                    <Tooltip text={isOtimizada ? "Opcional. Instruções gerais que se aplicam a toda a análise, não a um documento específico. Como você está usando a IA Otimizada, o foco deve estar nos módulos acima." : "Edite as regras lógicas gerais que a IA usará para analisar todos os documentos."} enabled={appSettings.showTooltips} position="top">
                                        <i className="fas fa-info-circle text-gray-400 hover:text-emerald-500 cursor-help ml-2"></i>
                                    </Tooltip>`
);

code = code.replace(
    /<p className="text-sm text-gray-500 dark:text-gray-400">Edite as regras lógicas que a IA usará para aprovar ou reprovar\.<\/p>/,
    `<p className="text-sm text-gray-500 dark:text-gray-400">{isOtimizada ? "Regras gerais aplicadas a todo o processo (opcional)." : "Edite as regras lógicas que a IA usará para aprovar ou reprovar."}</p>`
);

// Make the text area collapse if IA Otimizada
code = code.replace(
    /<div className="relative">\s*<textarea/,
    `<div className="relative">
                            {isOtimizada && (
                                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50 flex items-start gap-3">
                                    <i className="fas fa-lightbulb text-blue-500 mt-1"></i>
                                    <div className="text-sm text-blue-800 dark:text-blue-300">
                                        <strong>Dica de Fluxo de Trabalho:</strong> Na IA Otimizada, a maior parte das regras deve ficar nos <strong>Módulos Específicos</strong> acima. A IA fará uma triagem dos arquivos recebidos e <strong>descartará</strong> automaticamente qualquer arquivo que não corresponda a um dos módulos definidos. Use este campo apenas para orientações globais (ex: "Sempre formate datas como DD/MM/AAAA").
                                    </div>
                                </div>
                            )}
                            <textarea`
);


fs.writeFileSync('App.tsx', code);
console.log('App.tsx tooltips and UI patched');
