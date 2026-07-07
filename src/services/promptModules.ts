
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { DocumentPromptModule } from '../types';
import { GoogleGenAI } from '@google/genai';
import { getGlobalPrompt } from './storageService';
import { PROMPTS } from '../prompts';

const getAiModel = () => {
    try {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('prosas_app_settings');
            if (stored) {
                const settings = JSON.parse(stored);
                if (settings.aiModel) { if (settings.aiModel === 'gemini-3.5-flash') return 'gemini-2.5-flash'; return settings.aiModel; }
            }
        }
    } catch (e) {}
    return 'gemini-2.5-flash'; // Fallback
};


export const FALLBACK_PROMPT_MODULE_TEMPLATES: Omit<DocumentPromptModule, 'id'>[] = [
  {
    documentType: 'Cartão CNPJ',
    description: 'Validação de Cartão CNPJ (Receita Federal)',
    promptInstructions: 'Avalie o Cartão CNPJ:\n1. Localize o campo "SITUAÇÃO CADASTRAL". Se for diferente de "ATIVA", o documento está REPROVADO.\n2. Localize a "DATA DE EMISSÃO".\n3. OBRIGATÓRIO NA EVIDÊNCIA: Você DEVE incluir na evidência extraída o NOME DA EMPRESA (Razão Social), o número do CNPJ, a SITUAÇÃO CADASTRAL exata e a DATA DE EMISSÃO encontrados. Sem isso, a análise é inválida.\n4. Extraia a "RAZÃO SOCIAL" e o "CNPJ" para o cruzamento de dados organizacional.',
    isActive: false
  },
  {
    documentType: 'CND Federal (Tributos e Dívida Ativa)',
    description: 'Certidão Negativa de Débitos (Receita Federal e PGFN)',
    promptInstructions: 'Avalie a CND Federal (RFB/PGFN):\n1. Validade: Localize o campo "VÁLIDA ATÉ [DATA]". Se a Data Atual de Referência for POSTERIOR à data de validade, o status é REPROVADO.\n2. Tipo: Verifique se atesta débitos "NEGATIVOS" ou "POSITIVOS COM EFEITOS DE NEGATIVA". Se for "POSITIVA" pura, REPROVE.\n3. OBRIGATÓRIO NA EVIDÊNCIA: Você DEVE incluir na evidência extraída a frase exata que atesta o tipo da certidão (ex: "Certidão Negativa" ou "Positiva com efeitos de Negativa"), o CNPJ e o NOME da instituição para o qual foi emitida, e a DATA DE VALIDADE.\n4. Órgão: Confirme se o texto cita a Receita Federal e a PGFN.',
    isActive: false
  },
  {
    documentType: 'CRF FGTS (Caixa Econômica)',
    description: 'Certificado de Regularidade do FGTS',
    promptInstructions: 'Avalie a regularidade do CRF (FGTS):\n1. Regularidade: Procure pela frase que atesta a regularidade do empregador perante o FGTS. Se indicar irregularidade ou suspensão, REPROVE.\n2. Validade: Localize a data de validade (ex: "Válido de ... a ..."). Se a Data Atual de Referência ultrapassar a data final, REPROVE por expiração.\n3. OBRIGATÓRIO NA EVIDÊNCIA: A evidência deve conter o NOME da empresa/CNPJ presente no documento, o STATUS de regularidade e a VALIDADE.',
    isActive: false
  },
  {
    documentType: 'CNDT Trabalhista (TST)',
    description: 'Certidão Negativa de Débitos Trabalhistas',
    promptInstructions: 'Avalie a CNDT (Tribunal Superior do Trabalho):\n1. Status BNDT: Verifique se a certidão informa que a empresa "NÃO CONSTA" como devedora. Se constar como "POSITIVA", REPROVE.\n2. Validade: Localize a data de validade da certidão. Se a Data Atual de Referência ultrapassar esse limite, REPROVE.\n3. OBRIGATÓRIO NA EVIDÊNCIA: Transcreva na evidência a indicação exata de negatividade (ex: "NÃO CONSTA como devedora"), o NOME/CNPJ validado e a DATA DE VALIDADE.',
    isActive: false
  },
  {
    documentType: 'Estatuto Social',
    description: 'Verifica objetivos sociais e ausência de fins lucrativos.',
    promptInstructions: 'Avalie o Estatuto Social:\n1. Verifique se o objeto social da instituição possui relação com as atividades propostas no edital.\n2. Confirme se há cláusula expressa de que a entidade não possui fins lucrativos.\n3. OBRIGATÓRIO NA EVIDÊNCIA: Inclua o trecho exato que define os objetivos sociais e o trecho que atesta ser "Sem fins lucrativos", além do Nome da Instituição identificado no topo do documento.',
    isActive: false
  },
  {
    documentType: 'Ata de Eleição',
    description: 'Valida a diretoria vigente.',
    promptInstructions: 'Avalie a Ata de Eleição da Diretoria:\n1. Verifique se o mandato da diretoria atual está vigente.\n2. Identifique o representante legal responsável.\n3. OBRIGATÓRIO NA EVIDÊNCIA: Inclua os nomes dos eleitos (representantes legais), o período do mandato (datas) e a assinatura ou registro que confere validade ao documento.',
    isActive: false
  },
  {
    documentType: 'Orquestrador da Esteira',
    description: 'Regra Global de Cruzamento de Dados',
    promptInstructions: 'Execute as seguintes validações globais como orquestrador da esteira:\n1. Verifique se o "CNPJ" extraído em todos os módulos mapeados é exatamente idêntico. Se houver divergência entre matriz/filial ou empresas completamente distintas, a orquestração deve falhar e o status geral é REPROVADO.\n2. Verifique se a "Razão Social" possui correspondência aceitável (similaridade acima de 90%) em todos os documentos.\n3. Se qualquer um dos documentos anteriores for avaliado como "REPROVADO", o parecer final deverá obrigatoriamente ser REPROVADO.\n4. OBRIGATÓRIO NA EVIDÊNCIA: Na sua justificativa geral, mencione explicitamente se todos os CNPJs e nomes cruzados bateram perfeitamente.',
    isActive: true
  }
];

export async function fetchGlobalPromptModules(): Promise<Omit<DocumentPromptModule, 'id'>[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'prompt_modules'));
    if (!querySnapshot.empty) {
      const dbModules: Omit<DocumentPromptModule, 'id'>[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        dbModules.push({
          documentType: data.documentType,
          description: data.description || '',
          promptInstructions: data.promptInstructions || '',
          isActive: data.isActive !== undefined ? data.isActive : false
        });
      });
      // Merge with FALLBACK_PROMPT_MODULE_TEMPLATES for any that aren't in database yet
      const merged = [...dbModules];
      FALLBACK_PROMPT_MODULE_TEMPLATES.forEach(fallback => {
        const alreadyExists = merged.some(m => m.documentType.toLowerCase() === fallback.documentType.toLowerCase());
        if (!alreadyExists) {
          merged.push(fallback);
        }
      });
      return merged;
    }
  } catch (error) {
    console.error("Error fetching global prompt modules from db:", error);
  }
  return FALLBACK_PROMPT_MODULE_TEMPLATES;
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
    updatedModules: Omit<DocumentPromptModule, 'id'>[];
    referenceDate: string | null;
}> {
    const ai = new GoogleGenAI({ apiKey: 'proxy', httpOptions: { baseUrl: window.location.origin } });
    
    // Simplificando o envio dos módulos atuais para a IA ler as instruções
    const availableModulesJson = JSON.stringify(availableModules.map(m => ({
        documentType: m.documentType,
        description: m.description,
        promptInstructions: m.promptInstructions
    })));

    
    const basePrompt = await getGlobalPrompt('OPTIMIZED_AI_MODULE_DETECTOR', PROMPTS.OPTIMIZED_AI_MODULE_DETECTOR);
    const prompt = basePrompt
        .replace('{{availableModulesJson}}', availableModulesJson)
        .replace('{{regulationText}}', regulationText);


    try {
        const response = await ai.models.generateContent({
            model: getAiModel(), // Using Pro for better instruction adjustment
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
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
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
}