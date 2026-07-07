const fs = require('fs');
let code = fs.readFileSync('src/services/geminiService.ts', 'utf8');

const target = `Se não houver documento, repita "NENHUM DOCUMENTO ENCONTRADO" no campo de evidência e reprove o ponto.`;
const replacement = `Se este módulo exigir a presença de um documento e ele não estiver na lista, repita "NENHUM DOCUMENTO ENCONTRADO" no campo de evidência e reprove o ponto. Se este for um módulo lógico (ex: orquestração, regras globais) que não exige um arquivo específico por si só, ignore o aviso de documento não encontrado e faça a validação solicitada com base nas informações gerais.`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/services/geminiService.ts', code);
    console.log("Patched src/services/geminiService.ts successfully");
} else {
    console.log("Could not find target in src/services/geminiService.ts");
}
