'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
    errorInfo: undefined,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    console.error("Error stack:", error.stack);
    console.error("Component stack:", errorInfo.componentStack);

    // Log environment info for debugging
    console.log("Environment:", {
      mode: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    // Store error details in state for display
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Ocurrió un error inesperado.</h1>
          <p className="text-gray-600 mt-2">
            Nuestro equipo ha sido notificado. Por favor, intenta refrescar la página o vuelve a intentarlo más tarde.
          </p>

          {isDev && this.state.error && (
            <div className="mt-6 w-full max-w-2xl bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <h2 className="text-lg font-bold text-red-800 mb-2">Error Details (Development Only)</h2>
              <div className="text-sm text-red-900 font-mono overflow-auto">
                <p className="mb-2"><strong>Message:</strong> {this.state.error.message}</p>
                <details>
                  <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap">{this.state.error.stack}</pre>
                </details>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-semibold">Component Stack</summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  </details>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Refrescar Página
            </button>
            <a
              href="/"
              className="px-6 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Ir al Inicio
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
