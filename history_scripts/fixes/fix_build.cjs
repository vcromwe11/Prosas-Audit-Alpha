const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// The moveModule function needs to know about `context.promptModules`. 
// Because it uses `idx`, it's defined inside the component right? 
// Let's verify where it was defined.
