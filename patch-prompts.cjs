const fs = require('fs');
let code = fs.readFileSync('src/prompts.ts', 'utf8');

const target = `1. Retorne um mapeamento indicando qual arquivo (nome exato) corresponde a qual Módulo de Documento.
2. Um arquivo pode corresponder a múltiplos módulos se contiver vários documentos agrupados.
3. Se um arquivo não se encaixar em nenhum dos módulos ativos, ignore-o e NÃO o associe.
4. Responda ESTRITAMENTE em formato JSON:`;

const replacement = `1. Retorne um mapeamento indicando qual arquivo (nome exato) corresponde a qual Módulo de Documento.
2. Um arquivo pode corresponder a múltiplos módulos se contiver vários documentos agrupados.
3. Se um módulo representar um processo interno da IA, orquestração, ou regra global de cruzamento de dados (ou seja, não é um documento que o candidato envia, mas sim uma regra lógica), você DEVE mapear TODOS os arquivos do candidato para este módulo para que a IA possa realizar o cruzamento.
4. Se um arquivo não se encaixar em nenhum dos módulos ativos (e não for necessário para os módulos globais), ignore-o.
5. Responda ESTRITAMENTE em formato JSON:`;

if (code.includes('1. Retorne um mapeamento indicando qual arquivo')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/prompts.ts', code);
    console.log("Patched src/prompts.ts successfully");
} else {
    console.log("Could not find target in src/prompts.ts");
}
