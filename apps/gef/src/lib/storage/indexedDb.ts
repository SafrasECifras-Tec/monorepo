import { openDB, type IDBPDatabase } from 'idb';
import type { ImportedDataStore, ImportMeta } from '@/contexts/ImportDataContext';

const DB_NAME    = 'gef-import-db';
const DB_VERSION = 2;
const DATA_STORE    = 'modules';
const META_STORE    = 'meta';
const CLIENTS_STORE = 'clients';

// ─── Client Type ──────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  createdAt: string;
}

// ─── DB Init ─────────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DATA_STORE)) {
          db.createObjectStore(DATA_STORE);
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
        if (!db.objectStoreNames.contains(CLIENTS_STORE)) {
          db.createObjectStore(CLIENTS_STORE);
        }
      },
    });
  }
  return dbPromise;
}

// ─── Module Data ─────────────────────────────────────────────────────────────

const MODULE_KEYS: (keyof ImportedDataStore)[] = [
  'fluxoCaixa', 'fluxoAgregado', 'endividamento', 'balanco', 'dre', 'estoque',
];

export async function idbSaveModule<K extends keyof ImportedDataStore>(
  clientId: string,
  key: K,
  value: ImportedDataStore[K],
): Promise<void> {
  const db = await getDB();
  await db.put(DATA_STORE, value, `${clientId}::${key}`);
}

export async function idbDeleteModule(clientId: string, key: keyof ImportedDataStore): Promise<void> {
  const db = await getDB();
  await db.delete(DATA_STORE, `${clientId}::${key}`);
}

export async function idbLoadAll(clientId: string): Promise<Partial<ImportedDataStore>> {
  const db = await getDB();
  const result: Partial<ImportedDataStore> = {};
  for (const key of MODULE_KEYS) {
    const val = await db.get(DATA_STORE, `${clientId}::${key}`);
    if (val !== undefined) {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}

export async function idbDeleteAllClientData(clientId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([DATA_STORE, META_STORE], 'readwrite');
  const deletes = [
    ...MODULE_KEYS.map(key => tx.objectStore(DATA_STORE).delete(`${clientId}::${key}`)),
    tx.objectStore(META_STORE).delete(`${clientId}::import-meta`),
  ];
  await Promise.all([...deletes, tx.done]);
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export async function idbSaveMeta(clientId: string, meta: ImportMeta[]): Promise<void> {
  const db = await getDB();
  await db.put(META_STORE, meta, `${clientId}::import-meta`);
}

export async function idbLoadMeta(clientId: string): Promise<ImportMeta[]> {
  const db = await getDB();
  const val = await db.get(META_STORE, `${clientId}::import-meta`);
  return val ?? [];
}

// ─── Clients ──────────────────────────────────────────────────────────────────

const CLIENTS_KEY = 'clients-list';

export async function idbLoadClients(): Promise<Client[]> {
  const db = await getDB();
  const val = await db.get(CLIENTS_STORE, CLIENTS_KEY);
  return val ?? [];
}

export async function idbSaveClients(clients: Client[]): Promise<void> {
  const db = await getDB();
  await db.put(CLIENTS_STORE, clients, CLIENTS_KEY);
}
