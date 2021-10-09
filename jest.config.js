export default {
    verbose: true,
    moduleNameMapper: {
        '^@App/(.*)$': '<rootDir>/src/$1',
        '^lib/(.*)$': '<rootDir>/common/$1',
    },
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    globals: {
        'ts-jest': {
            useESM: true,
        },
    },
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
}
