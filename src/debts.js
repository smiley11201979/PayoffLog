// Pure debt math + date helpers for PayoffLog. No React Native imports
// here so this module can be unit-tested directly in Node
// (see test/debts.test.mjs).

export const STORAGE_KEY = 'payofflog-save-v1';

export const DEBT_TYPES = [
  'Title loan', 'Line of credit', 'Credit card', 'Installment loan', 'Mortgage', 'Other',
];

export const DEBT_STATUSES = [
  'current', 'past-due', 'defaulted', 'charged-off', 'in-settlement', 'forbearance', 'skipped', 'paid',
];

export const STATUS_LABELS = {
  current: 'CURRENT',
  'past-due': 'PAST DUE',
  defaulted: 'DEFAULTED',
  'charged-off': 'WRITTEN OFF',
  'in-settlement': 'IN SETTLEMENT',
  forbearance: 'FORBEARANCE',
  skipped: 'SKIPPED',
  paid: 'PAID',
};

export const SETTLEMENT_STAGES = [
  'drafted', 'offer-sent', 'agreement-received', 'paid', 'closed',
];

export const STAGE_LABELS = {
  drafted: 'LETTER DRAFTED',
  'offer-sent': 'OFFER SENT',
  'agreement-received': 'AGREEMENT RECEIVED',
  paid: 'SETTLEMENT PAID',
  closed: 'SETTLEMENT CLOSED',
};

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const formatMoney = (n) => {
  const v = round2(n);
  const sign = v < 0 ? '-' : '';
  const [whole, cents] = Math.abs(v).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}$${grouped}.${cents}`;
};

// --- Dates ---------------------------------------------------------------
// Dates are stored as local 'YYYY-MM-DD' strings. Parse them as LOCAL dates
// (new Date('2026-10-28') is UTC midnight and shifts a day in US timezones).

export const toDateStr = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseDateStr = (s) => {
  const [y, m, d] = String(s).split('-').map((x) => parseInt(x, 10));
  return new Date(y, (m || 1) - 1, d || 1);
};

export const todayStr = () => toDateStr(new Date());

export const addDays = (dateStr, n) => {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

export const prettyDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = parseDateStr(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

// Whole days from date a to date b (b - a); negative when b is before a.
export const daysBetween = (a, b) => Math.round((parseDateStr(b) - parseDateStr(a)) / 86400000);

// --- Debt shape ------------------------------------------------------------

const numOrNull = (v) => (v == null || v === '' || isNaN(Number(v)) ? null : round2(Number(v)));

export const normalizeSettlement = (s) => {
  if (!s || typeof s !== 'object') return null;
  return {
    stage: SETTLEMENT_STAGES.includes(s.stage) ? s.stage : 'drafted',
    offerAmount: numOrNull(s.offerAmount),
    offerSentDate: s.offerSentDate || null,
    agreementDeadline: s.agreementDeadline || null,
    payDate: s.payDate || null,
    writtenAgreement: !!s.writtenAgreement,
    lienReleaseRequired: !!s.lienReleaseRequired,
    lienReleaseConfirmed: !!s.lienReleaseConfirmed,
  };
};

export const normalizeDebt = (d) => ({
  id: d && d.id ? String(d.id) : '',
  creditor: (d && d.creditor ? String(d.creditor) : '').trim(),
  accountLabel: (d && d.accountLabel ? String(d.accountLabel) : '').trim(),
  type: d && DEBT_TYPES.includes(d.type) ? d.type : 'Other',
  balance: numOrNull(d ? d.balance : null),
  regularPayment: numOrNull(d ? d.regularPayment : null),
  amountDue: numOrNull(d ? d.amountDue : null),
  dueDate: d && d.dueDate ? String(d.dueDate) : null,
  status: d && DEBT_STATUSES.includes(d.status) ? d.status : 'current',
  notes: d && d.notes ? String(d.notes) : '',
  settlement: normalizeSettlement(d ? d.settlement : null),
});

// --- Standing rule -----------------------------------------------------------
// An offer that has been SENT but is not backed by a written agreement is
// NOT payable. This flag drives the red banner on the debt's card and the
// alert at the top of the list. Reaching the agreement-received stage (or
// recording writtenAgreement) clears it; a paid debt never flags.

export const doNotPay = (debt) => !!(
  debt
  && debt.status !== 'paid'
  && debt.settlement
  && debt.settlement.stage === 'offer-sent'
  && !debt.settlement.writtenAgreement
);

export const doNotPayDebts = (debts) => (debts || []).filter(doNotPay);

// --- Due-date state ----------------------------------------------------------

export const isOverdue = (debt, today = todayStr()) => !!(
  debt && debt.status !== 'paid' && debt.dueDate && debt.dueDate < today
);

export const daysOverdue = (debt, today = todayStr()) => (
  isOverdue(debt, today) ? daysBetween(debt.dueDate, today) : 0
);

// Due today through `withinDays` days from today (overdue debts excluded —
// they are counted separately).
export const isDueSoon = (debt, today = todayStr(), withinDays = 7) => {
  if (!debt || debt.status === 'paid' || !debt.dueDate) return false;
  const diff = daysBetween(today, debt.dueDate);
  return diff >= 0 && diff <= withinDays;
};

// --- Totals ------------------------------------------------------------------
// Null balances mean "unconfirmed" and are NEVER summed (never treated as
// 0). Paid debts are excluded from balances and amounts due.
// activeSettlements counts live negotiations: stage offer-sent or
// agreement-received on a non-paid debt. Drafted letters are pipeline,
// not active settlements.

export const summarizeDebts = (debts, today = todayStr()) => {
  const list = debts || [];
  let totalKnownBalance = 0;
  let totalDueNow = 0;
  let confirmedBalances = 0;
  let dueSoonCount = 0;
  let overdueCount = 0;
  let activeSettlements = 0;

  for (const d of list) {
    if (d.status === 'paid') continue;
    if (d.balance != null) {
      totalKnownBalance = round2(totalKnownBalance + d.balance);
      confirmedBalances += 1;
    }
    if (d.amountDue != null) totalDueNow = round2(totalDueNow + d.amountDue);
    if (isDueSoon(d, today)) dueSoonCount += 1;
    if (isOverdue(d, today)) overdueCount += 1;
    if (d.settlement && (d.settlement.stage === 'offer-sent' || d.settlement.stage === 'agreement-received')) {
      activeSettlements += 1;
    }
  }

  return {
    totalKnownBalance,
    totalDueNow,
    confirmedBalances,
    activeCount: list.filter((d) => d.status !== 'paid').length,
    dueSoonCount,
    overdueCount,
    activeSettlements,
    doNotPayCount: doNotPayDebts(list).length,
  };
};

// --- Sort ----------------------------------------------------------------------
// In-settlement first; then defaulted / past-due by due date (earliest due
// date first, so the most overdue leads; no due date last in the group);
// then everyone else by due date; paid debts last. Creditor name breaks
// remaining ties so the order is stable and predictable.

const sortGroup = (d) => {
  if (d.status === 'paid') return 3;
  if (d.status === 'in-settlement') return 0;
  if (d.status === 'defaulted' || d.status === 'past-due' || d.status === 'charged-off') return 1;
  return 2;
};

export const compareDebts = (a, b) => {
  const g = sortGroup(a) - sortGroup(b);
  if (g !== 0) return g;
  const ad = a.dueDate || null;
  const bd = b.dueDate || null;
  if (ad && bd && ad !== bd) return ad < bd ? -1 : 1;
  if (ad && !bd) return -1;
  if (!ad && bd) return 1;
  const ac = `${a.creditor} ${a.accountLabel}`;
  const bc = `${b.creditor} ${b.accountLabel}`;
  return ac < bc ? -1 : ac > bc ? 1 : 0;
};

export const sortDebts = (debts) => [...(debts || [])].sort(compareDebts);
