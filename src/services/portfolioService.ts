import fs from 'fs/promises';
import path from 'path';
import {Portfolio, PricePoint, Transaction, TransactionType} from '../types.js';
import {getDataDir} from '../utils/storageUtils.js';
import {getTransactions} from './transactionService.js';
import {getPriceHistory} from './priceHistoryService.js';
import {formatNumber} from '../utils/formatUtils.js';
import {Logger} from '../utils/logger.js';

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

function calculateMWR(cashFlows: Array<{ amount: number, date: Date }>): number {
    const guess = 0.1; // Initial guess of 10%
    const maxIterations = 100;
    const tolerance = 0.0000001;

    function npv(rate: number): number {
        return cashFlows.reduce((sum, flow) => {
            const timeInYears = (flow.date.getTime() - cashFlows[0].date.getTime()) / (365 * 24 * 60 * 60 * 1000);
            return sum + flow.amount / Math.pow(1 + rate, timeInYears);
        }, 0);
    }

    function npvDerivative(rate: number): number {
        return cashFlows.reduce((sum, flow) => {
            const timeInYears = (flow.date.getTime() - cashFlows[0].date.getTime()) / (365 * 24 * 60 * 60 * 1000);
            return sum - (timeInYears * flow.amount) / Math.pow(1 + rate, timeInYears + 1);
        }, 0);
    }

    let rate = guess;
    for (let i = 0; i < maxIterations; i++) {
        const currentNpv = npv(rate);
        if (Math.abs(currentNpv) < tolerance) {
            return rate;
        }
        rate = rate - currentNpv / npvDerivative(rate);
    }

    return rate;
}

function getStockMWR(transactions: Transaction[], currentValue: number, currentDate: Date): number {
    // Ignore vested stocks
    if (transactions.some(t => t.type.toUpperCase() === TransactionType.VESTED.toUpperCase())) {
        return 0;
    }

    // Convert transactions to cash flows
    const cashFlows = [
        ...transactions.map(t => ({
            amount: -(t.quantity * t.price),
            date: new Date(t.date)
        })),
        {
            amount: currentValue,
            date: currentDate
        }
    ];

    // Sort cash flows by date
    cashFlows.sort((a, b) => a.date.getTime() - b.date.getTime());

    return calculateMWR(cashFlows);
}

export async function updatePortfolio(): Promise<void> {
    try {
        const portfolio = await getPortfolio();

        for (const asset of portfolio.assets) {
            try {
                const transactions = await getTransactions(asset.symbol);
                const priceHistory = await getPriceHistory(asset.symbol);

                if (transactions.length === 0 || priceHistory.length === 0) {
                    Logger.warn(`No transactions or price history found for ${asset.symbol}`);
                    continue;
                }

                let totalQuantity = 0;
                let totalCost = 0;

                for (const transaction of transactions) {
                    if (transaction.type.toUpperCase() === TransactionType.BUY.toUpperCase() || transaction.type.toUpperCase() === TransactionType.VESTED.toUpperCase()) {
                        totalQuantity += transaction.quantity;
                        totalCost += transaction.quantity * transaction.price;
                    } else if (transaction.type.toUpperCase() === TransactionType.SELL.toUpperCase()) {
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

                const mwr = getStockMWR(transactions, asset.currentValue, new Date());

                // Update asset position
                asset.lastPrice = latestPrice?.price || 0;
                asset.quantity = totalQuantity;
                asset.totalCost = totalCost;
                asset.avgCost = avgCost;
                asset.currentValue = asset.quantity * asset.lastPrice;
                asset.profit = asset.currentValue - asset.totalCost;
                asset.profitPercentage = asset.totalCost > 0 ? (asset.profit / asset.totalCost) * 100 : 0;
                asset.lastUpdated = latestPrice.date;
                asset.mwr = mwr;

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
                `Updated ${currency} portfolio: value ${formatNumber(currencyPortfolio.value)}`
            );

        }

        await savePortfolio(portfolio);

    } catch (error) {
        Logger.error('Error updating portfolio performance', error);
        process.exit(1);
    }
}


