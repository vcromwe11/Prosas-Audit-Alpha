const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(/    \);\n\}\)\}\}/g, "    );\n})}");

fs.writeFileSync('App.tsx', code);
console.log('App.tsx syntax fixed');
