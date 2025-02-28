import { table } from 'table';
import {
    getPortfolio
} from '../services/portfolioService.js';

import {
    formatNumber,
    getColoredFormatedNumber,
} from '../utils/formatUtils.js';
import { Logger } from '../utils/logger.js';

/**
 * Display the current portfolio with latest prices
 */
export async function displayPortfolio(): Promise<void> {
    try {
        const portfolio = await getPortfolio();

        if (portfolio.assets.length === 0) {
            Logger.warn('Portfolio is empty. Add some assets first.');
            return;
        }

        const summaryTableData = []

        for (const currency of ( portfolio.currencies || [] ) ) {
            summaryTableData.push({
                'Currency': currency.currency,
                'Value': formatNumber(currency.value),
                'Cost': formatNumber(currency.cost),
                'P&L':`${getColoredFormatedNumber(currency.profit)}\t${getColoredFormatedNumber(currency.profitPercentage, '%')}`
        })
        }

        Logger.printTable(summaryTableData);

        const tableData = [];

        for (const asset of portfolio.assets) {
            tableData.push({
                'Symbol': asset.symbol,
                'Name': asset.name,
                'Currency': asset.currency,
                'Quantity': formatNumber(asset.quantity, 4),
                'Avg Cost': formatNumber(asset.avgCost),
                'Current Price': formatNumber(asset.lastPrice),
                'Value': formatNumber(asset.currentValue),
                'P&L': `${getColoredFormatedNumber(asset.profit)}\t${getColoredFormatedNumber(asset.profitPercentage, '%')}`,
            });
        }

        Logger.printTable(tableData);

    } catch (error) {
        Logger.error('', error);
        throw new Error(`Failed to display portfolio!`);
    }
}
