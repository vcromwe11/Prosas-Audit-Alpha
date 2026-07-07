const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const newHandle = `
  const handleRepoFileSelect = async (repoFiles: RepositoryFile[]) => {
      try {
          if (!repoFiles || repoFiles.length === 0) return;
          
          const files = await Promise.all(repoFiles.map(rf => getRepositoryFileAsFile(rf)));
          const mockEvent = { target: { files: files } } as any;
          
          if (typeof repoPickerTarget === 'string' && ['regulation', 'form', 'misc'].includes(repoPickerTarget)) {
              handleContextUpload(mockEvent, repoPickerTarget as 'regulation' | 'form' | 'misc');
          } else if (typeof repoPickerTarget === 'string') {
              // Note: slotId is now a UUID string, so we need to handle it properly
              handleSlotFilesSelected(mockEvent, repoPickerTarget);
          } else if (typeof repoPickerTarget === 'number') {
              handleSlotFilesSelected(mockEvent, repoPickerTarget.toString());
          }
      } catch (err) {
          console.error("Error pulling file from repo:", err);
          alert("Erro ao puxar documento do repositório");
      }
  };
`;

code = code.replace(/const handleRepoFileSelect = async \([\s\S]*?^  };\n/m, newHandle);

fs.writeFileSync('App.tsx', code);
