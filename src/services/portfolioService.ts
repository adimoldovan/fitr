import fs from 'fs/promises';
import path from 'path';
import {Portfolio, PricePoint, Transaction, TransactionType} from '../types';
import {getDataDir} from '../utils/storageUtils';
import {getTransactions} from './transactionService';
import {getPriceHistory} from './priceHistoryService';
import {formatNumber} from '../utils/formatUtils';
import {Logger} from '../utils/logger';

function getPortfolioPath(): string {
    return path.resolve(getDataDir('portfolioService'), 'portfolio.json');
}

export async function getPortfolio(): Promise<Portfolio> {
    try {
        const data = await fs.readFile(getPortfolioPath(), 'utf-8');
        return JSON.parse(data) as Portfolio;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            // File doesn't exist, create a default portfolio
            const defaultPortfolio: Portfolio = {
                assets: [],
                currencies: [],
                total: {
                    eur: 0
                }
            };
            
            // Ensure the directory exists
            await fs.mkdir(path.dirname(getPortfolioPath()), { recursive: true });
            
            // Save the default portfolio
            await savePortfolio(defaultPortfolio);
            Logger.info('Created new portfolio file with default structure');
            
            return defaultPortfolio;
        }
        
        // If it's any other error, log and exit
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

/**
 * Calculate Time-Weighted Return (TWR) for an asset
 * TWR eliminates the distorting effects of cash inflows and outflows
 * and provides a more accurate measure of investment performance
 * 
 * @param transactions Array of transactions for the asset
 * @param currentPrice Current price of the asset
 * @param currentDate Current date
 * @returns The time-weighted return as a decimal (e.g., 0.1 for 10%)
 */
export function calculateTWR(transactions: Transaction[], currentPrice: number, currentDate: Date): number {
    if (transactions.length === 0 || currentPrice <= 0) {
        return 0;
    }

    // Filter out non-buy/sell transactions as they don't affect holdings
    const relevantTransactions = transactions.filter(
        t => t.type === TransactionType.BUY ||
             t.type === TransactionType.SELL
    );

    if (relevantTransactions.length === 0) {
        return 0;
    }

    // Sort transactions by date
    const sortedTransactions = [...relevantTransactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Create a timeline of all events (transactions and final valuation)
    type TimelineEvent = {
        date: Date;
        isTransaction: boolean;
        transaction?: Transaction;
        price: number;
        holdings: number; // Number of shares held after this event
        value: number;    // Value of holdings after this event
    };

    const timeline: TimelineEvent[] = [];
    let currentHoldings = 0;

    // Add transactions to timeline
    for (const transaction of sortedTransactions) {
        // Get transaction date
        const transactionDate = new Date(transaction.date);
        
        if (transaction.type === TransactionType.BUY) {
            currentHoldings += transaction.quantity;
        } else if (transaction.type === TransactionType.SELL) {
            currentHoldings -= transaction.quantity;
        }

        timeline.push({
            date: transactionDate,
            isTransaction: true,
            transaction,
            price: transaction.price, // Use transaction price
            holdings: currentHoldings,
            value: currentHoldings * transaction.price
        });
    }

    // Add the current price point to calculate final return
    timeline.push({
        date: currentDate,
        isTransaction: false,
        price: currentPrice,
        holdings: currentHoldings,
        value: currentHoldings * currentPrice
    });

    // Sort timeline by date
    timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate holding period returns between cash flow events
    const holdingPeriodReturns: number[] = [];
    let previousValue = 0;
    let previousHoldings = 0;

    for (let i = 0; i < timeline.length; i++) {
        const event = timeline[i];
        
        if (i > 0) {
            // If holdings changed (due to a transaction), calculate return for the period
            if (event.isTransaction && event.transaction) {
                // Calculate value before transaction (using the price from this transaction)
                const valueBeforeTransaction = previousHoldings * event.price;

                // Calculate holding period return if we had previous holdings
                if (previousHoldings > 0 && previousValue > 0) {
                    // Calculate HPR: (End Value / Start Value) - 1
                    const hpr = valueBeforeTransaction / previousValue - 1;

                    // Sanity check: Ignore extreme values that might be due to data issues
                    if (hpr > -0.9 && hpr < 10) {  // Allow up to 1000% gain but not more
                        holdingPeriodReturns.push(hpr);
                    } else {
                        Logger.debug(`Ignoring extreme HPR value: ${hpr} for transaction on ${event.date.toISOString()}`);
                    }
                }
                
                // Update previous values after transaction
                previousValue = event.value;
                previousHoldings = event.holdings;
            } else if (!event.isTransaction) {
                // For price updates (not transactions), calculate return if holdings didn't change
                if (previousHoldings > 0 && previousValue > 0 && event.holdings === previousHoldings) {
                    // Calculate HPR: (End Value / Start Value) - 1
                    const hpr = event.value / previousValue - 1;
                    
                    // Sanity check: Ignore extreme values that might be due to data issues
                    if (hpr > -0.9 && hpr < 10) {  // Allow up to 1000% gain but not more
                        holdingPeriodReturns.push(hpr);
                    } else {
                        Logger.debug(`Ignoring extreme HPR value: ${hpr} for price update on ${event.date.toISOString()}`);
                    }
                }
                
                // Update previous values
                previousValue = event.value;
                previousHoldings = event.holdings;
            }
        } else {
            // First event, just store the values
            previousValue = event.value;
            previousHoldings = event.holdings;
        }
    }

    // If no valid holding period returns, return 0
    if (holdingPeriodReturns.length === 0) {
        return 0;
    }

    // Calculate TWR by compounding the holding period returns
    const twr = holdingPeriodReturns.reduce((acc, hpr) => acc * (1 + hpr), 1) - 1;
    
    // Apply a sanity check to the final TWR value
    if (twr < -0.9 || twr > 10) {
        Logger.debug(`Calculated TWR is outside reasonable range: ${twr}. Capping it.`);
        return twr < -0.9 ? -0.9 : 10;  // Cap at -90% loss or 1000% gain
    }
    
    return twr;
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
                    if (transaction.type.toUpperCase() === TransactionType.BUY.toUpperCase()) {
                        totalQuantity += transaction.quantity;
                        totalCost += transaction.quantity * transaction.price;
                    } else if (transaction.type.toUpperCase() === TransactionType.SELL.toUpperCase()) {
                        totalQuantity -= transaction.quantity;
                        totalCost -= (totalCost / totalQuantity) * transaction.quantity;
                    }
                }

                const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

                // Get latest price date
                const latestPrice = priceHistory.length > 0 ? priceHistory
                    .sort((a: PricePoint, b: PricePoint) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )[0] : { price: 0, date: new Date().toISOString() };

                const mwr = getStockMWR(transactions, asset.currentValue, new Date());
                
                // Calculate Time-Weighted Return (TWR)
                const twr = calculateTWR(transactions, latestPrice?.price || 0, new Date(latestPrice?.date || new Date().toISOString()));

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
                asset.twr = twr;

                Logger.info(
                    `Updated ${asset.symbol}:\n\tvalue: ${formatNumber(asset.currentValue)}, ` +
                    `p&l: ${formatNumber(asset.profit)} (${asset.profitPercentage.toFixed(2)}%), ` +
                    `TWR: ${(twr * 100).toFixed(2)}%`
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


