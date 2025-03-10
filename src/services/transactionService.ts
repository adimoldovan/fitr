import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Transaction } from '../types.js';
import { getDataDir } from '../utils/storageUtils.js';
import { Logger } from "../utils/logger.js";

async function getTransactionsPath(symbol: string): Promise<string> {
    const dir = path.resolve(getDataDir(), 'transactions');
    if (!existsSync(dir)) {
        Logger.debug(`Transactions dir not found. Creating ${dir}`);
        await fs.mkdir(dir, { recursive: true });
    }
    return path.resolve(dir, `${symbol}.json`);
}

export async function getTransactions(symbol: string): Promise<Transaction[]> {
    try {
        const filePath = await getTransactionsPath(symbol);
        if (!existsSync(filePath)) {
            Logger.debug(`Transactions file for ${ symbol } not found. Creating ${filePath}`);
            await fs.writeFile(filePath, JSON.stringify({ symbol, transactions: [] }, null, 2));
            return [];
        }

        const data = await fs.readFile(filePath, 'utf-8');
        const { transactions } = JSON.parse(data);
        return transactions;
    } catch (error) {
        Logger.error(`Error reading transactions for ${symbol}`, error);
        return [];
    }
}

export async function saveTransactions(symbol: string, transactions: Transaction[]): Promise<void> {
    try {
        const filePath = await getTransactionsPath(symbol);
        await fs.writeFile(filePath, JSON.stringify({ symbol, transactions }, null, 2));
        Logger.debug(`Saved ${transactions.length} transactions for ${symbol}`);
    } catch (error) {
        Logger.error(`Error saving transactions for ${symbol}`, error);
        throw error;
    }
}
