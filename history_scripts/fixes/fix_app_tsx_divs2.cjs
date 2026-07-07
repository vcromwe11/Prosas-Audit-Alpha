const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

const searchStr = `                                   </button>
                               </div>
                           </div>
                       </div>
                            <div className={expandedModuleId ?`;

const replaceStr = `                                   </button>
                               </div>
                           </div>
                            <div className={expandedModuleId ?`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('App.tsx', code);
console.log('App.tsx divs fixed again');
