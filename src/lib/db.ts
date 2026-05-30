// §V.24 — IndexedDB wrapper for board index.
// DB: "hashban"  version: 1  store: "boards" (keyPath: "id")
// Autosave cache (hashban:last) stays in localStorage — sync read required at init.

import type { BoardEntry } from "@/hooks/useBoardIndex";

const DB_NAME = "hashban";
const DB_VERSION = 1;
const STORE = "boards";
const LS_MIGRATE_KEY = "hashban:boards";

let _db: IDBDatabase | null = null;

function open(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };

    req.onsuccess = async () => {
      _db = req.result;
      await migrate(_db);
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

// §V.24 — one-time migration from localStorage → IDB
async function migrate(db: IDBDatabase): Promise<void> {
  try {
    const raw = localStorage.getItem(LS_MIGRATE_KEY);
    if (!raw) return;
    const entries: BoardEntry[] = JSON.parse(raw);
    if (!Array.isArray(entries) || entries.length === 0) {
      localStorage.removeItem(LS_MIGRATE_KEY);
      return;
    }
    // only migrate if IDB is empty (avoid double-import on repeat opens)
    const existing = await dbGetAll(db);
    if (existing.length > 0) {
      localStorage.removeItem(LS_MIGRATE_KEY);
      return;
    }
    await Promise.all(entries.map((e) => dbPut(db, e)));
    localStorage.removeItem(LS_MIGRATE_KEY);
  } catch {
    /* migration failure is non-fatal */
  }
}

function dbGetAll(db: IDBDatabase): Promise<BoardEntry[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows: BoardEntry[] = req.result ?? [];
      // sort newest first
      rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

function dbPut(db: IDBDatabase, entry: BoardEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function dbDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Public API

export async function getAllBoards(): Promise<BoardEntry[]> {
  const db = await open();
  return dbGetAll(db);
}

export async function putBoard(entry: BoardEntry): Promise<void> {
  const db = await open();
  return dbPut(db, entry);
}

export async function removeBoard(id: string): Promise<void> {
  const db = await open();
  return dbDelete(db, id);
}
