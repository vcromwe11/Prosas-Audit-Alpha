const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test.pdf'));

doc.fontSize(25).text('Title of the Document', 100, 100);
doc.fontSize(14).text('Here is a paragraph of text. It has some information that we want to extract as markdown.', 100, 150);
doc.fontSize(18).text('Section 1', 100, 200);
doc.fontSize(14).text('More text in section 1.', 100, 230);

doc.end();
