import fs from 'fs/promises';
import path from 'path';
import { Transaction } from '../types.js';
import { getDataDir } from '../utils/storageUtils.js';

function getTransactionsPath(symbol: string): string {
    return path.resolve(getDataDir(), 'transactions', `${symbol}.json`);
}

export async function getTransactions(symbol: string): Promise<Transaction[]> {
    try {
        const transactionsPath = getTransactionsPath(symbol);
        const data = await fs.readFile(transactionsPath, 'utf-8');
        const { transactions } = JSON.parse(data);
        return transactions;
    } catch (error) {
        console.error(`Error reading transactions for ${symbol}:`, error);
        throw new Error(`Failed to read transactions for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
