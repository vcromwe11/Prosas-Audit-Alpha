const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// I will add a state for the global prompt toggle if it's IA_OTIMIZADA.
// But maybe it's simpler to just render a button to expand it.

// Let's replace the textarea area
code = code.replace(
    /\{isOtimizada && \(\s*<div className="mb-4 p-4 bg-blue-50/g,
    `{isOtimizada && !isPromptVisible && (
        <button onClick={() => setIsPromptVisible(true)} className="w-full py-3 mb-4 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors font-bold"><i className="fas fa-plus mr-2"></i>Adicionar Instruções Globais Adicionais</button>
    )}
    {isOtimizada && (
        <div className="mb-4 p-4 bg-blue-50`
);

fs.writeFileSync('App.tsx', code);
