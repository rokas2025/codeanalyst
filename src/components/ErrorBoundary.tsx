import React from 'react'

type ErrorBoundaryState = { hasError: boolean; error?: Error; info?: React.ErrorInfo }

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for diagnostics
    // You can later wire this to a remote logger
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Info:', info)
    this.setState({ info })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Something went wrong.</h1>
          {this.state.error && (
            <pre style={{ whiteSpace: 'pre-wrap', background: '#111827', color: '#e5e7eb', padding: 12, borderRadius: 8 }}>
              {String(this.state.error?.stack || this.state.error?.message)}
            </pre>
          )}
          {this.state.info && (
            <details style={{ marginTop: 12 }}>
              <summary>Component stack</summary>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.info?.componentStack}</pre>
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
} 