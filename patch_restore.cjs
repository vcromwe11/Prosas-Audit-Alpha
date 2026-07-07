const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const replacement = `  }

  const handleCandidateUpload = async (event: React.ChangeEvent<HTMLInputElement>, slotId: string) => {
      const rawFiles = Array.from(event.target.files || []);
      if (rawFiles.length === 0) return;

      // Extract ZIPs if necessary
      const processedFiles: File[] = [];
      for (const file of rawFiles) {
          if (file.name.endsWith('.zip')) {
              try {
                  const extracted = await extractPdfsFromZip(file);
                  processedFiles.push(...extracted);
              } catch (e) {
                  alert(\`Erro ao extrair ZIP \${file.name}: \${e.message}\`);
              }
          } else {
              processedFiles.push(file);
          }
      }

      if (processedFiles.length === 0) {`;

code = code.replace(/  \}\n\n      if \(processedFiles\.length === 0\) \{/, replacement);

fs.writeFileSync('App.tsx', code);
console.log('Restored handleCandidateUpload');
