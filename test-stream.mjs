import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: 'proxy', httpOptions: { baseUrl: 'http://localhost:3000' }});
const doStream = async () => {
    try {
        const stream = await ai.models.generateContentStream({ model: 'gemini-2.5-flash', contents: 'Count from 1 to 5' });
        for await (const chunk of stream) {
            console.log(chunk.text);
        }
    } catch(e) {
        console.log(e);
    }
}
doStream();
