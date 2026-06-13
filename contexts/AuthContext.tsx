import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, linkWithPopup, browserPopupRedirectResolver } from 'firebase/auth';
import { subscribeToUsers } from '../services/storageService';

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
  setDriveToken: (token: string | null) => void;
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
            // Set an optimistic user immediately so the UI doesn't hang waiting for Firestore
            setUser({
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
                email: firebaseUser.email || '',
                avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email?.split('@')[0] || 'User'}&background=C13B2E&color=fff&size=128`,
                role: 'viewer' // Default role
            });

            unsubscribeUsers = subscribeToUsers((users) => {
                const appUser = users.find(u => u.uid === firebaseUser.uid);
                if (appUser) {
                    setUser(appUser);
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
              await createUserWithEmailAndPassword(auth, email, password);
          }
      } catch (error: any) {
          setAuthError(error.message || "Erro na autenticação.");
      }
  };

  const handleGoogleAuth = async () => {
      setAuthError('');
      try {
          const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential && credential.accessToken) {
              setDriveToken(credential.accessToken);
              setDriveStatus('ready');
              setDriveMsg('Conectado ao Drive');
          }
      } catch (error: any) {
          console.error("Auth error:", error);
          if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
              setAuthError('O pop-up de login foi bloqueado pelo navegador. Para entrar com Google, por favor, abra o aplicativo em uma nova guia (botão no topo direito da tela).');
          } else {
              setAuthError(error.message || "Erro no login com Google. Tente abrir o app em uma nova guia.");
          }
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
              const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
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
          } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
              alert("O pop-up de login foi bloqueado. Por favor, abra o aplicativo em uma nova guia para conectar-se ao Drive.");
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
      driveToken, setDriveToken, driveStatus, setDriveStatus, driveMsg, setDriveMsg, connectDrive
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
