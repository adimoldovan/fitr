import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
	entry: './src/index.ts',
	target: 'node',
	mode: 'production',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				include: [ path.resolve(__dirname, 'src') ],
			},
		],
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ],
	},
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname, 'dist'),
		clean: true,
	},
	experiments: {
		outputModule: true,
	},
};
