import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { PricePoint } from '../types';
import { getDataDir } from '../utils/storageUtils';
import { Logger } from "../utils/logger";
import { PriceSource } from '../types';

async function getPricesPath(symbol: string): Promise<string> {
    const dir = path.resolve(getDataDir(), 'prices');
    if (!existsSync(dir)) {
        Logger.debug(`Prices dir not found. Creating ${dir}`);
        await fs.mkdir(dir, { recursive: true });
    }
    return path.resolve(dir, `${symbol}.json`);
}

export async function getPriceHistory(symbol: string): Promise<PricePoint[]> {
    try {
        const pricesPath = await getPricesPath(symbol);
        if (!existsSync(pricesPath)) {
            Logger.debug(`Prices file for ${ symbol } not found. Creating ${pricesPath}`);
            await fs.writeFile(pricesPath, JSON.stringify({ symbol, priceHistory: [] }, null, 2));
            return [];
        }
        const data = await fs.readFile(pricesPath, 'utf-8');
        const { priceHistory } = JSON.parse(data);
        return priceHistory;
    } catch (error) {
        Logger.error(`Error reading price history for ${symbol}`, error);
        return [];
    }
}

export async function savePriceHistory(symbol: string, priceHistory: PricePoint[]): Promise<void> {
    try {
        const pricesPath = await getPricesPath(symbol);
        await fs.writeFile(pricesPath, JSON.stringify({ symbol, priceHistory }, null, 2));
    } catch (error) {
        Logger.error(`Error saving price history for ${symbol}`, error);
    }
}

export async function addPricePoint(symbol: string, price: number, date: string, source: PriceSource = PriceSource.MANUAL): Promise<void> {
    try {
        const priceHistory = await getPriceHistory(symbol);
        const newPricePoint: PricePoint = {
            price,
            date,
            source
        };
        priceHistory.push(newPricePoint);
        Logger.info(`Adding new price point for ${symbol}: ${JSON.stringify(newPricePoint)}`);
        await savePriceHistory(symbol, priceHistory);
    } catch (error) {
        Logger.error(`Error adding price point for ${symbol}`, error);
    }
}
