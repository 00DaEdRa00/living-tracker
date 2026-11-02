import { describe, it, expect, beforeEach } from 'vitest';
import { safeLocalStorage, hybridStorage } from '../lib/storageRepository';

describe('Sprint 4: Storage Repository & Hybrid Persistence', () => {
  beforeEach(() => {
    safeLocalStorage.removeItem('test-key');
  });

  it('safely writes, reads, and deletes items from safeLocalStorage', () => {
    safeLocalStorage.setItem('test-key', 'test-value-123');
    expect(safeLocalStorage.getItem('test-key')).toBe('test-value-123');

    safeLocalStorage.removeItem('test-key');
    expect(safeLocalStorage.getItem('test-key')).toBeNull();
  });

  it('reads and writes state through hybridStorage fallback', async () => {
    const payload = JSON.stringify({ state: { catClicks: 42 }, version: 1 });
    await hybridStorage.setItem('hybrid-test-key', payload);

    const retrieved = await hybridStorage.getItem('hybrid-test-key');
    expect(retrieved).toBe(payload);

    await hybridStorage.removeItem('hybrid-test-key');
    const afterDelete = await hybridStorage.getItem('hybrid-test-key');
    expect(afterDelete).toBeNull();
  });
});
