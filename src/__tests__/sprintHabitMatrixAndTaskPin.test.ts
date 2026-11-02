import { describe, it, expect, beforeEach } from 'vitest';
import { getHabitsMatrixPunchline } from '../components/HabitMatrixShareModal';
import { getHeatmapDays } from '../components/HabitsSection';
import { useTrackerStore } from '../store/useTrackerStore';
import {
  SOUND_FX_CATALOG,
  playWaterDropSound,
  playFlameSound,
  playBadgeUnlockSound,
} from '../lib/soundFx';
import { getDatabaseStats, getSystemMetrics } from '../lib/tauriBridge';

describe('Sprint 2: Habit Matrix & Task Pinning', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  describe('Habits Matrix Punchlines & 84-Day Heatmap', () => {
    it('generates 84-day heatmap array correctly', () => {
      const days84 = getHeatmapDays(84);
      expect(days84.length).toBe(84);
      const days56 = getHeatmapDays(56);
      expect(days56.length).toBe(56);
      const days28 = getHeatmapDays(28);
      expect(days28.length).toBe(28);
    });

    it('returns high consistency sassy punchline when all habits done', () => {
      const stats = {
        totalHabits: 5,
        completedToday: 5,
        avgStreak: 15,
        bestStreak: 25,
        consistencyPercent: 92,
      };
      const line = getHabitsMatrixPunchline(stats, 'sassy');
      expect(line).toContain('Каток дисциплины на полной мощности');
    });

    it('returns moderate consistency ironic punchline', () => {
      const stats = {
        totalHabits: 5,
        completedToday: 2,
        avgStreak: 6,
        bestStreak: 12,
        consistencyPercent: 65,
      };
      const line = getHabitsMatrixPunchline(stats, 'ironic');
      expect(line).toContain('Баланс хаоса и порядка');
    });

    it('returns neutral tone punchline for recovery state', () => {
      const stats = {
        totalHabits: 5,
        completedToday: 1,
        avgStreak: 2,
        bestStreak: 4,
        consistencyPercent: 40,
      };
      const line = getHabitsMatrixPunchline(stats, 'neutral');
      expect(line).toContain('Формирование новых полезных ритуалов');
    });
  });

  describe('Task Pinning Logic', () => {
    it('toggles task pinned state in tracker store', () => {
      const store = useTrackerStore.getState();
      store.addTask({
        title: 'Тестовая важная задача',
        category: 'Работа',
        priority: 'high',
      });

      const task = useTrackerStore.getState().tasks.find((t) => t.title === 'Тестовая важная задача');
      expect(task).toBeDefined();
      expect(task?.isPinned).toBeFalsy();

      useTrackerStore.getState().toggleTaskPin(task!.id);
      const pinnedTask = useTrackerStore.getState().tasks.find((t) => t.id === task!.id);
      expect(pinnedTask?.isPinned).toBe(true);

      useTrackerStore.getState().toggleTaskPin(task!.id);
      const unpinnedTask = useTrackerStore.getState().tasks.find((t) => t.id === task!.id);
      expect(unpinnedTask?.isPinned).toBe(false);
    });
  });
});

describe('Sprint 3: Sunset Theme & Web Audio FX Catalog', () => {
  it('supports sunset theme in store', () => {
    useTrackerStore.getState().setTheme('sunset');
    expect(useTrackerStore.getState().theme).toBe('sunset');
  });

  it('includes water, flame and badge sounds in procedural audio catalog', () => {
    const waterPreset = SOUND_FX_CATALOG.find((p) => p.id === 'water');
    expect(waterPreset).toBeDefined();
    expect(waterPreset?.name).toBe('Капля воды');

    const flamePreset = SOUND_FX_CATALOG.find((p) => p.id === 'flame');
    expect(flamePreset).toBeDefined();
    expect(flamePreset?.name).toBe('Огонь стрика');

    const badgePreset = SOUND_FX_CATALOG.find((p) => p.id === 'badge');
    expect(badgePreset).toBeDefined();
    expect(badgePreset?.name).toBe('Значок рубежа');

    // Safe execution check
    expect(() => playWaterDropSound()).not.toThrow();
    expect(() => playFlameSound()).not.toThrow();
    expect(() => playBadgeUnlockSound()).not.toThrow();
  });
});

describe('Sprint 4: Desktop Bridge SQLite v8 & System Metrics', () => {
  it('reports database version 8 with SQLite support', async () => {
    const stats = await getDatabaseStats();
    expect(stats).not.toBeNull();
    expect(stats?.version).toBeGreaterThanOrEqual(8);
  });

  it('provides system health metrics with SQLite v8 engine', async () => {
    const metrics = await getSystemMetrics();
    expect(metrics).not.toBeNull();
    expect(metrics?.status).toBe('healthy');
    expect(metrics?.sqlite_version).toBeGreaterThanOrEqual(8);
  });
});