const http = require('http');

const req = http.request({
    hostname: 'google.com',
    headers: { 'x-goog-api-key': 'proxy' }
});

req.setHeader('x-goog-api-key', 'REAL_KEY');
console.log(req.getHeader('x-goog-api-key'));
req.abort();
