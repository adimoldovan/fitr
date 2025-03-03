import chalk from 'chalk';
import {Config} from "../config.js";

const LOGGING_LEVELS: Record<string, number> = {
    debug: 4,
    info: 3,
    warn: 2,
    error: 1,
};

export class Logger {
    private static taskLevel = 0;
    private static readonly INDENT_SIZE = 2;

    static get loggingLevel() {
        return Config.getInstance().isDebugMode()
            ? LOGGING_LEVELS.debug as number
            : LOGGING_LEVELS.info as number;
    }

    private static getCurrentIndent(): string {
        return ' '.repeat(this.taskLevel * this.INDENT_SIZE);
    }

    static error(message: string, err: unknown, exit = true) {
        if (this.loggingLevel >= LOGGING_LEVELS.error) {
            console.error(`${this.getCurrentIndent()}${chalk.red('✖')} ${chalk.red(message)}`);
            if (err instanceof Error) {
                console.error(`${this.getCurrentIndent()}  ${chalk.red(err.message)}`);
                console.error(`${this.getCurrentIndent()}  ${chalk.red(err.stack)}`);
            } else if (err) {
                console.error(`${this.getCurrentIndent()}  ${chalk.red(String(err))}`);
            }
        }

        if (exit) {
            process.exit(1);
        }
    }

    static warn(message: string) {
        if (this.loggingLevel >= LOGGING_LEVELS.warn) {
            console.warn(`${this.getCurrentIndent()}${chalk.yellow('⚠')} ${chalk.yellow(message)}`);
        }
    }

    static info(message: string) {
        if (this.loggingLevel >= LOGGING_LEVELS.info) {
            console.log(`${this.getCurrentIndent()}${chalk.green('ℹ')} ${message}`);
        }
    }

    static debug(message: string) {
        if (this.loggingLevel >= LOGGING_LEVELS.debug) {
            console.log(`${this.getCurrentIndent()}${chalk.cyan('•')} ${chalk.cyan(message)}`);
        }
    }

    static start(message: string) {
        console.log(`${this.getCurrentIndent()}${chalk.green('▶')} ${message}`);
        this.taskLevel++;
    }

    static end() {
        if (this.taskLevel > 0) {
            this.taskLevel--;
            console.log(`${this.getCurrentIndent()}${chalk.green('✓')} Complete`);
        }
    }

    static stripAnsi(str: string): string {
        return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
    }

    static printTable(data: Record<string, string>[], withHeader: boolean, title: string) {
        console.log();
        // Calculate column widths
        const columnWidths: Record<string, number> = {};
        const columns = Object.keys(data[0]);

        // First, determine max width for each column
        columns.forEach(col => {
            columnWidths[col] = Math.max(
                col.length,
                ...data.map(row => this.stripAnsi(row[col]).length)
            );
        });

        console.log(chalk.bgHex('#5a3f65')(`  ${title}  `));

        // Print header
        const headerLine = columns.map(col =>
            col.padEnd(columnWidths[col], ' ')
        ).join(' | ');
        if (withHeader) {
            console.log('-'.repeat(headerLine.length));
            console.log(headerLine.toUpperCase());
        }
        console.log('='.repeat(headerLine.length));

        // Print rows
        data.forEach(row => {
            const line = columns.map(col =>
                String(row[col]).padEnd(columnWidths[col], ' ')
            ).join(' | ');
            console.log(line);
            console.log('-'.repeat(headerLine.length));
        });
        // console.log('_'.repeat(headerLine.length));
        console.log();
    }
}
