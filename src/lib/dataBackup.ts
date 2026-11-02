/**
 * Data Backup & P2P Sync Engine for Living Tracker
 * Provides full state snapshot serialization, integrity validation,
 * and JSON import/export matching the SQLite repository schema.
 */

import { useTrackerStore } from '../store/useTrackerStore';
import { TrackerState } from '../types/tracker';

export interface TrackerBackupSnapshot {
  schemaVersion: number;
  exportedAt: string;
  appName: string;
  data: {
    budget: TrackerState['budget'];
    transactions: TrackerState['transactions'];
    habits: TrackerState['habits'];
    tasks: TrackerState['tasks'];
    unlockedAchievements: TrackerState['unlockedAchievements'];
    tone: TrackerState['tone'];
    theme: TrackerState['theme'];
    soundEnabled: boolean;
  };
}

export const BACKUP_SCHEMA_VERSION = 2;

export function exportStateSnapshot(): string {
  const state = useTrackerStore.getState();

  const snapshot: TrackerBackupSnapshot = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'Living Tracker',
    data: {
      budget: state.budget,
      transactions: state.transactions,
      habits: state.habits,
      tasks: state.tasks,
      unlockedAchievements: state.unlockedAchievements,
      tone: state.tone,
      theme: state.theme,
      soundEnabled: state.soundEnabled,
    },
  };

  return JSON.stringify(snapshot, null, 2);
}

export function downloadBackupFile(): void {
  if (typeof window === 'undefined') return;
  const json = exportStateSnapshot();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `living-tracker-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackupSnapshot(parsed: any): parsed is TrackerBackupSnapshot {
  if (!parsed || typeof parsed !== 'object') return false;
  if (!parsed.schemaVersion || typeof parsed.schemaVersion !== 'number') return false;
  if (!parsed.data || typeof parsed.data !== 'object') return false;
  if (!Array.isArray(parsed.data.transactions)) return false;
  if (!Array.isArray(parsed.data.habits)) return false;
  if (!Array.isArray(parsed.data.tasks)) return false;
  return true;
}

export function restoreStateSnapshot(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!validateBackupSnapshot(parsed)) {
      return { success: false, error: 'Неверный формат или повреждённая структура бэкапа' };
    }

    const { data } = parsed;
    const store = useTrackerStore.getState();

    useTrackerStore.setState({
      budget: data.budget || store.budget,
      transactions: Array.isArray(data.transactions) ? data.transactions : store.transactions,
      habits: Array.isArray(data.habits) ? data.habits : store.habits,
      tasks: Array.isArray(data.tasks) ? data.tasks : store.tasks,
      unlockedAchievements: data.unlockedAchievements || store.unlockedAchievements,
      tone: data.tone || store.tone,
      theme: data.theme || store.theme,
      soundEnabled: typeof data.soundEnabled === 'boolean' ? data.soundEnabled : store.soundEnabled,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Ошибка парсинга JSON' };
  }
}

/**
 * P2P WebRTC / CRDT Room Code Helper
 * Generates an end-to-end sync room ID for direct device-to-device synchronization
 */
export function generateP2PRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
