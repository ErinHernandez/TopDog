/**
 * Date Formatting Utilities
 * 
 * Functions for formatting dates and times consistently.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface FormatDateOptions {
  /** Include time */
  includeTime?: boolean;
  /** Use relative time (e.g., "2 hours ago") */
  relative?: boolean;
  /** Date format style */
  style?: 'short' | 'medium' | 'long';
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Format a date string or Date object
 * 
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2024-12-08T10:30:00Z') // "Dec 8, 2024"
 * formatDate(new Date(), { includeTime: true }) // "Dec 8, 2024 at 10:30 AM"
 * formatDate('2024-12-08', { relative: true }) // "2 hours ago"
 */
export function formatDate(
  date: string | Date | number,
  options: FormatDateOptions = {}
): string {
  const {
    includeTime = false,
    relative = false,
    style = 'medium',
  } = options;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Invalid date check
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  // Relative time
  if (relative) {
    return formatRelativeTime(dateObj);
  }
  
  // Style configurations
  const dateStyles: Record<typeof style, Intl.DateTimeFormatOptions> = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric', weekday: 'long' },
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = includeTime 
    ? { hour: 'numeric', minute: '2-digit', hour12: true }
    : {};
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    ...dateStyles[style],
    ...timeOptions,
  });
  
  return formatter.format(dateObj);
}

/**
 * Format time only
 * 
 * @param date - Date to format
 * @param use24Hour - Use 24-hour format
 * @returns Formatted time string
 */
export function formatTime(
  date: string | Date | number,
  use24Hour = false
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid time';
  }
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
  });
}

/**
 * Format as relative time (e.g., "2 hours ago", "in 3 days")
 * 
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const isFuture = diffMs < 0;
  const absDays = Math.abs(diffDays);
  const absHours = Math.abs(diffHours);
  const absMins = Math.abs(diffMins);
  const absSecs = Math.abs(diffSecs);
  
  // Format the value
  let value: string;
  
  if (absDays >= 30) {
    // More than a month - show date
    return formatDate(dateObj, { style: 'medium' });
  } else if (absDays >= 7) {
    const weeks = Math.floor(absDays / 7);
    value = `${weeks} week${weeks > 1 ? 's' : ''}`;
  } else if (absDays >= 1) {
    value = `${absDays} day${absDays > 1 ? 's' : ''}`;
  } else if (absHours >= 1) {
    value = `${absHours} hour${absHours > 1 ? 's' : ''}`;
  } else if (absMins >= 1) {
    value = `${absMins} minute${absMins > 1 ? 's' : ''}`;
  } else {
    value = 'just now';
    return value;
  }
  
  return isFuture ? `in ${value}` : `${value} ago`;
}

/**
 * Format duration in seconds to readable string
 * 
 * @param seconds - Duration in seconds
 * @param compact - Use compact format
 * @returns Formatted duration string
 * 
 * @example
 * formatDuration(3665) // "1h 1m 5s"
 * formatDuration(45) // "45s"
 */
export function formatDuration(seconds: number, compact = true): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (compact) {
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
  }
  
  // Full format
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
  return parts.join(', ');
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date | number): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: string | Date | number): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
  );
}

