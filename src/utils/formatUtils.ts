import chalk from "chalk";

/**
 * Format a number with decimals
 */
export function formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

export function getColoredFormatedNumber(value: number, symbol: string = ''): string {
    const text = `  ${formatNumber(value)}${symbol}  `;
    if (value > 0) {
        // return chalk.bgGreen(text);
        return chalk.bgHex('#384f21')(text);
    }
    if (value < 0) {
        return chalk.bgHex('#732f2c')(text);
    }
    return text;
}

export function highlight(shouldHighlight: boolean, text: string): string {
    // text = ` ${text} `;
    if (shouldHighlight) {
        return chalk.yellowBright(text)
    }
    return text;
}
