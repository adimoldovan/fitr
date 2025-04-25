import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { Config } from '../config';
import { Logger } from './logger';

// Use process.cwd() which works for both CommonJS and ESM
const rootDir = process.cwd();

function getICloudDrivePath(): string {
    return path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs');
}

export function getDataDir(caller?: string): string {
    if (caller) {
        Logger.debug(`Resolving data dir for ${caller}`);
    }
    if (Config.getInstance().isDevMode()) {
        return path.resolve(rootDir, 'data');
    }

    // Use iCloud Drive on macOS
    if (process.platform === 'darwin') {
        return path.resolve(getICloudDrivePath(), 'Fitr');
    }

    // Fallback to home directory for other platforms
    return path.resolve(os.homedir(), '.fitr');
}

export async function initializeStorage(): Promise<void> {
    let DATA_DIR = getDataDir();
    Logger.debug(`Initializing storage in ${DATA_DIR}`);

    // Check if iCloud Drive is available on macOS
    if (process.platform === 'darwin') {
        try {
            await fs.access(getICloudDrivePath());
        } catch {
            Logger.warn('iCloud Drive not available, falling back to home directory');
            DATA_DIR = path.resolve(os.homedir(), '.fitr');
        }
    }

    Logger.info(`Data directory: ${DATA_DIR}`);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(path.resolve(DATA_DIR, 'transactions'), { recursive: true });
    await fs.mkdir(path.resolve(DATA_DIR, 'prices'), { recursive: true });
}
