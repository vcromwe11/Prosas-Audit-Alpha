const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /console\.log\("Proxying to:", proxyReq\.path\);/,
    `console.log("Proxying to:", proxyReq.path);
        console.log("Has API key?", !!process.env.GEMINI_API_KEY);`
);

fs.writeFileSync('server.ts', code);
