import type { TelemetryEvent } from "./types";

// Xam IndexedDB — əlavə asılılıq yoxdur (docs/PHASE-1.md → "üçüncü tərəf SDK əlavə etmə" ruhu
// analitika SDK-larına aiddir, amma minimal saxlamaq üçün belə).
const DB_NAME = "th_telemetry";
const DB_VERSION = 1;
const STORE = "queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "event_id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(event: TelemetryEvent): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(event);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function queueLength(): Promise<number> {
  const db = await openDb();
  const count = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return count;
}

export async function peekBatch(limit: number): Promise<TelemetryEvent[]> {
  const db = await openDb();
  const items = await new Promise<TelemetryEvent[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll(undefined, limit);
    req.onsuccess = () => resolve(req.result as TelemetryEvent[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items;
}

export async function removeBatch(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const id of eventIds) store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
