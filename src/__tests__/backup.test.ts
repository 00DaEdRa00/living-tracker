import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportStateSnapshot,
  validateBackupSnapshot,
  restoreStateSnapshot,
  generateP2PRoomCode,
  BACKUP_SCHEMA_VERSION,
} from '../lib/dataBackup';
import { useTrackerStore } from '../store/useTrackerStore';

describe('Data Backup & P2P Sync Engine', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  it('generates valid JSON state snapshot matching schema v2', () => {
    const rawJson = exportStateSnapshot();
    expect(typeof rawJson).toBe('string');

    const parsed = JSON.parse(rawJson);
    expect(parsed.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(parsed.appName).toBe('Living Tracker');
    expect(parsed.data).toBeDefined();
    expect(Array.isArray(parsed.data.tasks)).toBe(true);
    expect(Array.isArray(parsed.data.habits)).toBe(true);
    expect(Array.isArray(parsed.data.transactions)).toBe(true);

    expect(validateBackupSnapshot(parsed)).toBe(true);
  });

  it('rejects corrupted or invalid backup payloads', () => {
    expect(validateBackupSnapshot(null)).toBe(false);
    expect(validateBackupSnapshot({})).toBe(false);
    expect(validateBackupSnapshot({ schemaVersion: 1 })).toBe(false);
    expect(validateBackupSnapshot({ schemaVersion: 2, data: { tasks: 'invalid' } })).toBe(false);
  });

  it('restores snapshot data into tracker store', () => {
    const sampleBackup = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      appName: 'Living Tracker',
      data: {
        budget: { monthlyLimit: 75000, spent: 12000, currency: '₽' },
        transactions: [
          { id: 'tx-test', amount: 12000, category: 'Оборудование', date: new Date().toISOString() },
        ],
        habits: [],
        tasks: [
          { id: 'task-test', title: 'Восстановленная задача', completed: false, createdAt: new Date().toISOString() },
        ],
        unlockedAchievements: {},
        tone: 'neutral',
        theme: 'emerald',
        soundEnabled: false,
      },
    };

    const res = restoreStateSnapshot(JSON.stringify(sampleBackup));
    expect(res.success).toBe(true);

    const store = useTrackerStore.getState();
    expect(store.budget.monthlyLimit).toBe(75000);
    expect(store.budget.spent).toBe(12000);
    expect(store.tasks.length).toBe(1);
    expect(store.tasks[0].title).toBe('Восстановленная задача');
    expect(store.theme).toBe('emerald');
    expect(store.tone).toBe('neutral');
    expect(store.soundEnabled).toBe(false);
  });

  it('generates well-formed 8-char P2P room codes with hyphen separator', () => {
    const code = generateP2PRoomCode();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });
});
