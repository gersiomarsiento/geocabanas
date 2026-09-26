import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Path to your Next.js app, so next/jest can load next.config.ts and .env files
  dir: "./",
});

const config: Config = {
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "\\.integration\\.test\\.ts$",
  ],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
};

// next/jest returns an async function that merges in the Next.js-specific config
export default createJestConfig(config);
