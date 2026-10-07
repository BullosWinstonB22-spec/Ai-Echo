import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const DB_INDEXED_DB_NAME = 'EchoSQLiteStore';
const DB_STORE_NAME = 'sqlite_binary';
const DB_KEY = 'echo_main_db';
export const CURRENT_DATABASE_VERSION = 1;

let SQLInstance: SqlJsStatic | null = null;
let dbInstance: Database | null = null;

// IndexedDB Helper for persistent SQLite WASM binary buffer
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_INDEXED_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        db.createObjectStore(DB_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadBinaryFromIndexedDB(): Promise<Uint8Array | null> {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(DB_STORE_NAME, 'readonly');
      const store = tx.objectStore(DB_STORE_NAME);
      const getReq = store.get(DB_KEY);
      getReq.onsuccess = () => {
        if (getReq.result instanceof Uint8Array) {
          resolve(getReq.result);
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to load SQLite from IndexedDB:', err);
    return null;
  }
}

async function saveBinaryToIndexedDB(data: Uint8Array): Promise<void> {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(DB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(DB_STORE_NAME);
      const putReq = store.put(data, DB_KEY);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.error('Failed to save SQLite to IndexedDB:', err);
  }
}

async function initializeSQLJsStatic(): Promise<SqlJsStatic | null> {
  // Strategy 1: Vite bundled WASM URL
  try {
    return await initSqlJs({
      locateFile: () => sqlWasmUrl
    });
  } catch (e1) {
    console.warn('Vite WASM URL load failed, trying unpkg CDN:', e1);
  }

  // Strategy 2: unpkg CDN
  try {
    return await initSqlJs({
      locateFile: file => `https://unpkg.com/sql.js@1.14.1/dist/${file}`
    });
  } catch (e2) {
    console.warn('unpkg CDN WASM load failed, trying jsdelivr CDN:', e2);
  }

  // Strategy 3: jsdelivr CDN
  try {
    return await initSqlJs({
      locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/${file}`
    });
  } catch (e3) {
    console.error('All SQLite WASM initialization strategies failed:', e3);
    return null;
  }
}

// Fallback in-memory DB mock if WASM is completely unavailable
function createMockDatabase(): Database {
  return {
    run: () => {},
    exec: () => [],
    each: () => {},
    prepare: () => ({
      bind: () => false,
      step: () => false,
      get: () => [],
      getAsObject: () => ({}),
      run: () => {},
      free: () => true,
      reset: () => {},
      freemem: () => {},
    }),
    export: () => new Uint8Array(),
    close: () => {},
    getRowsModified: () => 0,
    create_function: () => {},
  } as unknown as Database;
}

export async function getSQLiteInstance(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!SQLInstance) {
    SQLInstance = await initializeSQLJsStatic();
  }

  if (!SQLInstance) {
    console.warn('Using fallback mock SQLite instance.');
    dbInstance = createMockDatabase();
    return dbInstance;
  }

  const existingBinary = await loadBinaryFromIndexedDB();
  if (existingBinary) {
    try {
      dbInstance = new SQLInstance.Database(existingBinary);
    } catch (e) {
      console.warn('Corrupted SQLite binary, re-creating empty database:', e);
      dbInstance = new SQLInstance.Database();
    }
  } else {
    dbInstance = new SQLInstance.Database();
  }

  // Initialize Tables & Run Version Migrations
  try {
    runDatabaseMigrations(dbInstance);
    await saveSQLiteToDisk();
  } catch (err) {
    console.warn('Error during SQLite migration/save:', err);
  }

  return dbInstance;
}

function runDatabaseMigrations(db: Database) {
  // Create migration tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const res = db.exec(`SELECT MAX(version) as ver FROM schema_migrations;`);
  let currentVer = 0;
  if (res.length > 0 && res[0].values.length > 0 && res[0].values[0][0] !== null) {
    currentVer = Number(res[0].values[0][0]);
  }

  // Version 1 Schema
  if (currentVer < 1) {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT,
        name TEXT,
        email TEXT,
        avatar TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT,
        title TEXT,
        category TEXT,
        preview TEXT,
        created_at TEXT,
        updated_at TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        firebase_uid TEXT,
        role TEXT,
        content TEXT,
        image_url TEXT,
        file_name TEXT,
        thinking_duration REAL,
        model_used TEXT,
        grounding_chunks TEXT,
        created_at TEXT,
        updated_at TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS recent_searches (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT,
        query TEXT,
        category TEXT,
        preview TEXT,
        status TEXT,
        timestamp TEXT,
        created_at TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT,
        setting_key TEXT,
        setting_value TEXT,
        updated_at TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        operation TEXT,
        table_name TEXT,
        record_id TEXT,
        payload TEXT,
        created_at TEXT,
        retry_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending'
      );

      INSERT INTO schema_migrations (version, applied_at)
      VALUES (1, '${new Date().toISOString()}');
    `);
  }
}

export async function saveSQLiteToDisk(): Promise<void> {
  if (!dbInstance) return;
  const binary = dbInstance.export();
  await saveBinaryToIndexedDB(binary);
}

export async function clearLocalSQLiteData(): Promise<void> {
  if (dbInstance) {
    dbInstance.run(`DELETE FROM users;`);
    dbInstance.run(`DELETE FROM conversations;`);
    dbInstance.run(`DELETE FROM messages;`);
    dbInstance.run(`DELETE FROM recent_searches;`);
    dbInstance.run(`DELETE FROM settings;`);
    dbInstance.run(`DELETE FROM sync_queue;`);
    await saveSQLiteToDisk();
  }
}
