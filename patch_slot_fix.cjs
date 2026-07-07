const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  "import('uuid').then(({ v4: uuidv4 }) => {",
  ""
);

code = code.replace(
  "slotId: uuidv4(),",
  "slotId: Math.random().toString(36).substring(7),"
);

code = code.replace(
  "        status: 'pending'\n        }]);\n    });",
  "        status: 'pending'\n        }]);"
);

fs.writeFileSync('App.tsx', code);
