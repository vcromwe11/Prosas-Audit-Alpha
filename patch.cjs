const fs = require('fs');
const content = fs.readFileSync('src/components/SettingsScreen.tsx', 'utf8');

const hookStr = `
  useEffect(() => {
      if (activeTab === 'advanced' && availableModels.length === 0) {
          let isMounted = true;
          const loadModels = async () => {
              setIsLoadingModels(true);
              const models = await getAvailableModels();
              if (isMounted) {
                  setAvailableModels(models);
                  setIsLoadingModels(false);
              }
          };
          loadModels();
          return () => { isMounted = false; };
      }
  }, [activeTab, availableModels.length]);
`;

const updated = content.replace('useEffect(() => {', hookStr + '\n  useEffect(() => {');
fs.writeFileSync('src/components/SettingsScreen.tsx', updated);
