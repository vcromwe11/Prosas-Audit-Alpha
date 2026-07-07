const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /import\('fs'\)\.then\(fs => fs\.writeFileSync\('key-log\.txt', 'Length: ' \+ \(process\.env\.GEMINI_API_KEY \|\| ''\)\.length \+ '\\n' \+ 'Key starts with: ' \+ \(process\.env\.GEMINI_API_KEY \|\| ''\)\.substring\(0, 5\)\);/,
    `import('fs').then(fs => fs.writeFileSync('key-log.txt', JSON.stringify({ 
        API_KEY: process.env.API_KEY || null, 
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || null 
    })));`
);

fs.writeFileSync('server.ts', code);
