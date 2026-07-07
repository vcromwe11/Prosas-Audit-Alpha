const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Add state
code = code.replace(
    "const [globalPromptModules, setGlobalPromptModules] = useState<Omit<DocumentPromptModule, 'id'>[]>(FALLBACK_PROMPT_MODULE_TEMPLATES);",
    "const [globalPromptModules, setGlobalPromptModules] = useState<Omit<DocumentPromptModule, 'id'>[]>(FALLBACK_PROMPT_MODULE_TEMPLATES);\n  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);"
);

// Update Header for isOtimizada
const headerRegex = /<div className="flex gap-2">[\s\S]*?Detectar pelo Regulamento[\s\S]*?<\/button>\s*\)}/m;
const headerMatch = code.match(headerRegex);

if (headerMatch) {
    const newHeaderPart = `
                                <div className="flex flex-col items-end mr-4">
                                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Data de Referência (Edital):</label>
                                    <input 
                                        type="date" 
                                        value={context.referenceDate}
                                        onChange={(e) => setContext({...context, referenceDate: e.target.value})}
                                        className="p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {context.regulationText && (
                                        <button
                                            onClick={handleDetectModules}
                                            disabled={isDetectingModules}
                                            className="text-xs bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                        >
                                            {isDetectingModules ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-robot"></i>} 
                                            Detectar pelo Regulamento
                                        </button>
                                    )}
`;
    code = code.replace(headerRegex, newHeaderPart.trim());
}

// Update the grid and mapping
const gridStart = '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">';
const newGridStart = '<div className={expandedModuleId ? "flex flex-col gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>';
code = code.replace(gridStart, newGridStart);

const mapStartStr = "{(context.promptModules || []).map((mod, idx) => (";
const newMapStart = `{(context.promptModules || []).map((mod, idx) => {
    const isExpanded = expandedModuleId === mod.id;
    if (expandedModuleId && !isExpanded) {
        return (
            <div key={mod.id} onClick={() => setExpandedModuleId(mod.id)} className="cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center text-sm transition-colors">
                <span className="font-bold text-gray-700 dark:text-gray-300 truncate"><i className="fas fa-file-alt mr-2 text-emerald-500"></i>{mod.documentType || 'Módulo sem nome'}</span>
                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-500"><i className="fas fa-expand-alt mr-1"></i> Maximizar</span>
            </div>
        );
    }
    return (`;
code = code.replace(mapStartStr, newMapStart);

// Update textarea and end of map block
const endMapRegex = /<textarea[\s\S]*?\/>\s*<\/div>\s*\)\)}/m;
const mapEndMatch = code.match(endMapRegex);

if (mapEndMatch) {
    const newEndMap = `
                                       <textarea 
                                            value={mod.promptInstructions}
                                            onChange={e => {
                                                const newMods = [...(context.promptModules || [])];
                                                newMods[idx].promptInstructions = e.target.value;
                                                setContext({...context, promptModules: newMods});
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
                                   </div>
                               );
                           })}`;
    code = code.replace(endMapRegex, newEndMap.trim());
}

fs.writeFileSync('App.tsx', code);
console.log('App.tsx UI updated');
