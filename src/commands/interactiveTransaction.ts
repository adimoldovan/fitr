import inquirer from 'inquirer';
import { format, parse, isValid } from 'date-fns';
import { getPortfolio } from '../services/portfolioService';
import { addTransaction } from './addTransaction';
import { TransactionType } from '../types';
import { Logger } from '../utils/logger';

/**
 * Validates a date string in YYYY-MM-DD format
 * @param dateStr Date string to validate
 * @returns True if valid, error message if invalid
 */
function validateDate(dateStr: string): boolean | string {
    try {
        const date = parse(dateStr, 'yyyy-MM-dd', new Date());
        return isValid(date) ? true : 'Invalid date format. Please use YYYY-MM-DD format.';
    } catch {
        return 'Invalid date format. Please use YYYY-MM-DD format.';
    }
}

/**
 * Validates a number is positive
 * @param value Value to validate
 * @returns True if valid, error message if invalid
 */
function validatePositiveNumber(value: string): boolean | string {
    const num = parseFloat(value);
    if (isNaN(num)) {
        return 'Please enter a valid number';
    }
    return num > 0 ? true : 'Please enter a number greater than 0';
}

/**
 * Validates a number is non-negative
 * @param value Value to validate
 * @returns True if valid, error message if invalid
 */
function validateNonNegativeNumber(value: string): boolean | string {
    const num = parseFloat(value);
    if (isNaN(num)) {
        return 'Please enter a valid number';
    }
    return num >= 0 ? true : 'Please enter a number greater than or equal to 0';
}

/**
 * Interactively prompt for transaction details and add the transaction
 */
export async function interactiveAddTransaction(): Promise<void> {
    try {
        // Get portfolio to list available assets
        const portfolio = await getPortfolio();
        
        if (!portfolio.assets || portfolio.assets.length === 0) {
            Logger.error('No assets found in portfolio. Please add assets first.', null);
            return;
        }
        
        // Create choices for asset selection
        const assetChoices = portfolio.assets.map(asset => ({
            name: `${asset.name} (${asset.symbol})`,
            value: asset.symbol
        }));
        
        // Create choices for transaction types
        const typeChoices = Object.values(TransactionType).map(type => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            value: type
        }));
        
        // Get current date in YYYY-MM-DD format for default value
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Prompt for transaction details
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'symbol',
                message: 'Select an asset:',
                choices: assetChoices
            },
            {
                type: 'list',
                name: 'type',
                message: 'Select transaction type:',
                choices: typeChoices
            },
            {
                type: 'input',
                name: 'date',
                message: 'Enter transaction date (YYYY-MM-DD):',
                default: today,
                validate: validateDate
            },
            {
                type: 'input',
                name: 'quantity',
                message: 'Enter quantity:',
                validate: validatePositiveNumber
            },
            {
                type: 'input',
                name: 'price',
                message: 'Enter price per unit:',
                validate: validateNonNegativeNumber
            },
            {
                type: 'input',
                name: 'fees',
                message: 'Enter transaction fees (optional):',
                default: '0',
                validate: validateNonNegativeNumber
            },
            {
                type: 'input',
                name: 'notes',
                message: 'Enter notes (optional):'
            }
        ]);
        
        // Call the addTransaction function with the collected data
        await addTransaction(
            answers.symbol,
            answers.type,
            answers.date,
            parseFloat(answers.quantity),
            parseFloat(answers.price),
            parseFloat(answers.fees),
            answers.notes
        );
        
    } catch (error) {
        Logger.error('Error in interactive transaction mode', error);
    }
} 