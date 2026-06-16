const http = require('https');
const ids = ["JIX9t2j0ZTN9S", "V4NSR1NG2p0Ke", "10X22vmagVvhOo", "xT0xeJpnrWC4XWblWQ", "13HgwGsXF0aiGY", "YQitE4YNQx8INZNNJM", "M7E5GIMTkHLzO", "Ch31IjylFca8o", "A06UF3macafXW", "o0vwzuFwCGAFO"];

(async () => {
  for (let id of ids) {
    try {
      const title = await new Promise((resolve) => {
        http.get(`https://giphy.com/gifs/${id}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            const match = data.match(/<title>([^<]*)<\/title>/);
            resolve(match ? match[1] : 'No title');
          });
        }).on('error', () => resolve('Error'));
      });
      console.log(id, title);
    } catch(e) {}
  }
})();
