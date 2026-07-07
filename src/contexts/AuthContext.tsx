import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, linkWithPopup } from 'firebase/auth';
import { subscribeToUsers, updateUserProfile } from '../services/storageService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoginMode: boolean;
  setIsLoginMode: (isLoginMode: boolean) => void;
  authError: string;
  setAuthError: (error: string) => void;
  handleEmailAuth: (e: React.FormEvent) => Promise<void>;
  handleGoogleAuth: () => Promise<void>;
  handleLogout: () => Promise<void>;
  driveToken: string | null;
  driveStatus: 'disconnected' | 'ready' | 'syncing' | 'error';
  driveMsg: string;
  connectDrive: () => Promise<void>;
  setDriveStatus: (status: 'disconnected' | 'ready' | 'syncing' | 'error') => void;
  setDriveMsg: (msg: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');
  
  // Drive State
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveStatus, setDriveStatus] = useState<'disconnected' | 'ready' | 'syncing' | 'error'>('disconnected');
  const [driveMsg, setDriveMsg] = useState('');

  useEffect(() => {
    let unsubscribeUsers: () => void;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            unsubscribeUsers = subscribeToUsers((users) => {
                const appUser = users.find(u => u.uid === firebaseUser.uid);
                if (appUser) {
                    setUser(appUser);
                } else {
                    // Do not attempt to persist standard new users here to prevent rule errors.
                    // syncUserProfile in App.tsx correctly handles the pre-registration logic and signout.
                    setUser({
                        uid: firebaseUser.uid,
                        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
                        email: firebaseUser.email || '',
                        avatarUrl: firebaseUser.photoURL || '',
                        role: 'viewer'
                    });
                }
            });
            // Try to restore Drive token from Google provider if returning
            firebaseUser.getIdTokenResult().then(() => {
                // Not getting token directly from here, handled differently usually, but we keep state clean
            });
        } else {
            setUser(null);
            if (unsubscribeUsers) unsubscribeUsers();
        }
        setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      try {
          if (isLoginMode) {
              await signInWithEmailAndPassword(auth, email, password);
          } else {
              throw new Error("A criação de novas contas na tela de login está desativada por motivos de segurança.");
          }
      } catch (error: any) {
          console.error("Auth error:", error);
          if (error.code === 'auth/invalid-credential') {
              setAuthError('E-mail ou senha incorretos. Se este perfil foi criado a partir de um login pré-existente via Google, não há senha definida. Clique no botão "Continuar com Google" abaixo.');
          } else if (error.code === 'auth/unauthorized-domain') {
              setAuthError('Domínio não autorizado. Adicione o domínio do Vercel na aba de Domínios Autorizados do Firebase Console (Authentication -> Settings).');
          } else {
              setAuthError(error.message || "Erro na autenticação.");
          }
      }
  };

  const handleGoogleAuth = async () => {
      setAuthError('');
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential && credential.accessToken) {
              setDriveToken(credential.accessToken);
              setDriveStatus('ready');
              setDriveMsg('Conectado ao Drive');
          }
      } catch (error: any) {
          setAuthError(error.message || "Erro no login com Google.");
      }
  };

  const handleLogout = async () => {
      await signOut(auth);
      setDriveToken(null);
      setDriveStatus('disconnected');
      setDriveMsg('');
  };

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

  return (
    <AuthContext.Provider value={{
      user, loading, email, setEmail, password, setPassword,
      isLoginMode, setIsLoginMode, authError, setAuthError,
      handleEmailAuth, handleGoogleAuth, handleLogout,
      driveToken, driveStatus, setDriveStatus, driveMsg, setDriveMsg, connectDrive
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
