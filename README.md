# PayoffLog

A local-only debt payoff + settlement tracker for Zachariah's own debts:
every balance, minimum, due date and past-due amount in one list, plus the
settlement pipeline no regular payoff app tracks — offer sent, written
agreement received, paid, lien release confirmed.

Stack (same as Hub Helper): Expo SDK 57 · React 19 · React Native 0.86 ·
AsyncStorage persistence · web support via react-native-web.

## The standing rule

**No settlement is paid until the agreement is in writing.** Any debt
whose settlement stage is *Offer Sent* without a recorded written
agreement shows a loud red **⛔ NO WRITTEN AGREEMENT — DO NOT PAY** flag
on its card, and an alert banner sits at the top of the screen naming
every flagged debt. Reaching *Agreement Received* (or toggling "Written
agreement received" on) clears the flag.

This rule came out of the Speedy Cash title-loan settlement: a $1,500
lump-sum offer sent Oct 19, 2026, payable Nov 1 — but only against a
written agreement including the lien release, which Speedy Cash has not
provided. The app is seeded with that debt sitting exactly at that stage,
flag visible from first launch.

## What it does

- **Totals header** — total owed (known balances only; an unconfirmed
  balance is shown as "unconfirmed" and never counted as $0), total due
  now, debts due within 7 days plus the overdue count, and the number of
  active settlements (offers sent or agreements received — drafted
  letters are pipeline, not active).
- **Debt list** — sorted with settlements first, then defaulted/past-due
  by due date (most overdue leads), then the rest by due date, paid
  debts last. Overdue dates show in red with the days overdue.
- **Add / edit form** — creditor, account label, type, status, balance,
  regular payment, amount due, due date, notes, and a settlement section:
  stage, offer amount, offer-sent date, written-agreement deadline, pay
  date, and toggles for written agreement received and lien release
  required/confirmed. Delete is a tap-again confirm; **Mark Paid** is a
  quick action on every open debt's card.
- **Seed data** — the 12 debts from the Past-Due Items Tracker as of
  Oct 27, 2026, added on first launch and backfilled on later launches
  only if never offered before: edit a seeded debt and your edit stands;
  delete one and it stays deleted.

## Local-only

No account, no network, no sync, no analytics. All data lives in
AsyncStorage on the phone. Uninstalling the app deletes the data — there
is no cloud copy.

## Tests

`npm test` runs the Node suites in `test/` (pure logic in `src/debts.js`
and the seed/backfill rules in `src/seed.js`, loaded via data: URLs the
same way as Hub Helper's suites).

## Rebuild steps (local Android build)

Same recipe as the other Smiley Delivers apps:

1. Get the project onto the Windows machine (repo ZIP download) and run
   `npm install` in a plain `C:\` folder — never the OneDrive-synced
   Desktop.
2. `npx expo prebuild` if `android/` isn't present yet.
3. **Copy this project's own `android\app\debug.keystore` over the fresh
   prebuild's copy before the first build.** The signing key is the
   per-project keystore, NOT `~/.android/debug.keystore` (that folder
   only holds the adb keys).
4. Build: `cd android && gradlew.bat assembleRelease`.
5. **Install over the top — never uninstall to fix a signature
   mismatch.** Uninstalling wipes the app's local data (all debts,
   edits, and seed state). If a signature mismatch appears, the fix is
   the keystore copy in step 3, then rebuild and reinstall.
