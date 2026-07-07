const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');
code = code.replace(
    "const [isGeneratingCriteria, setIsGeneratingCriteria] = useState(false);",
    "const [isGeneratingCriteria, setIsGeneratingCriteria] = useState(false);\n  const [pdfTarget, setPdfTarget] = useState<'regulation' | 'form' | 'misc' | null>(null);\n  const pdfInputRef = useRef<HTMLInputElement>(null);"
);
fs.writeFileSync('App.tsx', code);
console.log('App.tsx tsc variables fixed');
