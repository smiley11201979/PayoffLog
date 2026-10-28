// Node unit tests for src/debts.js — run with `npm test`.
// Loaded through a data: URL (same pattern as hub-helper's suites) so
// Node parses it as a module regardless of the package "type".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/debts.js', import.meta.url), 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const {
  doNotPay, doNotPayDebts, isOverdue, isDueSoon, daysOverdue, summarizeDebts,
  sortDebts, normalizeDebt, formatMoney,
} = mod;

const seedSrc = readFileSync(new URL('../src/seed.js', import.meta.url), 'utf8');
const seedMod = await import('data:text/javascript;base64,' + Buffer.from(seedSrc).toString('base64'));
const { SEED_DEBTS } = seedMod;

const TODAY = '2026-10-27'; // fixed "today" (Tue Oct 27, 2026)
const seed = SEED_DEBTS.map((d) => normalizeDebt(d));
const byLabel = (label) => seed.find((d) => d.accountLabel === label);

test('formatMoney renders dollars with 2 decimals and grouping', () => {
  assert.equal(formatMoney(1500), '$1,500.00');
  assert.equal(formatMoney(760.5), '$760.50');
  assert.equal(formatMoney(0), '$0.00');
});

test('totals: null balances excluded (never 0), paid debts excluded', () => {
  const t = summarizeDebts(seed, TODAY);
  // Known balances: 4296.24 + 4813.73 + 2684.39 + 92.12 + 760.50 + 3120.66
  // + 13410 + 6500 + 1193 + 2366.90 + 2830.32 + 14349.26 + 5680.79
  // + 194958.53 (SunWest) + 268 (Credit One) + 482.50 (Verve).
  // All 16 balances are confirmed.
  assert.equal(t.totalKnownBalance, 257806.94);
  assert.equal(t.confirmedBalances, 16);
  // Amount due now: 2038.30 + 4813.73 + 869.20 + 1265.57 + 92.12 + 646.47
  // + 1493.12 + 212.08 (Spotloan) + 324.23 + 114.00 (Quantum CU loans,
  // due Nov 15 — active and current, so they count).
  assert.equal(t.totalDueNow, 11868.82);
  assert.equal(t.activeCount, 16);
});

test('totals: a null-balance debt adds nothing, not even a zero row', () => {
  const t = summarizeDebts([
    normalizeDebt({ creditor: 'Mystery', accountLabel: 'Loan', balance: null, amountDue: null, status: 'past-due' }),
  ], TODAY);
  assert.equal(t.totalKnownBalance, 0);
  assert.equal(t.confirmedBalances, 0);
  assert.equal(t.totalDueNow, 0);
});

test('due within 7 days and overdue, against a fixed today', () => {
  const t = summarizeDebts(seed, TODAY);
  // Inside the 7-day window: the Speedy Cash title loan (Oct 28) and
  // GoodLeap (Nov 3 — exactly 7 days out, $646.47 total due).
  assert.equal(t.dueSoonCount, 2);
  // Overdue: Cash Hub (Jul 17), Speedy LOC (Oct 9), TitleMax (Oct 23).
  // Spotloan (due Nov 6, current) is neither overdue nor inside the
  // 7-day window, and Advance America is written off with no due date.
  assert.equal(t.overdueCount, 3);
  assert.equal(isDueSoon(byLabel('Title Loan …4254'), TODAY), true);
  assert.equal(isOverdue(byLabel('Title Loan …4254'), TODAY), false);
  assert.equal(daysOverdue(byLabel('Line of Credit …6764'), TODAY), 18);
  assert.equal(daysOverdue(byLabel('Line of Credit …1199'), TODAY), 4);
  assert.equal(isOverdue(byLabel('Line of Credit …8925'), TODAY), false); // Advance America: written off, no due date
  assert.equal(isOverdue(byLabel('Installment loan'), TODAY), false); // Spotloan: current, due Nov 6
});

test('do-not-pay flag: offer sent without a written agreement', () => {
  const title = byLabel('Title Loan …4254');
  assert.equal(title.settlement.stage, 'offer-sent');
  assert.equal(title.settlement.writtenAgreement, false);
  assert.equal(doNotPay(title), true);
  assert.deepEqual(doNotPayDebts(seed).map((d) => d.id), [title.id]);

  // Recording the written agreement clears the flag…
  assert.equal(doNotPay({ ...title, settlement: { ...title.settlement, writtenAgreement: true } }), false);
  // …as does reaching the agreement-received stage…
  assert.equal(doNotPay({ ...title, settlement: { ...title.settlement, stage: 'agreement-received' } }), false);
  // …and a drafted letter was never payable-flagged in the first place.
  assert.equal(doNotPay(byLabel('Line of Credit …6764')), false);
  // A paid debt never flags, whatever its settlement says.
  assert.equal(doNotPay({ ...title, status: 'paid' }), false);
});

test('active settlements counts live negotiations only', () => {
  const t = summarizeDebts(seed, TODAY);
  // Only the Speedy title loan is at offer-sent; the seven drafted
  // letters are pipeline, not active settlements.
  assert.equal(t.activeSettlements, 1);
  assert.equal(t.doNotPayCount, 1);
});

test('sort order: in-settlement, then past-due/defaulted by due date, then the rest by due date', () => {
  const order = sortDebts(seed).map((d) => `${d.creditor} — ${d.accountLabel}`);
  assert.deepEqual(order, [
    'Speedy Cash — Title Loan …4254', // in settlement
    'Cash Hub — Payday loan', // past due, due Jul 17
    'Speedy Cash — Line of Credit …6764', // defaulted, due Oct 9
    'TitleMax — Line of Credit …1199', // defaulted, due Oct 23
    'GoodLeap — Windows Doors …9594', // past due, due Nov 3
    'Advance America — Line of Credit …8925', // written off, no due date
    'Cash App Borrow — Borrow', // past due, no due date
    'LendNation — Online LOC', // past due, no due date
    'Snap Finance — Mattress lease — Factory Direct', // past due, no due date
    'Verve — Platinum Mastercard — Card …2756', // current, due Nov 5
    'Spotloan — Installment loan', // current, due Nov 6
    'Quantum Credit Union — Unsecured Loan — 551', // current, due Nov 15
    'Quantum Credit Union — Used Auto Loan — 520', // current, due Nov 15
    'Credit One — Visa — Card …8741', // current, no due date
    'SunWest Mortgage — Mortgage — Loan …0248', // forbearance, no due date
    'Viva Finance — Personal loan', // current, no due date
  ]);
});
