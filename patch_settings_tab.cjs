const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsScreen.tsx', 'utf8');

const targetTabAdmin = `{user?.role === 'admin' && (
                <button
                    onClick={() => setActiveTab('ai_logs')}`;
                    
const replacementTab = `{user && (
                <button
                    onClick={() => setActiveTab('ai_logs')}`;
                    
code = code.replace(targetTabAdmin, replacementTab);

const targetTabAdmin2 = `  useEffect(() => {
      if (activeTab === 'ai_logs' && user?.role === 'admin') {
          let isMounted = true;`;
const replacementTab2 = `  useEffect(() => {
      if (activeTab === 'ai_logs' && user) {
          let isMounted = true;`;
code = code.replace(targetTabAdmin2, replacementTab2);

fs.writeFileSync('src/components/SettingsScreen.tsx', code);
