import { Timestamp } from 'firebase/firestore';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Format a Firestore Timestamp for display in a conversation preview.
 * Shows time if today, "Yesterday" if yesterday, or date otherwise.
 */
export function formatConversationTime(timestamp: Timestamp | null): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

/**
 * Format a Firestore Timestamp for display within a message bubble.
 */
export function formatMessageTime(timestamp: Timestamp | null): string {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return format(date, 'h:mm a');
}

/**
 * Format a Timestamp as a relative time string (e.g. "3 minutes ago").
 */
export function formatRelativeTime(timestamp: Timestamp | null): string {
  if (!timestamp) return 'Unknown';
  return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
}

/**
 * Get initials from a display name for use in avatar placeholders.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate a string to a maximum length with an ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Generate a consistent HSL color from a string (for avatar backgrounds).
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 50%)`;
}

/**
 * Validate an email address format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate a password meets minimum requirements.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
