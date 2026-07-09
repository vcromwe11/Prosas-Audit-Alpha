const fs = require('fs');
const content = fs.readFileSync('src/components/SettingsScreen.tsx', 'utf8');

const target = `  const [availableModels, setAvailableModels] = useState<AiModelConfig[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);`;

const replacement = `  const [availableModels, setAvailableModels] = useState<AiModelConfig[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [aiLogs, setAiLogs] = useState<AiUsageEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const COST_PER_1M_CHARS = 0.05; // Estimativa (ex: US$ 0.05 a cada 1M caracteres)`;

let updated = content.replace(target, replacement);

const target2 = `  useEffect(() => {
      if (activeTab === 'advanced' && availableModels.length === 0) {`;

const replacement2 = `  useEffect(() => {
      if (activeTab === 'ai_logs') {
          let isMounted = true;
          const loadLogs = async () => {
              setIsLoadingLogs(true);
              const logs = await getAiUsageLogs(1000, 90) as AiUsageEntry[];
              if (isMounted) {
                  setAiLogs(logs);
                  setIsLoadingLogs(false);
              }
          };
          loadLogs();
          return () => { isMounted = false; };
      }
  }, [activeTab]);

  useEffect(() => {
      if (activeTab === 'advanced' && availableModels.length === 0) {`;

updated = updated.replace(target2, replacement2);
fs.writeFileSync('src/components/SettingsScreen.tsx', updated);
