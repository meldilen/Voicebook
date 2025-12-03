module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/unit_tests/setup.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/src/unit_tests/**/*.test.(js|jsx)'
  ],
  collectCoverageFrom: [
    'src/features/**/*.{js,jsx}',
    '!src/features/**/*.test.{js,jsx}'
  ]
};