const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

const missingText = `                                <div className="flex gap-2">
                                    <button onClick={() => { setPdfTarget('regulation'); pdfInputRef.current?.click(); }} className={\`px-4 py-2 rounded text-xs font-bold transition-colors \${
                                        context.regulationText ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400' : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 border border-transparent'
                                    }\`}>
                                        Upload Local
                                    </button>
                                    <button onClick={() => { setRepoPickerTarget('regulation'); setIsRepoPickerOpen(true); }} className={\`px-4 py-2 rounded text-xs font-bold transition-colors \${
                                        context.regulationText ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400' : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 border border-transparent'
                                    }\`}>
                                        Repositório
                                    </button>
                                </div>
                             </div>

                            {/* Form Template Card */}
                             <div className={\`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors relative min-h-[200px] \${
                                 context.formTemplateText 
                                  ? 'border-prosas-blue bg-blue-50 dark:bg-blue-900/10'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-prosas-blue dark:hover:border-prosas-blue hover:bg-gray-50 dark:hover:bg-gray-700/50'
                             }\`}>
                                {context.formTemplateText && (
                                    <div className="absolute top-3 right-3 flex items-center gap-2">
                                        <div className="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm"><i className="fas fa-check-circle"></i></div>
                                        <button 
                                            onClick={() => setContext({...context, formTemplateText: ''})} 
                                            className="text-gray-400 hover:text-red-500 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm transition-colors"
                                            title="Remover arquivo"
                                        >
                                            <i className="fas fa-times-circle"></i>
                                        </button>
                                    </div>
                                )}
                                <i className={\`fas fa-file-invoice text-4xl mb-4 \${context.formTemplateText ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'}\`}></i>
                                <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-1">Modelo de Formulário</h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Opcional. Estrutura da proposta.</p>
                                <div className="flex gap-2">
                                  <button onClick={() => { setPdfTarget('form'); pdfInputRef.current?.click(); }} className={\`px-4 py-2 rounded text-xs font-bold transition-colors \${
                                      context.formTemplateText ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400' : 'bg-blue-50 dark:bg-blue-900/20 text-prosas-blue hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-transparent'
                                  }\`}>
                                      Upload Local
                                  </button>
                                  <button onClick={() => { setRepoPickerTarget('form'); setIsRepoPickerOpen(true); }} className={\`px-4 py-2 rounded text-xs font-bold transition-colors \${
                                      context.formTemplateText ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400' : 'bg-blue-50 dark:bg-blue-900/20 text-prosas-blue hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-transparent'
                                  }\`}>
                                      Repos
                                  </button>
                                </div>
                             </div>

                            {/* Misc Files Card */}
                             <div className={\`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors relative min-h-[200px] \${
                                 context.miscFilesText 
                                  ? 'border-prosas-blue bg-blue-50 dark:bg-blue-900/10'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-prosas-blue dark:hover:border-prosas-blue hover:bg-gray-50 dark:hover:bg-gray-700/50'
                             }\`}>
                                {context.miscFilesText && (
                                    <div className="absolute top-3 right-3 flex items-center gap-2">
                                        <div className="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm"><i className="fas fa-check-circle"></i></div>
                                        <button 
                                            onClick={() => setContext({...context, miscFilesText: ''})} 
                                            className="text-gray-400 hover:text-red-500 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm transition-colors"
                                            title="Remover arquivo"
                                        >
                                            <i className="fas fa-times-circle"></i>
                                        </button>
                                    </div>
                                )}
                                <i className={\`fas fa-paperclip text-4xl mb-4 \${context.miscFilesText ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'}\`}></i>
                                <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-1">Outros Anexos</h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Opcional. Manuais ou erratas.</p>
                                <div className="flex gap-2">
                                  <button onClick={() => { setPdfTarget('misc'); pdfInputRef.current?.click(); }} className={\`px-4 py-2 rounded text-xs font-bold transition-colors \${
                                      context.miscFilesText ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400' : 'bg-blue-50 dark:bg-blue-900/20 text-prosas-blue hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-transparent'
                                  }\`}>
                                      Upload Local
                                  </button>
                                  <button onClick={() => { setRepoPickerTarget('misc'); setIsRepoPickerOpen(true); }} className={\`px-4 py-2 rounded text-xs font-bold transition-colors \${
                                      context.miscFilesText ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400' : 'bg-blue-50 dark:bg-blue-900/20 text-prosas-blue hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-transparent'
                                  }\`}>
                                      Repos
                                  </button>
                                </div>
                             </div>
                        </div>
                   </div>

                   {/* SECTION 2: AUTH RULES OR PROMPT MODULES */}
                   {isOtimizada ? (
                       <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8 transition-colors duration-200">
                           <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                               <div className="flex items-center gap-3">
                                   <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                                       <i className="fas fa-cubes text-xl"></i>
                                   </div>
                                   <div>
                                       <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">2. Módulos Específicos por Documento</h2>
                                       <p className="text-sm text-gray-500 dark:text-gray-400">Escolha quais instruções em prompt utilizar para cada documento na IA Otimizada.</p>
                                   </div>
                               </div>`;

const searchStr = `                                <div className="flex flex-col items-end mr-4">
                                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Data de Referência (Edital):</label>`;

code = code.replace(searchStr, missingText + '\n                               <div className="flex items-center gap-4">\n' + searchStr);
fs.writeFileSync('App.tsx', code);
console.log('App.tsx restored properly');
