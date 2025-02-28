import chalk from 'chalk';
import { Config } from "../config.js";

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

	static error(message: string, err: unknown) {
		if (this.loggingLevel >= LOGGING_LEVELS.error) {
			console.error(`${this.getCurrentIndent()}${chalk.red('✖')} ${chalk.red(message)}`);
			if (err instanceof Error) {
				console.error(`${this.getCurrentIndent()}  ${chalk.red(err.message)}`);
				console.error(`${this.getCurrentIndent()}  ${chalk.red(err.stack)}`);
			} else if (err) {
				console.error(`${this.getCurrentIndent()}  ${chalk.red(String(err))}`);
			}
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
}
