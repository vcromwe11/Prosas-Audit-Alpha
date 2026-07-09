import fetch from 'node-fetch';
const res = await fetch('http://localhost:3000/v1beta/models');
const json = await res.json();
console.log(json.models?.length);
console.log(json.models?.[0]?.name);
