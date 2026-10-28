// One-time seed data: Zachariah's debts as of Oct 27, 2026, from his
// Past-Due Items Tracker and the settlement work in progress.
//
// Pure module, no imports (same pattern as hub-helper's seed.js) so it
// can be unit-tested in Node through a data: URL.
//
// Rules:
// - A seed debt is added only when no debt with its key
//   (creditor + accountLabel) exists AND the key has not been offered
//   before (seededKeys). Once offered, a key is never seeded again —
//   if Zachariah later deletes a seeded debt, it stays deleted, and
//   edits he makes to a seeded debt are never overwritten.
// - A null balance means UNCONFIRMED — the app displays "unconfirmed"
//   and never treats it as 0.

const drafted = () => ({
  stage: 'drafted',
  offerAmount: null,
  offerSentDate: null,
  agreementDeadline: null,
  payDate: null,
  writtenAgreement: false,
  lienReleaseRequired: false,
  lienReleaseConfirmed: false,
});

export const SEED_DEBTS = [
  {
    id: 'debt-seed-sunwest', creditor: 'SunWest Mortgage', accountLabel: 'Mortgage — Loan …0248',
    type: 'Mortgage', balance: 194958.53, regularPayment: 1493.66, amountDue: null, dueDate: null,
    status: 'forbearance', settlement: null,
    notes: "On forbearance. Letter of Explanation submitted Oct 18, 2026 requesting a full pause through Jan 1, 2027; awaiting SunWest's decision. Portal checked Oct 27, 2026 (via SunWest's new login page, emailed to Zachariah): current balance $194,958.53 at 5.625%; escrow balance −$2,971.36 (shortage — watch for a payment adjustment when payments resume); loan paid-to-date 6/1/2026; interest paid YTD $5,505.43.",
  },
  {
    id: 'debt-seed-speedy-title', creditor: 'Speedy Cash', accountLabel: 'Title Loan …4254',
    type: 'Title loan', balance: 4296.24, regularPayment: null, amountDue: 2038.30, dueDate: '2026-10-28',
    status: 'in-settlement',
    settlement: {
      stage: 'offer-sent', offerAmount: 1500, offerSentDate: '2026-10-19',
      agreementDeadline: '2026-10-28', payDate: '2026-11-01',
      writtenAgreement: false, lienReleaseRequired: true, lienReleaseConfirmed: false,
    },
    notes: 'Defaulted; secured by vehicle title. Offer is ~35% of balance. Close-out email scheduled Oct 28, 2026.',
  },
  {
    id: 'debt-seed-speedy-loc', creditor: 'Speedy Cash', accountLabel: 'Line of Credit …6764',
    type: 'Line of credit', balance: 4813.73, regularPayment: null, amountDue: 4813.73, dueDate: '2026-10-09',
    status: 'defaulted', settlement: drafted(),
    notes: 'Settlement letter drafted Oct 18, 2026 — not sent; offer amount not yet set.',
  },
  {
    id: 'debt-seed-titlemax', creditor: 'TitleMax', accountLabel: 'Line of Credit …1199',
    type: 'Line of credit', balance: 2684.39, regularPayment: null, amountDue: 869.20, dueDate: '2026-10-23',
    status: 'defaulted', settlement: drafted(),
    notes: 'Defaulted line of credit (not a title loan). Letter drafted Oct 18, 2026 — not sent.',
  },
  {
    id: 'debt-seed-advance-america', creditor: 'Advance America', accountLabel: 'Line of Credit …8925',
    type: 'Line of credit', balance: 2366.90, regularPayment: null, amountDue: 1265.57, dueDate: null,
    status: 'charged-off', settlement: drafted(),
    notes: 'Portal checked Oct 27, 2026: status WRITE OFF (charged off), balance $2,366.90 CONFIRMED, minimum due $1,265.57, no due date shown. Line of credit #33428925, limit $1,400, autopay not enrolled. Letter drafted — not sent. A charged-off debt may be sold to a collector — watch for a new creditor name.',
  },
  {
    id: 'debt-seed-cashapp', creditor: 'Cash App Borrow', accountLabel: 'Borrow',
    type: 'Other', balance: 92.12, regularPayment: null, amountDue: 92.12, dueDate: null,
    status: 'past-due', settlement: drafted(),
    notes: 'Small overdue balance. Letter drafted — not sent.',
  },
  {
    id: 'debt-seed-viva', creditor: 'Viva Finance', accountLabel: 'Personal loan',
    type: 'Installment loan', balance: 2830.32, regularPayment: null, amountDue: null, dueDate: null,
    status: 'current', settlement: drafted(),
    notes: 'Portal checked Oct 27, 2026: loan Active, payoff balance $2,830.32, $500.00 paid to date. $3,000 proceeds received Sep 2026. Settlement letter drafted — not sent (it asks Viva to confirm payoff terms in writing).',
  },
  {
    id: 'debt-seed-cashhub', creditor: 'Cash Hub', accountLabel: 'Payday loan',
    type: 'Other', balance: 760.50, regularPayment: null, amountDue: null, dueDate: '2026-07-17',
    status: 'past-due', settlement: drafted(),
    notes: 'Portal checked Oct 27, 2026: status Past Due, principal balance $760.50, total amount due shown as $0.00. Last payment $250.34 on Jul 31, 2026 was RETURNED NSF. Loan had to be paid or extended by Jul 17, 2026. Settlement letter drafted — not sent.',
  },
  {
    id: 'debt-seed-lendnation', creditor: 'LendNation', accountLabel: 'Online LOC',
    type: 'Line of credit', balance: 3120.66, regularPayment: null, amountDue: null, dueDate: null,
    status: 'past-due', settlement: drafted(),
    notes: 'Portal checked Oct 27, 2026: Online LOC, current balance $3,120.66 on a $1,500 line taken out Jun 3, 2026 — the balance has more than doubled with interest and fees. (June 2026 figure was $1,724.) Letter drafted — not sent. Next payment amount/date were cut off in the portal screenshot.',
  },
  {
    id: 'debt-seed-spotloan', creditor: 'Spotloan', accountLabel: 'Installment loan',
    type: 'Installment loan', balance: 1193, regularPayment: null, amountDue: 212.08, dueDate: '2026-11-06',
    status: 'current', settlement: null,
    notes: "Active and current — auto-debits running from USAA. Balance $1,193 confirmed by Zachariah Oct 27, 2026. Corrected by Zachariah Oct 27, 2026: the earlier 'closed Oct 21' note was wrong; the account is open and not behind.",
  },
  {
    id: 'debt-seed-goodleap', creditor: 'GoodLeap', accountLabel: 'Windows Doors …9594',
    type: 'Installment loan', balance: 13410, regularPayment: 215.49, amountDue: 646.47, dueDate: '2026-11-03',
    status: 'past-due', settlement: null,
    notes: 'Portal checked Oct 27, 2026 (Windows Doors account …9594): remaining principal $13,410.00 CONFIRMED. PAST DUE — $430.98 past due + $215.49 current payment = $646.47 total due Nov 3, 2026. Regular payment $215.49. The Oct 20 text pitch\u2019s "$430.98 owed" is now VERIFIED as the past-due amount; its "$0.00 to bring current" claim was wrong. Old tracker figures ($86.20 to bring current, Dec 3 due date) superseded. Skipped for SETTLEMENT by choice (Oct 18, 2026).',
  },
  {
    id: 'debt-seed-snap', creditor: 'Snap Finance', accountLabel: 'Mattress lease — Factory Direct',
    type: 'Other', balance: 6500, regularPayment: 246.56, amountDue: 1493.12, dueDate: null,
    status: 'past-due', settlement: null,
    notes: 'Portal checked Oct 27, 2026: lease-to-own at Factory Direct Mattress, Application 2510310TN2KS. PAST DUE $1,493.12 (about 6 payments). Balance shown is the EARLY PURCHASE price — $6,500 to own it outright now (confirmed by Zachariah Oct 27, 2026). Maximum Term Option ends Nov 22, 2027: 29 renewable lease periods at $246.56, total of payments $9,615.51 if it runs the full term. Payments shown: May 22 and Jun 5, 2026 ($246.56 each). Skipped for SETTLEMENT by choice (Oct 18, 2026) — tracked here for payments.',
  },
  {
    id: 'debt-seed-quantum-auto', creditor: 'Quantum Credit Union', accountLabel: 'Used Auto Loan — 520',
    type: 'Installment loan', balance: 14349.26, regularPayment: 324.23, amountDue: 324.23, dueDate: '2026-11-15',
    status: 'current', settlement: null,
    notes: 'Portal checked Oct 27, 2026: used auto loan (account 520) — balance $14,349.26 on an original $42,665.38 loan; $324.23 due Nov 15, 2026. Portal notes the exact payoff amount must be confirmed with the credit union — balance shown is the portal figure. Added Oct 27, 2026; was not in the Past-Due Tracker.',
  },
  {
    id: 'debt-seed-quantum-unsecured', creditor: 'Quantum Credit Union', accountLabel: 'Unsecured Loan — 551',
    type: 'Installment loan', balance: 5680.79, regularPayment: 114.00, amountDue: 114.00, dueDate: '2026-11-15',
    status: 'current', settlement: null,
    notes: 'Portal checked Oct 27, 2026: unsecured loan (account 551) — balance $5,680.79 on an original $10,100.00 loan; $114.00 due Nov 15, 2026. Added Oct 27, 2026; was not in the Past-Due Tracker.',
  },
];

export const seedKey = (d) => `${d.creditor}|${d.accountLabel}`;

export const allSeedKeys = () => SEED_DEBTS.map(seedKey);

// Decide what to add to an existing save.
// existingDebts: debts loaded from storage (any shape with
//   creditor + accountLabel).
// seededKeys: keys offered by earlier seeds (may be undefined on a
//   fresh save — treated as none offered).
// Returns { debtsToAdd, seededKeys } where the new seededKeys covers
// every seed key: present, just added, or offered before. Callers
// persist it so deletions are never resurrected.
export const backfillSeeds = (existingDebts, seededKeys) => {
  const debts = Array.isArray(existingDebts) ? existingDebts : [];
  const offered = new Set(Array.isArray(seededKeys) ? seededKeys : []);
  const present = new Set(debts.map((d) => d && seedKey(d)));

  const debtsToAdd = SEED_DEBTS.filter((s) => !present.has(seedKey(s)) && !offered.has(seedKey(s)));
  const nextSeededKeys = [...new Set([...offered, ...allSeedKeys()])];
  return { debtsToAdd, seededKeys: nextSeededKeys };
};
