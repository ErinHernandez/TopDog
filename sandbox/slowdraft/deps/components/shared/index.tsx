/**
 * Shared Components for Slow Draft Sandbox
 */

import React from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4 }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#ffffff',
          marginBottom: 8,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: action ? 16 : 0,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            backgroundColor: '#60A5FA',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#EF4444',
          marginBottom: 8,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: onRetry ? 16 : 0,
          }}
        >
          {description}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            backgroundColor: '#EF4444',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
