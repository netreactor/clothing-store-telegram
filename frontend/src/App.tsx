import { Component, type ReactNode } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { DatabaseProvider } from '@/context/DatabaseContext';
import { TelegramProvider } from '@/context/TelegramContext';
import { AuthProvider } from '@/context/AuthContext';
import StorePage from '@/pages/StorePage';
import AdminPage from '@/pages/AdminPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import { ThemeProvider } from '@/context/ThemeContext';
import './App.css';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d131a',
          color: '#f8fafc',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Произошла ошибка
            </h2>
            <p style={{ color: 'rgba(248,250,252,0.6)', marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'Неизвестная ошибка'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '#/';
                window.location.reload();
              }}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#f8fafc',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Перезагрузить
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TelegramProvider>
          <AuthProvider>
            <DatabaseProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<StorePage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </Router>
            </DatabaseProvider>
          </AuthProvider>
        </TelegramProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
