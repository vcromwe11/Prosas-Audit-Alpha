const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

const regexReg = /<button onClick=\{\(\) => \{ setPdfTarget\('regulation'\); pdfInputRef\.current\?\.click\(\); \}\} className=\{(.*?)\}>\s*Upload Local\s*<\/button>/g;
code = code.replace(regexReg, (match, className) => {
    return `<label className={${className}} style={{ cursor: 'pointer' }}>
                                        Upload Local
                                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleContextUpload(e, 'regulation')} />
                                    </label>`;
});

const regexForm = /<button onClick=\{\(\) => \{ setPdfTarget\('form'\); pdfInputRef\.current\?\.click\(\); \}\} className=\{(.*?)\}>\s*Upload Local\s*<\/button>/g;
code = code.replace(regexForm, (match, className) => {
    return `<label className={${className}} style={{ cursor: 'pointer' }}>
                                      Upload Local
                                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleContextUpload(e, 'form')} />
                                  </label>`;
});

const regexMisc = /<button onClick=\{\(\) => \{ setPdfTarget\('misc'\); pdfInputRef\.current\?\.click\(\); \}\} className=\{(.*?)\}>\s*Upload Local\s*<\/button>/g;
code = code.replace(regexMisc, (match, className) => {
    return `<label className={${className}} style={{ cursor: 'pointer' }}>
                                      Upload Local
                                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleContextUpload(e, 'misc')} />
                                  </label>`;
});

fs.writeFileSync('App.tsx', code);
console.log('App.tsx file inputs fixed');
