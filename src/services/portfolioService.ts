import fs from 'fs/promises';
import path from 'path';
import { Portfolio, PricePoint } from '../types.js';
import { getDataDir } from '../utils/storageUtils.js';
import { getTransactions } from './transactionService.js';
import { getPriceHistory } from './priceHistoryService.js';
import { formatNumber } from '../utils/formatUtils.js';
import { Logger } from '../utils/logger.js';

function getPortfolioPath(): string {
    return path.resolve(getDataDir('portfolioService'), 'portfolio.json');
}

export async function getPortfolio(): Promise<Portfolio> {
    try {
        const data = await fs.readFile(getPortfolioPath(), 'utf-8');
        return JSON.parse(data) as Portfolio;
    } catch (error) {
        Logger.error('Error reading portfolio summary', error);
        process.exit(1);
    }
}

export async function savePortfolio(portfolio: Portfolio): Promise<void> {
    try {
        await fs.writeFile(getPortfolioPath(), JSON.stringify(portfolio, null, 2));
    } catch (error) {
        Logger.error('Error updating portfolio summary', error);
        process.exit(1);
    }
}

export async function updatePortfolio(): Promise<void> {
    try {
        const portfolio = await getPortfolio();

        for (const asset of portfolio.assets) {
            try {
                const transactions = await getTransactions(asset.symbol);
                const priceHistory = await getPriceHistory(asset.symbol);

                let totalQuantity = 0;
                let totalCost = 0;

                for (const transaction of transactions) {
                    if (transaction.type === 'buy') {
                        totalQuantity += transaction.quantity;
                        totalCost += transaction.quantity * transaction.price;
                    } else if (transaction.type === 'sell') {
                        totalQuantity -= transaction.quantity;
                        totalCost -= (totalCost / totalQuantity) * transaction.quantity;
                    }
                }

                const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

                // Get latest price date
                const latestPrice = priceHistory
                    .sort((a: PricePoint, b: PricePoint) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )[0];

                // Update asset position
                asset.lastPrice = latestPrice?.price || 0;
                asset.quantity = totalQuantity;
                asset.totalCost = totalCost;
                asset.avgCost = avgCost;
                asset.currentValue = asset.quantity * asset.lastPrice;
                asset.profit = asset.currentValue - asset.totalCost;
                asset.profitPercentage = asset.totalCost > 0 ? (asset.profit / asset.totalCost) * 100 : 0;
                asset.lastUpdated = latestPrice.date;

                Logger.info(
                    `Updated ${asset.symbol}:\n\tvalue: ${formatNumber(asset.currentValue)}, ` +
                    `p&l: ${formatNumber(asset.profit)} (${asset.profitPercentage.toFixed(2)}%)`
                );
            } catch (error) {
                Logger.error(`Error updating asset ${asset.symbol}`, error);
            }
        }

        const currencies = [...new Set(portfolio.assets.map(asset => asset.currency))];

        for (const currency of currencies) {
            const assets = portfolio.assets.filter(asset => asset.currency === currency);
            const value = assets.reduce((total, asset) => total + asset.currentValue, 0);
            const cost = assets.reduce((total, asset) => total + asset.totalCost, 0);

            const currencyPortfolio = {
                cost,
                value,
                profit: value - cost,
                profitPercentage: cost > 0 ? ((value - cost) / cost) * 100 : 0,
                exchangeRate: {
                    eur: 1
                },
                lastUpdated: new Date().toISOString()
            };

            portfolio.currencies = portfolio.currencies || [];
            const existingCurrencyPortfolio = portfolio.currencies.find(c => c.currency.toUpperCase() === currency.toUpperCase());

            if (existingCurrencyPortfolio) {
                Object.assign(existingCurrencyPortfolio, currencyPortfolio);
            } else {
                portfolio.currencies.push({
                    ...currencyPortfolio,
                    currency
                });
            }

            Logger.info(
                `Updated ${ currency } portfolio: value ${formatNumber(currencyPortfolio.value)}`
            );

        }

        await savePortfolio(portfolio);

    } catch (error) {
        Logger.error('Error updating portfolio performance', error);
        process.exit(1);
    }
}


