import { formatNumber, getColoredFormatedNumber, highlight } from '../formatUtils';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock chalk module
jest.mock('chalk', () => ({
  default: {
    bgHex: () => (text: string) => text,
    yellowBright: (text: string) => text
  },
  bgHex: () => (text: string) => text,
  yellowBright: (text: string) => text
}));

describe('formatNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('formats number with default 2 decimals', () => {
    expect(formatNumber(1234.5678)).toBe('1,234.57');
    expect(formatNumber(0)).toBe('0.00');
    expect(formatNumber(-1234.5678)).toBe('-1,234.57');
  });

  test('formats number with specified decimals', () => {
    expect(formatNumber(1234.5678, 0)).toBe('1,235');
    expect(formatNumber(1234.5678, 1)).toBe('1,234.6');
    expect(formatNumber(1234.5678, 3)).toBe('1,234.568');
    expect(formatNumber(1234.5678, 4)).toBe('1,234.5678');
  });

  test('handles edge cases', () => {
    expect(formatNumber(NaN, 2)).toBe('NaN');
    expect(formatNumber(Infinity, 2)).toBe('∞');
    expect(formatNumber(-Infinity, 2)).toBe('-∞');
  });
});

describe('getColoredFormatedNumber', () => {
  test('formats positive numbers correctly', () => {
    const result = getColoredFormatedNumber(1234.56);
    expect(result).toContain('1,234.56');
  });

  test('formats negative numbers correctly', () => {
    const result = getColoredFormatedNumber(-1234.56);
    expect(result).toContain('-1,234.56');
  });

  test('formats zero correctly', () => {
    const result = getColoredFormatedNumber(0);
    expect(result).toContain('0.00');
  });

  test('adds symbol when provided', () => {
    const result = getColoredFormatedNumber(1234.56, '%');
    expect(result).toContain('1,234.56%');
  });

  test('formats large numbers in thousands (k)', () => {
    const result = getColoredFormatedNumber(12345);
    expect(result).toContain('12.35k');
  });

  test('formats very large numbers in millions (m)', () => {
    const result = getColoredFormatedNumber(1234567);
    expect(result).toContain('1.23m');
  });

  // Skip chalk-specific tests since we're mocking chalk to return the input text
  test('returns a string for positive numbers', () => {
    const result = getColoredFormatedNumber(100);
    expect(typeof result).toBe('string');
    expect(result).toContain('100');
  });

  test('returns a string for negative numbers', () => {
    const result = getColoredFormatedNumber(-100);
    expect(typeof result).toBe('string');
    expect(result).toContain('-100');
  });
});

describe('highlight', () => {
  test('returns a string when shouldHighlight is true', () => {
    const result = highlight(true, 'test text');
    expect(typeof result).toBe('string');
    expect(result).toContain('test text');
  });

  test('returns original text when shouldHighlight is false', () => {
    const result = highlight(false, 'test text');
    expect(result).toBe('test text');
  });

  test('works with empty string', () => {
    const result = highlight(true, '');
    expect(result).toBe('');
  });
});
