import yahooFinance from 'yahoo-finance2';
import { format, parse, startOfWeek, addDays, parseISO, isBefore, getDay } from 'date-fns';
import { PricePoint, PriceSource } from '../types.js';
import { Logger } from '../utils/logger.js';

/**
 * Get historical weekly price data for a symbol between two dates
 */
export async function getHistoricalPrices(
    symbol: string,
    fromDate: string,
    toDate: string = format(new Date(), 'yyyy-MM-dd'), 
    interval: '1wk' | '1d' = '1wk'
): Promise<PricePoint[]> {
    try {
        Logger.info(`Fetching historical data for ${symbol} from ${fromDate} to ${toDate}...`);

        const from = parse(fromDate, 'yyyy-MM-dd', new Date());
        const to = parse(toDate, 'yyyy-MM-dd', new Date());

        const historicalResult = await yahooFinance.historical(symbol, {
            period1: from,
            period2: to,
            interval
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
 * Get weekly prices for a symbol since a given date
 * 
 * @param symbol The stock/ETF symbol
 * @param sinceDate The date to start fetching prices from (exclusive)
 * @param weekStartsOn The day of the week to consider as the first day (0 = Sunday, 1 = Monday, etc.)
 * @returns Array of price points
 */
export async function getWeeklyPrices(
    symbol: string,
    sinceDate: string,
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1 // Default to Monday
): Promise<PricePoint[]> {
    try {
        const today = new Date();
        const sinceDateObj = parseISO(sinceDate);
        
        // Debug logging
        Logger.debug(`Getting weekly prices for ${symbol} since ${sinceDate}`);
        Logger.debug(`Today: ${format(today, 'yyyy-MM-dd')}`);
        Logger.debug(`Week starts on day: ${weekStartsOn} (0=Sunday, 1=Monday, ...)`);
        
        // Get the start of the current week
        const currentWeekStart = startOfWeek(today, { weekStartsOn });
        Logger.debug(`Current week start: ${format(currentWeekStart, 'yyyy-MM-dd')}`);
        
        // If the sinceDate is after or on the current week's start, no need to fetch new data
        if (!isBefore(sinceDateObj, currentWeekStart)) {
            Logger.info(`Last update for ${symbol} was already in the current week. No new data needed.`);
            return [];
        }
        
        // Add one day to sinceDate to avoid getting the same date twice
        const nextDay = addDays(sinceDateObj, 1);
        const fromDate = format(nextDay, 'yyyy-MM-dd');
        const toDate = format(today, 'yyyy-MM-dd');
        
        Logger.info(`Fetching weekly prices from ${fromDate} to ${toDate} with week starting on day ${weekStartsOn}`);
        
        // Fetch historical prices
        const allPrices = await getHistoricalPrices(symbol, fromDate, toDate, '1wk');
        
        // Filter to only include prices for the specified day of the week
        // or include all if we don't have enough data
        if (allPrices.length > 7) {
            const filteredPrices = allPrices.filter(price => {
                const priceDate = parseISO(price.date);
                return getDay(priceDate) === weekStartsOn;
            });
            
            // If we have filtered prices, return those, otherwise return all prices
            if (filteredPrices.length > 0) {
                Logger.debug(`Filtered to ${filteredPrices.length} prices for day ${weekStartsOn} of the week`);
                return filteredPrices;
            }
        }
        
        // If we don't have enough data or no filtered prices, return all prices
        Logger.debug(`Returning all ${allPrices.length} price points (not enough data to filter by day of week)`);
        return allPrices;
    } catch (error) {
        Logger.error(`Error getting weekly prices for ${symbol}`, error);
        return [];
    }
}
