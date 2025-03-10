/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
	preset: 'ts-jest/presets/default-esm',
	testEnvironment: 'node',
	rootDir: './',
	roots: [
		'<rootDir>/src',
	],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    extensionsToTreatAsEsm: ['.ts'],
};