const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

const searchStr = `                                   </button>
                               </div>`;

code = code.replace(searchStr, searchStr + '\n                           </div>\n                       </div>');
fs.writeFileSync('App.tsx', code);
console.log('App.tsx divs restored');
