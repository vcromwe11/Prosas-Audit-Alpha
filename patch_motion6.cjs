const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(/transition-all duration-300 \$\{isExpanded \? 'h-\[32rem\]' : 'h-24'\}/g, "${isExpanded ? 'h-[32rem]' : 'h-24'}");
code = code.replace(/<textarea/, '<motion.textarea layout="position"');
code = code.replace(/<\/textarea>/, '</motion.textarea>');

fs.writeFileSync('App.tsx', code);
console.log('App.tsx textarea patched');
