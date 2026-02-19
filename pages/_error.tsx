import * as Sentry from '@sentry/nextjs';
import type { NextPageContext } from 'next';
import React from 'react';

interface ErrorProps {
  statusCode?: number;
  err?: Error;
}

function Error({ statusCode, err }: ErrorProps) {
  try {
    // Log error to Sentry if available
    if (err && Sentry) {
      Sentry.captureException(err, {
        tags: {
          type: 'page-error',
          statusCode: statusCode?.toString() || 'unknown',
        },
      });
    }

    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            {statusCode ? `Error ${statusCode}` : 'An error occurred'}
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            {statusCode === 404
              ? 'The page you are looking for does not exist.'
              : 'Something went wrong. Please try refreshing the page.'
            }
          </p>
          {err && process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 p-4 bg-[var(--bg-secondary)] rounded text-sm text-[var(--color-error)] overflow-auto max-w-md">
              {err.message}
            </pre>
          )}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="mt-6 bg-[var(--color-brand-accent)] text-[var(--bg-primary)] px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  } catch (errorBoundaryErr) {
    // Fallback error boundary - render minimal UI if above fails
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-lg text-[var(--text-secondary)]">An unexpected error occurred.</p>
        </div>
      </div>
    );
  }
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as { statusCode?: number }).statusCode : 404;
  return { statusCode, err: err as Error | undefined };
};

export default Error;
