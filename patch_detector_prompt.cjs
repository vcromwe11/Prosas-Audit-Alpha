const fs = require('fs');
let code = fs.readFileSync('prompts.ts', 'utf8');

const newDetector = `    OPTIMIZED_AI_MODULE_DETECTOR: \`Você é um especialista em análise de editais e regulamentos.
Leia o trecho do edital/regulamento abaixo e identifique QUAIS documentos são exigidos para a inscrição ou qualificação da instituição/projeto.

Temos os seguintes Módulos de Prompt disponíveis (com suas instruções padrão):
{{availableModulesJson}}

Sua tarefa:
1. Identifique quais documentos são exigidos no edital.
2. Para cada documento exigido:
   a) Se houver um Módulo correspondente na lista, USE-O.
   b) Adapte as "promptInstructions" do módulo incorporando as regras, exigências e peculiaridades ESPECÍFICAS mencionadas neste edital (ex: prazos de validade específicos, cláusulas obrigatórias).
   c) IMPORTANTE: Em TODO "promptInstructions" (seja atualizado ou criado do zero), adicione OBRIGATORIAMENTE uma instrução explícita para que a IA extraia na EVIDÊNCIA a TITULARIDADE (Nome da Empresa e/ou CNPJ a que o documento pertence), além do seu status de validade. É vital garantir que o documento pertença à organização candidata.
   d) Se o edital exigir um documento que NÃO está na lista, CRIE um novo módulo para ele com "documentType", "description" e "promptInstructions" adequados (incluindo a regra de extrair titularidade obrigatoriamente).
3. Procure no texto do edital a "Data de Referência" que baliza a validade dos documentos. A regra é: **Sempre procure o ÚLTIMO DIA DE INSCRIÇÃO do edital**. Se encontrar o prazo limite de inscrições, retorne-o no formato "AAAA-MM-DD". Se não encontrar, retorne null.
4. Mantenha os módulos orquestradores essenciais como "Orquestrador da Esteira", mesmo que não citados diretamente, pois são necessários para cruzamento de dados de titularidade.

Regulamento:
"""
{{regulationText}}
"""

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
}\``;

code = code.replace(/    OPTIMIZED_AI_MODULE_DETECTOR: `[\s\S]*?`/, newDetector);

fs.writeFileSync('prompts.ts', code);
