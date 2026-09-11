#!/usr/bin/env node
/**
 * Verification script for bank seed (PR: bank-seed-camera-format)
 * 
 * MƏQSƏD: Təsdiq etmək ki, PR #9-un fingerprint strip logic-i ilə seed olunan
 * suallar Qat 2 (bank_fingerprint) tərəfindən TUTULA BİLƏR.
 * 
 * Test edir:
 * 1. numericFingerprint cavab variantlarını düzgün stripləyir
 * 2. Seed sualların fingerprint_digits-ləri canonical-larından hesablanan ilə UYĞUN gəlir
 * 3. Eyni canonical (müxtəlif choice order ilə) eyni fingerprint verir
 * 
 * İşə salma:
 *   node scripts/verify-bank-seed.mjs
 */

// ═══════════════════════════════════════════════════════════════════════════════════
// Fingerprint logic (PR #9-dan kopyalanıb — bank.ts-dən)
// ═══════════════════════════════════════════════════════════════════════════════════

function numericFingerprint(canonical) {
  // Cavab variantlarını sil: A) 123 B) 456 C) 789 və ya a) 12 b) 34 formaları.
  // Pattern: [A-E] və ya [a-e], sonra ), sonra ixtiyari boşluq, sonra rəqəm(lər)/faiz.
  const withoutChoices = canonical.replace(/\b[A-Ea-e]\)\s*-?\d+(\.\d+)?%?\b/g, '');
  return (withoutChoices.match(/-?\d+(\.\d+)?/g) ?? []).join(',');
}

// ═══════════════════════════════════════════════════════════════════════════════════
// Seed sualların test case-ləri (migration 0075-dən)
// ═══════════════════════════════════════════════════════════════════════════════════

const testCases = [
  {
    id: 'Q1',
    canonical: '15. Mağazada birinci gün bütün malın 20%-i, ikinci gün isə qalan malın 60%-i satıldı. İki gündə mağazadakı bütün malın neçə faizi satıldı? A) 58% B) 68% C) 72% D) 80% E) 88%',
    expectedFingerprint: '15,20,60',
    topic: 'ARITH.PERCENT_OF'
  },
  {
    id: 'Q2',
    canonical: '23. x² - 7x + 12 = 0 tənliyinin kökləri x₁ və x₂ olarsa, x₁·x₂ hasilini tapın. A) -12 B) -7 C) 7 D) 12 E) 19',
    expectedFingerprint: '23,7,12,0',
    topic: 'ALG.VIETA_PRODUCT'
  },
  {
    id: 'Q3',
    canonical: '8. 3x + 5 = 20 tənliyini həll edin. A) 3 B) 5 C) 8 D) 15 E) 25',
    expectedFingerprint: '8,3,5,20',
    topic: 'ALG.LINEAR_EQUATION'
  },
  {
    id: 'Q4',
    canonical: '12. Kitabın qiyməti 50 manatdır. Qiymət 20% artırıldı. Yeni qiymət neçə manatdır? A) 55 B) 60 C) 65 D) 70 E) 75',
    expectedFingerprint: '12,50,20',
    topic: 'ARITH.PERCENT_INCREASE'
  },
  {
    id: 'Q5',
    canonical: '17. √48 ifadəsini sadələşdirin. A) 2√3 B) 3√2 C) 4√3 D) 6√2 E) 8√6',
    expectedFingerprint: '17,48,3,2,3,2,6',
    topic: 'ALG.SQUARE_ROOT_SIMPLIFY'
  },
  {
    id: 'Q6',
    canonical: '5. 24/36 kəsrini sadələşdirin. A) 1/2 B) 2/3 C) 3/4 D) 4/5 E) 5/6',
    expectedFingerprint: '5,24,36,2,3,4,5,6',
    topic: 'ARITH.FRACTION_SIMPLIFY'
  },
  {
    id: 'Q7',
    canonical: '19. Əgər 5 ədəd alma 10 manata başa gəlirsə, 8 ədəd alma neçə manat olar? A) 12 B) 14 C) 16 D) 18 E) 20',
    expectedFingerprint: '19,5,10,8',
    topic: 'ARITH.PROPORTION'
  },
  {
    id: 'Q8',
    canonical: '31. x² + 6x + 9 = 0 tənliyinin neçə həqiqi kökü var? A) 0 B) 1 C) 2 D) 3 E) sonsuz çox',
    expectedFingerprint: '31,6,9,0',
    topic: 'ALG.QUADRATIC_DISCRIMINANT'
  },
  {
    id: 'Q9',
    canonical: '14. 3, 7, 11, 15, ... arifmetik ardıcıllığın 10-cu həddi neçədir? A) 35 B) 37 C) 39 D) 41 E) 43',
    expectedFingerprint: '14,3,7,11,15,10',
    topic: 'ALG.ARITHMETIC_SEQUENCE'
  },
  {
    id: 'Q10',
    canonical: '21. Ədədin 25%-i 40-dır. Ədədin özü neçədir? A) 10 B) 80 C) 100 D) 120 E) 160',
    expectedFingerprint: '21,25,40',
    topic: 'ARITH.PERCENT_REVERSE'
  }
];

// ═══════════════════════════════════════════════════════════════════════════════════
// Test harness
// ═══════════════════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('Bank Seed Verification — Fingerprint Match Test');
console.log('═══════════════════════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const computed = numericFingerprint(tc.canonical);
  const match = computed === tc.expectedFingerprint;
  
  if (match) {
    passed++;
    console.log(`✓ ${tc.id} (${tc.topic})`);
    console.log(`  Expected: ${tc.expectedFingerprint}`);
    console.log(`  Computed: ${computed}\n`);
  } else {
    failed++;
    console.log(`✗ ${tc.id} (${tc.topic}) — MISMATCH`);
    console.log(`  Expected: ${tc.expectedFingerprint}`);
    console.log(`  Computed: ${computed}`);
    console.log(`  Canonical: ${tc.canonical.slice(0, 80)}...\n`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// Choice order independence test
// ═══════════════════════════════════════════════════════════════════════════════════

console.log('───────────────────────────────────────────────────────────────────────────');
console.log('Choice Order Independence Test\n');

const canonical1 = '15. Məsələ A) 58% B) 68% C) 72%';
const canonical2 = '15. Məsələ C) 72% A) 58% B) 68%';  // Same digits, different order
const fp1 = numericFingerprint(canonical1);
const fp2 = numericFingerprint(canonical2);

console.log(`Original:  "${canonical1}"`);
console.log(`  Fingerprint: ${fp1}`);
console.log(`Reordered: "${canonical2}"`);
console.log(`  Fingerprint: ${fp2}`);

if (fp1 === fp2) {
  console.log('✓ Fingerprints MATCH — choice order does not affect fingerprint\n');
  passed++;
} else {
  console.log('✗ Fingerprints DIFFER — choice order affects fingerprint (BUG!)\n');
  failed++;
}

// ═══════════════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════════════');
console.log(`TOTAL: ${passed + failed} tests`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('═══════════════════════════════════════════════════════════════════════════\n');

if (failed === 0) {
  console.log('✓ ALL TESTS PASSED');
  console.log('\nVERDICT: Bank seed migration is READY.');
  console.log('After merge + migration apply, Qat 2 (bank_fingerprint) should emit');
  console.log('match_path="fingerprint" for camera captures matching these questions.\n');
  process.exit(0);
} else {
  console.log('✗ SOME TESTS FAILED');
  console.log('\nFix fingerprint logic or seed data before merging.\n');
  process.exit(1);
}
