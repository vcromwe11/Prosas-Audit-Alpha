const { execSync } = require('child_process');
const apiKey = process.env.GEMINI_API_KEY;
const cmd = `curl -s -X POST -H "Content-Type: application/json" -H "x-goog-api-key: ${apiKey}" -d '{"contents":[{"role":"user","parts":[{"text":"Hello"}]}]}' https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
console.log(execSync(cmd).toString().slice(0, 100));
