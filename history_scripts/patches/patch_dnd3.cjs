const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const regex1 = /<div key=\{mod\.id\} onClick=\{\(\) => setExpandedModuleId\(mod\.id\)\} className="cursor-pointer (.*?)"(>)/;
code = code.replace(regex1, (match, className, bracket) => {
    return `<div key={mod.id} 
              onClick={() => setExpandedModuleId(mod.id)} 
              draggable={mod.documentType.trim().toLowerCase() !== 'orquestrador da esteira' && mod.documentType.trim().toLowerCase() !== 'cartão cnpj'}
              onDragStart={() => setDraggedModuleIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleModuleDrop(e, idx)}
              className="cursor-pointer ${className} \${draggedModuleIdx === idx ? 'opacity-50' : ''}"${bracket}`;
});

const regex2 = /<div key=\{mod\.id\} className=\{(.*?)\}(>)/;
code = code.replace(regex2, (match, classCode, bracket) => {
    return `<div key={mod.id} 
              draggable={mod.documentType.trim().toLowerCase() !== 'orquestrador da esteira' && mod.documentType.trim().toLowerCase() !== 'cartão cnpj'}
              onDragStart={() => setDraggedModuleIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleModuleDrop(e, idx)}
              className={${classCode} + (draggedModuleIdx === idx ? ' opacity-50 scale-[0.98]' : '')}${bracket}`;
});

fs.writeFileSync('App.tsx', code);
console.log('App.tsx draggable patched');
