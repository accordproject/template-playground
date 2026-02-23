import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#d32f2f' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '1rem', marginBottom: '2rem', color: '#666', maxWidth: '600px' }}>
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#19c6c7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          {this.state.error && (
            <details style={{ marginTop: '2rem', maxWidth: '800px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#666', fontSize: '0.9rem' }}>
                Error details
              </summary>
              <pre style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.85rem'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
