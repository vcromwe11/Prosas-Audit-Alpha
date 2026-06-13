import { PROMPTS } from "./prompts";

export const DEFAULT_DOCUMENT_CRITERIA = `
1. ATA DA ÚLTIMA ELEIÇÃO:
   - Verificar registro em cartório.
   - Verificar vigência do mandato.
   - Verificar consistência dos representantes legais.
   - REPROVAR se vencida ou sem registro.

2. RG E CPF DO RESPONSÁVEL LEGAL:
   - Obrigatório Frente e Verso.
   - Nome idêntico à Ata/Contrato.

3. DRE 2024:
   - Assinado por contador OU representante.
   - Negócios Sociais: Receita Bruta 2024 <= R$ 500k.

4. CND FEDERAL:
   - Validade: Emissão a partir de AGOSTO/2024.
   - Status: "Negativa" ou "Positiva com efeitos de Negativa".
   - REPROVAR se positiva ou antiga.

5. CARTÃO CNPJ:
   - Situação Cadastral: OBRIGATÓRIO SER "ATIVA".
   - Data da Situação Cadastral: Verificar data de atualização do status (Prioritário).
   - Emissão do documento: Máx 3 meses.
   - (Nota: Data de Abertura é secundária).

6. ERROS COMUNS (RESSALVAS/WARNING):
   - CNH no lugar de RG (Aceitar se tiver CPF).
   - Apenas um lado do RG (Aceitar se dados legíveis).
   - CND/CNPJ válidos mas antigos (>3 meses do edital) (WARNING).
`;

// System Instruction: Isola fortemente o contexto (Regras) dos dados (Arquivos)
export const SYSTEM_INSTRUCTION = (
    regulation: string, 
    formTemplate: string,
    miscFiles: string,
    criteria: string
) => {
    return PROMPTS.AUDIT_SYSTEM_INSTRUCTION
        .replace('{{regulation}}', regulation)
        .replace('{{formTemplate}}', formTemplate ? formTemplate : 'N/A')
        .replace('{{miscFiles}}', miscFiles ? miscFiles : 'N/A')
        .replace('{{criteria}}', criteria);
};

// User Prompt: Foca na estrutura de saída e na extração fiel
export const USER_TASK_PROMPT = PROMPTS.AUDIT_USER_TASK;
