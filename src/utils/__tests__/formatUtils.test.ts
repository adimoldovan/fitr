import { formatNumber, getColoredFormatedNumber, highlight } from '../formatUtils';
import chalk from 'chalk';

// Mock chalk to avoid ANSI color codes in test output
jest.mock('chalk', () => ({
  bgHex: jest.fn().mockImplementation(() => jest.fn(text => text)),
  yellowBright: jest.fn(text => text),
}));

describe('formatNumber', () => {
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

  test('applies green background for positive numbers', () => {
    getColoredFormatedNumber(100);
    expect(chalk.bgHex).toHaveBeenCalledWith('#384f21');
  });

  test('applies red background for negative numbers', () => {
    getColoredFormatedNumber(-100);
    expect(chalk.bgHex).toHaveBeenCalledWith('#732f2c');
  });
});

describe('highlight', () => {
  test('highlights text when shouldHighlight is true', () => {
    highlight(true, 'test text');
    expect(chalk.yellowBright).toHaveBeenCalledWith('test text');
  });

  test('returns original text when shouldHighlight is false', () => {
    const result = highlight(false, 'test text');
    expect(result).toBe('test text');
  });

  test('works with empty string', () => {
    highlight(true, '');
    expect(chalk.yellowBright).toHaveBeenCalledWith('');
  });
});
