const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `<Tooltip text="Adiciona um novo slot vazio para analisar os documentos de outro candidato" enabled={appSettings.showTooltips} position="top">`;
const replacement1 = `
                         <button 
                           onClick={() => {
                               candidates.forEach(c => {
                                   if (c.status === 'pending' && c.files.length > 0) {
                                       triggerAnalysis(c.slotId, false);
                                   }
                               });
                           }}
                           className="px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition-all duration-200 transform active:scale-95 bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                         >
                             <i className="fas fa-play"></i> Analisar Todos
                         </button>
                         <Tooltip text="Adiciona um novo slot vazio para analisar os documentos de outro candidato" enabled={appSettings.showTooltips} position="top">`;

if (code.includes('Tooltip text="Adiciona um novo slot vazio')) {
    code = code.replace(target1, replacement1);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched App.tsx Analisar Todos successfully");
} else {
    console.log("Could not find target in App.tsx for Analisar Todos");
}
