import { GoogleGenAI } from '@google/genai';
import http from 'http';
http.createServer((req, res) => { console.log("Stream URL:", req.url); console.log("Headers:", req.headers); process.exit(); }).listen(3017);
const ai = new GoogleGenAI({ apiKey: 'proxy', httpOptions: { baseUrl: 'http://localhost:3017' }});
ai.models.generateContentStream({ model: 'gemini-2.5-flash', contents: 'Hello' }).catch(e => {});
