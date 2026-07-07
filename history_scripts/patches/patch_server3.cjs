const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /on: \{\n\s*proxyReq: \(proxyReq\) => \{/,
    `on: {
      proxyReq: (proxyReq) => {
        console.log("Proxying to:", proxyReq.path);`
);

fs.writeFileSync('server.ts', code);
console.log('server.ts patched');
