const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    on: {
      proxyReq: (proxyReq) => {
        // Add the API key securely
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
          proxyReq.setHeader('x-goog-api-key', apiKey);
        }
      }
    }`;

const replacement = `    on: {
      proxyReq: (proxyReq) => {
        // Add the API key securely
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
          proxyReq.setHeader('x-goog-api-key', apiKey);
        }
        console.log("Proxying request to:", proxyReq.path);
      },
      proxyRes: (proxyRes, req, res) => {
        console.log("Proxy response status:", proxyRes.statusCode);
      },
      error: (err, req, res) => {
        console.error("Proxy error:", err);
      }
    }`;

if (code.includes('proxyReq: (proxyReq) => {')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Patched server.ts successfully");
} else {
    console.log("Could not find target");
}
