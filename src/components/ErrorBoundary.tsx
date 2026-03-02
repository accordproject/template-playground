import { Component, ErrorInfo, ReactNode } from 'react';
import useAppStore from '../store/store';

interface Props {
  children: ReactNode;
  showDevDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Get theme colors from store
      const { backgroundColor, textColor } = useAppStore.getState();
      const isDarkMode = backgroundColor === '#121212';
      const showDevDetails = this.props.showDevDetails ?? import.meta.env.DEV;
      
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: backgroundColor
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#d32f2f' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '1rem', marginBottom: '2rem', color: textColor, maxWidth: '600px', opacity: 0.8 }}>
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>
          <button
            type="button"
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
          {this.state.error && showDevDetails && (
            <details style={{ marginTop: '2rem', maxWidth: '800px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: textColor, opacity: 0.8, fontSize: '0.9rem' }}>
                Error details
              </summary>
              <pre style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
                color: textColor,
                border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.85rem'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack && (
                  <>
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
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
