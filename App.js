import React, { useMemo, useState } from 'react';
import {
  Platform, SafeAreaView, ScrollView, StatusBar, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { usePayoffData } from './src/usePayoffData';
import {
  DEBT_TYPES, DEBT_STATUSES, SETTLEMENT_STAGES, STATUS_LABELS, STAGE_LABELS,
  addDays, daysOverdue, doNotPay, doNotPayDebts, formatMoney, isOverdue,
  prettyDate, sortDebts, summarizeDebts, todayStr,
} from './src/debts';

const ORANGE = '#FF9900';
const BG = '#0a0a0b';
const CARD = '#18181b';
const BORDER = '#27272a';
const MUTED = '#a1a1aa';
const FAINT = '#71717a';
const GREEN = '#34d399';
const RED = '#ef4444';
const AMBER = '#fbbf24';
const BLUE = '#60a5fa';

const STATUS_COLORS = {
  current: GREEN,
  'past-due': AMBER,
  defaulted: RED,
  'charged-off': '#c084fc',
  'in-settlement': ORANGE,
  forbearance: BLUE,
  skipped: FAINT,
  paid: GREEN,
};

const s = {
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 16, marginHorizontal: 14, marginTop: 14 },
  cardTitle: { color: ORANGE, fontSize: 13, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  label: { color: MUTED, fontSize: 11, fontWeight: 'bold', marginTop: 12, marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, borderRadius: 10, color: '#fff', fontSize: 19, fontWeight: 'bold', paddingHorizontal: 14, paddingVertical: 12 },
  notesInput: { fontSize: 15, fontWeight: 'normal' },
  bigBtn: { backgroundColor: ORANGE, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  bigBtnText: { color: '#000', fontSize: 17, fontWeight: '900' },
  ghostBtn: { borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  ghostBtnText: { color: MUTED, fontSize: 14, fontWeight: 'bold' },
  error: { color: RED, fontSize: 13, fontWeight: 'bold', marginTop: 10 },
};

function Chip({ label, color, active, onPress }) {
  const body = (
    <View style={{
      borderWidth: 1, borderColor: active ? color : BORDER,
      backgroundColor: active ? '#26262b' : '#000',
      borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7,
    }}
    >
      <Text style={{ color: active ? color : MUTED, fontSize: 12, fontWeight: 'bold' }}>{label}</Text>
    </View>
  );
  if (!onPress) return body;
  return <TouchableOpacity onPress={onPress}>{body}</TouchableOpacity>;
}

function ChipRow({ options, value, onChange, labelFor, colorFor }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => (
        <Chip
          key={opt}
          label={labelFor ? labelFor(opt) : opt}
          color={colorFor ? colorFor(opt) : ORANGE}
          active={value === opt}
          onPress={() => onChange(opt)}
        />
      ))}
    </View>
  );
}

function ToggleRow({ label, value, onChange, color = GREEN }) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}
    >
      <Text style={{ color: '#fff', fontSize: 14, flex: 1, paddingRight: 10 }}>{label}</Text>
      <View style={{
        width: 52, height: 30, borderRadius: 999, padding: 3,
        backgroundColor: value ? color : '#000',
        borderWidth: 1, borderColor: value ? color : BORDER,
        alignItems: value ? 'flex-end' : 'flex-start',
      }}
      >
        <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: value ? '#000' : MUTED }} />
      </View>
    </TouchableOpacity>
  );
}

// Date stepper in the Hub Helper style: ‹ › around the pretty date, with
// a way to set a date where there is none and to clear one back to none.
function DateField({ value, onChange }) {
  if (!value) {
    return (
      <TouchableOpacity
        style={{ backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
        onPress={() => onChange(todayStr())}
      >
        <Text style={{ color: MUTED, fontSize: 14, fontWeight: 'bold' }}>No date — tap to set today</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TouchableOpacity style={{ backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }} onPress={() => onChange(addDays(value, -1))}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>‹</Text>
      </TouchableOpacity>
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>{prettyDate(value)}</Text>
      <TouchableOpacity style={{ backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }} onPress={() => onChange(addDays(value, 1))}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onChange(null)}>
        <Text style={{ color: RED, fontSize: 12, fontWeight: 'bold' }}>CLEAR</Text>
      </TouchableOpacity>
    </View>
  );
}

function MoneyField({ label, value, onChange, placeholder }) {
  return (
    <>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        keyboardType="numeric"
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9.]/g, ''))}
        placeholder={placeholder}
        placeholderTextColor={FAINT}
      />
    </>
  );
}

const moneyOrNull = (v) => {
  const t = String(v == null ? '' : v).trim();
  if (t === '') return null;
  const n = Number(t);
  return isNaN(n) || n < 0 ? undefined : Math.round(n * 100) / 100;
};

export default function App() {
  const data = usePayoffData();
  const today = todayStr();

  // form: null (closed) or an edit buffer whose money fields are strings
  // ('' means null / unconfirmed) and whose settlementStage is a stage
  // name or 'none'.
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const totals = useMemo(() => summarizeDebts(data.debts, today), [data.debts, today]);
  const sorted = useMemo(() => sortDebts(data.debts), [data.debts]);
  const flagged = useMemo(() => doNotPayDebts(data.debts), [data.debts]);

  if (!data.isLoaded) return <View style={{ flex: 1, backgroundColor: BG }} />;

  const rootStyle = {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    ...(Platform.OS === 'web' ? { width: '100%', maxWidth: 560, alignSelf: 'center', height: '100dvh', maxHeight: '100dvh', overflow: 'hidden' } : {}),
  };

  const numStr = (v) => (v == null ? '' : String(v));

  const openNewForm = () => {
    setFormError('');
    setPendingDeleteId(null);
    setForm({
      mode: 'new', id: null,
      creditor: '', accountLabel: '', type: 'Other', status: 'current',
      balance: '', regularPayment: '', amountDue: '', dueDate: null, notes: '',
      settlementStage: 'none', offerAmount: '', offerSentDate: null,
      agreementDeadline: null, payDate: null,
      writtenAgreement: false, lienReleaseRequired: false, lienReleaseConfirmed: false,
    });
  };

  const openEditForm = (d) => {
    setFormError('');
    setPendingDeleteId(null);
    setForm({
      mode: 'edit', id: d.id,
      creditor: d.creditor, accountLabel: d.accountLabel, type: d.type, status: d.status,
      balance: numStr(d.balance), regularPayment: numStr(d.regularPayment),
      amountDue: numStr(d.amountDue), dueDate: d.dueDate, notes: d.notes || '',
      settlementStage: d.settlement ? d.settlement.stage : 'none',
      offerAmount: d.settlement ? numStr(d.settlement.offerAmount) : '',
      offerSentDate: d.settlement ? d.settlement.offerSentDate : null,
      agreementDeadline: d.settlement ? d.settlement.agreementDeadline : null,
      payDate: d.settlement ? d.settlement.payDate : null,
      writtenAgreement: d.settlement ? d.settlement.writtenAgreement : false,
      lienReleaseRequired: d.settlement ? d.settlement.lienReleaseRequired : false,
      lienReleaseConfirmed: d.settlement ? d.settlement.lienReleaseConfirmed : false,
    });
  };

  const saveForm = () => {
    if (!form.creditor.trim()) return setFormError('Enter the creditor name.');
    const balance = moneyOrNull(form.balance);
    const regularPayment = moneyOrNull(form.regularPayment);
    const amountDue = moneyOrNull(form.amountDue);
    const offerAmount = moneyOrNull(form.offerAmount);
    if (balance === undefined) return setFormError('Balance must be a number — or leave it blank if unconfirmed.');
    if (regularPayment === undefined) return setFormError('Regular payment must be a number — or blank.');
    if (amountDue === undefined) return setFormError('Amount due must be a number — or blank.');
    if (form.settlementStage !== 'none' && offerAmount === undefined) return setFormError('Offer amount must be a number — or blank.');

    const settlement = form.settlementStage === 'none' ? null : {
      stage: form.settlementStage,
      offerAmount,
      offerSentDate: form.offerSentDate,
      agreementDeadline: form.agreementDeadline,
      payDate: form.payDate,
      writtenAgreement: form.writtenAgreement,
      lienReleaseRequired: form.lienReleaseRequired,
      lienReleaseConfirmed: form.lienReleaseRequired ? form.lienReleaseConfirmed : false,
    };

    const fields = {
      creditor: form.creditor.trim(),
      accountLabel: form.accountLabel.trim(),
      type: form.type,
      status: form.status,
      balance, regularPayment, amountDue,
      dueDate: form.dueDate,
      notes: form.notes.trim(),
      settlement,
    };
    if (form.mode === 'edit') data.updateDebt(form.id, fields);
    else data.addDebt(fields);
    setForm(null);
    setFormError('');
  };

  return (
    <SafeAreaView style={rootStyle}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <View style={{ flex: 1, minHeight: 0 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>

          {/* HEADER */}
          <View style={{ paddingHorizontal: 14, paddingTop: 18 }}>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>💸 PAYOFFLOG</Text>
            <Text style={{ color: MUTED, fontSize: 13, marginTop: 2 }}>Debt payoff + settlement tracker · on this phone only</Text>
          </View>

          {/* DO-NOT-PAY ALERT */}
          {flagged.length > 0 && (
            <View style={{ backgroundColor: '#2a0a0a', borderWidth: 2, borderColor: RED, borderRadius: 14, padding: 16, marginHorizontal: 14, marginTop: 14 }}>
              <Text style={{ color: RED, fontSize: 17, fontWeight: '900', letterSpacing: 0.5 }}>⛔ NO WRITTEN AGREEMENT — DO NOT PAY</Text>
              {flagged.map((d) => (
                <Text key={d.id} style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 6 }}>
                  {d.creditor} ({d.accountLabel}) — offer of {d.settlement.offerAmount != null ? formatMoney(d.settlement.offerAmount) : '—'} sent{d.settlement.offerSentDate ? ` ${prettyDate(d.settlement.offerSentDate)}` : ''}, nothing in writing yet.
                </Text>
              ))}
              <Text style={{ color: MUTED, fontSize: 12, marginTop: 8 }}>
                The standing rule: no settlement gets paid until the agreement — including any lien release — is in hand in writing.
              </Text>
            </View>
          )}

          {/* TOTALS */}
          <View style={s.card}>
            <View style={{ backgroundColor: '#000', borderWidth: 1, borderColor: ORANGE, borderRadius: 10, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>TOTAL OWED (KNOWN BALANCES)</Text>
              <Text style={{ color: ORANGE, fontSize: 30, fontWeight: '900', marginTop: 2 }}>{formatMoney(totals.totalKnownBalance)}</Text>
              <Text style={{ color: FAINT, fontSize: 11, marginTop: 3 }}>
                {totals.confirmedBalances} of {data.debts.length} balances confirmed · unconfirmed balances are never counted
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <View style={{ flex: 1, backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 10 }}>
                <Text style={{ color: MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>DUE NOW</Text>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 4 }}>{formatMoney(totals.totalDueNow)}</Text>
                <Text style={{ color: FAINT, fontSize: 11, marginTop: 3 }}>across {totals.activeCount} open debts</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 10 }}>
                <Text style={{ color: MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>DUE ≤ 7 DAYS</Text>
                <Text style={{ color: totals.dueSoonCount ? AMBER : '#fff', fontSize: 17, fontWeight: '900', marginTop: 4 }}>{totals.dueSoonCount}</Text>
                <Text style={{ color: totals.overdueCount ? RED : FAINT, fontSize: 11, marginTop: 3 }}>{totals.overdueCount} overdue</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#000', borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 10 }}>
                <Text style={{ color: MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>SETTLEMENTS</Text>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 4 }}>{totals.activeSettlements} active</Text>
                <Text style={{ color: totals.doNotPayCount ? RED : FAINT, fontSize: 11, marginTop: 3 }}>
                  {totals.doNotPayCount ? `${totals.doNotPayCount} awaiting writing` : 'none awaiting writing'}
                </Text>
              </View>
            </View>
          </View>

          {/* ADD / EDIT FORM */}
          {form ? (
            <View style={s.card}>
              <Text style={s.cardTitle}>{form.mode === 'edit' ? '✏️ EDIT DEBT' : '➕ ADD DEBT'}</Text>

              <Text style={s.label}>CREDITOR</Text>
              <TextInput style={[s.input, s.notesInput]} value={form.creditor} onChangeText={(v) => setForm({ ...form, creditor: v })} placeholder="e.g. Speedy Cash" placeholderTextColor={FAINT} />
              <Text style={s.label}>ACCOUNT LABEL</Text>
              <TextInput style={[s.input, s.notesInput]} value={form.accountLabel} onChangeText={(v) => setForm({ ...form, accountLabel: v })} placeholder="e.g. Title Loan …4254" placeholderTextColor={FAINT} />

              <Text style={s.label}>TYPE</Text>
              <ChipRow options={DEBT_TYPES} value={form.type} onChange={(v) => setForm({ ...form, type: v })} />
              <Text style={s.label}>STATUS</Text>
              <ChipRow
                options={DEBT_STATUSES}
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v })}
                labelFor={(v) => STATUS_LABELS[v]}
                colorFor={(v) => STATUS_COLORS[v]}
              />

              <MoneyField label="BALANCE ($ — BLANK = UNCONFIRMED)" value={form.balance} onChange={(v) => setForm({ ...form, balance: v })} placeholder="Blank if unconfirmed" />
              <MoneyField label="REGULAR PAYMENT ($ — OPTIONAL)" value={form.regularPayment} onChange={(v) => setForm({ ...form, regularPayment: v })} placeholder="e.g. 246.56" />
              <MoneyField label="AMOUNT DUE NOW ($ — OPTIONAL)" value={form.amountDue} onChange={(v) => setForm({ ...form, amountDue: v })} placeholder="e.g. 2038.30" />

              <Text style={s.label}>DUE DATE</Text>
              <DateField value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />

              <Text style={s.label}>NOTES</Text>
              <TextInput style={[s.input, s.notesInput]} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} placeholder="Anything to remember about this debt" placeholderTextColor={FAINT} multiline />

              <Text style={[s.cardTitle, { marginTop: 20 }]}>🤝 SETTLEMENT</Text>
              <Text style={s.label}>STAGE</Text>
              <ChipRow
                options={['none', ...SETTLEMENT_STAGES]}
                value={form.settlementStage}
                onChange={(v) => setForm({ ...form, settlementStage: v })}
                labelFor={(v) => (v === 'none' ? 'NO SETTLEMENT' : STAGE_LABELS[v])}
              />
              {form.settlementStage !== 'none' && (
                <>
                  <MoneyField label="OFFER AMOUNT ($)" value={form.offerAmount} onChange={(v) => setForm({ ...form, offerAmount: v })} placeholder="e.g. 1500" />
                  <Text style={s.label}>OFFER SENT DATE</Text>
                  <DateField value={form.offerSentDate} onChange={(v) => setForm({ ...form, offerSentDate: v })} />
                  <Text style={s.label}>WRITTEN-AGREEMENT DEADLINE</Text>
                  <DateField value={form.agreementDeadline} onChange={(v) => setForm({ ...form, agreementDeadline: v })} />
                  <Text style={s.label}>PAY DATE (ONLY WITH A WRITTEN AGREEMENT)</Text>
                  <DateField value={form.payDate} onChange={(v) => setForm({ ...form, payDate: v })} />
                  <View style={{ marginTop: 8 }}>
                    <ToggleRow label="Written agreement received" value={form.writtenAgreement} onChange={(v) => setForm({ ...form, writtenAgreement: v })} />
                    <ToggleRow label="Lien release required" value={form.lienReleaseRequired} onChange={(v) => setForm({ ...form, lienReleaseRequired: v })} color={AMBER} />
                    {form.lienReleaseRequired && (
                      <ToggleRow label="Lien release confirmed" value={form.lienReleaseConfirmed} onChange={(v) => setForm({ ...form, lienReleaseConfirmed: v })} color={AMBER} />
                    )}
                  </View>
                  {form.settlementStage === 'offer-sent' && !form.writtenAgreement && (
                    <Text style={{ color: RED, fontSize: 13, fontWeight: 'bold', marginTop: 8 }}>
                      ⛔ At OFFER SENT with no written agreement, this debt flags DO NOT PAY.
                    </Text>
                  )}
                </>
              )}

              {!!formError && <Text style={s.error}>{formError}</Text>}

              <TouchableOpacity style={s.bigBtn} onPress={saveForm}>
                <Text style={s.bigBtnText}>{form.mode === 'edit' ? 'SAVE CHANGES' : 'ADD DEBT'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtn} onPress={() => { setForm(null); setFormError(''); }}>
                <Text style={s.ghostBtnText}>Cancel</Text>
              </TouchableOpacity>

              {form.mode === 'edit' && (
                pendingDeleteId === form.id ? (
                  <TouchableOpacity
                    style={{ backgroundColor: RED, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 10 }}
                    onPress={() => { data.deleteDebt(form.id); setForm(null); setPendingDeleteId(null); }}
                  >
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900' }}>TAP AGAIN TO DELETE THIS DEBT</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={s.ghostBtn} onPress={() => setPendingDeleteId(form.id)}>
                    <Text style={{ color: RED, fontSize: 14, fontWeight: 'bold' }}>Delete this debt</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          ) : (
            <TouchableOpacity style={[s.bigBtn, { marginHorizontal: 14 }]} onPress={openNewForm}>
              <Text style={s.bigBtnText}>➕ ADD A DEBT</Text>
            </TouchableOpacity>
          )}

          {/* DEBT LIST */}
          <View style={s.card}>
            <Text style={s.cardTitle}>🗂 DEBTS ({data.debts.length})</Text>
            {sorted.length === 0 && <Text style={{ color: MUTED, fontSize: 13 }}>No debts logged yet.</Text>}
            {sorted.map((d) => {
              const flaggedDebt = doNotPay(d);
              const overdue = isOverdue(d, today);
              return (
                <View key={d.id} style={{ borderTopWidth: 1, borderTopColor: BORDER, paddingVertical: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>{d.creditor}</Text>
                      <Text style={{ color: MUTED, fontSize: 12, marginTop: 1 }}>{d.accountLabel} · {d.type}</Text>
                    </View>
                    {d.balance != null
                      ? <Text style={{ color: d.status === 'paid' ? FAINT : '#fff', fontSize: 16, fontWeight: '900' }}>{formatMoney(d.balance)}</Text>
                      : <Text style={{ color: AMBER, fontSize: 12, fontWeight: 'bold', marginTop: 3 }}>BALANCE UNCONFIRMED</Text>}
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    <Chip label={STATUS_LABELS[d.status]} color={STATUS_COLORS[d.status]} active />
                    {d.settlement && (
                      <Chip
                        label={`SETTLEMENT: ${STAGE_LABELS[d.settlement.stage]}${d.settlement.offerAmount != null ? ` · ${formatMoney(d.settlement.offerAmount)}` : ''}`}
                        color={flaggedDebt ? RED : ORANGE}
                        active
                      />
                    )}
                    {d.settlement && d.settlement.lienReleaseRequired && (
                      <Chip label={d.settlement.lienReleaseConfirmed ? 'LIEN RELEASE ✓' : 'LIEN RELEASE PENDING'} color={AMBER} active />
                    )}
                  </View>

                  {d.amountDue != null && d.status !== 'paid' && (
                    <Text style={{ color: '#fff', fontSize: 13, marginTop: 8 }}>
                      Due now: <Text style={{ fontWeight: '900' }}>{formatMoney(d.amountDue)}</Text>
                      {d.regularPayment != null ? <Text style={{ color: MUTED }}> · regular payment {formatMoney(d.regularPayment)}</Text> : null}
                    </Text>
                  )}
                  {d.amountDue == null && d.regularPayment != null && d.status !== 'paid' && (
                    <Text style={{ color: MUTED, fontSize: 13, marginTop: 8 }}>Regular payment {formatMoney(d.regularPayment)}</Text>
                  )}
                  {d.dueDate && d.status !== 'paid' && (
                    overdue
                      ? <Text style={{ color: RED, fontSize: 13, fontWeight: 'bold', marginTop: 3 }}>⚠️ OVERDUE — was due {prettyDate(d.dueDate)} ({daysOverdue(d, today)} day{daysOverdue(d, today) === 1 ? '' : 's'} ago)</Text>
                      : <Text style={{ color: MUTED, fontSize: 13, marginTop: 3 }}>Due {prettyDate(d.dueDate)}</Text>
                  )}
                  {d.settlement && d.settlement.agreementDeadline && d.settlement.stage === 'offer-sent' && (
                    <Text style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
                      Written agreement deadline: {prettyDate(d.settlement.agreementDeadline)}{d.settlement.payDate ? ` · pay date ${prettyDate(d.settlement.payDate)}` : ''}
                    </Text>
                  )}
                  {!!d.notes && <Text style={{ color: FAINT, fontSize: 12, marginTop: 4, lineHeight: 17 }}>{d.notes}</Text>}

                  {flaggedDebt && (
                    <View style={{ backgroundColor: '#2a0a0a', borderWidth: 1, borderColor: RED, borderRadius: 10, padding: 10, marginTop: 9 }}>
                      <Text style={{ color: RED, fontSize: 13, fontWeight: '900' }}>⛔ NO WRITTEN AGREEMENT — DO NOT PAY</Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <TouchableOpacity style={{ borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 }} onPress={() => openEditForm(d)}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>EDIT</Text>
                    </TouchableOpacity>
                    {d.status !== 'paid' && (
                      <TouchableOpacity style={{ borderWidth: 1, borderColor: GREEN, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 }} onPress={() => data.markPaid(d.id)}>
                        <Text style={{ color: GREEN, fontSize: 12, fontWeight: 'bold' }}>MARK PAID ✓</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
            <Text style={{ color: FAINT, fontSize: 11, marginTop: 10 }}>
              Everything lives on this phone — no account, no sync, nothing leaves the device. A blank balance means unconfirmed, never zero.
            </Text>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
