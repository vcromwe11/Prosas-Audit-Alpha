const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

const regex = /<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className=\{expandedModuleId \?/m;
const replaceWith = `</button>
                               </div>
                           </div>
                           </div>
                           <div className={expandedModuleId ?`;

if (regex.test(code)) {
    code = code.replace(regex, replaceWith);
    fs.writeFileSync('App.tsx', code);
    console.log('App.tsx divs FINALLY fixed');
} else {
    console.log('Regex did not match!');
    console.log(code.match(/<\/button>[\s\S]{0,100}expandedModuleId/));
}
