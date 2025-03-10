import { getTransactions } from '../services/transactionService.js';
import { getPortfolio } from '../services/portfolioService.js';
import { Logger } from '../utils/logger.js';
import { format, parseISO } from 'date-fns';
import { table } from 'table';

/**
 * Format currency value
 * @param value Value to format
 * @param currency Currency symbol
 * @returns Formatted currency string
 */
function formatCurrency(value: number, currency: string = ''): string {
    return `${currency}${value.toFixed(2)}`;
}

/**
 * List transactions for a specific asset
 * @param symbol Asset symbol
 */
export async function listTransactions(symbol?: string): Promise<void> {
    try {
        // If no symbol is provided, prompt the user to select an asset
        if (!symbol) {
            const portfolio = await getPortfolio();
            
            if (!portfolio.assets || portfolio.assets.length === 0) {
                Logger.error('No assets found in portfolio. Please add assets first.', null);
                return;
            }
            
            // List all assets and let the user choose
            Logger.info('Available assets:');
            portfolio.assets.forEach((asset, index) => {
                Logger.info(`${index + 1}. ${asset.name} (${asset.symbol})`);
            });
            
            Logger.info('Please specify an asset symbol using --symbol option');
            return;
        }
        
        // Validate symbol exists in portfolio
        const portfolio = await getPortfolio();
        const asset = portfolio.assets.find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
        
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
        
        // Sort transactions by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        // Display transactions in a table
        const tableData = [
            ['Date', 'Type', 'Quantity', 'Price', 'Fees', 'Total', 'Notes']
        ];
        
        sortedTransactions.forEach(transaction => {
            const total = transaction.quantity * transaction.price + (transaction.fees || 0);
            tableData.push([
                format(parseISO(transaction.date), 'yyyy-MM-dd'),
                transaction.type.toUpperCase(),
                transaction.quantity.toString(),
                formatCurrency(transaction.price, asset.currency),
                formatCurrency(transaction.fees || 0, asset.currency),
                formatCurrency(total, asset.currency),
                transaction.notes || ''
            ]);
        });
        
        // Calculate totals
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
        
        // Add summary row
        tableData.push([
            'SUMMARY',
            '',
            totalQuantity.toString(),
            '',
            formatCurrency(totalFees, asset.currency),
            formatCurrency(totalCost + totalFees, asset.currency),
            ''
        ]);
        
        // Print the table
        Logger.info(`Transactions for ${asset.name} (${asset.symbol}):`);
        console.log(table(tableData));
        
    } catch (error) {
        Logger.error('Error listing transactions', error);
    }
} 