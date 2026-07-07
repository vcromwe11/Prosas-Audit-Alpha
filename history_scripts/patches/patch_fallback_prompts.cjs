const fs = require('fs');
let code = fs.readFileSync('services/promptModules.ts', 'utf8');

const newFallback = `export const FALLBACK_PROMPT_MODULE_TEMPLATES: Omit<DocumentPromptModule, 'id'>[] = [
  {
    documentType: 'Cartão CNPJ',
    description: 'Validação de Cartão CNPJ (Receita Federal)',
    promptInstructions: 'Avalie o Cartão CNPJ:\\n1. Localize o campo "SITUAÇÃO CADASTRAL". Se for diferente de "ATIVA", o documento está REPROVADO.\\n2. Localize a "DATA DE EMISSÃO".\\n3. OBRIGATÓRIO NA EVIDÊNCIA: Você DEVE incluir na evidência extraída o NOME DA EMPRESA (Razão Social), o número do CNPJ, a SITUAÇÃO CADASTRAL exata e a DATA DE EMISSÃO encontrados. Sem isso, a análise é inválida.\\n4. Extraia a "RAZÃO SOCIAL" e o "CNPJ" para o cruzamento de dados organizacional.',
    isActive: false
  },
  {
    documentType: 'CND Federal (Tributos e Dívida Ativa)',
    description: 'Certidão Negativa de Débitos (Receita Federal e PGFN)',
    promptInstructions: 'Avalie a CND Federal (RFB/PGFN):\\n1. Validade: Localize o campo "VÁLIDA ATÉ [DATA]". Se a Data Atual de Referência for POSTERIOR à data de validade, o status é REPROVADO.\\n2. Tipo: Verifique se atesta débitos "NEGATIVOS" ou "POSITIVOS COM EFEITOS DE NEGATIVA". Se for "POSITIVA" pura, REPROVE.\\n3. OBRIGATÓRIO NA EVIDÊNCIA: Você DEVE incluir na evidência extraída a frase exata que atesta o tipo da certidão (ex: "Certidão Negativa" ou "Positiva com efeitos de Negativa"), o CNPJ e o NOME da instituição para o qual foi emitida, e a DATA DE VALIDADE.\\n4. Órgão: Confirme se o texto cita a Receita Federal e a PGFN.',
    isActive: false
  },
  {
    documentType: 'CRF FGTS (Caixa Econômica)',
    description: 'Certificado de Regularidade do FGTS',
    promptInstructions: 'Avalie a regularidade do CRF (FGTS):\\n1. Regularidade: Procure pela frase que atesta a regularidade do empregador perante o FGTS. Se indicar irregularidade ou suspensão, REPROVE.\\n2. Validade: Localize a data de validade (ex: "Válido de ... a ..."). Se a Data Atual de Referência ultrapassar a data final, REPROVE por expiração.\\n3. OBRIGATÓRIO NA EVIDÊNCIA: A evidência deve conter o NOME da empresa/CNPJ presente no documento, o STATUS de regularidade e a VALIDADE.',
    isActive: false
  },
  {
    documentType: 'CNDT Trabalhista (TST)',
    description: 'Certidão Negativa de Débitos Trabalhistas',
    promptInstructions: 'Avalie a CNDT (Tribunal Superior do Trabalho):\\n1. Status BNDT: Verifique se a certidão informa que a empresa "NÃO CONSTA" como devedora. Se constar como "POSITIVA", REPROVE.\\n2. Validade: Localize a data de validade da certidão. Se a Data Atual de Referência ultrapassar esse limite, REPROVE.\\n3. OBRIGATÓRIO NA EVIDÊNCIA: Transcreva na evidência a indicação exata de negatividade (ex: "NÃO CONSTA como devedora"), o NOME/CNPJ validado e a DATA DE VALIDADE.',
    isActive: false
  },
  {
    documentType: 'Estatuto Social',
    description: 'Verifica objetivos sociais e ausência de fins lucrativos.',
    promptInstructions: 'Avalie o Estatuto Social:\\n1. Verifique se o objeto social da instituição possui relação com as atividades propostas no edital.\\n2. Confirme se há cláusula expressa de que a entidade não possui fins lucrativos.\\n3. OBRIGATÓRIO NA EVIDÊNCIA: Inclua o trecho exato que define os objetivos sociais e o trecho que atesta ser "Sem fins lucrativos", além do Nome da Instituição identificado no topo do documento.',
    isActive: false
  },
  {
    documentType: 'Ata de Eleição',
    description: 'Valida a diretoria vigente.',
    promptInstructions: 'Avalie a Ata de Eleição da Diretoria:\\n1. Verifique se o mandato da diretoria atual está vigente.\\n2. Identifique o representante legal responsável.\\n3. OBRIGATÓRIO NA EVIDÊNCIA: Inclua os nomes dos eleitos (representantes legais), o período do mandato (datas) e a assinatura ou registro que confere validade ao documento.',
    isActive: false
  },
  {
    documentType: 'Orquestrador da Esteira',
    description: 'Regra Global de Cruzamento de Dados',
    promptInstructions: 'Execute as seguintes validações globais como orquestrador da esteira:\\n1. Verifique se o "CNPJ" extraído em todos os módulos mapeados é exatamente idêntico. Se houver divergência entre matriz/filial ou empresas completamente distintas, a orquestração deve falhar e o status geral é REPROVADO.\\n2. Verifique se a "Razão Social" possui correspondência aceitável (similaridade acima de 90%) em todos os documentos.\\n3. Se qualquer um dos documentos anteriores for avaliado como "REPROVADO", o parecer final deverá obrigatoriamente ser REPROVADO.\\n4. OBRIGATÓRIO NA EVIDÊNCIA: Na sua justificativa geral, mencione explicitamente se todos os CNPJs e nomes cruzados bateram perfeitamente.',
    isActive: true
  }
];`;

code = code.replace(/export const FALLBACK_PROMPT_MODULE_TEMPLATES: Omit<DocumentPromptModule, 'id'>\[\] = \[\s*\{[\s\S]*\}\s*\];/, newFallback);

fs.writeFileSync('services/promptModules.ts', code);
