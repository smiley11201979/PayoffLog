// Node unit tests for src/seed.js — run with `npm test`.
// Loaded through a data: URL (same pattern as hub-helper's suites).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/seed.js', import.meta.url), 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const { SEED_DEBTS, seedKey, allSeedKeys, backfillSeeds } = mod;

const debtsSrc = readFileSync(new URL('../src/debts.js', import.meta.url), 'utf8');
const debts = await import('data:text/javascript;base64,' + Buffer.from(debtsSrc).toString('base64'));

test('seed integrity: exactly 21 entries with unique keys', () => {
  assert.equal(SEED_DEBTS.length, 21);
  assert.equal(new Set(allSeedKeys()).size, 21);
  assert.equal(new Set(SEED_DEBTS.map((d) => d.id)).size, 21);
});

test('seed integrity: known-balance sum is 313853.74', () => {
  const known = SEED_DEBTS.filter((d) => d.balance != null);
  const sum = debts.round2(known.reduce((a, d) => a + d.balance, 0));
  // 4296.24 + 4813.73 + 2684.39 + 708.71 (Cash App Borrow — three
  // loans $93.98 + $269.85 + $344.88, per Zachariah's app Oct 29,
  // 2026, kept as one entry at his direction) + 760.50 (Cash Hub, portal
  // figure Oct 27, 2026 — replaces the stale June $940) + 3120.66
  // (LendNation, portal Oct 27, 2026 — June figure was $1,724) + 13410
  // + 6500 (Snap — early purchase price, Oct 27, 2026; the full-term
  // total of payments would be $9,615.51)
  // + 1193 + 2366.90 + 2830.32 (Spotloan, Advance America
  // and Viva all portal-confirmed Oct 27, 2026)
  // + 14349.26 + 5680.79 (Quantum Credit Union auto + unsecured
  // loans, portal Oct 27, 2026)
  // + 194958.53 (SunWest mortgage, portal Oct 27, 2026)
  // + 268 (Credit One) + 482.50 (Verve) + 1056 (Afterpay)
  // + 997 (Quantum credit card), reported Oct 27, 2026
  // + 25310 (camper, Community National Bank) + 27679 (Damian's car,
  // Heartland Credit Union), reported Oct 27, 2026
  // + 388.21 (OnePay, reported by Zachariah Oct 29, 2026 — balance
  // $388.21, $29.85/mo due on the 1st, current; missed in the
  // original build). This seed sum now MATCHES the $313,853.74
  // debt-board total exactly (Cash App corrected Oct 29, 2026).
  assert.equal(known.length, 21);
  assert.equal(sum, 313853.74);
  // No null balances remain — all 21 confirmed (20 as of Oct 27, 2026, plus OnePay Oct 29, 2026).
  assert.deepEqual(
    SEED_DEBTS.filter((d) => d.balance == null).map((d) => d.creditor),
    [],
  );
});

test('seed integrity: Speedy Cash title loan sits at offer-sent with NO written agreement', () => {
  const title = SEED_DEBTS.find((d) => d.accountLabel === 'Title Loan …4254');
  assert.equal(title.creditor, 'Speedy Cash');
  assert.equal(title.status, 'in-settlement');
  assert.equal(title.settlement.stage, 'offer-sent');
  assert.equal(title.settlement.offerAmount, 1500);
  assert.equal(title.settlement.offerSentDate, '2026-10-19');
  assert.equal(title.settlement.agreementDeadline, '2026-10-28');
  assert.equal(title.settlement.payDate, '2026-11-01');
  assert.equal(title.settlement.writtenAgreement, false);
  assert.equal(title.settlement.lienReleaseRequired, true);
  assert.equal(debts.doNotPay(debts.normalizeDebt(title)), true);
});

test('seed integrity: Spotloan is active and current — NOT closed, NOT paid', () => {
  const spotloan = SEED_DEBTS.find((d) => d.creditor === 'Spotloan');
  assert.equal(spotloan.status, 'current'); // corrected Oct 27, 2026
  assert.equal(spotloan.balance, 1193); // confirmed by Zachariah Oct 27, 2026
  assert.equal(spotloan.amountDue, 212.08);
  assert.equal(spotloan.dueDate, '2026-11-06');
  assert.equal(spotloan.settlement, null);
  assert.match(spotloan.notes, /Active and current/);
});

test('seed integrity: Cash Hub carries the Oct 27, 2026 portal figures', () => {
  const cashHub = SEED_DEBTS.find((d) => d.creditor === 'Cash Hub');
  assert.equal(cashHub.balance, 760.50); // portal principal balance, current
  assert.equal(cashHub.amountDue, null); // portal shows $0.00 due — not invented
  assert.equal(cashHub.dueDate, '2026-07-17');
  assert.equal(cashHub.status, 'past-due');
  assert.equal(cashHub.settlement.stage, 'drafted');
  assert.match(cashHub.notes, /RETURNED NSF/);
});

test('fresh install (no save): all 21 seed debts are offered', () => {
  const out = backfillSeeds([], undefined);
  assert.equal(out.debtsToAdd.length, 21);
  assert.deepEqual([...out.seededKeys].sort(), [...allSeedKeys()].sort());
});

test('existing save with every seed present: nothing is added', () => {
  const out = backfillSeeds(SEED_DEBTS, undefined);
  assert.equal(out.debtsToAdd.length, 0);
});

test('a user-edited seed debt is never overwritten by the backfill', () => {
  const edited = SEED_DEBTS.map((d) => (
    d.creditor === 'Cash Hub' ? { ...d, balance: 700, notes: 'Zachariah edited this.' } : d
  ));
  const out = backfillSeeds(edited, undefined);
  assert.equal(out.debtsToAdd.length, 0);
});

test('a deleted seed debt is never resurrected once its key was offered', () => {
  const remaining = SEED_DEBTS.filter((d) => d.creditor !== 'Cash Hub');
  const out = backfillSeeds(remaining, allSeedKeys());
  assert.equal(out.debtsToAdd.length, 0);
});

test('a missing seed debt IS backfilled when its key was never offered', () => {
  // Save predates the Cash Hub seed: everything else present, Cash Hub
  // absent and its key not in seededKeys.
  const remaining = SEED_DEBTS.filter((d) => d.creditor !== 'Cash Hub');
  const offeredBefore = allSeedKeys().filter((k) => !k.startsWith('Cash Hub|'));
  const out = backfillSeeds(remaining, offeredBefore);
  assert.deepEqual(out.debtsToAdd.map((d) => d.creditor), ['Cash Hub']);
  assert.equal(seedKey(out.debtsToAdd[0]), 'Cash Hub|Payday loan');
});
