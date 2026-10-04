import { runCalculationTests } from './utils/calculations.test';
import { runOperationalPolishTests } from './utils/operationalPolish.test';

console.log('====================================================');
console.log('SMARTCORE LEDGER — AUTOMATED OPERATIONAL POLISH SUITE');
console.log('====================================================\n');

console.log('>>> [1/2] Running Core Financial Calculations Tests...');
const calcResult = runCalculationTests();
calcResult.results.forEach(r => console.log('  ' + r));
console.log(`Calculation Tests Result: ${calcResult.passed ? 'ALL PASSED' : 'SOME FAILED'}\n`);

console.log('>>> [2/2] Running Thermal Receipts, RBAC Permissions & WhatsApp Tests...');
const polishResult = runOperationalPolishTests();
polishResult.results.forEach(r => console.log('  ' + r));
console.log(`Operational Polish Tests Result: ${polishResult.passed ? 'ALL PASSED' : 'SOME FAILED'}\n`);

const overallPassed = calcResult.passed && polishResult.passed;
console.log('====================================================');
if (overallPassed) {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY (100% PASS RATE)');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('❌ UNIT TESTS FAILED');
  console.log('====================================================');
  process.exit(1);
}
