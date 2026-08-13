import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            color: '#f0f0f0',
            padding: '20px',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#141414',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '16px',
              padding: '30px',
              textAlign: 'center',
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                fontSize: '2.5rem',
                marginBottom: '12px',
              }}
            >
              ⚠️
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>
              Algo deu errado na exibição
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#9a9a9a', marginBottom: '20px', lineHeight: 1.5 }}>
              Ocorreu um erro ao carregar a interface. Clique abaixo para reiniciar a aplicação com segurança.
            </p>
            {this.state.error && (
              <pre
                style={{
                  textAlign: 'left',
                  background: '#090d16',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: '#f43f5e',
                  overflowX: 'auto',
                  marginBottom: '20px',
                  maxHeight: '120px',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Recarregar Página
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#9a9a9a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Limpar Cache Local
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
