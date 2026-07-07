const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const regex = /className="cursor-pointer (.*?)\s*\$\{draggedModuleIdx === idx \? 'opacity-50' : ''\}"/;
code = code.replace(regex, 'className={`cursor-pointer $1 ${draggedModuleIdx === idx ? \\\'opacity-50\\\' : \\\'\\\'}`}');

fs.writeFileSync('App.tsx', code);
console.log('App.tsx template literal patched');
