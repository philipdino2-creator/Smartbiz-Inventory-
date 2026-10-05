import { runCalculationTests } from './utils/calculations.test';
import { runOperationalPolishTests } from './utils/operationalPolish.test';
import { runBackendRemediationTests } from './utils/backendRemediation.test';
import { runConcurrencyHardeningTests } from './utils/concurrencyHardening.test';
import { runRuntimeReliabilityTests } from './utils/runtimeReliability.test';
import { runPersistentSessionsTests } from './utils/persistentSessions.test';

async function runAllTests() {
  console.log('====================================================');
  console.log('SMARTCORE LEDGER — AUTOMATED OPERATIONAL POLISH SUITE');
  console.log('====================================================\n');

  console.log('>>> [1/6] Running Core Financial Calculations Tests...');
  const calcResult = runCalculationTests();
  calcResult.results.forEach(r => console.log('  ' + r));
  console.log(`Calculation Tests Result: ${calcResult.passed ? 'ALL PASSED' : 'SOME FAILED'}\n`);

  console.log('>>> [2/6] Running Thermal Receipts, RBAC Permissions & WhatsApp Tests...');
  const polishResult = runOperationalPolishTests();
  polishResult.results.forEach(r => console.log('  ' + r));
  console.log(`Operational Polish Tests Result: ${polishResult.passed ? 'ALL PASSED' : 'SOME FAILED'}\n`);

  console.log('>>> [3/6] Running Backend Migration Remediation Tests...');
  const remediationResult = runBackendRemediationTests();
  remediationResult.results.forEach(r => console.log('  ' + r));
  console.log(`Remediation Tests Result: ${remediationResult.passed ? 'ALL PASSED' : 'SOME FAILED'}\n`);

  console.log('>>> [4/6] Running Database Integrity & Concurrency Hardening Tests...');
  const concurrencyResult = await runConcurrencyHardeningTests();
  concurrencyResult.results.forEach(r => console.log('  ' + r));
  console.log(`Concurrency Tests Result: ${concurrencyResult.passed ? 'ALL PASSED' : 'SOME FAILED'}\n`);

  console.log('>>> [5/6] Running Runtime Reliability, Health Checks & Graceful Shutdown Tests...');
  const reliabilityResult = await runRuntimeReliabilityTests();
  reliabilityResult.results.forEach(r => console.log('  ' + r));
  console.log(`Reliability Tests Result: ${reliabilityResult.passed ? 'ALL PASSED' : 'SOME FAILED'}\n`);

  console.log('>>> [6/6] Running Persistent Authentication Sessions & Multi-Instance Tests...');
  const sessionResult = await runPersistentSessionsTests();
  sessionResult.results.forEach(r => console.log('  ' + r));
  console.log(`Persistent Sessions Result: ${sessionResult.passed ? 'ALL PASSED' : 'SOME FAILED'}\n`);

  const overallPassed =
    calcResult.passed &&
    polishResult.passed &&
    remediationResult.passed &&
    concurrencyResult.passed &&
    reliabilityResult.passed &&
    sessionResult.passed;

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
}

runAllTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
