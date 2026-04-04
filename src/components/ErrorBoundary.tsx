import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    // @ts-ignore
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    // @ts-ignore
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      let errorDetails = "";
      
      // @ts-ignore
      if (this.state.error) {
        try {
          // @ts-ignore
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error === "Missing or insufficient permissions.") {
            errorMessage = "Erro de Permissão no Banco de Dados";
            errorDetails = "Você não tem permissão para acessar ou modificar estes dados. Por favor, verifique se você está logado com a conta correta.";
          } else {
            // @ts-ignore
            errorDetails = parsedError.error || this.state.error.message;
          }
        } catch (e) {
          // @ts-ignore
          errorDetails = this.state.error.message;
        }
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{errorMessage}</h1>
            <p className="text-gray-600 mb-6">{errorDetails}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
