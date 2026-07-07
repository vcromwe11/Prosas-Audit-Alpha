const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
    /Arquivos descartados NÃO devem entrar na análise subsequente\./,
    "Arquivos descartados NÃO devem entrar na análise subsequente, e você NÃO DEVE gerar pontos de checagem (points) no JSON para eles. Eles devem ser sumariamente ignorados do banco de dados final."
);

fs.writeFileSync('App.tsx', code);
console.log('App.tsx AI prompt patched');
