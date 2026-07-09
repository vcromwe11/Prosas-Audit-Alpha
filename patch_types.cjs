const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const targetContext = `export interface AuditContext {
  editalTitle: string;
  regulationText: string;
  formTemplateText: string;
  miscFilesText: string;
  criteriaText: string;
  useGlobalInstructions?: boolean; 
  referenceDate: string; // Data do edital/prazo de inscrição
  authRules: DocumentAuthRule[];
  promptModules?: DocumentPromptModule[];
  isReady: boolean;
}`;

const replacementContext = `export interface AuditContext {
  editalTitle: string;
  regulationText: string;
  formTemplateText: string;
  miscFilesText: string;
  criteriaText: string;
  useGlobalInstructions?: boolean; 
  excludeContextInAnalysis?: boolean; // Se verdadeiro, não envia o regulamento/formulário durante a análise
  referenceDate: string; // Data do edital/prazo de inscrição
  authRules: DocumentAuthRule[];
  promptModules?: DocumentPromptModule[];
  isReady: boolean;
}`;

code = code.replace(targetContext, replacementContext);
fs.writeFileSync('src/types.ts', code);
