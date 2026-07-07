const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
    "setContext(prev => ({...prev, promptModules: newMods}));",
    "setContext(prev => ({...prev, promptModules: newMods, referenceDate: result.referenceDate || prev.referenceDate}));"
);

fs.writeFileSync('App.tsx', code);
console.log('handleDetectModules patched');
