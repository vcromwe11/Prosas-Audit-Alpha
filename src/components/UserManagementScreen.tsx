import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../types';
import { subscribeToUsers, updateUserRole, adminCreateUser, updateUserProfile, deleteUserProfile, fetchAllTemporaryPasswords } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const UserManagementScreen: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';
    const { success, error: toastError, warning } = useToast();

    // Form State (New User)
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserTempPass, setNewUserTempPass] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'analyst' | 'viewer'>('viewer');
    const [newUserState, setNewUserState] = useState('');
    const [newUserCompany, setNewUserCompany] = useState('');
    const [newUserFunction, setNewUserFunction] = useState('');
    const [createError, setCreateError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Edit Modal State
    const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
    const [editName, setEditName] = useState('');
    const [editCompany, setEditCompany] = useState('');
    const [editJobFunction, setEditJobFunction] = useState('');
    const [editState, setEditState] = useState('');
    const [editRole, setEditRole] = useState<'admin' | 'analyst' | 'viewer'>('viewer');
    const [editTempPass, setEditTempPass] = useState('');
    const [editError, setEditError] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Delete confirmation state
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
    const [userCredentials, setUserCredentials] = useState<Record<string, string>>({});

    useEffect(() => {
        const unsubscribe = subscribeToUsers((fetchedUsers) => {
            setUsers(fetchedUsers);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!users.length || !isAdmin) return;
        const fetchCreds = async () => {
            const creds = await fetchAllTemporaryPasswords(users.map(u => u.uid));
            setUserCredentials(creds);
        };
        fetchCreds();
    }, [users, isAdmin]);

    const handleRoleChange = async (uid: string, newRole: 'admin' | 'analyst' | 'viewer') => {
        if (!isAdmin) return;
        setUpdatingUserId(uid);
        await updateUserRole(uid, newRole);
        setUpdatingUserId(null);
    };

    const togglePasswordVisibility = (uid: string) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [uid]: !prev[uid]
        }));
    };

    const handlePasswordChange = async (uid: string) => {
        if (!isAdmin && uid !== currentUser?.uid) return;
        const newPass = prompt('Digite a nova senha temporária para este usuário:');
        if (newPass && newPass.trim() && newPass.length >= 6) {
            setUpdatingUserId(uid);
            await updateUserProfile(uid, { temporaryPassword: newPass.trim() });
            setUserCredentials(prev => ({ ...prev, [uid]: newPass.trim() }));
            setUpdatingUserId(null);
        } else if (newPass) {
            toastError('Ação negada: A senha deve ter pelo menos 6 caracteres.');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) return;
        setCreateError('');

        if (newUserTempPass.length < 6) {
            setCreateError('A senha temporária deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsCreating(true);
        try {
            const newProf = await adminCreateUser({
                name: newUserName,
                email: newUserEmail,
                temporaryPassword: newUserTempPass,
                role: newUserRole,
                state: newUserState,
                company: newUserCompany,
                jobFunction: newUserFunction
            });
            
            // Reset form
            setIsCreateModalOpen(false);
            setNewUserName('');
            setNewUserEmail('');
            setNewUserTempPass('');
            setNewUserState('');
            setNewUserCompany('');
            setNewUserFunction('');
            setNewUserRole('viewer');

            if ((newProf as any).isUpdatingExisting) {
                warning(`Aviso: O e-mail ${newUserEmail} já estava cadastrado no banco de dados. O perfil existente foi atualizado em vez de criar um novo.`);
            } else if ((newProf as any).isPreRegistration) {
                warning(`O usuário foi cadastrado, mas o e-mail ${newUserEmail} já possuía uma conta (provavelmente via Google). A senha anterior foi mantida.`);
            }

        } catch (error: any) {
            console.error("User creation error:", error);
            setCreateError(`Erro ao criar usuário: ${error.message || 'O e-mail pode já estar em uso ou a senha é muito fraca.'}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleOpenEdit = (user: UserProfile) => {
        setUserToEdit(user);
        setEditName(user.name);
        setEditCompany(user.company || '');
        setEditJobFunction(user.jobFunction || '');
        setEditState(user.state || '');
        setEditRole(user.role);
        setEditTempPass(userCredentials[user.uid] || '');
        setEditError('');
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userToEdit) return;
        
        // Prevent editing if not admin and not own profile
        if (!isAdmin && userToEdit.uid !== currentUser?.uid) {
            setEditError('Você só pode alterar os dados do seu próprio perfil.');
            return;
        }

        setEditError('');
        setIsSavingEdit(true);

        try {
            const updates: Partial<UserProfile> & { temporaryPassword?: string } = {
                name: editName,
                company: editCompany,
                jobFunction: editJobFunction,
                state: editState,
                temporaryPassword: editTempPass || undefined,
            };

            // Non-admin can NOT change permission/role
            if (isAdmin) {
                updates.role = editRole;
            }

            await updateUserProfile(userToEdit.uid, updates); if (editTempPass) { setUserCredentials(prev => ({ ...prev, [userToEdit.uid]: editTempPass })); } else if (editTempPass === "") { setUserCredentials(prev => { const next = { ...prev }; delete next[userToEdit.uid]; return next; }); }
            setUserToEdit(null);
        } catch (error: any) {
            setEditError('Erro ao atualizar usuário: ' + (error.message || error));
        } finally {
            setIsSavingEdit(false);
        }
    };

    return (
        <motion.div
            key="manage_users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-6xl mx-auto pb-12"
        >
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <i className="fas fa-users-cog text-3xl text-prosas-blue"></i>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {isAdmin ? "Gerenciamento de Usuários" : "Meu Perfil / Usuários Autorizados"}
                    </h1>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-prosas-blue hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm flex items-center gap-2 transition-colors"
                    >
                        <i className="fas fa-plus"></i> Novo Usuário
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isAdmin 
                            ? "Você está visualizando como Administrador. É possível adicionar novos usuários, editar dados, alterar permissões/senhas e excluir contas." 
                            : "Você está visualizando a listagem de usuários do sistema. Como Leitor ou Analista, você pode editar apenas os dados da sua própria conta (com exceção do cargo)."
                        }
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Carregando usuários...</div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[850px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Usuário</th>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Permissão / Role</th>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Detalhes Adicionais</th>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-right">Senha Temp (Se houver)</th>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => {
                                    const isSelf = user.uid === currentUser?.uid;
                                    const canEditThisRow = isAdmin || isSelf;
                                    const canDeleteThisRow = isAdmin && !isSelf;

                                    return (
                                        <tr key={user.uid} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isSelf ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}>
                                            <td className="py-4 px-4 align-top">
                                                <div className="flex items-start gap-3">
                                                    <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full shadow-sm" />
                                                    <div>
                                                        <span className="font-medium text-gray-800 dark:text-gray-200 block">
                                                            {user.name} {isSelf && <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-bold ml-1.5">Você</span>}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 block">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 align-top">
                                                <select 
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                                                    disabled={updatingUserId === user.uid || !isAdmin}
                                                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded focus:ring-prosas-blue focus:border-prosas-blue block p-2 disabled:opacity-75 disabled:bg-gray-100 dark:disabled:bg-gray-900 cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    <option value="viewer">Leitor</option>
                                                    <option value="analyst">Analista</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </td>
                                            <td className="py-4 px-4 align-top">
                                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                                    {user.company && <div><span className="font-medium">Empresa:</span> {user.company}</div>}
                                                    {user.jobFunction && <div><span className="font-medium">Função:</span> {user.jobFunction}</div>}
                                                    {user.state && <div><span className="font-medium">Estado:</span> {user.state}</div>}
                                                    {!user.company && !user.jobFunction && !user.state && <span className="text-gray-400 italic">Não definidos</span>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 align-top text-right">
                                                {(isAdmin || isSelf) ? (
                                                    userCredentials[user.uid] ? (
                                                        <div className="flex flex-col items-end gap-2">
                                                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600">
                                                                <span className="font-mono text-sm text-gray-800 dark:text-gray-200 min-w-[80px] text-center">
                                                                    {visiblePasswords[user.uid] ? userCredentials[user.uid] : '••••••••'}
                                                                </span>
                                                                <button 
                                                                    onClick={() => togglePasswordVisibility(user.uid)}
                                                                    className="text-gray-500 hover:text-prosas-blue focus:outline-none"
                                                                    title={visiblePasswords[user.uid] ? 'Ocultar senha' : 'Mostrar senha'}
                                                                >
                                                                    <i className={`fas ${visiblePasswords[user.uid] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                                </button>
                                                            </div>
                                                            <button 
                                                                onClick={() => handlePasswordChange(user.uid)}
                                                                disabled={updatingUserId === user.uid}
                                                                className="text-xs text-prosas-blue hover:underline whitespace-nowrap"
                                                            >
                                                                Alterar Senha
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic block mt-2">Login Google / Sem Senha</span>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-gray-450 dark:text-gray-500 italic block mt-2">•••••••• (Oculto)</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 align-top text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEditThisRow && (
                                                        <button
                                                            onClick={() => handleOpenEdit(user)}
                                                            className="p-1 px-2.5 text-xs bg-blue-50 dark:bg-blue-900/40 text-prosas-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded hover:bg-prosas-blue hover:text-white dark:hover:bg-blue-600 transition-colors flex items-center gap-1 font-medium"
                                                            title="Editar Usuário"
                                                        >
                                                            <i className="fas fa-edit"></i> Editar
                                                        </button>
                                                    )}
                                                    {canDeleteThisRow && (
                                                        <button
                                                            onClick={() => setUserToDelete(user)}
                                                            className="p-1 px-2.5 text-xs bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-650 hover:text-white dark:hover:bg-red-650 transition-colors flex items-center gap-1 font-medium"
                                                            title="Excluir Usuário"
                                                        >
                                                            <i className="fas fa-trash-alt"></i> Excluir
                                                        </button>
                                                    )}
                                                    {!canEditThisRow && !canDeleteThisRow && (
                                                        <span className="text-xs text-gray-400 italic">Sem ações</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500">Nenhum usuário encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Adicionar Novo Usuário</h2>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>

                            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                                {createError && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm mb-4">
                                        <i className="fas fa-exclamation-circle mr-2"></i>
                                        {createError}
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
                                        <input
                                            required
                                            type="text"
                                            value={newUserName}
                                            onChange={(e) => setNewUserName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                            placeholder="João da Silva"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail *</label>
                                        <input
                                            required
                                            type="email"
                                            value={newUserEmail}
                                            onChange={(e) => setNewUserEmail(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                            placeholder="joao@empresa.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha Temporária *</label>
                                        <input
                                            required
                                            type="text"
                                            value={newUserTempPass}
                                            onChange={(e) => setNewUserTempPass(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-mono"
                                            placeholder="Minimo 6 caracteres"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Permissão Inicial *</label>
                                        <select
                                            value={newUserRole}
                                            onChange={(e) => setNewUserRole(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                        >
                                            <option value="viewer">Leitor</option>
                                            <option value="analyst">Analista</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                </div>

                                <hr className="border-gray-100 dark:border-gray-700 my-2" />
                                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Dados Opcionais</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Estado (UF)</label>
                                        <input
                                            type="text"
                                            value={newUserState}
                                            onChange={(e) => setNewUserState(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                            placeholder="Ex: SP"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Empresa</label>
                                        <input
                                            type="text"
                                            value={newUserCompany}
                                            onChange={(e) => setNewUserCompany(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                            placeholder="Nome da Organização"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Função</label>
                                        <input
                                            type="text"
                                            value={newUserFunction}
                                            onChange={(e) => setNewUserFunction(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                            placeholder="Ex: Analista Financeiro"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="px-6 py-2 bg-prosas-blue hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
                                    >
                                        {isCreating ? 'Criando...' : 'Criar Usuário'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit User Modal */}
            <AnimatePresence>
                {userToEdit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Editar Perfil de Usuário</h2>
                                <button
                                    onClick={() => setUserToEdit(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>

                            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                                {editError && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm mb-4">
                                        <i className="fas fa-exclamation-circle mr-2"></i>
                                        {editError}
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
                                        <input
                                            required
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                            placeholder="João da Silva"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail (Não editável)</label>
                                        <input
                                            disabled
                                            type="email"
                                            value={userToEdit.email}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-450 text-sm cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha Temporária</label>
                                        <input
                                            type="text"
                                            value={editTempPass}
                                            onChange={(e) => setEditTempPass(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-mono"
                                            placeholder="Diga uma nova senha se quiser alterar"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Permissão / Cargo {!isAdmin && <span className="text-xs text-gray-400 font-normal">(Apenas admin)</span>}
                                        </label>
                                        <select
                                            disabled={!isAdmin}
                                            value={editRole}
                                            onChange={(e) => setEditRole(e.target.value as any)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-75 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
                                        >
                                            <option value="viewer">Leitor</option>
                                            <option value="analyst">Analista</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                </div>

                                <hr className="border-gray-100 dark:border-gray-700 my-2" />
                                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Dados Adicionais</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Estado (UF)</label>
                                        <input
                                            type="text"
                                            value={editState}
                                            onChange={(e) => setEditState(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                            placeholder="Ex: SP"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Empresa</label>
                                        <input
                                            type="text"
                                            value={editCompany}
                                            onChange={(e) => setEditCompany(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                            placeholder="Nome da Organização"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Função</label>
                                        <input
                                            type="text"
                                            value={editJobFunction}
                                            onChange={(e) => setEditJobFunction(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-prosas-blue focus:border-prosas-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                            placeholder="Ex: Analista Financeiro"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setUserToEdit(null)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit}
                                        className="px-6 py-2 bg-prosas-blue hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
                                    >
                                        {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {userToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full text-center"
                        >
                            <div className="text-red-500 text-4xl mb-4">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Excluir Usuário</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Tem certeza que deseja remover {userToDelete.name || userToDelete.email} permanentemente? Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setUserToDelete(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={async () => {
                                        const uid = userToDelete.uid;
                                        setUserToDelete(null);
                                        setUpdatingUserId(uid);
                                        try {
                                            await deleteUserProfile(uid);
                                        } catch (err: any) {
                                            toastError('Erro ao excluir usuário: ' + (err.message || err));
                                        } finally {
                                            setUpdatingUserId(null);
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                                >
                                    Excluir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default UserManagementScreen;
