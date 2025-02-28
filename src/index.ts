#!/usr/bin/env node
import { Command } from 'commander';
import { displayPortfolio } from './commands/displayPortfolio.js';
import { updateData } from './commands/updateData.js';
import { initializeStorage } from './utils/storageUtils.js';
import { Config } from './config.js';
import { Logger } from './utils/logger.js';

const program = new Command();

program
    .name('fi-tracker')
    .description('A CLI tool for tracking investment portfolio performance')
    .version('1.0.0');

program
    .option('--offline', 'Display portfolio data without fetching current prices')
    .option('--update', 'Update historical price data for all assets in the portfolio')
    .option('--debug', 'Use development data directory')
    .option('--dev-data', 'Use development data directory')
    .action(async (options) => {
        Config.getInstance().setDevMode(!!options.devData);
        Config.getInstance().setDebugMode(!!options.debug);

        Logger.info(`Running in ${Config.getInstance().isDevMode() ? 'development' : 'production'} data mode`);

        await initializeStorage();

        try {
            if (options.update) {
                await updateData();
            }

            await displayPortfolio();
        } catch (error) {
            Logger.error('', error);
            process.exit(1);
        }
    });

program.parse(process.argv);
