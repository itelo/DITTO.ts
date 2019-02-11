module.exports = {
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json"
    }
  },
  // collectCoverage: true,
  collectCoverageFrom: [
    "src/modules/**/*.ts",
    "src/utils/**/*.ts",
    "src/config/libs/*.ts",
    "src/config/index.ts"
  ],
  moduleFileExtensions: ["ts", "js"],
  moduleNameMapper: {
    "^@models/(.*)": "<rootDir>/src/models/$1",
    "^@modules/(.*)": "<rootDir>/src/modules/$1",
    "^@config/(.*)": "<rootDir>/src/config/$1",
    "^@utils/(.*)": "<rootDir>/src/utils/$1",
    "^types/(.*)": "<rootDir>/src/types/$1"
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  testMatch: ["**/test/**/*.test.(ts|js)"],
  testEnvironment: "node",
  setupTestFrameworkScriptFile: "./jest.setup.js"
};
