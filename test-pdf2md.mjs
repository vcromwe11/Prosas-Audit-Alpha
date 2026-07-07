import fs from 'fs';
import pdf2md from '@opendocsg/pdf2md';

async function run() {
  const buffer = fs.readFileSync('test.pdf');
  const markdown = await pdf2md(buffer);
  console.log("MARKDOWN RESULT:\n", markdown);
}
run();
