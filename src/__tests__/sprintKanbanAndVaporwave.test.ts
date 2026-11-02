import { describe, it, expect, beforeEach } from 'vitest';
import { calculateCertificateData } from '../components/StreakCertificateModal';
import { getHeatmapDays } from '../components/HabitsSection';
import { useTrackerStore } from '../store/useTrackerStore';
import {
  SOUND_FX_CATALOG,
  playVaporwaveSound,
  playKanbanMoveSound,
  playCertificateSound,
} from '../lib/soundFx';
import { getDatabaseStats, getSystemMetrics, getSqliteVersion } from '../lib/tauriBridge';
import type { Habit } from '../types/tracker';

describe('Sprint 2-4: Kanban Board, Vaporwave Theme, Streak Certificate & SQLite v11', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  describe('Sprint 2: Kanban Status & Habit Routine Enhancements', () => {
    it('manages task kanban status transitions in store', () => {
      const store = useTrackerStore.getState();
      store.addTask({
        id: 'kanban-task-1',
        title: 'Refactor Architecture',
        priority: 'high',
        category: 'Работа',
      });

      let task = useTrackerStore.getState().tasks.find((t) => t.id === 'kanban-task-1');
      expect(task).toBeDefined();
      expect(task?.completed).toBe(false);

      // Move to in_progress
      store.updateTaskKanbanStatus('kanban-task-1', 'in_progress');
      task = useTrackerStore.getState().tasks.find((t) => t.id === 'kanban-task-1');
      expect(task?.kanbanStatus).toBe('in_progress');
      expect(task?.completed).toBe(false);

      // Move to done
      store.updateTaskKanbanStatus('kanban-task-1', 'done');
      task = useTrackerStore.getState().tasks.find((t) => t.id === 'kanban-task-1');
      expect(task?.kanbanStatus).toBe('done');
      expect(task?.completed).toBe(true);
      expect(task?.completedAt).toBeDefined();

      // Move back to todo
      store.updateTaskKanbanStatus('kanban-task-1', 'todo');
      task = useTrackerStore.getState().tasks.find((t) => t.id === 'kanban-task-1');
      expect(task?.kanbanStatus).toBe('todo');
      expect(task?.completed).toBe(false);
    });

    it('supports habit time-of-day slots', () => {
      const store = useTrackerStore.getState();
      store.addHabit({
        id: 'morning-meditation',
        title: 'Утренняя медитация',
        category: 'Здоровье/Спорт',
        timeOfDay: 'morning',
        frozenDates: [],
      });

      const habit = useTrackerStore.getState().habits.find((h) => h.id === 'morning-meditation');
      expect(habit).toBeDefined();
      expect(habit?.timeOfDay).toBe('morning');
    });

    it('awards freeze shield upon reaching 7-day milestone streak', () => {
      const store = useTrackerStore.getState();
      const initialShields = useTrackerStore.getState().freezeShields ?? 3;

      store.addHabit({
        id: 'milestone-habit',
        title: 'Ежедневный бег',
        category: 'Здоровье/Спорт',
        frozenDates: [],
      });

      // Set streak to 6
      store.updateHabit('milestone-habit', { streak: 6, completedToday: false });

      // Toggle to complete today -> streak becomes 7 (multiple of 7)
      store.toggleHabit('milestone-habit');

      const updatedHabit = useTrackerStore.getState().habits.find((h) => h.id === 'milestone-habit');
      expect(updatedHabit?.streak).toBe(7);
      expect(useTrackerStore.getState().freezeShields).toBe(initialShields + 1);
    });

    it('generates 168-day (24 weeks / half-year) heatmap window correctly', () => {
      const days = getHeatmapDays(168);
      expect(days).toHaveLength(168);
      const today = new Date().toISOString().split('T')[0];
      expect(days[days.length - 1]).toBe(today);
    });
  });

  describe('Sprint 3: Streak Certificate Generator & Vaporwave Theme', () => {
    it('calculates certificate tiers and stats accurately', () => {
      const habit: Habit = {
        id: 'test-h1',
        title: 'Глубокий фокус',
        streak: 35,
        bestStreak: 42,
        completedToday: true,
        history: ['2026-10-01', '2026-10-02', '2026-10-03'],
        frozenDates: ['2026-10-04'],
        category: 'Работа',
        createdAt: '2026-09-01T00:00:00.000Z',
      };

      const certSassy = calculateCertificateData(habit, 'sassy');
      expect(certSassy.streak).toBe(35);
      expect(certSassy.bestStreak).toBe(42);
      expect(certSassy.totalCheckins).toBe(3);
      expect(certSassy.freezesUsed).toBe(1);
      expect(certSassy.tierName).toBe('Непоколебимый Чемпион');
      expect(certSassy.tierBadge).toBe('🥇');
      expect(certSassy.punchline).toContain('Прокрастинация рыдает');

      const certIronic = calculateCertificateData(habit, 'ironic');
      expect(certIronic.punchline).toContain('Юридически заверенная победа');

      const certNeutral = calculateCertificateData(habit, 'neutral');
      expect(certNeutral.punchline).toContain('Официальное признание');
    });

    it('sets Vaporwave theme and verifies theme store state', () => {
      const store = useTrackerStore.getState();
      store.setTheme('vaporwave');
      expect(useTrackerStore.getState().theme).toBe('vaporwave');
    });

    it('contains vaporwave, kanban_move and certificate in Web Audio FX catalog', () => {
      const vaporwavePreset = SOUND_FX_CATALOG.find((p) => p.id === 'vaporwave');
      expect(vaporwavePreset).toBeDefined();
      expect(vaporwavePreset?.icon).toBe('🌴');

      const kanbanPreset = SOUND_FX_CATALOG.find((p) => p.id === 'kanban_move');
      expect(kanbanPreset).toBeDefined();
      expect(kanbanPreset?.icon).toBe('📋');

      const certPreset = SOUND_FX_CATALOG.find((p) => p.id === 'certificate');
      expect(certPreset).toBeDefined();
      expect(certPreset?.icon).toBe('📜');

      // Functions execute safely without throwing
      expect(() => playVaporwaveSound()).not.toThrow();
      expect(() => playKanbanMoveSound()).not.toThrow();
      expect(() => playCertificateSound()).not.toThrow();
    });
  });

  describe('Sprint 4: Tauri 2.0 SQLite v11 Schema Integration', () => {
    it('validates SQLite schema version 11 in database stats', async () => {
      const stats = await getDatabaseStats();
      expect(stats).not.toBeNull();
      expect(stats?.version).toBe(11);
    });

    it('validates SQLite schema version 11 in system metrics', async () => {
      const metrics = await getSystemMetrics();
      expect(metrics).not.toBeNull();
      expect(metrics?.sqlite_version).toBeGreaterThanOrEqual(11);
    });

    it('retrieves SQLite version 11 via bridge helper', async () => {
      const version = await getSqliteVersion();
      expect(version).toBeGreaterThanOrEqual(11);
    });
  });
});
