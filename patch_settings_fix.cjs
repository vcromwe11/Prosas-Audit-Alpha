const fs = require('fs');
const content = fs.readFileSync('src/components/SettingsScreen.tsx', 'utf8');

const target = `const logs = await getAiUsageLogs(1000, 90) as AiUsageEntry[];`;
const replacement = `const logs = (await getAiUsageLogs(1000, 90)) as unknown as AiUsageEntry[];`;

const updated = content.replace(target, replacement);
fs.writeFileSync('src/components/SettingsScreen.tsx', updated);
