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
    // text = `  ${formatNumber(value)}${symbol}  `;
    let text = formatNumber(value);

    if(value >= 1000000) {
        text = `${(value / 1000000).toFixed(2)}m`;
    } else if(value >= 10000) {
        text = `${(value / 1000).toFixed(2)}k`;
    }

    // const text = value >= 1000000 ? `${(value / 1000000).toFixed(2)}m` : `${(value / 1000).toFixed(0)}k`;
    text = `${text}${symbol}`;
    text = text.padEnd((8 - text.length) + text.length + 2, ' ');
    text = text.padStart(text.length + 2, ' ')

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
