const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'proxy', httpOptions: { baseUrl: 'http://localhost:3005' } });
ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'Hello' }).catch(e => console.log(e.message));
