import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY, normalizeDebt } from './debts';
import { SEED_DEBTS, allSeedKeys, backfillSeeds } from './seed';

const makeId = () => `debt-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

// Local-only data hook, modeled on Hub Helper's useHubData: one
// AsyncStorage save holding the debts plus the seed keys already
// offered (so a deleted seed debt is never resurrected and user edits
// are never overwritten by the backfill).
export function usePayoffData() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [debts, setDebts] = useState([]);
  const [seededKeys, setSeededKeys] = useState([]);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          const loaded = (Array.isArray(data.debts) ? data.debts : []).map(normalizeDebt);
          const backfill = backfillSeeds(loaded, data.seededKeys);
          setDebts([...loaded, ...backfill.debtsToAdd.map(normalizeDebt)]);
          setSeededKeys(backfill.seededKeys);
        } else {
          setDebts(SEED_DEBTS.map(normalizeDebt));
          setSeededKeys(allSeedKeys());
        }
      } catch (e) {
        setDebts(SEED_DEBTS.map(normalizeDebt));
        setSeededKeys(allSeedKeys());
      }
      setIsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ debts, seededKeys })).catch(() => {});
    }, 150);
  }, [debts, seededKeys, isLoaded]);

  const addDebt = (fields) => {
    const d = normalizeDebt({ ...fields, id: makeId() });
    setDebts((prev) => [...prev, d]);
    return d;
  };

  const updateDebt = (id, fields) => {
    setDebts((prev) => prev.map((d) => (d.id === id ? normalizeDebt({ ...d, ...fields, id }) : d)));
  };

  const deleteDebt = (id) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  // Quick action: mark a debt paid off. A live settlement moves to the
  // 'paid' stage with it; the debt drops out of every total.
  const markPaid = (id) => {
    setDebts((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const next = { ...d, status: 'paid' };
      if (next.settlement && next.settlement.stage !== 'closed') {
        next.settlement = { ...next.settlement, stage: 'paid' };
      }
      return next;
    }));
  };

  return { isLoaded, debts, addDebt, updateDebt, deleteDebt, markPaid };
}
