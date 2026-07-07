const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Replace the first return (collapsed)
code = code.replace(/<div key=\{mod\.id\}\s+onClick=\{\(\) => setExpandedModuleId\(mod\.id\)\}/, 
    '<motion.div layoutId={`module-${mod.id}`} layout initial={false} key={mod.id} onClick={() => setExpandedModuleId(mod.id)}');
code = code.replace(/<span className="font-bold text-gray-700 dark:text-gray-300 truncate">/,
    '<motion.span layout="position" className="font-bold text-gray-700 dark:text-gray-300 truncate">');
code = code.replace(/<\/span>\s*<\/div>\s*<span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-500">/,
    '</motion.span></div><motion.span layout="position" className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-500">');
code = code.replace(/<\/i> Maximizar<\/span>\s*<\/div>\s*\);\s*\}/,
    '</i> Maximizar</motion.span></motion.div>);}');


// Replace the second return (expanded / default view)
code = code.replace(/return \(\s*<div key=\{mod\.id\}\s+draggable=\{draggableModuleId === mod\.id/,
    'return (\n<motion.div layoutId={`module-${mod.id}`} layout initial={false} key={mod.id}\ndraggable={draggableModuleId === mod.id');

// Replace the closing div for the second return
code = code.replace(/<\/i> \{isExpanded \? 'Minimizar' : 'Expandir para Editar'\}\s*<\/button>\s*<\/div>\s*<\/div>\s*\)\s*\})/,
    '</i> {isExpanded ? \\\'Minimizar\\\' : \\\'Expandir para Editar\\\'}</button></div></motion.div>)})');

fs.writeFileSync('App.tsx', code);
console.log('App.tsx motion patched');
