import { getTransactions } from '../services/transactionService';
import { getPortfolio } from '../services/portfolioService';
import { Logger } from '../utils/logger';
import { format, parseISO } from 'date-fns';
import { table } from 'table';
import { formatNumber } from '../utils/formatUtils';
import { Asset, Transaction } from '../types';

/**
 * Display available assets in the portfolio
 * @param assets List of assets in the portfolio
 */
export function displayAvailableAssets(assets: Asset[]): void {
    Logger.info('Available assets:');
    assets.forEach((asset, index) => {
        Logger.info(`${index + 1}. ${asset.name} (${asset.symbol})`);
    });
    Logger.info('Please specify an asset symbol using --symbol option');
}

/**
 * Find an asset in the portfolio by symbol
 * @param assets List of assets in the portfolio
 * @param symbol Asset symbol to find
 * @returns The found asset or undefined if not found
 */
export function findAssetBySymbol(assets: Asset[], symbol: string): Asset | undefined {
    return assets.find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
}

/**
 * Sort transactions by date (newest first)
 * @param transactions List of transactions to sort
 * @returns Sorted transactions
 */
export function sortTransactionsByDate(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

/**
 * Calculate transaction statistics
 * @param transactions List of transactions
 * @returns Object containing total quantity, cost, and fees
 */
export function calculateTransactionStats(transactions: Transaction[]): { 
    totalQuantity: number; 
    totalCost: number; 
    totalFees: number; 
} {
    const totalQuantity = transactions.reduce((sum, t) => {
        if (t.type === 'buy' || t.type === 'vested') {
            return sum + t.quantity;
        } else if (t.type === 'sell') {
            return sum - t.quantity;
        }
        return sum;
    }, 0);

    const totalCost = transactions.reduce((sum, t) => {
        if (t.type === 'buy' || t.type === 'vested') {
            return sum + (t.quantity * t.price);
        } else if (t.type === 'sell') {
            return sum - (t.quantity * t.price);
        }
        return sum;
    }, 0);

    const totalFees = transactions.reduce((sum, t) => sum + (t.fees || 0), 0);

    return { totalQuantity, totalCost, totalFees };
}

/**
 * Format transactions into table data
 * @param transactions List of transactions
 * @param stats Transaction statistics
 * @returns Formatted table data
 */
export function formatTransactionsTable(transactions: Transaction[], stats: { 
    totalQuantity: number; 
    totalCost: number; 
    totalFees: number; 
}): string[][] {
    const tableData = [
        ['Date', 'Type', 'Quantity', 'Price', 'Fees', 'Total', 'Notes']
    ];

    transactions.forEach(transaction => {
        const total = transaction.quantity * transaction.price + (transaction.fees || 0);
        tableData.push([
            format(parseISO(transaction.date), 'yyyy-MM-dd'),
            transaction.type.toUpperCase(),
            transaction.quantity.toString(),
            formatNumber(transaction.price),
            formatNumber(transaction.fees || 0),
            formatNumber(total),
            transaction.notes || ''
        ]);
    });

    // Add summary row
    tableData.push([
        'SUMMARY',
        '',
        stats.totalQuantity.toString(),
        '',
        formatNumber(stats.totalFees),
        formatNumber(stats.totalCost + stats.totalFees),
        ''
    ]);

    return tableData;
}

/**
 * Display transactions table
 * @param asset Asset information
 * @param tableData Formatted table data
 */
export function displayTransactionsTable(asset: Asset, tableData: string[][]): void {
    Logger.info(`Transactions for ${asset.name} (${asset.symbol}):`);
    console.log(table(tableData));
}

/**
 * List transactions for a specific asset
 * @param symbol Asset symbol
 */
export async function listTransactions(symbol?: string): Promise<void> {
    try {
        // Get portfolio data
        const portfolio = await getPortfolio();

        // If no symbol is provided, display available assets
        if (!symbol) {
            if (!portfolio.assets || portfolio.assets.length === 0) {
                Logger.error('No assets found in portfolio. Please add assets first.', null);
                return;
            }

            displayAvailableAssets(portfolio.assets);
            return;
        }

        // Validate symbol exists in portfolio
        const asset = findAssetBySymbol(portfolio.assets, symbol);

        if (!asset) {
            Logger.error(`Asset with symbol ${symbol} not found in portfolio`, null);
            return;
        }

        // Get transactions for the asset
        const transactions = await getTransactions(symbol);

        if (!transactions || transactions.length === 0) {
            Logger.info(`No transactions found for ${symbol}`);
            return;
        }

        // Sort transactions by date
        const sortedTransactions = sortTransactionsByDate(transactions);

        // Calculate transaction statistics
        const stats = calculateTransactionStats(transactions);

        // Format transactions into table data
        const tableData = formatTransactionsTable(sortedTransactions, stats);

        // Display the transactions table
        displayTransactionsTable(asset, tableData);

    } catch (error) {
        Logger.error('Error listing transactions', error);
    }
} 