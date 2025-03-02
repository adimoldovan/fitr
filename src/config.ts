import fs from 'fs';
import path from "path";
import {getDataDir} from './utils/storageUtils.js';
import {Logger} from "./utils/logger.js";

interface ConfigData {
    mainCurrency: string;
    minTargetValue: string;
    maxTargetValue: string;
    targetValuePace: string;
}

export class Config {
    private static instance: Config;
    private devMode: boolean = false;
    private debugMode: boolean = false;
    private config: ConfigData = {
        mainCurrency: '',
        minTargetValue: '',
        maxTargetValue: '',
        targetValuePace: '',
    };

    private constructor() {
    }

    private async parseConfigFromFile(): Promise<void> {
        const configPath = path.join(getDataDir(), 'config.json');

        try {
            await fs.promises.access(configPath);
        } catch {
            Logger.debug(`Config file not found at ${configPath}, creating default config`);
            const defaultConfig = {
                mainCurrency: 'EUR',
                minTargetValue: '500000',
                maxTargetValue: '1000000',
                targetValuePace: '100000'
            };
            await fs.promises.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
        }

        try {
            Logger.debug(`Loading config from ${configPath}`);
            const configFile = await fs.promises.readFile(configPath, 'utf8');
            const loadedConfig = JSON.parse(configFile);
            this.config = {...this.config, ...loadedConfig};
        } catch (error) {
            Logger.error('Failed to load config.json', error, true);
        }
    }

    static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }

        return Config.instance;
    }

    setDevMode(value: boolean): void {
        this.devMode = value;
    }

    isDevMode(): boolean {
        return this.devMode;
    }

    setDebugMode(value: boolean): void {
        this.debugMode = value;
    }

    isDebugMode(): boolean {
        return this.debugMode;
    }

    async loadConfigFromFile(): Promise<void> {
        Logger.debug('Creating Config instance');
        await this.parseConfigFromFile();
    }

    getConfig(): ConfigData {
        return this.config;
    }
}
