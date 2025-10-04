import React, { Component, ReactNode } from 'react';
import { useLineupsStore } from '../../store/lineups';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lineup page error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      // Clear lineup working state
      localStorage.removeItem('yslm_lineup_working_v1');
    } catch {}
    
    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong with the Lineup Builder
            </h2>
            <p className="text-red-600 mb-4">
              There was an error loading or displaying your lineup. 
              This might be due to outdated data in your browser storage.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-red-600 hover:text-red-700">
                  Technical details
                </summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded border border-red-200 overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
              >
                Reset Lineup State
              </button>
              <a
                href="/teamsheets"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-medium inline-block"
              >
                Go to Teamsheets
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;