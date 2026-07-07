const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Replace the collapsed module div with motion.div
code = code.replace(/<div key=\{mod\.id\}\s+onClick=\{\(\) => setExpandedModuleId\(mod\.id\)\}/, '<motion.div layout layoutId={`module-${mod.id}`} key={mod.id}\n               onClick={() => setExpandedModuleId(mod.id)}');

// Replace the expanded/regular module div with motion.div
code = code.replace(/<div key=\{mod\.id\}\s+draggable=\{draggableModuleId === mod\.id/g, '<motion.div layout layoutId={`module-${mod.id}`} key={mod.id} \n              draggable={draggableModuleId === mod.id');

// Replace the closing tags.
// First, find the closing tag for the collapsed module:
//   </label>
//                                                                                                    {(user?.role === 'admin' || user?.role === 'developer') && (

// Let's do it carefully.
