import chalk from "chalk";

/**
 * Formats a number with the specified number of decimal places
 * 
 * @param {number} value - The number to format
 * @param {number} [decimals=2] - The number of decimal places to display (default: 2)
 * @returns {string} The formatted number as a string with commas as thousand separators
 * 
 * @example
 * // Returns "1,234.57"
 * formatNumber(1234.567)
 * 
 * @example
 * // Returns "1,234.567"
 * formatNumber(1234.567, 3)
 */
export function formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Formats a number with color highlighting based on its value and adds an optional symbol
 * 
 * @param {number} value - The number to format and color
 * @param {string} [symbol=''] - Optional symbol to append to the number (e.g., '%', '$')
 * @returns {string} The formatted number with color highlighting
 * 
 * Features:
 * - Positive numbers get a green background (#384f21)
 * - Negative numbers get a red background (#732f2c)
 * - Numbers ≥ 1,000,000 are formatted as "X.XXm" (millions)
 * - Numbers ≥ 10,000 are formatted as "X.XXk" (thousands)
 * - Adds padding for consistent width display
 * 
 * @example
 * // Returns a green-highlighted "  1,234.56  "
 * getColoredFormatedNumber(1234.56)
 * 
 * @example
 * // Returns a green-highlighted "  1.23m$  "
 * getColoredFormatedNumber(1234567, '$')
 */
export function getColoredFormatedNumber(value: number, symbol: string = ''): string {
    let text = formatNumber(value);

    if(value >= 1000000) {
        text = `${(value / 1000000).toFixed(2)}m`;
    } else if(value >= 10000) {
        text = `${(value / 1000).toFixed(2)}k`;
    }

    text = `${text}${symbol}`;
    text = text.padEnd((8 - text.length) + text.length + 2, ' ');
    text = text.padStart(text.length + 2, ' ')

    if (value > 0) {
        return chalk.bgHex('#384f21')(text);
    }
    if (value < 0) {
        return chalk.bgHex('#732f2c')(text);
    }
    return text;
}

/**
 * Conditionally highlights text with a bright yellow color
 * 
 * @param {boolean} shouldHighlight - Whether the text should be highlighted
 * @param {string} text - The text to potentially highlight
 * @returns {string} The highlighted text if shouldHighlight is true, otherwise the original text
 * 
 * @example
 * // Returns yellow-highlighted "test text"
 * highlight(true, "test text")
 * 
 * @example
 * // Returns "test text" without highlighting
 * highlight(false, "test text")
 */
export function highlight(shouldHighlight: boolean, text: string): string {
    if (shouldHighlight) {
        return chalk.yellowBright(text)
    }
    return text;
}
