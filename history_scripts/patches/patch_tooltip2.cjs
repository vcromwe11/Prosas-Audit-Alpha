const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
    /<h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">2\. Módulos Específicos por Documento<\/h2>/,
    `<div className="flex items-center">
                                           <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">2. Módulos Específicos por Documento</h2>
                                           <Tooltip text="Defina regras específicas para cada tipo de documento. A IA fará a triagem dos arquivos enviados pelos candidatos. Documentos que não se encaixarem em nenhum módulo serão DESCARTADOS e ignorados na análise, economizando processamento e evitando falsos positivos." enabled={appSettings.showTooltips} position="top">
                                               <i className="fas fa-info-circle text-gray-400 hover:text-emerald-500 cursor-help ml-2"></i>
                                           </Tooltip>
                                       </div>`
);

fs.writeFileSync('App.tsx', code);
console.log('App.tsx tooltip 2 patched');
