const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const regex = /const handleDetectModules = async \(\) => \{[\s\S]*?\}\s*\}\n/;
const match = code.match(regex);
console.log(match ? "Found match" : "No match found");
