import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { Card } from './Card';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log error using simple logging
    logger.error('Error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  handleRetry = () => {
    logger.info('Error boundary retry attempted');
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full"
          >
            <Card className="text-center" padding="xl">
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon className="w-8 h-8 text-error-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                Oops! Something went wrong
              </h2>
              
              <p className="text-neutral-600 mb-6">
                We encountered an unexpected error. Don't worry, your data is safe. 
                Please try refreshing the page or contact support if the problem persists.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-neutral-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="bg-neutral-100 rounded-lg p-4 text-xs font-mono text-neutral-800 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  icon={<ArrowPathIcon />}
                  size="lg"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  size="lg"
                >
                  Refresh Page
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = () => setError(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};
