export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  // Remove the /api/genai prefix
  let path = url.pathname.replace(/\/api\/genai/g, '');
  if (!path.startsWith('/')) path = '/' + path;

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing API Key");
    return new Response(JSON.stringify({ error: "Missing API_KEY environment variable" }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
    });
  }

  const targetUrl = `https://generativelanguage.googleapis.com${path}${url.search}`;
  
  const headers = new Headers(req.headers);
  headers.set('x-goog-api-key', apiKey);
  headers.delete('host');
  headers.delete('connection');

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    });
    
    // Return the response, streaming it back to the client
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
    });
  }
}
