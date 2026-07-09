import fetch from 'node-fetch';
const res = await fetch('http://localhost:3000/v1beta/models');
const json = await res.json();
console.log(JSON.stringify(json.models?.filter(m => m.supportedGenerationMethods?.includes('generateContent')).map(m => ({name: m.name.replace('models/', ''), displayName: m.displayName})).slice(0, 5), null, 2));
