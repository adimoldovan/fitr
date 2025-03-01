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
    .version('0.1.0');

program
    .option('--sync', 'Fetches and updates historical price data for all assets and calculates portfolio performance')
    .option('--debug', 'Use development data directory')
    .option('--dev-data', 'Use development data directory')
    .option('--growth-rate <growthRate>', 'Set the expected annual growth rate for the portfolio', '0.07')
    .option('--skip-prediction', 'Hide the prediction table')
    .helpOption('--help, -h', 'Display help information')
    .action(async (options) => {
        Config.getInstance().setDevMode(!!options.devData);
        Config.getInstance().setDebugMode(!!options.debug);

        if (options.debug) {
            Logger.debug(`Options: ${JSON.stringify(options)}`);
        }

        Logger.info(`Running in ${Config.getInstance().isDevMode() ? 'development' : 'production'} data mode`);

        await initializeStorage();

        try {
            if (options.sync) {
                await updateData();
            }

            await displayPortfolio(options.growthRate, !!options.skipPrediction);
        } catch (error) {
            Logger.error('', error);
        }
    });

program.parse(process.argv);
