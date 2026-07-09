import React, { useState, useEffect } from 'react';
import { subscribeToRepositoryFolders, subscribeToRepositoryFilesAll } from '../services/storageService';
import { RepositoryFile, RepositoryFolder } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const RepositoryPickerDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (files: RepositoryFile[]) => void;
}> = ({ isOpen, onClose, onSelect }) => {
  const { user } = useAuth();
  const { warning } = useToast();
  const [folders, setFolders] = useState<RepositoryFolder[]>([]);
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<RepositoryFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<RepositoryFolder | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    const isAdmin = user.role === 'admin' || user.role === 'developer';
    const unsubFolders = subscribeToRepositoryFolders(isAdmin, user.uid, setFolders);
    const unsubFiles = subscribeToRepositoryFilesAll(isAdmin, user.uid, setFiles);
    return () => { unsubFolders(); unsubFiles(); };
  }, [isOpen, user]);

  if (!isOpen) return null;

  const currentFiles = files.filter(f => currentFolderId ? f.folderId === currentFolderId : (!f.folderId || f.folderId === ''));
  const subfolders = folders.filter(f => currentFolderId ? f.parentId === currentFolderId : !f.parentId);
  
  const currentFolder = folders.find(f => f.id === currentFolderId);

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


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 text-slate-800 dark:text-gray-200 text-left">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden relative">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h2 className="text-lg font-bold">Selecionar do Repositório</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"><i className="fas fa-times"></i></button>
        </div>
        
        <div className="p-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2">
            {currentFolderId && (
                <button onClick={() => { setCurrentFolderId(currentFolder?.parentId || null); setSelectedFolder(null); setSelectedFiles([]); }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded text-sm"><i className="fas fa-arrow-left"></i> Voltar</button>
            )}
            <div className="py-1 px-2 font-medium text-sm">{currentFolder ? currentFolder.name : 'Pasta Raiz'}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {subfolders.map(folder => (
                    <div key={folder.id} onClick={() => setSelectedFolder(folder)} onDoubleClick={() => { setCurrentFolderId(folder.id); setSelectedFolder(null); setSelectedFiles([]); }} className={`border rounded p-3 cursor-pointer flex items-center gap-3 ${selectedFolder?.id === folder.id ? "border-blue-500 bg-blue-100 dark:bg-blue-800" : "border-blue-100 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40"}`}>
                        <i className="fas fa-folder text-prosas-blue dark:text-blue-400 text-xl"></i>
                        <span className="font-medium text-sm truncate">{folder.name}</span>
                    </div>
                ))}
            </div>

            {subfolders.length > 0 && currentFiles.length > 0 && <hr className="my-4 border-gray-200 dark:border-gray-800" />}

            <div className="grid grid-cols-1 mb-2">
                {currentFiles.map(file => (
                    <div key={file.id} onClick={() => toggleFileSelection(file)} className={`border-b rounded-none p-3 cursor-pointer flex items-center justify-between group transition-colors ${selectedFiles.some(f => f.id === file.id) ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700" : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <i className={`fas fa-file-${file.type.includes('pdf') ? 'pdf text-red-500' : 'alt text-gray-500'} text-lg min-w-6 text-center`}></i>
                            <span className="font-medium text-sm truncate">{file.name}</span>
                        </div>
                        {selectedFiles.some(f => f.id === file.id) ? <span className="text-xs text-prosas-blue uppercase font-bold tracking-wider px-2"><i className="fas fa-check-square"></i> Selecionado</span> : <span className="text-xs text-gray-400 group-hover:text-prosas-blue opacity-50 group-hover:opacity-100 uppercase font-bold tracking-wider px-2"><i className="far fa-square"></i> Selecionar</span>}
                    </div>
                ))}
            </div>

            {subfolders.length === 0 && currentFiles.length === 0 && (
                <div className="text-center py-12 text-gray-400">Pasta Vazia</div>
            )}
        </div>

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
                  warning("Esta pasta está vazia.");
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

      </div>
    </div>
  );
};
