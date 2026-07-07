const fs = require('fs');
let code = fs.readFileSync('components/SettingsScreen.tsx', 'utf8');

const workflowContent = `
        {/* AI Workflow Section */}
        {activeTab === 'ai_workflow' && user?.role === 'admin' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <i className="fas fa-microchip text-prosas-blue"></i> Fluxo de IA e Modelos
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Visão detalhada de como a Inteligência Artificial é orquestrada no sistema para garantir precisão e eficiência.
                    </p>
                </div>
                <div className="p-6 space-y-8">
                    
                    {/* Stage 1: Edital Extraction */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <span className="font-bold text-lg">1</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                                Extração de Regras (Mapeamento do Edital)
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                    Gemini 2.5 Flash / 1.5 Pro
                                </span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                A IA lê o texto integral do edital para extrair as exigências documentais, os prazos e criar os <strong>Módulos de Validação</strong>. 
                                Requer um modelo com janela de contexto ampla e alta capacidade de raciocínio lógico para compreender leis, anexos e exceções.
                            </p>
                        </div>
                    </div>

                    {/* Stage 2: Triage */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <span className="font-bold text-lg">2</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                                Triagem e Distribuição de Documentos
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                    Gemini 1.5 Flash
                                </span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Quando os documentos do candidato chegam, este modelo ágil e de baixo custo analisa a massa de arquivos (PDFs misturados) e 
                                "separa o joio do trigo". Ele identifica qual página ou arquivo corresponde a qual Módulo (ex: "Isto é o Cartão CNPJ", "Isto é a CND"),
                                descartando páginas irrelevantes e reduzindo o "ruído" para a próxima etapa.
                            </p>
                        </div>
                    </div>

                    {/* Stage 3: Module Analysis */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <span className="font-bold text-lg">3</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                                Validação Específica por Módulo
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                    Modelo Selecionado (Padrão: Gemini 2.5 Flash)
                                </span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Com os documentos já filtrados e separados, cada Módulo aciona a IA <strong>apenas com o documento que lhe compete</strong> e a sua regra específica.
                                Isso evita que o Módulo de "Cartão CNPJ" se confunda lendo páginas do "Estatuto Social", garantindo altíssima precisão e evitando falsos positivos.
                                O modelo para esta etapa pode ser escolhido na aba Avançado.
                            </p>
                        </div>
                    </div>

                    {/* Stage 4: Orchestration */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <span className="font-bold text-lg">4</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                                Orquestração e Parecer Final
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                    Gemini 2.5 Flash
                                </span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                O orquestrador recebe os laudos de todos os Módulos individuais, consolida as informações da organização (como nome e status do CNPJ) 
                                e gera o formato estruturado JSON final ("APROVADO", "REPROVADO" ou "RESSALVAS") apresentado no painel.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        )}
`;

code = code.replace(
    /\{\/\* Advanced Section \*\/\}/g,
    workflowContent + '\n        {/* Advanced Section */}'
);

fs.writeFileSync('components/SettingsScreen.tsx', code);
