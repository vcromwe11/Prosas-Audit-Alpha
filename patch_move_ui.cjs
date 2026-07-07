const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const regex = /<div className="flex justify-between items-start mb-2">\s*<div className="flex-1">/;
const replaceStr = `<div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col gap-1 mr-3 mt-1 justify-center items-center text-gray-400">
                                                <button onClick={() => moveModule(idx, 'up')} disabled={idx === 0} className="hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"><i className="fas fa-chevron-up"></i></button>
                                                <button onClick={() => moveModule(idx, 'down')} disabled={idx === (context.promptModules || []).length - 1} className="hover:text-emerald-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"><i className="fas fa-chevron-down"></i></button>
                                            </div>
                                            <div className="flex-1">`;

code = code.replace(regex, replaceStr);
fs.writeFileSync('App.tsx', code);
console.log('App.tsx UI patched');
