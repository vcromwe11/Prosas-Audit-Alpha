const fs = require('fs');

// 1. Patch storageService.ts
let storage = fs.readFileSync('src/services/storageService.ts', 'utf8');
const targetStorage = `    const logEntry = {
      ...entry,
      timestamp: Date.now(),
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email
    };
    await setDoc(doc(db, "ai_usage_logs", logId), logEntry);`;
const replacementStorage = `    const logEntry: any = {
      ...entry,
      timestamp: Date.now(),
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email
    };
    Object.keys(logEntry).forEach(key => {
      if (logEntry[key] === undefined) {
        delete logEntry[key];
      }
    });
    await setDoc(doc(db, "ai_usage_logs", logId), logEntry);`;
storage = storage.replace(targetStorage, replacementStorage);
fs.writeFileSync('src/services/storageService.ts', storage);

// 2. Patch SettingsScreen.tsx
let settings = fs.readFileSync('src/components/SettingsScreen.tsx', 'utf8');
const targetSettings = `  useEffect(() => {
      if (activeTab === 'ai_logs') {
          let isMounted = true;`;
const replacementSettings = `  useEffect(() => {
      if (activeTab === 'ai_logs' && user?.role === 'admin') {
          let isMounted = true;`;
settings = settings.replace(targetSettings, replacementSettings);
settings = settings.replace(`}, [activeTab]);`, `}, [activeTab, user?.role]);`);
fs.writeFileSync('src/components/SettingsScreen.tsx', settings);

// 3. Patch geminiService.ts
let gemini = fs.readFileSync('src/services/geminiService.ts', 'utf8');
const targetGemini = `            const isRateLimit = status === 429;
            const isServerOverload = status === 503;
            const isNetworkError = errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError");
            
            if ((isRateLimit || isServerOverload || isNetworkError) && i < retries - 1) {`;
const replacementGemini = `            const isRateLimit = status === 429;
            const isServerOverload = status === 503;
            const isNetworkError = errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError");
            const isParsingError = errorMessage.includes("Unexpected token") || errorMessage.includes("SyntaxError: Unexpected token");
            
            if ((isRateLimit || isServerOverload || isNetworkError || isParsingError) && i < retries - 1) {`;
gemini = gemini.replace(targetGemini, replacementGemini);
fs.writeFileSync('src/services/geminiService.ts', gemini);
