export interface StoredFormDraft<T = unknown> {
  key: string;
  version: 1;
  payload: T;
  savedAt: string;
  expiresAt: string;
}

const DATABASE_NAME = 'porprov-admin-form-drafts-v2';
const STORE_NAME = 'form-drafts';
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
let databasePromise: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Unable to open draft storage'));
      request.onblocked = () => reject(new Error('Draft storage upgrade is blocked'));
    });
  }
  return databasePromise;
}

export async function readFormDraft<T>(key: string): Promise<StoredFormDraft<T> | null> {
  try {
    const database = await openDatabase();
    const value = await new Promise<StoredFormDraft<T> | undefined>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result as StoredFormDraft<T> | undefined);
      request.onerror = () => reject(request.error);
    });
    if (!value || value.key !== key || value.version !== 1 || !Number.isFinite(Date.parse(value.expiresAt))) return null;
    if (Date.parse(value.expiresAt) <= Date.now()) {
      await deleteFormDraft(key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export async function saveFormDraft<T>(key: string, payload: T): Promise<StoredFormDraft<T>> {
  const now = Date.now();
  const value: StoredFormDraft<T> = {
    key,
    version: 1,
    payload,
    savedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DRAFT_TTL_MS).toISOString(),
  };
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  return value;
}

export async function deleteFormDraft(key: string): Promise<void> {
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch {
    // INFO: Draft lokal tidak dapat dibersihkan bila storage browser unavailable.
  }
}
