const express = require('express');
const app = express();
app.use((req, res) => {
    console.log("Target received URL:", req.url);
    console.log("Target received headers:", req.headers['x-goog-api-key']);
    res.json({ status: 'ok' });
});
app.listen(3001, () => console.log('Dummy target on 3001'));
