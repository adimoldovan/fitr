import fs from 'fs/promises';
import path from 'path';
import { PricePoint } from '../types.js';
import { getDataDir } from '../utils/storageUtils.js';

function getPricesPath(symbol: string): string {
    return path.resolve(getDataDir(), 'prices', `${symbol}.json`);
}

export async function getPriceHistory(symbol: string): Promise<PricePoint[]> {
    try {
        const pricesPath = getPricesPath(symbol);
        const data = await fs.readFile(pricesPath, 'utf-8');
        const { priceHistory } = JSON.parse(data);
        return priceHistory;
    } catch (error) {
        console.error(`Error reading price history for ${symbol}:`, error);
        throw new Error(`Failed to read price history for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function savePriceHistory(symbol: string, priceHistory: PricePoint[]): Promise<void> {
    try {
        const pricesPath = getPricesPath(symbol);
        await fs.writeFile(pricesPath, JSON.stringify({ symbol, priceHistory }, null, 2));
    } catch (error) {
        console.error(`Error saving price history for ${symbol}:`, error);
        throw new Error(`Failed to save price history for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
