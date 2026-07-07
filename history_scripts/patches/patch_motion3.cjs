const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// The collapsed block:
const collapsedAnchor = 'className={`cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center text-sm transition-colors ${draggedModuleIdx === idx ? \\\'opacity-50\\\' : \\\'\\\'}`}>';

// We replace the opening div for collapsed
code = code.replace(/<div key=\{mod\.id\}\s*onClick=\{\(\) => setExpandedModuleId\(mod\.id\)\}/, 
    '<motion.div layoutId={`module-${mod.id}`} layout initial={false} key={mod.id}\n               onClick={() => setExpandedModuleId(mod.id)}');

code = code.replace(/<span className="font-bold text-gray-700 dark:text-gray-300 truncate"><i className="fas fa-file-alt mr-2 text-emerald-500"><\/i>\{mod\.documentType \|\| 'Módulo sem nome'\}<\/span>\s*<\/div>\s*<span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-500"><i className="fas fa-expand-alt mr-1"><\/i> Maximizar<\/span>\s*<\/div>\s*\);\s*\}/, 
    '<motion.span layout="position" className="font-bold text-gray-700 dark:text-gray-300 truncate"><i className="fas fa-file-alt mr-2 text-emerald-500"></i>{mod.documentType || \\\'Módulo sem nome\\\'}</motion.span>\n                              </div>\n                <motion.span layout="position" className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-500"><i className="fas fa-expand-alt mr-1"></i> Maximizar</motion.span>\n            </motion.div>\n        );\n    }');

// The expanded block:
code = code.replace(/return \(\s*<div key=\{mod\.id\}/, 'return (\n                                   <motion.div layoutId={`module-${mod.id}`} layout initial={false} key={mod.id}');
code = code.replace(/<\/i> \{isExpanded \? 'Minimizar' : 'Expandir para Editar'\}\s*<\/button>\s*<\/div>\s*<\/div>\s*\);\s*\}/,
    '</i> {isExpanded ? \\\'Minimizar\\\' : \\\'Expandir para Editar\\\'}\n                                           </button>\n                                       </div>\n                                   </motion.div>\n                               );\n                           }');


fs.writeFileSync('App.tsx', code);
console.log('App.tsx motion fully patched');
