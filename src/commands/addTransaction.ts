import { getTransactions, saveTransactions } from '../services/transactionService.js';
import { getPortfolio, updatePortfolio } from '../services/portfolioService.js';
import { Transaction, TransactionType } from '../types.js';
import { Logger } from '../utils/logger.js';
import { format, parse } from 'date-fns';

export async function addTransaction(
    symbol: string,
    type: string,
    date: string,
    quantity: number,
    price: number,
    fees?: number,
    notes?: string
): Promise<void> {
    try {
        // Validate symbol exists in portfolio
        const portfolio = await getPortfolio();
        const asset = portfolio.assets.find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
        
        if (!asset) {
            Logger.error(`Asset with symbol ${symbol} not found in portfolio`, null);
            return;
        }

        // Validate transaction type
        const transactionType = type.toLowerCase() as TransactionType;
        if (!Object.values(TransactionType).includes(transactionType)) {
            Logger.error(`Invalid transaction type: ${type}. Valid types are: ${Object.values(TransactionType).join(', ')}`, null);
            return;
        }

        // Parse and validate date
        let parsedDate: Date;
        try {
            // Try to parse date in YYYY-MM-DD format
            parsedDate = parse(date, 'yyyy-MM-dd', new Date());
            if (isNaN(parsedDate.getTime())) {
                throw new Error('Invalid date format');
            }
        } catch (err) {
            Logger.error(`Invalid date format: ${date}. Please use YYYY-MM-DD format.`, err);
            return;
        }

        // Validate quantity and price
        if (quantity <= 0) {
            Logger.error(`Quantity must be greater than 0`, null);
            return;
        }

        if (price < 0) {
            Logger.error(`Price cannot be negative`, null);
            return;
        }

        // Create new transaction
        const newTransaction: Transaction = {
            date: format(parsedDate, 'yyyy-MM-dd'),
            type: transactionType,
            quantity,
            price,
            fees: fees || 0,
            notes: notes || ''
        };

        // Get existing transactions and add the new one
        const transactions = await getTransactions(symbol);
        transactions.push(newTransaction);
        
        // Sort transactions by date (oldest first)
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Save updated transactions
        await saveTransactions(symbol, transactions);
        
        Logger.info(`Transaction added successfully for ${symbol}`);
        
        // Update portfolio calculations
        await updatePortfolio();
        
        Logger.info(`Portfolio updated successfully`);
    } catch (error) {
        Logger.error('Error adding transaction', error);
    }
} 