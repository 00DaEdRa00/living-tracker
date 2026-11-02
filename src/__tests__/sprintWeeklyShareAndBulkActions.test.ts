import { describe, it, expect, beforeEach } from 'vitest';
import { useTrackerStore } from '../store/useTrackerStore';
import {
  calculateWeeklySprintStats,
  getWeeklySprintPunchline,
} from '../components/WeeklySprintShareModal';
import { getHeatmapDays } from '../components/HabitsSection';
import {
  playAuroraSound,
  playBulkActionSound,
  SOUND_FX_CATALOG,
} from '../lib/soundFx';
import { getDatabaseStats, getSystemMetrics } from '../lib/tauriBridge';

describe('Sprint 2-4: Weekly Sprint Share, Bulk Actions, Aurora Theme & SQLite v9', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  describe('Sprint 3: Aurora Theme Support', () => {
    it('sets and activates aurora theme in store', () => {
      const store = useTrackerStore.getState();
      store.setTheme('aurora');
      expect(useTrackerStore.getState().theme).toBe('aurora');
    });

    it('verifies aurora theme exists alongside all supported themes', () => {
      const store = useTrackerStore.getState();
      const themes = [
        'amoled',
        'cyberpunk',
        'emerald',
        'synthwave',
        'nord',
        'dracula',
        'tokyo',
        'crimson',
        'matrix',
        'sunset',
        'aurora',
      ] as const;

      themes.forEach((t) => {
        store.setTheme(t);
        expect(useTrackerStore.getState().theme).toBe(t);
      });
    });
  });

  describe('Sprint 2: Task Bulk / Batch Actions', () => {
    it('executes bulkCompleteTasks for multiple selected tasks', () => {
      const store = useTrackerStore.getState();
      store.addTask({ title: 'Задача 1', category: 'Работа' });
      store.addTask({ title: 'Задача 2', category: 'Быт' });
      store.addTask({ title: 'Задача 3', category: 'Хобби' });

      const taskIds = useTrackerStore.getState().tasks.map((t) => t.id);
      expect(taskIds.length).toBeGreaterThanOrEqual(3);

      store.bulkCompleteTasks([taskIds[0], taskIds[1]]);

      const updated = useTrackerStore.getState().tasks;
      expect(updated.find((t) => t.id === taskIds[0])?.completed).toBe(true);
      expect(updated.find((t) => t.id === taskIds[1])?.completed).toBe(true);
      expect(updated.find((t) => t.id === taskIds[2])?.completed).toBe(false);
    });

    it('executes bulkRescheduleTasks and shifts dueDates by N days', () => {
      const store = useTrackerStore.getState();
      const baseDate = new Date('2026-11-01T12:00:00.000Z');
      store.addTask({
        title: 'Срочный проект',
        dueDate: baseDate.toISOString(),
      });
      const task = useTrackerStore.getState().tasks.find((t) => t.title === 'Срочный проект')!;
      expect(task).toBeDefined();

      store.bulkRescheduleTasks([task.id], 3);

      const updated = useTrackerStore.getState().tasks.find((t) => t.id === task.id)!;
      const originalTime = baseDate.getTime();
      const updatedTime = new Date(updated.dueDate!).getTime();
      const diffDays = Math.round((updatedTime - originalTime) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(3);
    });

    it('executes bulkSetTaskPriority across target tasks', () => {
      const store = useTrackerStore.getState();
      store.addTask({ title: 'Задача A', priority: 'low' });
      store.addTask({ title: 'Задача B', priority: 'low' });

      const ids = useTrackerStore
        .getState()
        .tasks.filter((t) => t.title === 'Задача A' || t.title === 'Задача B')
        .map((t) => t.id);
      store.bulkSetTaskPriority(ids, 'high');

      const updated = useTrackerStore.getState().tasks;
      expect(updated.find((t) => t.id === ids[0])?.priority).toBe('high');
      expect(updated.find((t) => t.id === ids[1])?.priority).toBe('high');
    });

    it('executes bulkDeleteTasks and cleans up target tasks', () => {
      const store = useTrackerStore.getState();
      store.addTask({ title: 'Удаляемая 1' });
      store.addTask({ title: 'Удаляемая 2' });
      store.addTask({ title: 'Остающаяся 3' });

      const all = useTrackerStore.getState().tasks;
      const t1 = all.find((t) => t.title === 'Удаляемая 1')!;
      const t2 = all.find((t) => t.title === 'Удаляемая 2')!;
      const t3 = all.find((t) => t.title === 'Остающаяся 3')!;

      store.bulkDeleteTasks([t1.id, t2.id]);

      const remaining = useTrackerStore.getState().tasks;
      expect(remaining.find((t) => t.id === t1.id)).toBeUndefined();
      expect(remaining.find((t) => t.id === t2.id)).toBeUndefined();
      expect(remaining.find((t) => t.id === t3.id)).toBeDefined();
    });
  });

  describe('Sprint 2: Habit Archive & 112-Day Heatmap', () => {
    it('supports archiving and unarchiving habits', () => {
      const store = useTrackerStore.getState();
      store.addHabit({ title: 'Привычка на паузе', category: 'Здоровье/Спорт' });
      const habitId = useTrackerStore.getState().habits[0].id;

      expect(useTrackerStore.getState().habits[0].isArchived).toBeFalsy();

      store.archiveHabit(habitId);
      expect(useTrackerStore.getState().habits[0].isArchived).toBe(true);

      store.unarchiveHabit(habitId);
      expect(useTrackerStore.getState().habits[0].isArchived).toBe(false);
    });

    it('generates 112-day heatmap array (16 weeks / quarter view)', () => {
      const days = getHeatmapDays(112);
      expect(days.length).toBe(112);
      // All items are valid YYYY-MM-DD
      days.forEach((d) => {
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('Sprint 3: Procedural Audio FX Catalog', () => {
    it('executes playAuroraSound and playBulkActionSound safely', () => {
      expect(() => playAuroraSound()).not.toThrow();
      expect(() => playBulkActionSound()).not.toThrow();
    });

    it('includes aurora and bulk in SOUND_FX_CATALOG', () => {
      const ids = SOUND_FX_CATALOG.map((s) => s.id);
      expect(ids).toContain('aurora');
      expect(ids).toContain('bulk');
    });
  });

  describe('Sprint 3: Weekly Sprint Review Share Modal & Tones', () => {
    it('calculates weekly sprint stats correctly', () => {
      const now = new Date();
      const tasks = [
        { completed: true, completedAt: now.toISOString() },
        { completed: true, completedAt: now.toISOString() },
        { completed: false },
      ];
      const habits = [{ streak: 5 }, { streak: 12 }, { streak: 0 }];

      const stats = calculateWeeklySprintStats(tasks, habits, 75, 4);
      expect(stats.completedTasksThisWeek).toBe(2);
      expect(stats.activeStreaksCount).toBe(2);
      expect(stats.longestStreak).toBe(12);
      expect(stats.focusMinutes).toBe(75);
      expect(stats.freezeShields).toBe(4);
      expect(stats.productivityScore).toBeGreaterThanOrEqual(50);
    });

    it('generates tone-specific punchlines for weekly sprint', () => {
      const highScoreStats = {
        completedTasksThisWeek: 10,
        totalTasks: 12,
        activeStreaksCount: 5,
        longestStreak: 21,
        focusMinutes: 180,
        freezeShields: 3,
        productivityScore: 88,
      };

      const sassyLine = getWeeklySprintPunchline(highScoreStats, 'sassy');
      expect(sassyLine).toContain('Неделя закрыта с ноги');

      const ironicLine = getWeeklySprintPunchline(highScoreStats, 'ironic');
      expect(ironicLine).toContain('диван');

      const neutralLine = getWeeklySprintPunchline(highScoreStats, 'neutral');
      expect(neutralLine).toContain('Выдающиеся');
    });
  });

  describe('Sprint 4: Tauri 2.0 SQLite Integration', () => {
    it('validates SQLite schema version in database stats', async () => {
      const stats = await getDatabaseStats();
      expect(stats).not.toBeNull();
      expect(stats?.version).toBeGreaterThanOrEqual(9);
    });

    it('validates SQLite schema version in system metrics', async () => {
      const metrics = await getSystemMetrics();
      expect(metrics).not.toBeNull();
      expect(metrics?.sqlite_version).toBeGreaterThanOrEqual(9);
    });
  });
});
