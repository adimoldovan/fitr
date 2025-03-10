#!/usr/bin/env node
import {Command} from 'commander';
import {displayPortfolio} from './commands/displayPortfolio';
import {updateData} from './commands/updateData';
import {interactiveAddTransaction} from './commands/interactiveTransaction';
import {listTransactions} from './commands/listTransactions';
import {initializeStorage} from './utils/storageUtils';
import {Config} from './config';
import {Logger} from './utils/logger';

const program = new Command();

// Configure the main program
program
    .name('fi-tracker')
    .description('A CLI tool for tracking investment portfolio performance')
    .version('0.1.0')
    .helpOption('--help, -h', 'Display help information');

// Add global options
program
    .option('-v, --verbose', 'Enable verbose logging mode')
    .option('-D, --dev-data', 'Use development data directory');

/**
 * Common options interface for commands
 */
interface CommandOptions {
    verbose?: boolean;
    devData?: boolean;
    sync?: boolean;
    growthRate?: string;
    skipPrediction?: boolean;
    symbol?: string;
    type?: string;
    date?: string;
    quantity?: number;
    price?: number;
    fees?: number;
    notes?: string;
    interactive?: boolean;
}

/**
 * Setup common configuration and initialization for commands
 * @param options Command options
 * @returns Promise that resolves when setup is complete
 */
async function setupCommand(options: CommandOptions): Promise<void> {
    Config.getInstance().setDevMode(!!options.devData);
    Config.getInstance().setDebugMode(!!options.verbose);
    await Config.getInstance().loadConfigFromFile();

    if (options.verbose) {
        Logger.debug(`Options: ${JSON.stringify(options)}`);
        Logger.debug(`Config: ${JSON.stringify(Config.getInstance())}`);
    }

    if (Config.getInstance().isDevMode()) {
        Logger.info(`Running in dev data mode`);
    }

    await initializeStorage();
}

// Main command
program
    .option('-s, --sync', 'Fetches and updates historical price data for all assets and calculates portfolio performance')
    .option('-g, --growth-rate <growthRate>', 'Set the expected annual growth rate for the portfolio', '0.07')
    .option('-p, --skip-prediction', 'Hide the prediction table')
    .action(async (options) => {
        try {
            await setupCommand(options);
            
            if (options.sync) {
                await updateData();
            }

            await displayPortfolio(options.growthRate, !!options.skipPrediction);
        } catch (error) {
            Logger.error('', error);
        }
    });

// Create transaction command with subcommands
const transactionCommand = program
    .command('transaction')
    .description('Manage asset transactions')
    .alias('tx')
    .helpOption('--help, -h', 'Display help information');

// Add transaction subcommand (always interactive)
transactionCommand
    .command('add')
    .description('Add a new transaction for an asset (interactive mode)')
    .helpOption('--help, -h', 'Display help information')
    .action(async (options) => {
        try {
            // Merge command options with global options
            const mergedOptions = {
                ...program.opts(),
                ...options
            };
            
            await setupCommand(mergedOptions);
            
            // Always use interactive mode
            await interactiveAddTransaction();
        } catch (error) {
            Logger.error('Error adding transaction', error);
        }
    });

// List transactions subcommand
transactionCommand
    .command('list')
    .description('List transactions for an asset')
    .option('-s, --symbol <symbol>', 'Asset symbol')
    .helpOption('--help, -h', 'Display help information')
    .action(async (options) => {
        try {
            // Merge command options with global options
            const mergedOptions = {
                ...program.opts(),
                ...options
            };
            
            await setupCommand(mergedOptions);
            
            await listTransactions(options.symbol);
        } catch (error) {
            Logger.error('Error listing transactions', error);
        }
    });

program.parse(process.argv);
