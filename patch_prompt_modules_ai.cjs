const fs = require('fs');

let code = fs.readFileSync('services/promptModules.ts', 'utf8');

// Update return type
code = code.replace(
    "selectedModuleTypes: string[];\n    missingDocumentTypes: string[];",
    "selectedModuleTypes: string[];\n    missingDocumentTypes: string[];\n    referenceDate: string | null;"
);

// Update prompt instructions
const oldTask = `Sua tarefa:
1. Liste quais documentos são exigidos no edital.
2. Desses documentos exigidos, cruze com a nossa lista de Módulos disponíveis.
3. Se um documento exigido possuir um Módulo correspondente, adicione-o à lista "selectedModuleTypes".
4. Se um documento exigido NÃO possuir um Módulo correspondente (ou seja, nós não temos instrução pronta para ele), adicione-o à lista "missingDocumentTypes" com um nome claro e descritivo.`;

const newTask = `Sua tarefa:
1. Liste quais documentos são exigidos no edital.
2. Desses documentos exigidos, cruze com a nossa lista de Módulos disponíveis.
3. Se um documento exigido possuir um Módulo correspondente, adicione-o à lista "selectedModuleTypes".
4. Se um documento exigido NÃO possuir um Módulo correspondente (ou seja, nós não temos instrução pronta para ele), adicione-o à lista "missingDocumentTypes" com um nome claro e descritivo.
5. Procure no texto do edital por uma "Data de Referência" que baliza a validade dos documentos (ex: data final de inscrição, data de publicação do edital, ou data base mencionada para cálculo de prazos de validade). Se encontrar, retorne no formato "AAAA-MM-DD". Se não encontrar, retorne null.`;

code = code.replace(oldTask, newTask);

const oldJson = `{
  "selectedModuleTypes": ["Estatuto Social", "Ata de Eleição"],
  "missingDocumentTypes": ["Certidão Negativa de Débitos", "Comprovante de Conta Bancária"]
}`;

const newJson = `{
  "selectedModuleTypes": ["Estatuto Social", "Ata de Eleição"],
  "missingDocumentTypes": ["Certidão Negativa de Débitos", "Comprovante de Conta Bancária"],
  "referenceDate": "2024-12-31"
}`;

code = code.replace(oldJson, newJson);

// Update return parsing
code = code.replace(
    "parsed = { selectedModuleTypes: [], missingDocumentTypes: [] };",
    "parsed = { selectedModuleTypes: [], missingDocumentTypes: [], referenceDate: null };"
);
code = code.replace(
    "missingDocumentTypes: parsed.missingDocumentTypes || []",
    "missingDocumentTypes: parsed.missingDocumentTypes || [],\n            referenceDate: parsed.referenceDate || null"
);
code = code.replace(
    "return { selectedModuleTypes: [], missingDocumentTypes: [] };",
    "return { selectedModuleTypes: [], missingDocumentTypes: [], referenceDate: null };"
);


fs.writeFileSync('services/promptModules.ts', code);
console.log('promptModules.ts AI updated');
