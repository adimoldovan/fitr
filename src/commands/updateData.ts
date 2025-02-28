import { format } from 'date-fns';
import { getPortfolioSummary, updatePortfolio } from '../services/portfolioService.js';
import { getTransactions } from '../services/transactionService.js';
import { savePriceHistory, getPriceHistory } from '../services/priceHistoryService.js';
import {
    getHistoricalPrices,
    getWeeklyPricesSinceLastUpdate
} from '../services/yahooFinance.js';
import { formatDate } from '../utils/dateUtils.js';
import { PricePoint, Transaction } from "../types";
import { Logger } from '../utils/logger.js';

async function updateHistoricalPricesDataForSymbol(symbol: string): Promise<void> {
    Logger.start(`Updating historical data for ${symbol}...`);

    const existingPriceHistory = await getPriceHistory(symbol);
    const latestExistingPriceDate = existingPriceHistory.length > 0
        ? [...existingPriceHistory]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date
        : null;

    const updatedPriceHistory = [];


    if (latestExistingPriceDate) {
        Logger.info(`Found existing price for ${symbol} is from ${formatDate(latestExistingPriceDate)}`);
        updatedPriceHistory.push(...existingPriceHistory);

        try {
            const pricePoints = await getWeeklyPricesSinceLastUpdate(symbol, latestExistingPriceDate);
            Logger.info(`Fetched ${pricePoints.length} new price points for ${symbol}`);
            updatedPriceHistory.push(...pricePoints);
        } catch (error) {
            Logger.error(`Error updating price history for ${symbol}`, error);
        }
    } else {
        Logger.info(`No existing price data for ${symbol}. Will fetch initial data.`);

        try {
            // Get the first transaction date for this asset
            const transactions = await getTransactions(symbol);
            if (transactions.length > 0) {
                const firstTransaction = [...transactions]
                    .sort((a: Transaction, b: Transaction) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )[0];

                const pricePoints = await getHistoricalPrices(symbol, firstTransaction.date);

                Logger.info(`Fetched ${pricePoints.length} initial price points for ${symbol}`);
                updatedPriceHistory.push(...pricePoints);
            } else {
                Logger.warn(`No transactions found for ${symbol}`);
            }
        } catch (error) {
            Logger.error(`Error fetching initial price history for ${symbol}`, error);
        }
    }

    await savePriceHistory(symbol, updatedPriceHistory);
    Logger.end();
}


/**
 * Update historical price data for all assets in the portfolio
 */
export async function updateData(): Promise<void> {
    Logger.start('Updating portfolio data');

    try {
        const portfolio = await getPortfolioSummary();

        if (portfolio.assets.length === 0) {
            Logger.warn('Portfolio is empty. Add some assets first?');
            return;
        }

        const symbols = portfolio.assets.map(asset => asset.symbol);

        for (const symbol of symbols) {
            await updateHistoricalPricesDataForSymbol(symbol);
        }

        await updatePortfolio();

        Logger.info(`Data updated successfully on ${format(new Date(), 'MMMM do, yyyy')}`);
    } catch (error) {
        throw new Error(`Failed to update portfolio data: ${error instanceof Error ? error.message : String(error)}`);
    }
    Logger.end();
}
