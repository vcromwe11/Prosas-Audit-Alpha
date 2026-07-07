const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `          const parsed = JSON.parse(saved);`;
const replacement = `          const parsed = JSON.parse(saved);
          if (parsed.aiModel === 'gemini-3.5-flash' || parsed.aiModel === 'gemini-1.5-flash') {
              parsed.aiModel = 'gemini-2.5-flash';
              localStorage.setItem('prosas_app_settings', JSON.stringify(parsed));
          }`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched App.tsx successfully");
} else {
    console.log("Could not find target");
}
