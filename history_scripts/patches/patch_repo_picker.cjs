const fs = require('fs');
let code = fs.readFileSync('components/RepositoryPickerDialog.tsx', 'utf8');

// Replace the prop definition
code = code.replace(
  'onSelect: (file: RepositoryFile) => void;',
  'onSelect: (files: RepositoryFile[]) => void;'
);

// Add selectedFiles state
code = code.replace(
  'const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);',
  'const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);\n  const [selectedFiles, setSelectedFiles] = useState<RepositoryFile[]>([]);'
);

// Add toggle function
const toggleFunction = `
  const toggleFileSelection = (file: RepositoryFile) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleConfirmSelection = () => {
    if (selectedFiles.length > 0) {
      onSelect(selectedFiles);
      setSelectedFiles([]);
      onClose();
    }
  };

  const handleSelectAllInFolder = () => {
    if (currentFiles.length > 0) {
      onSelect(currentFiles);
      setSelectedFiles([]);
      onClose();
    }
  };
`;

code = code.replace(
  '  const currentFolder = folders.find(f => f.id === currentFolderId);',
  '  const currentFolder = folders.find(f => f.id === currentFolderId);\n' + toggleFunction
);

// Change folder click behavior. Right now we only have single click. The prompt asks for:
// "se eu clicar na página [pasta], tem que aparecer um botão embaixo, perguntando se eu quero colocar subir toda a pasta de uma vez e se eu der um clique duplo na pasta, eu abro a pasta"
// So we can make onClick select the folder, and onDoubleClick open it. But we don't have a "selectedFolder" state. Let's just add it.
code = code.replace(
  '  const [selectedFiles, setSelectedFiles] = useState<RepositoryFile[]>([]);',
  '  const [selectedFiles, setSelectedFiles] = useState<RepositoryFile[]>([]);\n  const [selectedFolder, setSelectedFolder] = useState<RepositoryFolder | null>(null);'
);

// We need to clear selections when changing folder
code = code.replace(
  'onClick={() => setCurrentFolderId(folder.id)}',
  'onClick={() => setSelectedFolder(folder)} onDoubleClick={() => { setCurrentFolderId(folder.id); setSelectedFolder(null); setSelectedFiles([]); }}'
);

code = code.replace(
  'onClick={() => setCurrentFolderId(currentFolder?.parentId || null)}',
  'onClick={() => { setCurrentFolderId(currentFolder?.parentId || null); setSelectedFolder(null); setSelectedFiles([]); }}'
);

// Change folder UI to show selected state
code = code.replace(
  'className="border border-blue-100 dark:border-blue-800 rounded p-3 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer flex items-center gap-3"',
  'className={`border rounded p-3 cursor-pointer flex items-center gap-3 ${selectedFolder?.id === folder.id ? "border-blue-500 bg-blue-100 dark:bg-blue-800" : "border-blue-100 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40"}`}'
);

// Change file mapping to allow multiple selections
code = code.replace(
  '<div key={file.id} onClick={() => { onSelect(file); onClose(); }} className="border-b border-gray-100 dark:border-gray-800 rounded-none p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between group transition-colors">',
  '<div key={file.id} onClick={() => toggleFileSelection(file)} className={`border-b rounded-none p-3 cursor-pointer flex items-center justify-between group transition-colors ${selectedFiles.some(f => f.id === file.id) ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700" : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>'
);

// Change the file checkmark
code = code.replace(
  '<span className="text-xs text-prosas-blue opacity-50 group-hover:opacity-100 uppercase font-bold tracking-wider px-2"><i className="fas fa-check"></i> Selecionar</span>',
  '{selectedFiles.some(f => f.id === file.id) ? <span className="text-xs text-prosas-blue uppercase font-bold tracking-wider px-2"><i className="fas fa-check-square"></i> Selecionado</span> : <span className="text-xs text-gray-400 group-hover:text-prosas-blue opacity-50 group-hover:opacity-100 uppercase font-bold tracking-wider px-2"><i className="far fa-square"></i> Selecionar</span>}'
);

// Add the footer buttons
code = code.replace(
  '        <div className="flex-1 overflow-y-auto p-4">',
  `        <div className="flex-1 overflow-y-auto p-4 pb-24">`
);

const footer = `
      {/* Footer Actions */}
      {(selectedFiles.length > 0 || selectedFolder || currentFolderId) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center shadow-lg">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {selectedFiles.length > 0 && <span>{selectedFiles.length} documento(s) selecionado(s)</span>}
            {selectedFolder && !selectedFiles.length && <span>Pasta "{selectedFolder.name}" selecionada</span>}
          </div>
          <div className="flex gap-2">
            {selectedFolder && (
              <button onClick={() => {
                const filesInFolder = files.filter(f => f.folderId === selectedFolder.id);
                if (filesInFolder.length > 0) {
                  onSelect(filesInFolder);
                  setSelectedFolder(null);
                  onClose();
                } else {
                  alert("Esta pasta está vazia.");
                }
              }} className="px-4 py-2 bg-prosas-blue text-white rounded font-bold hover:bg-blue-700">
                Adicionar todos da pasta
              </button>
            )}
            {!selectedFolder && currentFolderId && selectedFiles.length === 0 && (
              <button onClick={handleSelectAllInFolder} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded font-bold hover:bg-gray-300 dark:hover:bg-gray-600">
                Selecionar todos desta pasta
              </button>
            )}
            {selectedFiles.length > 0 && (
              <button onClick={handleConfirmSelection} className="px-4 py-2 bg-prosas-blue text-white rounded font-bold hover:bg-blue-700">
                Confirmar Seleção ({selectedFiles.length})
              </button>
            )}
          </div>
        </div>
      )}
`;

code = code.replace(
  '      </div>\n    </div>\n  );\n};',
  footer + '\n      </div>\n    </div>\n  );\n};'
);

// We need to add position relative to the modal to use absolute positioning for the footer
code = code.replace(
  'max-h-[85vh] flex flex-col overflow-hidden',
  'max-h-[85vh] flex flex-col overflow-hidden relative'
);

fs.writeFileSync('components/RepositoryPickerDialog.tsx', code);
