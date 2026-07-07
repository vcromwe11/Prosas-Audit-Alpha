const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
    /    \}\n  \}\n\}/,
    `    }\n    // AI Audits Cache\n    match /ai_audits_cache/{cacheId} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}`
);

fs.writeFileSync('firestore.rules', code);
