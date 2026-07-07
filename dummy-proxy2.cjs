const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
app.use('/api/genai', createProxyMiddleware({
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    pathRewrite: (path, req) => {
      let newPath = path.replace('^/api/genai', '').replace('/api/genai', '');
      newPath = newPath.replace(/([?&])key=[^&]+(&|$)/, (match, p1, p2) => {
          return p1 === '?' && p2 === '' ? '' : (p1 === '?' ? '?' : (p2 === '' ? '' : '&'));
      });
      return newPath;
    },
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader('x-goog-api-key', process.env.GEMINI_API_KEY);
      }
    }
}));
app.listen(3002, () => console.log('Dummy proxy 2 on 3002'));
