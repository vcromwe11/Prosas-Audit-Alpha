const express = require('express');
const app = express();
app.all('*', (req, res) => {
    console.log("Target received URL:", req.url);
    console.log("Target received headers:", req.headers);
    res.json({ status: 'ok' });
});
app.listen(3001, () => console.log('Dummy target on 3001'));
