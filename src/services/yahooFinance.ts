import yahooFinance from 'yahoo-finance2';
import { format, parse, differenceInWeeks } from 'date-fns';
import { PricePoint, PriceSource } from '../types.js';
import { Logger } from '../utils/logger.js';

/**
 * Get historical weekly price data for a symbol between two dates
 */
export async function getHistoricalPrices(
    symbol: string,
    fromDate: string,
    toDate: string = format(new Date(), 'yyyy-MM-dd')
): Promise<PricePoint[]> {
    try {
        Logger.info(`Fetching historical data for ${symbol} from ${fromDate} to ${toDate}...`);

        const from = parse(fromDate, 'yyyy-MM-dd', new Date());
        const to = parse(toDate, 'yyyy-MM-dd', new Date());

        const historicalResult = await yahooFinance.historical(symbol, {
            period1: from,
            period2: to,
            interval: '1wk' // Weekly data
        });

        // Map the data to our PricePoint format
        const pricePoints: PricePoint[] = historicalResult.map(item => ({
            date: format(item.date, 'yyyy-MM-dd'),
            price: item.close,
            source: PriceSource.YAHOO
        }));

        Logger.info(`Found ${pricePoints.length} historical price points for ${symbol}`);
        return pricePoints;
    } catch (error) {
        Logger.error(`Error fetching historical prices for ${symbol}`, error);
        return [];
    }
}

/**
 * Get weekly price data since the last recorded date
 */
export async function getWeeklyPricesSinceLastUpdate(
    symbol: string,
    lastUpdateDate: string
): Promise<PricePoint[]> {
    const today = new Date();
    const lastUpdate = parse(lastUpdateDate, 'yyyy-MM-dd', new Date());

    // If the last update was less than a week ago, no need to fetch new data
    const weeksSinceLastUpdate = differenceInWeeks(today, lastUpdate);
    if (weeksSinceLastUpdate < 1) {
        Logger.info(`Last update for ${symbol} was less than a week ago. No new data needed.`);
        return [];
    }

    // Add one day to lastUpdateDate to avoid getting the same date twice
    const nextDay = new Date(lastUpdate);
    nextDay.setDate(nextDay.getDate() + 1);
    const fromDate = format(nextDay, 'yyyy-MM-dd');

    return await getHistoricalPrices(symbol, fromDate);
}
