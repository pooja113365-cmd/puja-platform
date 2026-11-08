import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { failed: true, error };
  }
  componentDidCatch(err) {
    console.error(err);
    // Auto-recover once from stale Vite HMR / pre-bundled dependency state
    try {
      const key = 'vedapujas_hmr_recovered';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
    } catch {
      // ignore storage errors
    }
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-6 text-center">
          <div className="max-w-md rounded-2xl border border-gold-400/60 bg-white p-8 shadow-lg">
            <h1 className="font-serif text-3xl font-bold text-maroon-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-maroon-700/80">
              {this.state.error?.message || 'The page encountered a temporary reload issue.'}
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem('vedapujas_hmr_recovered');
                } catch {
                  // ignore
                }
                window.location.reload();
              }}
              className="btn-primary mt-5"
            >
              Reload VedaPujas
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

