import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught Error in Component:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#080a0f',
                    color: '#ffffff',
                    padding: '24px',
                    textAlign: 'center'
                }}>
                    <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px', color: 'var(--accent-gold)' }}>
                            Ocurrió un inconveniente temporal
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
                            La vista se está actualizando. Haz clic en el botón para recargar la aplicación.
                        </p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="btn-primary"
                            style={{ padding: '14px 28px', borderRadius: '10px' }}
                        >
                            Recargar Portal
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
