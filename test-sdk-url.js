const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'proxy', httpOptions: { baseUrl: 'http://localhost:3000/api/genai/' }});
console.log(ai.models.generateContent);
