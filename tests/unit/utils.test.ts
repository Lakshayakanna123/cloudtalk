import { describe, it, expect } from 'vitest';
import {
  formatConversationTime,
  formatMessageTime,
  getInitials,
  truncate,
  stringToColor,
  isValidEmail,
  validatePassword,
} from '../../src/utils';
import { Timestamp } from 'firebase/firestore';

// Mock Timestamp for testing
function makeTimestamp(date: Date): Timestamp {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  } as unknown as Timestamp;
}

// ─── formatConversationTime ───────────────────────────────────────────────────

describe('formatConversationTime', () => {
  it('returns empty string for null', () => {
    expect(formatConversationTime(null)).toBe('');
  });

  it('formats today as time string', () => {
    const now = new Date();
    const ts = makeTimestamp(now);
    const result = formatConversationTime(ts);
    // Should match h:mm a pattern
    expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/i);
  });

  it('returns "Yesterday" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const ts = makeTimestamp(yesterday);
    expect(formatConversationTime(ts)).toBe('Yesterday');
  });

  it('formats older dates as MMM d', () => {
    const old = new Date(2024, 0, 15); // Jan 15
    const ts = makeTimestamp(old);
    const result = formatConversationTime(ts);
    expect(result).toBe('Jan 15');
  });
});

// ─── formatMessageTime ─────────────────────────────────────────────────────────

describe('formatMessageTime', () => {
  it('returns empty string for null', () => {
    expect(formatMessageTime(null)).toBe('');
  });

  it('formats timestamp as time', () => {
    const date = new Date(2024, 0, 1, 14, 30);
    const ts = makeTimestamp(date);
    expect(formatMessageTime(ts)).toBe('2:30 PM');
  });
});

// ─── getInitials ──────────────────────────────────────────────────────────────

describe('getInitials', () => {
  it('returns initials for a full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial for single name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('limits to 2 characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });
});

// ─── truncate ─────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('returns the original string if within limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates and adds ellipsis if over limit', () => {
    const result = truncate('Hello World', 8);
    expect(result).toBe('Hello W…');
    expect(result.length).toBe(8);
  });

  it('truncates exactly at limit', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

// ─── stringToColor ────────────────────────────────────────────────────────────

describe('stringToColor', () => {
  it('returns an HSL color string', () => {
    const color = stringToColor('test');
    expect(color).toMatch(/^hsl\(\d+, 60%, 50%\)$/);
  });

  it('returns consistent color for same input', () => {
    expect(stringToColor('alice')).toBe(stringToColor('alice'));
  });

  it('returns different colors for different inputs', () => {
    expect(stringToColor('alice')).not.toBe(stringToColor('bob'));
  });
});

// ─── isValidEmail ─────────────────────────────────────────────────────────────

describe('isValidEmail', () => {
  it('validates correct email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
  });
});

// ─── validatePassword ─────────────────────────────────────────────────────────

describe('validatePassword', () => {
  it('returns null for valid password', () => {
    expect(validatePassword('password123')).toBeNull();
    expect(validatePassword('123456')).toBeNull();
  });

  it('returns error for short password', () => {
    const err = validatePassword('12345');
    expect(err).not.toBeNull();
    expect(err).toContain('6 characters');
  });
});
