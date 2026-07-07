import express from 'express';
import fs from 'fs';
const app = express();
app.use((req, res) => {
    fs.writeFileSync('req_url.txt', req.url);
    res.json({ message: "Hello" });
    process.exit(0);
});
app.listen(3002);
