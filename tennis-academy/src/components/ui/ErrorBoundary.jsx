// src/components/ui/ErrorBoundary.jsx
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center py-16 px-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-12 h-12 rounded-full bg-err-bg flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-err" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink">Something went wrong</h3>
              <p className="text-sm text-ink-muted mt-1">This screen encountered an error. Try refreshing the page.</p>
            </div>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-line text-sm font-medium text-ink hover:bg-canvas-soft transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}