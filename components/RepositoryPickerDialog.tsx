import React, { useState, useEffect } from 'react';
import { subscribeToRepositoryFolders, subscribeToRepositoryFilesAll } from '../services/storageService';
import { RepositoryFile, RepositoryFolder } from '../types';

export const RepositoryPickerDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: RepositoryFile) => void;
}> = ({ isOpen, onClose, onSelect }) => {
  const [folders, setFolders] = useState<RepositoryFolder[]>([]);
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsubFolders = subscribeToRepositoryFolders(setFolders);
    const unsubFiles = subscribeToRepositoryFilesAll(setFiles);
    return () => { unsubFolders(); unsubFiles(); };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentFiles = files.filter(f => currentFolderId ? f.folderId === currentFolderId : (!f.folderId || f.folderId === ''));
  const subfolders = folders.filter(f => currentFolderId ? f.parentId === currentFolderId : !f.parentId);
  
  const currentFolder = folders.find(f => f.id === currentFolderId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 text-slate-800 dark:text-gray-200 text-left">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h2 className="text-lg font-bold">Selecionar do Repositório</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"><i className="fas fa-times"></i></button>
        </div>
        
        <div className="p-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2">
            {currentFolderId && (
                <button onClick={() => setCurrentFolderId(currentFolder?.parentId || null)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded text-sm"><i className="fas fa-arrow-left"></i> Voltar</button>
            )}
            <div className="py-1 px-2 font-medium text-sm">{currentFolder ? currentFolder.name : 'Pasta Raiz'}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {subfolders.map(folder => (
                    <div key={folder.id} onClick={() => setCurrentFolderId(folder.id)} className="border border-blue-100 dark:border-blue-800 rounded p-3 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer flex items-center gap-3">
                        <i className="fas fa-folder text-prosas-blue dark:text-blue-400 text-xl"></i>
                        <span className="font-medium text-sm truncate">{folder.name}</span>
                    </div>
                ))}
            </div>

            {subfolders.length > 0 && currentFiles.length > 0 && <hr className="my-4 border-gray-200 dark:border-gray-800" />}

            <div className="grid grid-cols-1 mb-2">
                {currentFiles.map(file => (
                    <div key={file.id} onClick={() => { onSelect(file); onClose(); }} className="border-b border-gray-100 dark:border-gray-800 rounded-none p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <i className={`fas fa-file-${file.type.includes('pdf') ? 'pdf text-red-500' : 'alt text-gray-500'} text-lg min-w-6 text-center`}></i>
                            <span className="font-medium text-sm truncate">{file.name}</span>
                        </div>
                        <span className="text-xs text-prosas-blue opacity-50 group-hover:opacity-100 uppercase font-bold tracking-wider px-2"><i className="fas fa-check"></i> Selecionar</span>
                    </div>
                ))}
            </div>

            {subfolders.length === 0 && currentFiles.length === 0 && (
                <div className="text-center py-12 text-gray-400">Pasta Vazia</div>
            )}
        </div>
      </div>
    </div>
  );
};
