const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
    /\{isOtimizada && !isPromptVisible && \(\n\s*<button onClick=\{\(\) => setIsPromptVisible\(true\)\} className="w-full py-3 mb-4 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors font-bold"><i className="fas fa-plus mr-2"><\/i>Adicionar Instruções Globais Adicionais<\/button>\n\s*\)\}\n\s*\{isOtimizada && \(\n\s*<div className="mb-4 p-4 bg-blue-50/g,
    `{isOtimizada && (
                                <div className="mb-4 p-4 bg-blue-50`
);

fs.writeFileSync('App.tsx', code);
console.log('App.tsx reverted collapse');
