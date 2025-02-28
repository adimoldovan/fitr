export class Config {
    private static instance: Config;
    private devMode = false;
    private debugMode = false;

    private constructor() {}

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
}
