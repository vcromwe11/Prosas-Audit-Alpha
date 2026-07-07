const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const strToReplace = `<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex print:block font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">`;

const inputElement = `
      <input 
        type="file" 
        className="hidden" 
        ref={pdfInputRef} 
        accept=".pdf,.doc,.docx,.txt" 
        onChange={(e) => {
            if (pdfTarget) handleContextUpload(e, pdfTarget as any);
        }} 
      />`;

code = code.replace(strToReplace, strToReplace + inputElement);
fs.writeFileSync('App.tsx', code);
console.log('App.tsx input added for real');
