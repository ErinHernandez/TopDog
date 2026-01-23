/**
 * Dev Linking Components
 * Development navigation and UI components for testing
 */

import React, { ReactNode } from 'react';
import type { JSX } from 'react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface DevLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}

interface DevButtonProps {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}

interface DevSectionProps {
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}

interface DevTextProps {
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * DevLink component for development navigation
 */
export const DevLink = ({ href, children, className = "", ...props }: DevLinkProps): JSX.Element => {
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
};

/**
 * DevButton component for development actions
 */
export const DevButton = ({ onClick, children, className = "", ...props }: DevButtonProps): JSX.Element => {
  return (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  );
};

/**
 * DevSection component for development sections
 */
export const DevSection = ({ children, className = "", ...props }: DevSectionProps): JSX.Element => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

/**
 * DevText component for development text
 */
export const DevText = ({ children, className = "", ...props }: DevTextProps): JSX.Element => {
  return (
    <span className={className} {...props}>
      {children}
    </span>
  );
};
