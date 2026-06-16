import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RepositoryFolder, RepositoryFile, AppSettings } from '../types';
import { useAuth } from '../src/contexts/AuthContext';
import { useAuthGuard } from '../src/hooks/useAuthGuard';
import { 
    subscribeToRepositoryFolders, 
    subscribeToRepositoryFiles, 
    createRepositoryFolder, 
    updateRepositoryFolder, 
    deleteRepositoryFolder, 
    uploadRepositoryFile, 
    updateRepositoryFile, 
    deleteRepositoryFile,
    getFileDownloadUrl
} from '../services/storageService';

interface RepositoryScreenProps {
  appSettings: AppSettings;
}

export const RepositoryScreen: React.FC<RepositoryScreenProps> = ({ appSettings }) => {
  const { user } = useAuth();
  const { checkPermission } = useAuthGuard();
  const [folders, setFolders] = useState<RepositoryFolder[]>([]);
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<RepositoryFolder | null>(null);
  
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const subfolders = folders.filter(f => selectedFolder ? f.parentId === selectedFolder.id : !f.parentId);
  
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  const [isUploading, setIsUploading] = useState(false);
          const [uploadProgress, setUploadProgress] = useState(0);

  const [movingFileId, setMovingFileId] = useState<string | null>(null);
  
  const [folderToDelete, setFolderToDelete] = useState<RepositoryFolder | null>(null);
  const [fileToDelete, setFileToDelete] = useState<RepositoryFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubFolders = subscribeToRepositoryFolders(setFolders);
    return () => unsubFolders();
  }, []);

  useEffect(() => {
    // Fetch files for the selected folder, or root if selectedFolder is null
    const unsubFiles = subscribeToRepositoryFiles(selectedFolder ? selectedFolder.id : null, setFiles);
    return () => unsubFiles();
  }, [selectedFolder]);

  const handleCreateFolder = async () => {
    if (!checkPermission('mutate_data')) {
      alert('Sem permissão.');
      return;
    }
    if (!newFolderName.trim()) return;
    await createRepositoryFolder(newFolderName, selectedFolder ? selectedFolder.id : null);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleDeleteFolder = (folder: RepositoryFolder) => {
    if (!checkPermission('mutate_data')) {
        alert('Sem permissão.');
        return;
    }
    setFolderToDelete(folder);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    
    const folder = folderToDelete;
    setFolderToDelete(null);

    const isDescendant = (childId: string | null | undefined): boolean => {
        if (!childId) return false;
        if (childId === folder.id) return true;
        const childFolder = folders.find(f => f.id === childId);
        return childFolder ? isDescendant(childFolder.parentId) : false;
    };

    if (isDescendant(selectedFolder?.id)) {
        setSelectedFolder(null);
    }

    try {
      await deleteRepositoryFolder(folder.id);
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao deletar pasta: ${e.message}`);
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!checkPermission('mutate_data')) {
        alert('Sem permissão.');
        return;
    }
    if (!editingFolderName.trim()) return;
    await updateRepositoryFolder(folderId, editingFolderName);
    setEditingFolderId(null);
  };

    const handleFileUpload = async (event: any, overrideTargetFolderId: string | null = null) => {
      if (!checkPermission('mutate_data')) {
          alert('Sem permissão.');
          return;
      }
      
      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;
  
      setIsUploading(true);
      setUploadProgress(0);
      
      const totalFiles = fileList.length;
      let completed = 0;
  
      const createdFoldersCache: { [path: string]: string } = {};

      for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          let targetFolderId = overrideTargetFolderId || (selectedFolder ? selectedFolder.id : null);

          if (file.webkitRelativePath) {
              const pathParts = file.webkitRelativePath.split('/');
              const folderParts = pathParts.slice(0, -1);
              
              let currentPath = '';
              for (const part of folderParts) {
                  currentPath += (currentPath ? '/' : '') + part;
                  if (createdFoldersCache[currentPath]) {
                      targetFolderId = createdFoldersCache[currentPath];
                  } else {
                      const existingFolder = folders.find(f => f.name === part && (f.parentId || null) === targetFolderId);
                      if (existingFolder) {
                          targetFolderId = existingFolder.id;
                          createdFoldersCache[currentPath] = existingFolder.id;
                      } else {
                          try {
                              const newFolderId = await createRepositoryFolder(part, targetFolderId);
                              targetFolderId = newFolderId;
                              createdFoldersCache[currentPath] = newFolderId;
                          } catch(e) {
                              console.error(e);
                          }
                      }
                  }
              }
          }

          try {
              await uploadRepositoryFile(targetFolderId, file, (progress) => {
                  // Calculate overall progress
                  const overallProgress = Math.round(((completed + (progress / 100)) / totalFiles) * 100);
                  setUploadProgress(overallProgress);
              });
          } catch (e) {
              console.error("Erro no upload do arquivo:", file.name, e);
              alert(`Erro ao fazer upload do arquivo ${file.name}. Verifique as permissões do Firebase Storage.`);
          }

          completed++;
          setUploadProgress(Math.round((completed / totalFiles) * 100));
      }
      
      setIsUploading(false);
      if(event.target) event.target.value = '';
    };
  
    const handleDeleteFile = (file: RepositoryFile) => {
      if (!checkPermission('mutate_data')) {
          alert('Sem permissão.');
          return;
      }
      setFileToDelete(file);
    };

    const confirmDeleteFile = async () => {
      if (!fileToDelete) return;
      const file = fileToDelete;
      setFileToDelete(null);
      await deleteRepositoryFile(file);
    };

    const handleMoveFile = async (fileId: string, folderId: string) => {
        if (!checkPermission('mutate_data')) {
            alert('Sem permissão.');
            return;
        }
        await updateRepositoryFile(fileId, { folderId });
    };

    const handleDownloadFile = async (file: RepositoryFile) => {
        try {
            const url = await getFileDownloadUrl(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (e: any) {
            console.error("Download fail:", e);
            alert(`Erro ao fazer download: ${e.message}`);
        }
    };

  return (
    <motion.div
        key="repository"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="h-full flex flex-col bg-slate-50 dark:bg-gray-900"
    >
        <div className="flex-none p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-100 flex items-center gap-2">
                <i className="fas fa-folder-open text-prosas-blue dark:text-blue-400"></i> Repositório de Documentos
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie os arquivos e projetos não analisados.</p>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* PASTAS */}
            <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-y-auto">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Pastas</h3>
                    <button 
                        onClick={() => setIsCreatingFolder(true)} 
                        className="text-prosas-blue dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 p-2 rounded-full transition-colors"
                        title="Nova Pasta"
                    >
                        <i className="fas fa-plus"></i>
                    </button>
                </div>

                {isCreatingFolder && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="Nome da pasta..." 
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 mb-2"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsCreatingFolder(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1">Cancelar</button>
                            <button onClick={handleCreateFolder} className="text-xs bg-prosas-blue hover:bg-prosas-blue-dark text-white px-3 py-1 rounded">Criar</button>
                        </div>
                    </div>
                )}

                <div className="p-2 space-y-1">
                    <div 
                        className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${!selectedFolder ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'}`}
                        onClick={() => setSelectedFolder(null)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900/60');
                            e.currentTarget.classList.remove('border-transparent');
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900/60');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900/60');
                            
                            const fileId = e.dataTransfer.getData('text/plain');
                            if (fileId) {
                                handleMoveFile(fileId, ''); // Using empty string to represent root in Firebase
                            } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                handleFileUpload({ target: { files: e.dataTransfer.files } }, null);
                            }
                        }}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <i className="fas fa-home text-gray-500 dark:text-gray-400"></i>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">Raiz</span>
                        </div>
                    </div>
                    {(() => {
                        const rootFolders = folders.filter(f => !f.parentId);
                        
                        const renderFolderTree = (folder: RepositoryFolder, depth = 0) => {
                            const childFolders = folders.filter(f => f.parentId === folder.id);
                            
                            return (
                                <div key={folder.id} className="flex flex-col">
                                    <div 
                                        className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${selectedFolder?.id === folder.id ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'}`}
                                        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
                                        onClick={() => setSelectedFolder(folder)}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900/60');
                                            e.currentTarget.classList.remove('border-transparent');
                                        }}
                                        onDragLeave={(e) => {
                                            e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900/60');
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900/60');
                                            
                                            // Handling file move (internal D&D)
                                            const fileId = e.dataTransfer.getData('text/plain');
                                            if (fileId) {
                                                handleMoveFile(fileId, folder.id);
                                            } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                                // Handling file upload (external D&D) directly to this folder
                                                handleFileUpload({ target: { files: e.dataTransfer.files } }, folder.id);
                                            }
                                        }}
                                    >
                                        {editingFolderId === folder.id ? (
                                            <div className="flex-1 flex items-center gap-2">
                                                <input 
                                                    type="text"
                                                    autoFocus
                                                    value={editingFolderName}
                                                    onChange={(e) => setEditingFolderName(e.target.value)}
                                                    className="flex-1 px-2 py-1 text-sm border border-prosas-blue rounded"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRenameFolder(folder.id);
                                                        if (e.key === 'Escape') setEditingFolderId(null);
                                                    }}
                                                />
                                                <button onClick={(e) => { e.stopPropagation(); handleRenameFolder(folder.id); }} className="text-prosas-blue bg-white p-1 rounded shadow-sm"><i className="fas fa-check"></i></button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <i className={`fas fa-folder ${selectedFolder?.id === folder.id ? 'text-prosas-blue dark:text-blue-400' : 'text-gray-400'}`}></i>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={folder.name}>{folder.name}</span>
                                                </div>
                                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }} 
                                                        className="p-1 text-gray-400 hover:text-prosas-blue rounded"
                                                    >
                                                        <i className="fas fa-edit text-xs"></i>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }} 
                                                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                                                    >
                                                        <i className="fas fa-trash text-xs"></i>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {childFolders.length > 0 && (
                                        <div className="flex flex-col space-y-1 mt-1">
                                            {childFolders.map(child => renderFolderTree(child, depth + 1))}
                                        </div>
                                    )}
                                </div>
                            );
                        };

                        return rootFolders.length > 0 ? (
                            rootFolders.map(folder => renderFolderTree(folder))
                        ) : (
                            !isCreatingFolder && (
                                <div className="text-center p-4 text-gray-500 text-sm">
                                    Nenhuma pasta criada.
                                </div>
                            )
                        );
                    })()}
                </div>
            </div>

            {/* ARQUIVOS */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-850 relative overflow-hidden">
                <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                />
                <input 
                    type="file" 
                    {...{ webkitdirectory: "true", directory: "true" } as any}
                    multiple 
                    ref={folderInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                />
                
                <>
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            {selectedFolder && (
                                <button 
                                    onClick={() => {
                                        const parentFolder = folders.find(f => f.id === selectedFolder.parentId);
                                        setSelectedFolder(parentFolder || null);
                                    }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors"
                                    title="Voltar para pasta anterior"
                                >
                                    <i className="fas fa-arrow-left"></i>
                                </button>
                            )}
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{selectedFolder ? selectedFolder.name : 'Arquivos na Raiz'}</h3>
                                <p className="text-xs text-gray-500">{subfolders.length} pasta(s), {files.length} arquivo(s)</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => folderInputRef.current?.click()}
                                disabled={isUploading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                <i className="fas fa-folder-plus"></i> Upload de Pasta
                            </button>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="bg-prosas-blue hover:bg-prosas-blue-dark text-white px-4 py-2 text-sm rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                {isUploading ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Enviando... {uploadProgress}%</>
                                ) : (
                                    <><i className="fas fa-upload"></i> Upload de Arquivos</>
                                )}
                            </button>
                        </div>
                    </div>

                    <div 
                        className="flex-1 overflow-y-auto p-4 relative"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
                            }
                        }}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {subfolders.map(folder => (
                                <div 
                                    key={folder.id} 
                                    onClick={() => setSelectedFolder(folder)}
                                    className="border border-blue-100 dark:border-blue-800 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-900/20 hover:shadow-md transition-shadow group flex flex-col cursor-pointer"
                                >
                                    <div className="flex-1 flex items-start gap-3">
                                        <i className="fas fa-folder text-prosas-blue dark:text-blue-400 text-2xl"></i>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-gray-200 truncate" title={folder.name}>{folder.name}</h4>
                                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Pasta</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {files.map(file => (
                                    <div 
                                        key={file.id} 
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 hover:shadow-md transition-shadow group flex flex-col cursor-grab active:cursor-grabbing"
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('text/plain', file.id);
                                            e.dataTransfer.effectAllowed = 'move';
                                        }}
                                    >
                                        <div className="flex-1 flex items-start gap-3">
                                            <i className={`fas fa-file-${file.type.includes('pdf') ? 'pdf text-red-500' : 'alt text-gray-500'} text-2xl`}></i>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={file.name}>{file.name}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                                            {movingFileId === file.id ? (
                                                <div className="flex gap-2">
                                                    <select 
                                                        className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                                        onChange={(e) => {
                                                            if (e.target.value) handleMoveFile(file.id, e.target.value);
                                                        }}
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Mover para...</option>
                                                        {folders.filter(f => f.id !== selectedFolder?.id).map(f => (
                                                            <option key={f.id} value={f.id}>{f.name}</option>
                                                        ))}
                                                    </select>
                                                    <button onClick={() => setMovingFileId(null)} className="text-xs text-gray-500">Cancelar</button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDownloadFile(file); }}
                                                        className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded transition-colors"
                                                    >
                                                        <i className="fas fa-download mr-1"></i> Abrir
                                                    </button>
                                                    <button 
                                                        onClick={() => setMovingFileId(file.id)}
                                                        className="text-xs text-prosas-blue hover:text-prosas-blue-dark bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded transition-colors"
                                                    >
                                                        <i className="fas fa-exchange-alt mr-1"></i> Mover
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteFile(file)}
                                                        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded transition-colors"
                                                    >
                                                        <i className="fas fa-trash mr-1"></i> Excluir
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {files.length === 0 && subfolders.length === 0 && !isUploading && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                                    <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                                    <p>Esta pasta está vazia.</p>
                                    <p className="text-sm mt-1">Clique em Upload para adicionar documentos.</p>
                                </div>
                            )}
                        </div>
                    </>
            </div>
        </div>

        {/* Delete Folder Modal */}
        {folderToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 text-slate-800 dark:text-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
                        <i className="fas fa-exclamation-triangle mr-2"></i> Excluir Pasta
                    </h3>
                    <p className="mb-4">
                        Tem certeza que deseja deletar a pasta <strong>"{folderToDelete.name}"</strong> e todo o seu conteúdo?
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                        Atenção: Todos os arquivos e subpastas dentro dela também serão permanentemente apagados. Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setFolderToDelete(null)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDeleteFolder}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm shadow-sm transition-colors"
                        >
                            <i className="fas fa-trash mr-2"></i> Sim, excluir
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Delete File Modal */}
        {fileToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 text-slate-800 dark:text-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
                        <i className="fas fa-exclamation-triangle mr-2"></i> Excluir Arquivo
                    </h3>
                    <p className="mb-6">
                        Tem certeza que deseja deletar o arquivo <strong>"{fileToDelete.name}"</strong>?
                        Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setFileToDelete(null)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDeleteFile}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm shadow-sm transition-colors"
                        >
                            <i className="fas fa-trash mr-2"></i> Sim, excluir
                        </button>
                    </div>
                </div>
            </div>
        )}

    </motion.div>
  );
};

export default RepositoryScreen;
