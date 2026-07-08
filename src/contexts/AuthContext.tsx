import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider } from 'firebase/auth';
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

  useEffect(() => {
    let unsubscribeUsers: () => void;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
                const { syncUserProfile } = await import('../services/storageService');
                await syncUserProfile();
            } catch (e) {
                console.error("Error syncing profile:", e);
            }

            unsubscribeUsers = subscribeToUsers((users) => {
                const appUser = users.find(u => u.uid === firebaseUser.uid);
                if (appUser) {
                    setUser(appUser);
                } else {
                    setUser({
                        uid: firebaseUser.uid,
                        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
                        email: firebaseUser.email || '',
                        avatarUrl: firebaseUser.photoURL || '',
                        role: 'viewer'
                    });
                }
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
      } catch (error: any) {
          setAuthError(error.message || "Erro no login com Google.");
      }
  };

  const handleLogout = async () => {
      await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, email, setEmail, password, setPassword,
      isLoginMode, setIsLoginMode, authError, setAuthError,
      handleEmailAuth, handleGoogleAuth, handleLogout
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
