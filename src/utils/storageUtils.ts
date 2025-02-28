import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Config } from '../config.js';
import { Logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getDataDir(caller?: string): string {
    if ( caller ) {
        Logger.debug(`Resolving data dir for ${caller}`);
    }
    if (Config.getInstance().isDevMode()) {
        return path.resolve(__dirname, '../../data');
    }
    return path.resolve(os.homedir(), '.fi-tracker');
}

export async function initializeStorage(): Promise<void> {
    const DATA_DIR = getDataDir();
    Logger.debug(`Initializing storage in ${DATA_DIR}`);

    Logger.info(`Data directory: ${ DATA_DIR }`);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(path.resolve(DATA_DIR, 'transactions'), { recursive: true });
    await fs.mkdir(path.resolve(DATA_DIR, 'prices'), { recursive: true });
}
