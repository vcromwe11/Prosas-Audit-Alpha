import { useState, useEffect, useCallback } from 'react';
import { findBackupFile, uploadToDrive, downloadFromDrive } from '../services/driveService';
import { saveAllReports } from '../services/storageService';
import { SavedReport } from '../types';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, linkWithPopup, GoogleAuthProvider } from 'firebase/auth';

export const useDriveBackup = (
    allReports: SavedReport[],
    autoSaveDrive: boolean,
    checkPermission: (action: string) => boolean
) => {
    const [driveToken, setDriveToken] = useState<string | null>(null);
    const [driveStatus, setDriveStatus] = useState<'disconnected' | 'ready' | 'syncing' | 'error'>('disconnected');
    const [driveMsg, setDriveMsg] = useState('');

    const connectDrive = async () => {
        try {
            if (!auth.currentUser) return;
            
            let credential;
            
            const isGoogleLinked = auth.currentUser.providerData.some(p => p.providerId === 'google.com');
            
            if (isGoogleLinked) {
                const result = await signInWithPopup(auth, googleProvider);
                credential = GoogleAuthProvider.credentialFromResult(result);
            } else {
                const result = await linkWithPopup(auth.currentUser, googleProvider);
                credential = GoogleAuthProvider.credentialFromResult(result);
            }

            if (credential && credential.accessToken) {
                setDriveToken(credential.accessToken);
                setDriveStatus('ready');
                setDriveMsg('Conectado ao Drive');
            } else {
                setDriveStatus('error');
                setDriveMsg('Não foi possível obter a credencial do Drive.');
            }
        } catch (error: any) {
            console.error("Erro ao conectar Google Drive:", error);
            if (error.code === 'auth/credential-already-in-use') {
                alert("Atenção: Esta conta Google já está cadastrada no sistema ou vinculada a outro usuário. Para acessar o Drive com esta conta, você deve fazer login diretamente através do Google na tela inicial.");
            }
            setDriveStatus('error');
            setDriveMsg('Erro na autenticação.');
        }
    };

    const handleBackupToDrive = useCallback(async () => {
        if (!driveToken) return;
        setDriveStatus('syncing');
        setDriveMsg('Salvando...');
        
        try {
            const reports = allReports;
            // Find existing file to overwrite, or create new
            const existingFileId = await findBackupFile(driveToken);
            await uploadToDrive(driveToken, reports, existingFileId);
            
            setDriveStatus('ready');
            setDriveMsg(`Backup salvo! (${reports.length} itens)`);
            setTimeout(() => setDriveMsg('Conectado ao Drive'), 3000);
        } catch (e: any) {
            console.error(e);
            if (e.name === 'DriveAuthError' || e.message?.includes('Token expirado') || e.message?.includes('401')) {
                setDriveStatus('disconnected');
                setDriveToken(null);
                setDriveMsg('Sessão expirada. Reconecte-se.');
            } else {
                setDriveStatus('error');
                setDriveMsg('Erro ao salvar');
            }
        }
    }, [driveToken, allReports]);

    const handleRestoreFromDrive = useCallback(async () => {
        if (!checkPermission('mutate_data')) {
            alert('Você não tem permissão para realizar esta ação.');
            return;
        }
        if (!driveToken) return;
        
        if (!window.confirm("Isso substituirá os dados atuais pelos do Drive. Continuar?")) return;
        
        setDriveStatus('syncing');
        setDriveMsg('Baixando...');
        
        try {
            const fileId = await findBackupFile(driveToken);
            if (!fileId) {
                setDriveStatus('error');
                setDriveMsg('Nenhum backup encontrado.');
                return;
            }
            
            const data = await downloadFromDrive(driveToken, fileId);
            if (Array.isArray(data)) {
                await saveAllReports(data);
                setDriveStatus('ready');
                setDriveMsg('Restaurado com sucesso!');
            } else {
                throw new Error("Formato inválido");
            }
        } catch (e: any) {
            console.error(e);
            if (e.name === 'DriveAuthError' || e.message?.includes('Token expirado') || e.message?.includes('401')) {
                setDriveStatus('disconnected');
                setDriveToken(null);
                setDriveMsg('Sessão expirada. Reconecte-se.');
                alert("Sua sessão do Google Drive expirou. Por favor, conecte-se novamente.");
            } else {
                setDriveStatus('error');
                setDriveMsg('Erro ao restaurar');
            }
        }
    }, [driveToken, checkPermission]);

    useEffect(() => {
        if (!allReports || allReports.length === 0) {
            return;
        }
        if (autoSaveDrive && driveToken && driveStatus === 'ready') {
            const timeoutId = setTimeout(() => {
                handleBackupToDrive();
            }, 10000); 
            
            return () => clearTimeout(timeoutId);
        }
    }, [allReports, autoSaveDrive, driveToken, driveStatus, handleBackupToDrive]);

    return {
        driveToken,
        driveStatus,
        driveMsg,
        connectDrive,
        handleBackupToDrive,
        handleRestoreFromDrive
    };
};
