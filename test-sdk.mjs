import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: 'proxy', httpOptions: { baseUrl: 'http://localhost:3000/api/genai' }});
ai.models.generateContent({ model: 'gemini-1.5-flash', contents: 'Hello' }).catch(e => console.log(e.message));
