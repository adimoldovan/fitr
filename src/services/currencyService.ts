import {Logger} from '../utils/logger.js';
import {getDataDir} from '../utils/storageUtils.js';
import {CurrencyExchangeRate, CurrencyExchangeRates} from '../types.js';
import fs from 'fs/promises';
import path from 'path';

export function getCurrencyExchangeCachePath(): string {
    return path.resolve(getDataDir(), 'currency.json');
}

export async function fetchAndSaveCurrencyExchangeRate(from: string, to: string): Promise<void> {
    Logger.start(`Fetching conversion rate for pair ${from}:${to}`);

    if (process.env.EXCHANGE_RATE_API_KEY === undefined) {
        Logger.error('Error fetching conversion rate. EXCHANGE_RATE_API_KEY is not set', null, false);
    }

    const url = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/pair/${from}/${to}`;
    const response = await fetch(url);
    if (!response.ok) {
        Logger.error(`Error fetching conversion rate from ${from} to ${to}`, null, false);
        console.error(response);
    }

    try {
        const data = await response.json();
        if (data.conversion_rate) {
            Logger.debug(`Found conversion rate ${data.conversion_rate}`);
        } else {
            Logger.error(`Error parsing conversion rate from response ${JSON.stringify(response)}`, null, false);
        }

        await saveExchangeRate(from, to, data.conversion_rate);
    } catch (error) {
        Logger.error('Error parsing conversion rate response', error, false);
    }

    Logger.end();
}

export async function getCurrencyExchangeRate(from: string, to: string): Promise<number> {
    Logger.debug(`Getting exchange rate from ${from} to ${to}`);

    const cache = await getCurrencyExchangeCache();
    const rate = cache.rates.find((r: CurrencyExchangeRate) => r.pair === `${from.toUpperCase()}:${to.toUpperCase()}`);

    if (rate) {
        return rate.rate;
    } else {
        Logger.warn(`Conversion rate for ${from}:${to} not found. Run with --sync to fetch the latest rates`);
        return 0;
    }
}

export async function saveExchangeRate(from: string, to: string, rate: number): Promise<void> {
    const cache = await getCurrencyExchangeCache();
    const pairKey = `${from.toUpperCase()}:${to.toUpperCase()}`;
    const pair = cache.rates.find((r) => r.pair === pairKey);

    if (pair) {
        pair.rate = rate;
        pair.date = new Date().toISOString();
    } else {
        cache.rates.push({
            pair: pairKey,
            rate,
            date: new Date().toISOString(),
        });
    }

    try {
        await fs.writeFile(getCurrencyExchangeCachePath(), JSON.stringify(cache, null, 2));
    } catch (error) {
        Logger.error('Error updating currency exchange cache', error);
    }
}

export async function getCurrencyExchangeCache(): Promise<CurrencyExchangeRates> {
    try {
        const data = await fs.readFile(getCurrencyExchangeCachePath(), 'utf-8');
        return JSON.parse(data) as CurrencyExchangeRates;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        Logger.debug('Cannot read currency exchange cache');
        return {rates: []};
    }
}
