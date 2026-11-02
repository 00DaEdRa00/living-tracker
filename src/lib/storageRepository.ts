/**
 * Storage Repository for Living Tracker.
 * Provides abstraction over SQLite (via Tauri 2.0 @tauri-apps/plugin-sql)
 * and LocalStorage (for web browser dev & preview).
 */

import type { StateStorage } from 'zustand/middleware';
import type Database from '@tauri-apps/plugin-sql';
import { isTauri } from './tauriBridge';
import type { TrackerState, Transaction, Habit, Task, Budget } from '../types/tracker';

const SQLITE_DB_PATH = 'sqlite:living_tracker.db';
const LOCAL_STORAGE_KEY = 'living-tracker-storage';

let dbInstance: Database | null = null;

/**
 * Get or initialize SQLite Database connection when running in Tauri
 */
export async function getSqliteDb() {
  if (!isTauri()) return null;
  if (dbInstance) return dbInstance;

  try {
    const DatabaseModule = await import('@tauri-apps/plugin-sql');
    const Database = DatabaseModule.default;
    dbInstance = await Database.load(SQLITE_DB_PATH);

    // Ensure settings table exists for atomic state storage
    await dbInstance.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'expense'
      );
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        icon TEXT,
        streak INTEGER NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0,
        completed_today INTEGER NOT NULL DEFAULT 0,
        history_json TEXT NOT NULL DEFAULT '[]',
        frozen_dates_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'medium',
        category TEXT,
        icon TEXT,
        due_date TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT
      );
    `);

    return dbInstance;
  } catch (err) {
    console.warn('[StorageRepository] Failed to initialize SQLite DB:', err);
    return null;
  }
}

/**
 * LocalStorage safe fallback implementation
 */
export const safeLocalStorage: StateStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // browser storage restricted
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // browser storage restricted
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // browser storage restricted
    }
  },
};

/**
 * Hybrid State Storage for Zustand persist middleware:
 * - In Tauri: uses SQLite settings table + structured relational tables
 * - In Browser: uses LocalStorage
 */
export const hybridStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (isTauri()) {
      try {
        const db = await getSqliteDb();
        if (db) {
          const rows = await db.select<{ key: string; value: string }[]>(
            'SELECT value FROM settings WHERE key = $1 LIMIT 1',
            [name]
          );
          if (rows && rows.length > 0) {
            return rows[0].value;
          }
        }
      } catch (err) {
        console.warn('[StorageRepository] SQLite getItem fallback to localStorage:', err);
      }
    }
    return safeLocalStorage.getItem(name);
  },

  setItem: async (name: string, value: string): Promise<void> => {
    // Always write to local storage as fallback/mirror
    safeLocalStorage.setItem(name, value);

    if (isTauri()) {
      try {
        const db = await getSqliteDb();
        if (db) {
          await db.execute(
            'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
            [name, value]
          );

          // Synchronize relational SQLite tables asynchronously in background
          try {
            const parsed = JSON.parse(value);
            const state = parsed.state as Partial<TrackerState>;
            if (state) {
              await syncRelationalTables(db, state);
            }
          } catch {
            // non-json or payload mismatch
          }
        }
      } catch (err) {
        console.warn('[StorageRepository] SQLite setItem error:', err);
      }
    }
  },

  removeItem: async (name: string): Promise<void> => {
    safeLocalStorage.removeItem(name);
    if (isTauri()) {
      try {
        const db = await getSqliteDb();
        if (db) {
          await db.execute('DELETE FROM settings WHERE key = $1', [name]);
        }
      } catch (err) {
        console.warn('[StorageRepository] SQLite removeItem error:', err);
      }
    }
  },
};

/**
 * Synchronize individual entities into dedicated relational SQLite tables
 */
async function syncRelationalTables(db: Database, state: Partial<TrackerState>): Promise<void> {
  // Sync Transactions
  if (Array.isArray(state.transactions)) {
    for (const tx of state.transactions) {
      await db.execute(
        `INSERT INTO transactions (id, amount, category, description, date, type)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT(id) DO UPDATE SET
           amount = excluded.amount,
           category = excluded.category,
           description = excluded.description,
           date = excluded.date,
           type = excluded.type`,
        [tx.id, tx.amount, tx.category, tx.description || null, tx.date, tx.type || 'expense']
      );
    }
  }

  // Sync Habits
  if (Array.isArray(state.habits)) {
    for (const h of state.habits) {
      await db.execute(
        `INSERT INTO habits (id, title, description, category, icon, streak, best_streak, completed_today, history_json, frozen_dates_json, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           description = excluded.description,
           category = excluded.category,
           icon = excluded.icon,
           streak = excluded.streak,
           best_streak = excluded.best_streak,
           completed_today = excluded.completed_today,
           history_json = excluded.history_json,
           frozen_dates_json = excluded.frozen_dates_json`,
        [
          h.id,
          h.title,
          h.description || null,
          h.category || null,
          h.icon || null,
          h.streak,
          h.bestStreak || 0,
          h.completedToday ? 1 : 0,
          JSON.stringify(h.history || []),
          JSON.stringify(h.frozenDates || []),
          h.createdAt || new Date().toISOString(),
        ]
      );
    }
  }

  // Sync Tasks
  if (Array.isArray(state.tasks)) {
    for (const t of state.tasks) {
      await db.execute(
        `INSERT INTO tasks (id, title, description, completed, priority, category, icon, due_date, created_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           description = excluded.description,
           completed = excluded.completed,
           priority = excluded.priority,
           category = excluded.category,
           icon = excluded.icon,
           due_date = excluded.due_date,
           completed_at = excluded.completed_at`,
        [
          t.id,
          t.title,
          t.description || null,
          t.completed ? 1 : 0,
          t.priority || 'medium',
          t.category || null,
          t.icon || null,
          t.dueDate || null,
          t.createdAt || new Date().toISOString(),
          t.completedAt || null,
        ]
      );
    }
  }
}
