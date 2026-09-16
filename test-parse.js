const { readFileSync } = require('fs');
const ts = require('typescript');
const code = readFileSync('src/server/portfolioRepo.ts', 'utf8');

// Just load it and see if there are errors parsing
try {
  // Try evaluating the array? No, it's TS. Let's just compile and run a script to print the lengths
} catch (e) {
}
