import React from 'react';

interface LoginScreenProps {
  firebaseError: string | null;
  authError: string;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoginMode: boolean;
  setIsLoginMode: (isLoginMode: boolean) => void;
  handleEmailAuth: (e: React.FormEvent) => void;
  handleGoogleAuth: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  firebaseError,
  authError,
  email,
  setEmail,
  password,
  setPassword,
  isLoginMode,
  setIsLoginMode,
  handleEmailAuth,
  handleGoogleAuth,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 transition-colors duration-200">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center border-t-4 border-prosas-red transition-colors duration-200">
            <h1 className="text-3xl font-bold italic text-prosas-red mb-2">prosas</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Auditoria de Projetos IA</p>
            
            {firebaseError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm text-left">
                    {firebaseError}
                </div>
            )}

            {authError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm text-left">
                    {authError}
                </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                <div>
                    <input 
                        type="email" 
                        placeholder="Seu e-mail" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-prosas-blue outline-none"
                        required
                        maxLength={100}
                    />
                </div>
                <div>
                    <input 
                        type="password" 
                        placeholder="Sua senha" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-prosas-blue outline-none"
                        required
                        maxLength={100}
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-prosas-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                    {isLoginMode ? 'Entrar' : 'Cadastrar'}
                </button>
            </form>

            <div className="relative flex items-center py-2 mb-6">
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-sm">ou</span>
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            <button 
              onClick={handleGoogleAuth}
              type="button"
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 px-4 rounded flex items-center justify-center gap-3 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 transition-all duration-200 mb-6"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Continuar com Google
            </button>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
                {isLoginMode ? "Não tem uma conta? " : "Já tem uma conta? "}
                <button 
                    type="button" 
                    onClick={() => setIsLoginMode(!isLoginMode)}
                    className="text-prosas-blue hover:underline font-bold"
                >
                    {isLoginMode ? "Cadastre-se" : "Faça login"}
                </button>
            </p>
        </div>
    </div>
  );
};
