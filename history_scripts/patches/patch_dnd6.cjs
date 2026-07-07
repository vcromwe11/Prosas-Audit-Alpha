const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(/\\'opacity-50\\' : \\'\\'/g, "'opacity-50' : ''");

fs.writeFileSync('App.tsx', code);
console.log('App.tsx quotes patched');
