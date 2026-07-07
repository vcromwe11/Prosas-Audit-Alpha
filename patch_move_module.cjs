const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const anchor = "const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);";
const functions = `
  const enforceModuleOrder = (modules: DocumentPromptModule[]) => {
      const orqIdx = modules.findIndex(m => m.documentType.trim().toLowerCase() === 'orquestrador da esteira');
      let orqModule = null;
      if (orqIdx !== -1) {
          orqModule = modules.splice(orqIdx, 1)[0];
      }

      const cnpjIdx = modules.findIndex(m => m.documentType.trim().toLowerCase() === 'cartão cnpj');
      let cnpjModule = null;
      if (cnpjIdx !== -1) {
          cnpjModule = modules.splice(cnpjIdx, 1)[0];
      }

      const result = [...modules];
      if (cnpjModule) result.unshift(cnpjModule);
      if (orqModule) result.unshift(orqModule);
      return result;
  };

  const moveModule = (idx: number, direction: 'up' | 'down') => {
      let newMods = [...(context.promptModules || [])];
      
      const docType = newMods[idx].documentType.trim().toLowerCase();
      if (docType === 'orquestrador da esteira' || docType === 'cartão cnpj') return;
      
      if (direction === 'up' && idx > 0) {
          const prevDocType = newMods[idx - 1].documentType.trim().toLowerCase();
          if (prevDocType === 'orquestrador da esteira' || prevDocType === 'cartão cnpj') return;
          const temp = newMods[idx - 1];
          newMods[idx - 1] = newMods[idx];
          newMods[idx] = temp;
      } else if (direction === 'down' && idx < newMods.length - 1) {
          const nextDocType = newMods[idx + 1].documentType.trim().toLowerCase();
          if (nextDocType === 'orquestrador da esteira' || nextDocType === 'cartão cnpj') return;
          const temp = newMods[idx + 1];
          newMods[idx + 1] = newMods[idx];
          newMods[idx] = temp;
      }
      
      newMods = enforceModuleOrder(newMods);
      setContext({...context, promptModules: newMods});
  };
`;

code = code.replace(anchor, anchor + functions);
fs.writeFileSync('App.tsx', code);
console.log('App.tsx moveModule patched');
