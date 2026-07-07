const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
app.use('/api/genai', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: { '^/api/genai': '' },
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader('x-goog-api-key', 'MY_SECRET_KEY');
        if (proxyReq.path && proxyReq.path.includes('key=')) {
            proxyReq.path = proxyReq.path.replace(/([?&])key=[^&]+(&|$)/, (match, p1, p2) => {
                return p1 === '?' && p2 === '' ? '' : (p1 === '?' ? '?' : (p2 === '' ? '' : '&'));
            });
        }
      }
    }
}));
app.listen(3002, () => console.log('Dummy proxy on 3002'));
