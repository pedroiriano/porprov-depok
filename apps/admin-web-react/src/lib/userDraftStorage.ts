export type UserDraftFields = {
  username: string;
  email: string;
  full_name: string;
  role: string;
};

export type StoredUserDraft = {
  key: string;
  version: 1;
  fields: UserDraftFields;
  savedAt: string;
  expiresAt: string;
};

const DATABASE_NAME = 'porprov-admin-drafts';
const STORE_NAME = 'user-form-drafts';
const DATABASE_VERSION = 1;
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

let databasePromise: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Unable to open draft storage'));
      request.onblocked = () => reject(new Error('Draft storage upgrade is blocked'));
    });
  }
  return databasePromise;
}

function normalizeDraft(value: unknown): StoredUserDraft | null {
  if (!value || typeof value !== 'object') return null;
  const draft = value as Partial<StoredUserDraft>;
  const fields = draft.fields as Partial<UserDraftFields> | undefined;
  if (
    draft.version !== 1
    || typeof draft.key !== 'string'
    || typeof draft.savedAt !== 'string'
    || typeof draft.expiresAt !== 'string'
    || !fields
    || typeof fields.username !== 'string'
    || typeof fields.email !== 'string'
    || typeof fields.full_name !== 'string'
    || typeof fields.role !== 'string'
  ) return null;
  if (!Number.isFinite(Date.parse(draft.savedAt)) || !Number.isFinite(Date.parse(draft.expiresAt))) return null;

  return {
    key: draft.key,
    version: 1,
    fields: {
      username: fields.username.slice(0, 64),
      email: fields.email.slice(0, 254),
      full_name: fields.full_name.slice(0, 120),
      role: fields.role.slice(0, 64),
    },
    savedAt: draft.savedAt,
    expiresAt: draft.expiresAt,
  };
}

export async function readUserDraft(key: string): Promise<StoredUserDraft | null> {
  let draft: StoredUserDraft | null;
  try {
    const database = await openDatabase();
    draft = await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(normalizeDraft(request.result));
      request.onerror = () => reject(request.error || new Error('Unable to read draft'));
    });
  } catch {
    return null;
  }

  if (draft?.key !== key) return null;
  if (draft && Date.parse(draft.expiresAt) <= Date.now()) {
    await deleteUserDraft(key);
    return null;
  }
  return draft;
}

export async function saveUserDraft(key: string, fields: UserDraftFields): Promise<StoredUserDraft> {
  const now = Date.now();
  const draft: StoredUserDraft = {
    key,
    version: 1,
    fields: {
      username: fields.username.slice(0, 64),
      email: fields.email.slice(0, 254),
      full_name: fields.full_name.slice(0, 120),
      role: fields.role.slice(0, 64),
    },
    savedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DRAFT_TTL_MS).toISOString(),
  };

  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(draft);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Unable to save draft'));
    transaction.onabort = () => reject(transaction.error || new Error('Draft transaction aborted'));
  });
  return draft;
}

export async function deleteUserDraft(key: string): Promise<void> {
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Unable to delete draft'));
      transaction.onabort = () => reject(transaction.error || new Error('Draft transaction aborted'));
    });
  } catch {
    // INFO: No further cleanup is possible when IndexedDB is unavailable.
  }
}
