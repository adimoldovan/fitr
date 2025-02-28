/**
 * Format a number with decimals
 */
export function formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
    }).format(value);
}

/**
 * Format a color based on whether a value is positive or negative
 */
export function getColorForValue(value: number): string {
    if (value > 0) return '\x1b[32m'; // Green
    if (value < 0) return '\x1b[31m'; // Red
    return '\x1b[0m'; // Reset
}

export function getColoredFormatedNumber(value: number, symbol: string = ''): string {
    return getColorForValue(value) + formatNumber(value) + symbol + resetColor;
}

/**
 * Reset color code
 */
export const resetColor = '\x1b[0m';
