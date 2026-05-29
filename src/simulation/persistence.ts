import { openDB, type IDBPDatabase } from "idb";
import type {
  Civilization,
  TradeExchange,
  SymbolHypothesis,
  Metrics,
} from "../types/index.ts";

const DB_NAME = "alien-translator";
const DB_VERSION = 1;

interface AlienTranslatorDB {
  civilizations: {
    key: string;
    value: { id: string; data: string };
  };
  trades: {
    key: number;
    value: { round: number; data: string };
  };
  hypotheses: {
    key: number;
    value: { timestamp: number; data: string };
  };
  metrics: {
    key: number;
    value: { round: number; data: string };
  };
  state: {
    key: string;
    value: { key: string; value: string };
  };
}

let dbInstance: IDBPDatabase<AlienTranslatorDB> | null = null;

async function getDB(): Promise<IDBPDatabase<AlienTranslatorDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<AlienTranslatorDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("civilizations")) {
        db.createObjectStore("civilizations", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("trades")) {
        db.createObjectStore("trades", {
          keyPath: "round",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("hypotheses")) {
        db.createObjectStore("hypotheses", {
          keyPath: "timestamp",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("metrics")) {
        db.createObjectStore("metrics", { keyPath: "round" });
      }
      if (!db.objectStoreNames.contains("state")) {
        db.createObjectStore("state", { keyPath: "key" });
      }
    },
  });
  return dbInstance;
}

export async function saveCivilizations(civs: Civilization[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("civilizations", "readwrite");
  for (const civ of civs) {
    await tx.store.put({ id: civ.id, data: JSON.stringify(civ) });
  }
  await tx.done;
}

export async function saveTrades(trades: TradeExchange[]): Promise<void> {
  if (trades.length === 0) return;
  const db = await getDB();
  const tx = db.transaction("trades", "readwrite");
  for (const trade of trades) {
    await tx.store.put({ round: trade.round, data: JSON.stringify(trade) });
  }
  await tx.done;
}

export async function saveHypotheses(
  hypotheses: SymbolHypothesis[],
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("hypotheses", "readwrite");
  await tx.store.add({
    timestamp: Date.now(),
    data: JSON.stringify(hypotheses),
  });
  await tx.done;
}

export async function saveMetrics(metrics: Metrics[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("metrics", "readwrite");
  for (const m of metrics) {
    await tx.store.put({ round: m.round, data: JSON.stringify(m) });
  }
  await tx.done;
}

export async function saveState(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put("state", { key, value });
}

export async function loadState(key: string): Promise<string | null> {
  const db = await getDB();
  const result = await db.get("state", key);
  return result?.value || null;
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const stores = db.objectStoreNames;
  const tx = db.transaction(stores, "readwrite");
  for (const store of stores) {
    await tx.objectStore(store).clear();
  }
  await tx.done;
}
