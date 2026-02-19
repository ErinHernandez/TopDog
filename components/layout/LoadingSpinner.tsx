/**
 * LoadingSpinner Component
 * Lightweight, CSS-based loading indicator
 * Used as fallback for dynamic imports and async operations
 */

import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  /** Size of spinner: 'sm' (24px), 'md' (32px), 'lg' (48px) */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label displayed below spinner */
  label?: string;
  /** Additional CSS class name */
  className?: string;
  /** Center spinner vertically and horizontally */
  centered?: boolean;
}

/**
 * LoadingSpinner Component
 * Pure CSS animation spinner for loading states
 * No external dependencies, uses CSS custom properties from globals.css
 *
 * @param props - Spinner configuration
 * @returns Loading spinner element
 *
 * @example
 * ```tsx
 * // Basic spinner
 * <LoadingSpinner />
 *
 * // With label and custom size
 * <LoadingSpinner size="lg" label="Loading image..." centered />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  label,
  className,
  centered = false,
}: LoadingSpinnerProps) {
  const sizeClass = styles[`size-${size}`] || styles['size-md'];
  const containerClass = centered ? styles.centered : '';
  const wrapperClass = `${styles.spinner} ${sizeClass} ${containerClass} ${className || ''}`;

  return (
    <div className={wrapperClass}>
      {/* Outer ring animation */}
      <div className={styles.ring} />
      {/* Inner indicator dots */}
      <div className={styles.dot} style={{ animationDelay: '0s' }} />
      <div className={styles.dot} style={{ animationDelay: '-0.2s' }} />
      <div className={styles.dot} style={{ animationDelay: '-0.4s' }} />
      {/* Label text if provided */}
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}

export default LoadingSpinner;
