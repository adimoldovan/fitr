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

        const summaryTableData = [
            ['Value', 'Cost', 'P&L']
        ]

        summaryTableData.push([
            formatNumber(portfolio.value),
            formatNumber(portfolio.cost),
            `${getColoredFormatedNumber(portfolio.profit)}    ${getColoredFormatedNumber(portfolio.profitPercentage, '%')}`
        ])

        console.log(table(summaryTableData));

        const tableData = [
            ['Symbol', 'Name', 'Currency', 'Quantity', 'Avg Cost', 'Current Price', 'Value', 'P&L']
        ];

        for (const asset of portfolio.assets) {
            tableData.push([
                asset.symbol,
                asset.name,
                asset.currency,
                formatNumber(asset.quantity, 4),
                formatNumber(asset.avgCost),
                formatNumber(asset.lastPrice),
                formatNumber(asset.currentValue),
                `${getColoredFormatedNumber(asset.profit)}    ${getColoredFormatedNumber(asset.profitPercentage, '%')}`,
            ]);
        }

        console.log(table(tableData));

    } catch (error) {
        Logger.error('', error);
        throw new Error(`Failed to display portfolio!`);
    }
}
