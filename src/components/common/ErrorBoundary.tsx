import React from 'react';
export class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() { 
    if (this.state.hasError) {
      return (
        <div className="bg-rose-950 border border-rose-500/50 p-8 text-rose-300">
          <h2 className="text-xl font-bold mb-4">React Error</h2>
          <pre className="whitespace-pre-wrap text-sm">{this.state.error?.stack || this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}
