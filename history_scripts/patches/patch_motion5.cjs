const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(/\\'Módulo sem nome\\'/g, "'Módulo sem nome'");
code = code.replace(/\\'Minimizar\\'/g, "'Minimizar'");
code = code.replace(/\\'Expandir para Editar\\'/g, "'Expandir para Editar'");

fs.writeFileSync('App.tsx', code);
console.log('App.tsx syntax error patched');
