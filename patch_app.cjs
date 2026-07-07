const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const oldHandleDetectModulesRegex = /const handleDetectModules = async \(\) => \{[\s\S]*?\}\s*\}\n/;

const newHandleDetectModules = `const handleDetectModules = async () => {
      if (!context.regulationText) return;
      setIsDetectingModules(true);
      try {
          const result = await generatePromptModulesFromRegulation(context.regulationText, globalPromptModules);
          
          if (result.updatedModules && result.updatedModules.length > 0) {
              // Add IDs to the updated modules
              const newModsWithIds = result.updatedModules.map(m => ({
                  ...m,
                  id: Math.random().toString(36).substring(7)
              }));
              
              setContext(prev => ({
                  ...prev, 
                  promptModules: enforceModuleOrder(newModsWithIds), 
                  referenceDate: result.referenceDate || prev.referenceDate
              }));
          }
      } catch (error) {
          console.error("Error auto-detecting modules:", error);
          alert("Ocorreu um erro ao detectar os módulos. Tente novamente.");
      } finally {
          setIsDetectingModules(false);
      }
  }
`;

code = code.replace(oldHandleDetectModulesRegex, newHandleDetectModules);

fs.writeFileSync('App.tsx', code);
console.log('App.tsx patched handleDetectModules');
