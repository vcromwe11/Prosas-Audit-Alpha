import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from 'http-proxy-middleware';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // The `@google/genai` sdk sends a POST request with the body
  app.use('/api/genai', createProxyMiddleware({
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    pathRewrite: {
      '^/api/genai': '', // remove base path
    },
    on: {
      proxyReq: (proxyReq) => {
        // Add the API key securely
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (apiKey) {
          proxyReq.setHeader('x-goog-api-key', apiKey);
        } else {
          console.warn("WARNING: No API key found in server environment variables!");
        }
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
