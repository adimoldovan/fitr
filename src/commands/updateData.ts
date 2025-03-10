import {format, isToday, parseISO, startOfWeek, subWeeks} from 'date-fns';
import {getPortfolio, updatePortfolio} from '../services/portfolioService.js';
import {getTransactions} from '../services/transactionService.js';
import {savePriceHistory, getPriceHistory} from '../services/priceHistoryService.js';
import {fetchAndSaveCurrencyExchangeRate} from '../services/currencyService.js';
import {
    getHistoricalPrices,
    getWeeklyPrices
} from '../services/yahooFinance.js';
import {formatDate} from '../utils/dateUtils.js';
import {PricePoint, Transaction} from "../types";
import {Logger} from '../utils/logger.js';

/**
 * Update historical price data for a symbol
 * @param symbol The stock/ETF symbol to update
 * @param weekStartsOn The day of the week to consider as the first day (0 = Sunday, 1 = Monday, etc.)
 * @returns Promise that resolves when the update is complete
 */
async function updateHistoricalPricesDataForSymbol(
    symbol: string, 
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1
): Promise<void> {
    Logger.start(`Updating historical data for ${symbol}...`);

    try {
        // Get existing price history
        const existingPriceHistory = await getPriceHistory(symbol);
        
        // If no price history exists, initialize it from the first transaction date
        if (existingPriceHistory.length === 0) {
            Logger.info(`No existing price data for ${symbol}. Will fetch initial data.`);
            
            // Get the first transaction date for this asset
            const transactions = await getTransactions(symbol);
            if (transactions.length === 0) {
                Logger.warn(`No transactions found for ${symbol}. Skipping price history update.`);
                return;
            }
            
            // Find the first transaction date
            const firstTransaction = [...transactions]
                .sort((a: Transaction, b: Transaction) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )[0];
            
            // Fetch historical prices from the first transaction date
            const pricePoints = await getHistoricalPrices(symbol, firstTransaction.date);
            Logger.info(`Fetched ${pricePoints.length} initial price points for ${symbol}`);
            
            // Save the price history
            await savePriceHistory(symbol, pricePoints);
        } 
        // If price history exists, update it with new data if needed
        else {
            // Find the latest price date
            const sortedPriceHistory = [...existingPriceHistory].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            const latestPricePoint = sortedPriceHistory[0];
            const latestPriceDate = parseISO(latestPricePoint.date);
            Logger.info(`Latest price for ${symbol} is from ${formatDate(latestPricePoint.date)}`);
            
            // Get the start of the current week
            const today = new Date();
            const currentWeekStart = startOfWeek(today, { weekStartsOn });
            
            // Get the start of the previous week
            const previousWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn });
            
            // Debug logging
            Logger.debug(`Today: ${format(today, 'yyyy-MM-dd')}`);
            Logger.debug(`Latest price date: ${format(latestPriceDate, 'yyyy-MM-dd')}`);
            Logger.debug(`Current week start: ${format(currentWeekStart, 'yyyy-MM-dd')}`);
            Logger.debug(`Previous week start: ${format(previousWeekStart, 'yyyy-MM-dd')}`);
            Logger.debug(`Week starts on day: ${weekStartsOn} (0=Sunday, 1=Monday, ...)`);
            
            // Check if we already have today's price
            const hasToday = sortedPriceHistory.some(price => isToday(parseISO(price.date)));
            
            if (hasToday) {
                Logger.info(`Already have today's price for ${symbol}. Skipping update.`);
                return;
            }
            
            // Fetch new weekly prices
            const newPricePoints = await getWeeklyPrices(symbol, latestPricePoint.date, weekStartsOn);
            Logger.info(`Fetched ${newPricePoints.length} new price points for ${symbol}`);
            
            if (newPricePoints.length === 0) {
                Logger.info(`No new price points for ${symbol}. Skipping update.`);
                return;
            }
            
            // Merge existing and new price points, avoiding duplicates
            const mergedPriceHistory = mergePriceHistories(existingPriceHistory, newPricePoints);
            
            // Save the updated price history
            await savePriceHistory(symbol, mergedPriceHistory);
            Logger.info(`Updated price history for ${symbol} with ${newPricePoints.length} new points`);
        }
    } catch (error) {
        Logger.error(`Error updating price history for ${symbol}`, error);
    } finally {
        Logger.end();
    }
}

/**
 * Merge two price histories, avoiding duplicates
 * @param existingHistory Existing price history
 * @param newHistory New price history to merge
 * @returns Merged price history without duplicates
 */
function mergePriceHistories(existingHistory: PricePoint[], newHistory: PricePoint[]): PricePoint[] {
    // Create a map of existing prices by date for quick lookup
    const existingPricesByDate = new Map<string, PricePoint>();
    existingHistory.forEach(price => {
        existingPricesByDate.set(price.date, price);
    });
    
    // Add new prices only if they don't already exist
    for (const newPrice of newHistory) {
        if (!existingPricesByDate.has(newPrice.date)) {
            existingPricesByDate.set(newPrice.date, newPrice);
        }
    }
    
    // Convert the map back to an array
    return Array.from(existingPricesByDate.values());
}

/**
 * Update historical price data for all assets in the portfolio
 * @param weekStartsOn The day of the week to consider as the first day (0 = Sunday, 1 = Monday, etc.)
 */
export async function updateData(weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1): Promise<void> {
    Logger.start('Updating portfolio data');

    try {
        const portfolio = await getPortfolio();

        if (portfolio.assets.length === 0) {
            Logger.warn('Portfolio is empty. Add some assets first?');
            return;
        }

        const symbols = portfolio.assets.map(asset => asset.symbol);

        for (const symbol of symbols) {
            await updateHistoricalPricesDataForSymbol(symbol, weekStartsOn);
        }

        Logger.start(`Updating currency exchange rates...`);
        const currencies = [...new Set(portfolio.assets.map(asset => asset.currency))];

        for (const c1 of currencies) {
            for (const c2 of currencies) {
                if(c1 !== c2) {
                    await fetchAndSaveCurrencyExchangeRate(c1, c2)
                }
            }
        }
        Logger.end();

        await updatePortfolio();

        Logger.info(`Data updated successfully on ${format(new Date(), 'MMMM do, yyyy')}`);
    } catch (error) {
        Logger.error('Error updating data', error);
    } finally {
        Logger.end();
    }
}
