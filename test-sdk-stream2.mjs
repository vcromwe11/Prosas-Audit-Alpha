import { GoogleGenAI } from '@google/genai';
import http from 'http';
http.createServer((req, res) => { console.log("Stream URL:", req.url); process.exit(); }).listen(3016);
const ai = new GoogleGenAI({ apiKey: 'proxy', httpOptions: { baseUrl: 'http://localhost:3016' }});
ai.models.generateContentStream({ model: 'gemini-2.5-flash', contents: 'Hello' }).catch(e => {});
