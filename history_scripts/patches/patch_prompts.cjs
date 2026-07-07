const fs = require('fs');
let code = fs.readFileSync('prompts.ts', 'utf8');

const triagePrompt = `
    TRIAGE_DOCUMENTS: \`Você é um especialista em triagem de documentos (Inteligência Artificial).
Sua tarefa é analisar o texto extraído de todos os arquivos enviados por um candidato e relacionar cada arquivo (ou página) aos Módulos de Validação exigidos pelo edital.

Temos os seguintes Módulos de Validação ativos (o que precisamos encontrar):
{{activeModulesList}}

DOCUMENTOS ENVIADOS PELO CANDIDATO:
{{candidateDocuments}}

INSTRUÇÕES:
1. Para cada arquivo enviado, determine qual(is) Módulo(s) ele tenta atender.
2. Se um arquivo contiver múltiplas páginas e cada página for um documento diferente, relacione o arquivo ao módulo adequado, mas se possível especifique a página na sua lógica interna (para extração). Como você só pode retornar o nome do arquivo, retorne o nome do arquivo exato.
3. Se um arquivo for inútil, não contiver informações relevantes ou não se encaixar em NENHUM dos módulos ativos, NÃO o inclua no mapeamento para nenhum módulo. Ele será ignorado.
4. Um mesmo arquivo pode servir para múltiplos módulos se for um PDF consolidado.

Retorne EXCLUSIVAMENTE um objeto JSON no formato abaixo, sem formatação markdown ou texto extra:
{
  "documentMapping": {
    "ID_OU_NOME_DO_MODULO": ["nome_exato_do_arquivo_1.pdf", "nome_exato_do_arquivo_2.pdf"]
  }
}\`,
`;

code = code.replace(
    /OPTIMIZED_AI_MODULE_DETECTOR:/,
    triagePrompt + '\n    OPTIMIZED_AI_MODULE_DETECTOR:'
);

fs.writeFileSync('prompts.ts', code);
