const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `const [repoPickerTarget, setRepoPickerTarget] = useState<string | number | null>(null);`;
const replacement1 = `const [repoPickerTarget, setRepoPickerTarget] = useState<string | number | null>(null);
const [isBatchAdding, setIsBatchAdding] = useState(false);`;
code = code.replace(target1, replacement1);

const target2 = `          if (typeof repoPickerTarget === 'string' && ['regulation', 'form', 'misc'].includes(repoPickerTarget)) {
              handleContextUpload(mockEvent, repoPickerTarget as 'regulation' | 'form' | 'misc');
          } else if (typeof repoPickerTarget === 'string') {
              // Note: slotId is now a UUID string, so we need to handle it properly
              handleSlotFilesSelected(mockEvent, repoPickerTarget);
          } else if (typeof repoPickerTarget === 'number') {
              handleSlotFilesSelected(mockEvent, repoPickerTarget.toString());
          }`;
const replacement2 = `          if (repoPickerTarget === 'batch') {
              // Create new slots for each selected file (expecting ZIPs or PDFs)
              const newCandidates = [];
              for (const file of files) {
                  const newSlotId = Math.random().toString(36).substring(7);
                  newCandidates.push({
                      slotId: newSlotId,
                      files: [file], // Temporarily set the raw file, will extract next
                      candidateName: file.name.replace(/\\.(pdf|zip)$/i, ''),
                      status: 'pending',
                      isLoadingFiles: true
                  });
              }
              setCandidates(prev => [...prev, ...newCandidates]);
              
              // Process each file (e.g., extract ZIP)
              for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const slotId = newCandidates[i].slotId;
                  
                  if (file.name.endsWith('.zip')) {
                      extractPdfsFromZip(file).then(extracted => {
                          setCandidates(prev => prev.map(c => {
                              if (c.slotId === slotId) {
                                  return { 
                                      ...c, 
                                      files: extracted, 
                                      isLoadingFiles: false,
                                      candidateName: extracted.length > 1 ? \`\${c.candidateName} (\${extracted.length} docs)\` : c.candidateName
                                  };
                              }
                              return c;
                          }));
                      }).catch(e => {
                          alert(\`Erro ao extrair ZIP \${file.name}: \${e.message}\`);
                          setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, isLoadingFiles: false, error: e.message, status: 'error' } : c));
                      });
                  } else {
                      setCandidates(prev => prev.map(c => c.slotId === slotId ? { ...c, isLoadingFiles: false } : c));
                  }
              }
          } else if (typeof repoPickerTarget === 'string' && ['regulation', 'form', 'misc'].includes(repoPickerTarget)) {
              handleContextUpload(mockEvent, repoPickerTarget as 'regulation' | 'form' | 'misc');
          } else if (typeof repoPickerTarget === 'string') {
              // Note: slotId is now a UUID string, so we need to handle it properly
              handleSlotFilesSelected(mockEvent, repoPickerTarget);
          } else if (typeof repoPickerTarget === 'number') {
              handleSlotFilesSelected(mockEvent, repoPickerTarget.toString());
          }`;
code = code.replace(target2, replacement2);

const target3 = `                         <button 
                           onClick={addNewSlot}
                           disabled={candidates.length >= appSettings.maxConcurrentSlots}`;
const replacement3 = `                         <button 
                           onClick={() => {
                               setRepoPickerTarget('batch');
                               setIsRepoPickerOpen(true);
                           }}
                           className="px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition-all duration-200 transform active:scale-95 bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                         >
                             <i className="fas fa-layer-group"></i> Lote (Repositório)
                         </button>
                         <button 
                           onClick={addNewSlot}
                           disabled={candidates.length >= appSettings.maxConcurrentSlots}`;
code = code.replace(target3, replacement3);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched src/App.tsx successfully");
