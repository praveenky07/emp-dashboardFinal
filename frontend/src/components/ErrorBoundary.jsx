import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CRITICAL-UI] Error captured by Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-rose-50 border-2 border-rose-100 rounded-[32px] p-10 max-w-md text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-rose-900 leading-tight">Something went wrong</h2>
              <p className="text-rose-600 font-bold text-sm">
                We encountered an unexpected error while rendering this page.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs flex items-center gap-3 mx-auto transition-all shadow-lg shadow-rose-200"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <p className="text-[10px] text-rose-300 font-black uppercase tracking-tighter">
                Error ID: {(Math.random() * 100000).toFixed(0)} • Details logged in console
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
