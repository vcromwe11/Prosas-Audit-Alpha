const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const anchorState = "const [draggedModuleIdx, setDraggedModuleIdx] = useState<number | null>(null);";
if (!code.includes("const [draggableModuleId, setDraggableModuleId] = useState<string | null>(null);")) {
    code = code.replace(anchorState, anchorState + "\n  const [draggableModuleId, setDraggableModuleId] = useState<string | null>(null);");
}

// add grip handle to expanded module
const upDownAnchor = `<div className="flex flex-col gap-1 mr-3 mt-1 justify-center items-center text-gray-400">`;
const gripHandleExpanded = `<div className="flex flex-col gap-1 mr-3 mt-1 justify-center items-center text-gray-400" onMouseEnter={() => setDraggableModuleId(mod.id)} onMouseLeave={() => setDraggableModuleId(null)}>
                                                <i className="fas fa-grip-vertical mb-1 cursor-grab active:cursor-grabbing hover:text-emerald-500"></i>`;
code = code.replace(upDownAnchor, gripHandleExpanded);

// add grip handle to collapsed module
const collapsedTitleAnchor = `<span className="font-bold text-gray-700 dark:text-gray-300 truncate"><i className="fas fa-file-alt mr-2 text-emerald-500"></i>{mod.documentType || 'Módulo sem nome'}</span>`;
const gripHandleCollapsed = `<div className="flex items-center gap-2" onMouseEnter={() => setDraggableModuleId(mod.id)} onMouseLeave={() => setDraggableModuleId(null)}>
                                  <i className="fas fa-grip-vertical text-gray-400 hover:text-emerald-500 cursor-grab active:cursor-grabbing px-2 py-1"></i>
                                  <span className="font-bold text-gray-700 dark:text-gray-300 truncate"><i className="fas fa-file-alt mr-2 text-emerald-500"></i>{mod.documentType || 'Módulo sem nome'}</span>
                              </div>`;
code = code.replace(collapsedTitleAnchor, gripHandleCollapsed);

// replace draggable condition
code = code.replace(/draggable=\{mod\.documentType\.trim\(\)\.toLowerCase\(\) !== 'orquestrador da esteira' && mod\.documentType\.trim\(\)\.toLowerCase\(\) !== 'cartão cnpj'\}/g, 
    "draggable={draggableModuleId === mod.id && mod.documentType.trim().toLowerCase() !== 'orquestrador da esteira' && mod.documentType.trim().toLowerCase() !== 'cartão cnpj'}");

fs.writeFileSync('App.tsx', code);
console.log('App.tsx grip handles patched');
