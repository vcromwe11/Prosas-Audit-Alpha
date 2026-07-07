import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from 'http-proxy-middleware';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // The `@google/genai` sdk sends a POST request with the body
  app.use(['/v1beta', '/v1alpha'], createProxyMiddleware({
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    pathRewrite: (path, req) => {
      let newPath = req.originalUrl;
      newPath = newPath.replace(/([?&])key=[^&]+(&|$)/, (match, p1, p2) => {
          return p1 === '?' && p2 === '' ? '' : (p1 === '?' ? '?' : (p2 === '' ? '' : '&'));
      });
      return newPath;
    },
    on: {
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
    }
  }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Using express version 4, wildcard is *
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
