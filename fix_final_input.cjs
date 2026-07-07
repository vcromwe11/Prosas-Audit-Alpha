const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const strToReplace = `<div className="max-w-[1600px] mx-auto pb-10">`;

const inputElement = `<input 
        type="file" 
        className="hidden" 
        ref={pdfInputRef} 
        accept=".pdf,.doc,.docx,.txt" 
        onChange={(e) => {
            if (pdfTarget) handleContextUpload(e, pdfTarget);
        }} 
      />`;

code = code.replace(strToReplace, strToReplace + '\\n      ' + inputElement);
fs.writeFileSync('App.tsx', code);
console.log('App.tsx input added');
