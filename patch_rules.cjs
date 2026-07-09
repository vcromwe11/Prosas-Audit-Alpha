const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
`    // AI Usage logs
    match /ai_usage_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }`,
`    // AI Usage logs
    match /ai_usage_logs/{logId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }`
);

fs.writeFileSync('firestore.rules', code);
