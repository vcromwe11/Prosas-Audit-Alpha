const fs = require('fs');
let code = fs.readFileSync('services/promptModules.ts', 'utf8');

const newFunction = `export async function generatePromptModulesFromRegulation(
    regulationText: string, 
    availableModules: Omit<DocumentPromptModule, 'id'>[]
): Promise<{
    updatedModules: Omit<DocumentPromptModule, 'id'>[];
    referenceDate: string | null;
}> {
    const ai = new GoogleGenAI({ apiKey: 'proxy', httpOptions: { baseUrl: window.location.origin + '/api/genai' } });
    
    // Simplificando o envio dos módulos atuais para a IA ler as instruções
    const availableModulesJson = JSON.stringify(availableModules.map(m => ({
        documentType: m.documentType,
        description: m.description,
        promptInstructions: m.promptInstructions
    })));

    const prompt = \`Você é um especialista em análise de editais e regulamentos.
Leia o trecho do edital/regulamento abaixo e identifique QUAIS documentos são exigidos para a inscrição ou qualificação da instituição/projeto.

Temos os seguintes Módulos de Prompt disponíveis (com suas instruções padrão):
\${availableModulesJson}

Sua tarefa:
1. Identifique quais documentos são exigidos no edital.
2. Para cada documento exigido:
   a) Se houver um Módulo correspondente na lista, USE-O.
   b) Adapte as "promptInstructions" do módulo incorporando as regras, exigências e peculiaridades ESPECÍFICAS mencionadas neste edital (ex: prazos de validade específicos, cláusulas obrigatórias).
   c) Se o edital exigir um documento que NÃO está na lista, CRIE um novo módulo para ele com "documentType", "description" e "promptInstructions" adequados para analisá-lo.
3. Procure no texto do edital a "Data de Referência" que baliza a validade dos documentos. A regra é: **Sempre procure o ÚLTIMO DIA DE INSCRIÇÃO do edital**. Se encontrar o prazo limite de inscrições, retorne-o no formato "AAAA-MM-DD". Se não encontrar, retorne null.
4. Mantenha os módulos orquestradores essenciais como "Orquestrador da Esteira", mesmo que não citados diretamente, pois são necessários para cruzamento de dados.

Regulamento:
"""\${regulationText}"""

Retorne EXCLUSIVAMENTE um objeto JSON no formato abaixo, sem formatação markdown ou texto extra:
{
  "updatedModules": [
    {
      "documentType": "Cartão CNPJ",
      "description": "...",
      "promptInstructions": "...",
      "isActive": true
    }
  ],
  "referenceDate": "2024-12-31"
}\`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview', // Using Pro for better instruction adjustment
            contents: prompt,
            config: {
                temperature: 0.2,
                responseMimeType: "application/json",
            }
        });

        const text = response.text || "{}";
        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch(e) {
            const jsonMatch = text.match(/\`\`\`json\\n([\\s\\S]*?)\\n\`\`\`/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[1]);
            } else {
                parsed = { updatedModules: [], referenceDate: null };
            }
        }

        return {
            updatedModules: parsed.updatedModules || [],
            referenceDate: parsed.referenceDate || null
        };
    } catch (e) {
        console.error("Error detecting prompt modules:", e);
        return { updatedModules: [], referenceDate: null };
    }
}`;

const startRegex = /export async function generatePromptModulesFromRegulation\([\s\S]*?\}\n\}\n/;
code = code.replace(startRegex, newFunction);

fs.writeFileSync('services/promptModules.ts', code);
console.log('promptModules.ts patched');
