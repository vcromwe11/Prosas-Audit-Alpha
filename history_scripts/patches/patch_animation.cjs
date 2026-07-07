const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// I will write a regex to replace everything between `{(context.promptModules || []).map((mod, idx) => {` and `return (` with the new single structure.
// Actually, it's safer to just replace the whole mapping block.

const newMapping = `{(context.promptModules || []).map((mod, idx) => {
    const isExpanded = expandedModuleId === mod.id;
    const isCollapsed = expandedModuleId && !isExpanded;
    
    return (
        <motion.div 
            layout 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            key={mod.id} 
            draggable={draggableModuleId === mod.id && mod.documentType.trim().toLowerCase() !== 'orquestrador da esteira' && mod.documentType.trim().toLowerCase() !== 'cartão cnpj'}
            onDragStart={() => setDraggedModuleIdx(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleModuleDrop(e, idx)}
            className={
                isCollapsed 
                ? \`cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center text-sm transition-colors \${draggedModuleIdx === idx ? 'opacity-50' : ''}\`
                : \`p-4 rounded-lg border overflow-hidden \${mod.isActive ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'} \${draggedModuleIdx === idx ? 'opacity-50 scale-[0.98]' : ''}\`
            }
            onClick={isCollapsed ? () => setExpandedModuleId(mod.id) : undefined}
        >
            {isCollapsed ? (
                <>
                    <div className="flex items-center gap-2" onMouseEnter={() => setDraggableModuleId(mod.id)} onMouseLeave={() => setDraggableModuleId(null)}>
                        <i className="fas fa-grip-vertical text-gray-400 hover:text-emerald-500 cursor-grab active:cursor-grabbing px-2 py-1"></i>
                        <span className="font-bold text-gray-700 dark:text-gray-300 truncate"><i className="fas fa-file-alt mr-2 text-emerald-500"></i>{mod.documentType || 'Módulo sem nome'}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-500 shrink-0"><i className="fas fa-expand-alt mr-1"></i> Maximizar</span>
                </>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1 mr-3 mt-1 justify-center items-center text-gray-400" onMouseEnter={() => setDraggableModuleId(mod.id)} onMouseLeave={() => setDraggableModuleId(null)}>
                            <i className="fas fa-grip-vertical mb-1 cursor-grab active:cursor-grabbing hover:text-emerald-500"></i>
                            <button onClick={() => moveModule(idx, 'up')} disabled={idx === 0} className="hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"><i className="fas fa-chevron-up"></i></button>
                            <button onClick={() => moveModule(idx, 'down')} disabled={idx === (context.promptModules || []).length - 1} className="hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"><i className="fas fa-chevron-down"></i></button>
                        </div>
                        <div className="flex-1">
                            <input 
                                type="text" 
                                value={mod.documentType}
                                onChange={e => {
                                    const newMods = [...(context.promptModules || [])];
                                    newMods[idx].documentType = e.target.value;
                                    setContext({...context, promptModules: enforceModuleOrder(newMods)});
                                }}
                                className="font-bold text-sm bg-transparent border-b border-dashed border-gray-300 focus:border-emerald-500 outline-none w-full text-gray-800 dark:text-gray-200"
                                placeholder="Tipo do Documento"
                            />
                            <input 
                                type="text" 
                                value={mod.description}
                                onChange={e => {
                                    const newMods = [...(context.promptModules || [])];
                                    newMods[idx].description = e.target.value;
                                    setContext({...context, promptModules: enforceModuleOrder(newMods)});
                                }}
                                className="text-xs bg-transparent border-b border-dashed border-gray-300 focus:border-emerald-500 outline-none w-full text-gray-500 dark:text-gray-400 mt-1"
                                placeholder="Breve descrição"
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={mod.isActive} onChange={e => {
                                    const newMods = [...(context.promptModules || [])];
                                    newMods[idx].isActive = e.target.checked;
                                    setContext({...context, promptModules: enforceModuleOrder(newMods)});
                                }}/>
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                            </label>
                            {(user?.role === 'admin' || user?.role === 'developer') && (
                                <button 
                                    onClick={async () => {
                                        try {
                                            await saveGlobalPromptModule(mod, user.email || 'admin');
                                            alert('Módulo salvo como padrão com sucesso!');
                                            fetchGlobalPromptModules().then(mods => setGlobalPromptModules(mods));
                                        } catch(e) {
                                            alert('Erro ao salvar módulo');
                                        }
                                    }}
                                    className="text-xs text-blue-500 hover:bg-blue-50 p-1 rounded"
                                    title="Salvar como Padrão para todos"
                                >
                                    <i className="fas fa-save"></i>
                                </button>
                            )}
                            <button onClick={() => {
                                const newMods = [...(context.promptModules || [])];
                                newMods.splice(idx, 1);
                                setContext({...context, promptModules: enforceModuleOrder(newMods)});
                            }} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <textarea 
                        value={mod.promptInstructions}
                        onChange={e => {
                            const newMods = [...(context.promptModules || [])];
                            newMods[idx].promptInstructions = e.target.value;
                            setContext({...context, promptModules: enforceModuleOrder(newMods)});
                        }}
                        className={\`w-full text-xs p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded mt-2 outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 dark:text-gray-300 transition-all duration-300 \${isExpanded ? 'h-[32rem]' : 'h-24'}\`}
                        placeholder="Instruções para a IA analisar este documento..."
                    />
                    <div className="mt-2 flex justify-end">
                        <button 
                            onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                            className="text-xs text-gray-500 hover:text-emerald-600 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded shadow-sm transition-colors"
                        >
                            <i className={\`fas \${isExpanded ? 'fa-compress-alt' : 'fa-expand-alt'}\`}></i> {isExpanded ? 'Minimizar' : 'Expandir para Editar'}
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
})}`;

const startRegex = /\{\(context\.promptModules \|\| \[\]\)\.map\(\(mod, idx\) => \{/;
const endRegex = /<\/i> \{isExpanded \? 'Minimizar' : 'Expandir para Editar'\}\s*<\/button>\s*<\/div>\s*<\/motion\.div>\s*\);\s*\}\)/;

let startIdx = code.search(startRegex);
let endIdx = code.search(endRegex);

if (startIdx !== -1 && endIdx !== -1) {
    const endOffset = code.match(endRegex)[0].length;
    code = code.substring(0, startIdx) + newMapping + code.substring(endIdx + endOffset);
    fs.writeFileSync('App.tsx', code);
    console.log('Animation patched via single return structure!');
} else {
    console.log('Regex did not match.');
}
