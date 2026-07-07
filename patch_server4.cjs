const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /app\.use\('\/api\/genai', createProxyMiddleware\(\{/,
    `app.use('/api/genai', (req, res, next) => {
    console.log("Original URL:", req.originalUrl);
    next();
  }, createProxyMiddleware({`
);

fs.writeFileSync('server.ts', code);
console.log('server.ts originalUrl logging added');
