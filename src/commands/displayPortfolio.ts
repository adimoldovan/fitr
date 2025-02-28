import {
    getPortfolio
} from '../services/portfolioService.js';

import {getCurrencyExchangeRate} from '../services/currencyService.js';

import {
    formatNumber,
    getColoredFormatedNumber,
} from '../utils/formatUtils.js';

import {Logger} from '../utils/logger.js';

/**
 * Display the current portfolio with latest prices
 */
export async function displayPortfolio(withTotalInCurrencies?: string): Promise<void> {
    try {
        const portfolio = await getPortfolio();

        if (portfolio.assets.length === 0) {
            Logger.warn('Portfolio is empty. Add some assets first.');
            return;
        }


        if (withTotalInCurrencies) {
            const displayCurrencies = withTotalInCurrencies.split(',');
            Logger.debug(`Calculating total portfolio in ${withTotalInCurrencies}`);

            const valueInCurrenciesDataTable = [];
            for (const displayCurrency of displayCurrencies) {
                let valueInCurrency: number = 0;
                for (const c of (portfolio.currencies || [])) {
                    if (c.currency.toUpperCase() === displayCurrency.toUpperCase()) {
                        valueInCurrency += c.value;
                    } else {
                        const exchangeRate = await getCurrencyExchangeRate(c.currency, displayCurrency);
                        valueInCurrency += c.value * exchangeRate;
                    }
                }
                valueInCurrenciesDataTable.push({
                    'TOTAL': `${displayCurrency.toUpperCase()}\t${formatNumber(valueInCurrency)}`
                });
            }

            Logger.printTable(valueInCurrenciesDataTable);
        }

        const summaryTableData = []

        for (const currency of (portfolio.currencies || [])) {
            summaryTableData.push({
                'Currency': currency.currency,
                'Value': formatNumber(currency.value),
                'Cost': formatNumber(currency.cost),
                'P&L': `${getColoredFormatedNumber(currency.profit)}\t${getColoredFormatedNumber(currency.profitPercentage, '%')}`
            })
        }

        Logger.printTable(summaryTableData);

        const tableData = [];

        for (const asset of portfolio.assets) {
            tableData.push({
                'Symbol': asset.symbol,
                'Name': asset.name,
                'ISIN': asset.isin,
                'Value': formatNumber(asset.currentValue),
                'Quantity': formatNumber(asset.quantity, 4),
                'Avg Cost': formatNumber(asset.avgCost),
                'Current Price': formatNumber(asset.lastPrice),
                'Currency': asset.currency,
                'Updated': asset.lastUpdated,
                'P&L': `${getColoredFormatedNumber(asset.profit)}\t${getColoredFormatedNumber(asset.profitPercentage, '%')}`,
            });
        }

        Logger.printTable(tableData);

    } catch (error) {
        Logger.error('', error);
        throw new Error(`Failed to display portfolio!`);
    }
}
