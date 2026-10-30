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
    type: 'Other', balance: 708.71, regularPayment: null, amountDue: 93.98, dueDate: null,
    status: 'past-due', settlement: drafted(),
    notes: 'THREE separate loans, confirmed by Zachariah from his app Oct 29, 2026: $93.98 + $269.85 + $344.88 = $708.71 total — kept as a single PayoffLog entry at his direction (Oct 29, 2026). Loan 1 ($93.98) is the overdue one; the $92.12 figure carried before was only loan 1\'s overdue repayment, not the whole Borrow balance. The $20 auto-application Oct 29, 2026 (Jan Perez mask-sale money) went to the $344.88 loan (was $364.88). Another $0.93 interest charge on loan 1 due to land Oct 30, 2026. Letter drafted — not sent (updated to the three-loan structure). NOTE for the installed app: seed values never overwrite an existing on-phone entry, so Zachariah edits this entry\'s balance to $708.71 by hand in the app.',
  },
  {
    id: 'debt-seed-viva', creditor: 'Viva Finance', accountLabel: 'Personal loan',
    type: 'Installment loan', balance: 2830.32, regularPayment: null, amountDue: null, dueDate: null,
    status: 'current', settlement: null,
    notes: 'Portal checked Oct 27, 2026: loan Active, payoff balance $2,830.32, $500.00 paid to date. $3,000 proceeds received Sep 2026. Paid by PAYROLL DEDUCTION (Zachariah, Oct 27, 2026) — serviced before his pay lands, so it needs no cash budgeting. The drafted settlement letter was marked MOOT Oct 27, 2026 — the loan is Active and payroll-paid, so there is nothing to settle.',
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
    status: 'in-settlement',
    settlement: {
      stage: 'offer-sent', offerAmount: 4224.08, offerSentDate: '2026-10-29',
      agreementDeadline: null, payDate: null,
      writtenAgreement: false, lienReleaseRequired: false, lienReleaseConfirmed: false,
    },
    notes: 'Portal checked Oct 27, 2026: lease-to-own at Factory Direct Mattress, Application 2510310TN2KS. PAST DUE $1,493.12 (about 6 payments). Balance shown is the EARLY PURCHASE price — $6,500 to own it outright now (confirmed by Zachariah Oct 27, 2026); Snap\'s own emailed ledger (Oct 29, 2026) shows $8,149.91 after the Oct 2 payment. Maximum Term Option ends Nov 22, 2027: 29 renewable lease periods at $246.56, total of payments $9,615.51 if it runs the full term. SETTLEMENT OFFER — made BY Snap Finance on Oct 29, 2026 (the offer amount/date in the Settlement section are Snap\'s proposal, not Zachariah\'s): $4,224.08 total = $528.01 "today" + 7 × $528.01 starting Nov 6, 2026 (8 × $528.01); payment FREQUENCY (biweekly vs monthly) NOT stated, and Snap named "card 6813 on file" — that card is on a CLOSED account. Snap confirmed Oct 29 that all three card payments ($765.92 total) were received, the $20 ledger entries are returned-payment fees, and it will not pull from the closed bank account. Zachariah replied Oct 29, 2026: do NOT charge card 6813, and no working payment method until Snap provides the COMPLETE terms in writing (exact dates + frequency for every payment, confirmation that $4,224.08 settles the lease in full with a $0 balance and the account closed as settled, and how the mattress is treated at completion). Awaiting Snap\'s answer — DO NOT PAY until those terms are in writing. NOTE for the installed app: seed values never overwrite an existing on-phone entry, so Zachariah enters this by hand in the app: Edit → Settlement stage OFFER SENT → Offer Amount 4224.08.',
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
  {
    id: 'debt-seed-creditone', creditor: 'Credit One', accountLabel: 'Visa — Card …8741',
    type: 'Credit card', balance: 268, regularPayment: null, amountDue: null, dueDate: null,
    status: 'current', settlement: null,
    notes: 'Balance and limit reported by Zachariah Oct 27, 2026: $268 balance on a $300 credit limit (~$32 available). A $66.22 payment posted Oct 23, 2026. Marked current on the strength of that payment — minimum due and due date not yet confirmed; update from the next statement.',
  },
  {
    id: 'debt-seed-verve', creditor: 'Verve', accountLabel: 'Platinum Mastercard — Card …2756',
    type: 'Credit card', balance: 482.50, regularPayment: null, amountDue: 45, dueDate: '2026-11-05',
    status: 'current', settlement: null,
    notes: 'App checked Oct 27, 2026 (Verve Platinum Mastercard, issued by The Bancorp Bank): balance $482.50 on a $500 limit — only $17.00 available credit. Last statement balance $481.53. Auto Pay is OFF — payments are manual. UPDATED Oct 29, 2026: the $75.00 Easy Pay payment made Oct 27 was RETURNED UNPAID and reversed (Continental Finance email Oct 29) — the second failed $75 payment in four days — so the November minimum is $45.00 due Nov 5, 2026 (confirmed by Zachariah from the app Oct 29). "Continental Finance" and this Verve card are the SAME obligation (Zachariah, Oct 29, 2026); his payment pattern runs ~$83/mo. No returned-payment/late fee confirmed yet.',
  },
  {
    id: 'debt-seed-onepay', creditor: 'OnePay', accountLabel: 'Card',
    type: 'Credit card', balance: 388.21, regularPayment: 29.85, amountDue: 0, dueDate: '2026-11-01',
    status: 'current', settlement: null,
    notes: 'Reported by Zachariah Oct 29, 2026: balance $388.21, monthly payment $29.85 due on the 1st, current / up to date — $0 past due. This one was missed when the board was first built; added Oct 29, 2026 as the 21st debt. Credit limit not reported.',
  },
  {
    id: 'debt-seed-afterpay', creditor: 'Afterpay', accountLabel: 'Pay-in-4 plan',
    type: 'Buy now, pay later', balance: 704.50, regularPayment: null, amountDue: null, dueDate: null,
    status: 'current', settlement: null,
    notes: 'Remaining balance $704.50 — marked down Oct 29, 2026 at Zachariah\'s direction so the total reflects tonight. Reconciliation: the full installment schedule from his app screenshots (Oct 28, 2026) totals $1,057.37 (≈ the $1,056 balance he reported Oct 27, 2026, on a $2,500 limit); on Oct 28, 2026 he paid $352.87 — $306.78 prepaid toward the pay-in-4 orders (covering Nov 1\'s $260.69 in full, the extra $46.09 applying forward) plus the $46.09 Sam\'s Club Pay-in-12 installment (4 of 12) paid separately — leaving $704.50. Remaining: pay-in-4 $335.78 (Nov 8 ≈$42.25, Nov 15 $169.89, Nov 22 $32.50, Nov 29 $91.14 — every pay-in-4 order ends Nov 29, 2026; nothing is due until Nov 8) plus Sam\'s Club Pay-in-12 $368.72 (8 × $46.09 monthly, Nov 30, 2026 through ~Jun 2027). Standing condition: no new Afterpay orders. NOTE for the installed app: seed values never overwrite an existing on-phone entry, so Zachariah edits this entry\'s balance to $704.50 by hand in the app.',
  },
  {
    id: 'debt-seed-quantum-card', creditor: 'Quantum Credit Union', accountLabel: 'Credit Card',
    type: 'Credit card', balance: 997, regularPayment: null, amountDue: 0, dueDate: null,
    status: 'current', settlement: null,
    notes: 'Reported by Zachariah Oct 27, 2026: balance $997 on a $1,000 limit — only $3 available. No payment currently due. Third Quantum Credit Union account, alongside the used auto loan (520) and unsecured loan (551).',
  },
  {
    id: 'debt-seed-camper', creditor: 'Community National Bank', accountLabel: 'Camper loan',
    type: 'RV loan', balance: 25310, regularPayment: 400, amountDue: 312, dueDate: '2026-11-15',
    status: 'past-due', settlement: null,
    notes: 'Payroll allotment (Zachariah, Oct 27, 2026): due on the 15th monthly, $400/month, and currently $312 behind. Balance $25,310 confirmed by Zachariah Oct 27, 2026. The June 2026 bills sheet showed a $376 allotment on the 17th (stale). The camper is the RV in repair at Camping World. Still to confirm: whether the allotment covers the full payment — it is behind despite the allotment.',
  },
  {
    id: 'debt-seed-sons-car', creditor: 'Heartland Credit Union', accountLabel: "Damian's car — Zach pays half",
    type: 'Auto loan', balance: 27679, regularPayment: 175, amountDue: null, dueDate: null,
    status: 'current', settlement: null,
    notes: 'Payroll deduction (Zachariah, Oct 27, 2026): car loan for his son Damian at Heartland Credit Union. Zachariah pays half — $175 per pay period (full payment $350 per pay period). Balance $27,679 confirmed by Zachariah Oct 27, 2026. This is the "Heartland $300 (1st)" allotment from the June 2026 sheet — those figures are stale.',
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
