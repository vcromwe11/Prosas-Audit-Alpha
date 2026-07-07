const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// replace standard setContext calls that update promptModules to wrap in enforceModuleOrder
code = code.replace(/setContext\(prev => \(\{\.\.\.prev, promptModules: newMods,/g, 'setContext(prev => ({...prev, promptModules: enforceModuleOrder(newMods),');
code = code.replace(/setContext\(\{\.\.\.context, promptModules: newMods\}\);/g, 'setContext({...context, promptModules: enforceModuleOrder(newMods)});');
code = code.replace(/setContext\(prev => \(\{\.\.\.prev, promptModules: \[\.\.\.\(prev\.promptModules \|\| \[\]\), \.\.\.toAdd\]\}\)\);/g, 'setContext(prev => ({...prev, promptModules: enforceModuleOrder([...(prev.promptModules || []), ...toAdd])}));');
code = code.replace(/setContext\(prev => \(\{\.\.\.prev, promptModules: \[\.\.\.\(prev\.promptModules \|\| \[\]\), \{id: Math\.random\(\)\.toString\(36\)\.substring\(7\), documentType: 'Novo Documento', description: '', promptInstructions: '', isActive: true\}\]\}\)\);/g, "setContext(prev => ({...prev, promptModules: enforceModuleOrder([...(prev.promptModules || []), {id: Math.random().toString(36).substring(7), documentType: 'Novo Documento', description: '', promptInstructions: '', isActive: true}])}));");

fs.writeFileSync('App.tsx', code);
console.log('App.tsx enforce module order patched');
