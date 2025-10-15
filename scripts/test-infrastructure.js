#!/usr/bin/env node

/**
 * Test Infrastructure Verification Script
 * 
 * This script verifies that all testing infrastructure is properly set up
 * and working correctly.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Infrastructure Verification\n');

// Check if required files exist
const requiredFiles = [
  'jest.config.js',
  'jest.setup.js',
  'playwright.config.ts',
  '.env.test',
  'tests/setup/database.ts',
  'tests/setup/jest-setup.ts',
  'tests/README.md'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please check the setup.');
  process.exit(1);
}

// Check if test directories exist
const testDirs = [
  'tests/setup',
  'tests/e2e',
  'tests/integration',
  'lib/validations/__tests__',
  'lib/utils/__tests__'
];

console.log('\n📂 Checking test directories...');
testDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ❌ ${dir} - MISSING`);
  }
});

// Run unit tests
console.log('\n🔬 Running unit tests...');
try {
  execSync('npm run test -- --passWithNoTests --silent', { stdio: 'inherit' });
  console.log('  ✅ Unit tests passed');
} catch (error) {
  console.log('  ❌ Unit tests failed');
  console.error(error.message);
}

// Check Playwright installation
console.log('\n🎭 Checking Playwright setup...');
try {
  execSync('npx playwright --version', { stdio: 'pipe' });
  console.log('  ✅ Playwright is installed');
} catch (error) {
  console.log('  ❌ Playwright is not properly installed');
}

// Verify test scripts in package.json
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['test', 'test:watch', 'test:e2e', 'test:integration', 'test:all'];

requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`  ✅ ${script}: ${packageJson.scripts[script]}`);
  } else {
    console.log(`  ❌ ${script} - MISSING`);
  }
});

console.log('\n✨ Testing infrastructure verification complete!');
console.log('\n📚 Available test commands:');
console.log('  npm run test              - Run unit tests');
console.log('  npm run test:watch        - Run unit tests in watch mode');
console.log('  npm run test:integration  - Run integration tests (requires database)');
console.log('  npm run test:e2e          - Run end-to-end tests');
console.log('  npm run test:all          - Run unit and E2E tests');
console.log('\n📖 See tests/README.md for detailed documentation.');