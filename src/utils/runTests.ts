import { runCalculationTests } from './calculations.test';

const results = runCalculationTests();
console.log('--- TEST RUN RESULTS ---');
results.results.forEach(r => console.log(r));
console.log(`OVERALL STATUS: ${results.passed ? 'ALL TESTS PASSED ✓' : 'TESTS FAILED ✗'}`);

if (!results.passed) {
  process.exit(1);
}
