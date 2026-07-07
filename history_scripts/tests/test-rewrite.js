const path = '/api/genai/v1beta/models/gemini-2.5-flash:generateContent?key=proxy';
let newPath = path.replace('^/api/genai', '').replace('/api/genai', '');
newPath = newPath.replace(/([?&])key=[^&]+(&|$)/, (match, p1, p2) => {
    return p1 === '?' && p2 === '' ? '' : (p1 === '?' ? '?' : (p2 === '' ? '' : '&'));
});
console.log(newPath);
