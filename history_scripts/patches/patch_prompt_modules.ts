import fs from 'fs';

let content = fs.readFileSync('services/promptModules.ts', 'utf8');

const newCode = `
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { DocumentPromptModule } from '../types';
import { GoogleGenAI } from '@google/genai';

export const FALLBACK_PROMPT_MODULE_TEMPLATES: Omit<DocumentPromptModule, 'id'>[] = [
  {
    documentType: 'Estatuto Social',
    description: 'Verifica objetivos sociais e ausência de fins lucrativos.',
    promptInstructions: 'Avalie o Estatuto Social:\\n1. Verifique se o objeto social da instituição possui relação com as atividades propostas no edital.\\n2. Confirme se há cláusula expressa de que a entidade não possui fins lucrativos.',
    isActive: false
  },
  {
    documentType: 'Ata de Eleição',
    description: 'Valida a diretoria vigente.',
    promptInstructions: 'Avalie a Ata de Eleição da Diretoria:\\n1. Verifique se o mandato da diretoria atual está vigente (dentro do prazo).\\n2. Identifique o representante legal responsável pela assinatura dos documentos.',
    isActive: false
  },
  {
    documentType: 'Comprovante de Endereço',
    description: 'Valida a sede da instituição.',
    promptInstructions: 'Avalie o Comprovante de Endereço:\\n1. Verifique se está em nome da instituição (mesmo CNPJ ou Razão Social).\\n2. Confirme se a data de emissão é de no máximo 3 meses anteriores à data de referência.',
    isActive: false
  },
  {
    documentType: 'Relatório de Atividades',
    description: 'Analisa o histórico e capacidade técnica.',
    promptInstructions: 'Avalie o Relatório de Atividades:\\n1. Verifique se comprova a atuação da entidade na área do projeto.\\n2. Busque indícios de experiência prévia compatível com o porte do projeto proposto.',
    isActive: false
  }
];

export async function fetchGlobalPromptModules(): Promise<Omit<DocumentPromptModule, 'id'>[]> {
  try {
    const q = collection(db, 'prompt_modules');
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return FALLBACK_PROMPT_MODULE_TEMPLATES;
    }
    const modules: Omit<DocumentPromptModule, 'id'>[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      modules.push({
        documentType: data.documentType,
        description: data.description,
        promptInstructions: data.promptInstructions,
        isActive: false
      });
    });
    return modules;
  } catch (error) {
    console.error("Error fetching prompt modules:", error);
    return FALLBACK_PROMPT_MODULE_TEMPLATES;
  }
}

export async function saveGlobalPromptModule(module: Omit<DocumentPromptModule, 'id'>, userEmail: string): Promise<void> {
  try {
    // using documentType as an ID (slugified)
    const id = module.documentType.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const docRef = doc(db, 'prompt_modules', id);
    await setDoc(docRef, {
      id: id,
      documentType: module.documentType,
      description: module.description || '',
      promptInstructions: module.promptInstructions || '',
      updatedBy: userEmail,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error saving prompt module:", error);
    throw error;
  }
}

export async function generatePromptModulesFromRegulation(
    regulationText: string, 
    availableModules: Omit<DocumentPromptModule, 'id'>[]
): Promise<{
    selectedModuleTypes: string[];
    missingDocumentTypes: string[];
}> {
    const ai = new GoogleGenAI({ apiKey: 'proxy', httpOptions: { baseUrl: window.location.origin + '/api/genai' } });
    
    const availableModulesJson = JSON.stringify(availableModules.map(m => m.documentType));

    const prompt = \`
Você é um especialista em análise de editais e regulamentos.
Leia o trecho do edital/regulamento abaixo e identifique QUAIS documentos são exigidos para a inscrição ou qualificação da instituição/projeto.

Temos os seguintes Módulos de Prompt disponíveis (cada um responsável por analisar um documento):
\${availableModulesJson}

Sua tarefa:
1. Liste quais documentos são exigidos no edital.
2. Desses documentos exigidos, cruze com a nossa lista de Módulos disponíveis.
3. Se um documento exigido possuir um Módulo correspondente, adicione-o à lista "selectedModuleTypes".
4. Se um documento exigido NÃO possuir um Módulo correspondente (ou seja, nós não temos instrução pronta para ele), adicione-o à lista "missingDocumentTypes" com um nome claro e descritivo.

Regulamento:
"""
\${regulationText}
"""

Retorne EXCLUSIVAMENTE um objeto JSON no formato abaixo, sem formatação markdown ou texto extra:
{
  "selectedModuleTypes": ["Estatuto Social", "Ata de Eleição"],
  "missingDocumentTypes": ["Certidão Negativa de Débitos", "Comprovante de Conta Bancária"]
}
\`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                parsed = { selectedModuleTypes: [], missingDocumentTypes: [] };
            }
        }

        return {
            selectedModuleTypes: parsed.selectedModuleTypes || [],
            missingDocumentTypes: parsed.missingDocumentTypes || []
        };
    } catch (e) {
        console.error("Error detecting prompt modules:", e);
        return { selectedModuleTypes: [], missingDocumentTypes: [] };
    }
}
`;

fs.writeFileSync('services/promptModules.ts', newCode);
console.log('updated promptModules.ts');
