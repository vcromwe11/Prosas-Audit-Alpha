import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../types';
import { subscribeToUsers, updateUserRole, adminCreateUser, updateUserProfile } from '../services/storageService';

const UserManagementScreen: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    // Form State
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserTempPass, setNewUserTempPass] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'analyst' | 'viewer'>('viewer');
    const [newUserState, setNewUserState] = useState('');
    const [newUserCompany, setNewUserCompany] = useState('');
    const [newUserFunction, setNewUserFunction] = useState('');
    const [createError, setCreateError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToUsers((fetchedUsers) => {
            setUsers(fetchedUsers);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (uid: string, newRole: 'admin' | 'analyst' | 'viewer') => {
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
        const newPass = prompt('Digite a nova senha temporária para este usuário:');
        if (newPass && newPass.trim() && newPass.length >= 6) {
            setUpdatingUserId(uid);
            await updateUserProfile(uid, { temporaryPassword: newPass.trim() });
            setUpdatingUserId(null);
        } else if (newPass) {
            alert('A senha deve ter pelo menos 6 caracteres.');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');

        if (newUserTempPass.length < 6) {
            setCreateError('A senha temporária deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsCreating(true);
        try {
            await adminCreateUser({
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
        } catch (error: any) {
            setCreateError('Erro ao criar usuário. O e-mail pode já estar em uso ou a senha é muito fraca.');
        } finally {
            setIsCreating(false);
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
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gerenciamento de Usuários</h1>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-prosas-blue hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm flex items-center gap-2 transition-colors"
                >
                    <i className="fas fa-plus"></i> Novo Usuário
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Apenas administradores podem ver esta tela, adicionar usuários e modificar permissões/senhas.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Caregando usuários...</div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Usuário</th>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Permissão</th>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Detalhes Adicionais</th>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-right">Acesso (Senha Temp.)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.uid} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-4 px-4 align-top">
                                            <div className="flex items-start gap-3">
                                                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full shadow-sm" />
                                                <div>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200 block">{user.name}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 align-top">
                                            <select 
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                                                disabled={updatingUserId === user.uid}
                                                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded focus:ring-prosas-blue focus:border-prosas-blue block p-2 disabled:opacity-50"
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
                                            {user.temporaryPassword ? (
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600">
                                                        <span className="font-mono text-sm text-gray-800 dark:text-gray-200 min-w-[80px] text-center">
                                                            {visiblePasswords[user.uid] ? user.temporaryPassword : '••••••••'}
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
                                                <span className="text-xs text-gray-400 italic block mt-2">Login Google (Sem Senha Temp)</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-500">Nenhum usuário encontrado.</td>
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
        </motion.div>
    );
};

export default UserManagementScreen;
