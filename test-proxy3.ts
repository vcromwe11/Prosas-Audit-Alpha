import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: 'proxy', httpOptions: { baseUrl: 'http://localhost:3000/api/genai' } });

async function test() {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Hello',
    });
    console.log(response.text);
  } catch (e) {
    console.log("Error:", e.message);
  }
}
test();
