const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(/<div className=\{expandedModuleId \? "flex flex-col gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"\}>/, 
    '<motion.div layout className={expandedModuleId ? "flex flex-col gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>');

// find the closing div for this mapping block:
code = code.replace(/<\/button>\s*<\/div>\s*<\/div>\s*\)\s*:\s*null\}/, 
    '</button>\n                           </motion.div>\n                       </div>\n                   ) : null}');

fs.writeFileSync('App.tsx', code);
console.log('App.tsx layout container patched');
