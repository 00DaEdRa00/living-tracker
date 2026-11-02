import { describe, it, expect, beforeEach } from 'vitest';
import { useTrackerStore } from '../store/useTrackerStore';
import { getDailyPunchline } from '../components/DailySummaryShareModal';
import { getWeeklyProgress } from '../components/HabitsSection';
import {
  playSummaryFanfareSound,
  playUploadSound,
  playQuickDateSound,
  playLevelUpSound,
  playRecurrenceSound,
  playVictoryTrumpetSound,
  playTimerCompleteSound,
  SOUND_FX_CATALOG,
} from '../lib/soundFx';
import {
  isTauri,
  getDatabaseStats,
  optimizeDatabase,
  getSystemTrayStatus,
} from '../lib/tauriBridge';

describe('Sprint 2-4 Advanced Enhancements Suite', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  describe('Sprint 3: Theme System & Tokyo Night', () => {
    it('supports tokyo theme in TrackerStore and applies properly', () => {
      const store = useTrackerStore.getState();
      store.setTheme('tokyo');
      expect(useTrackerStore.getState().theme).toBe('tokyo');
    });

    it('cycles through all supported themes including tokyo, dracula and crimson', () => {
      const store = useTrackerStore.getState();
      const themes = ['amoled', 'cyberpunk', 'emerald', 'synthwave', 'nord', 'dracula', 'tokyo', 'crimson'] as const;
      
      themes.forEach((theme) => {
        store.setTheme(theme);
        expect(useTrackerStore.getState().theme).toBe(theme);
      });
    });
  });

  describe('Sprint 3: Web Audio FX Engine', () => {
    it('safely invokes summary fanfare and procedural sound effects without crashing in Node/browser environments', () => {
      expect(() => playSummaryFanfareSound()).not.toThrow();
      expect(() => playUploadSound()).not.toThrow();
      expect(() => playQuickDateSound()).not.toThrow();
      expect(() => playLevelUpSound()).not.toThrow();
    });
  });

  describe('Sprint 3: Daily Summary Share Card & Multi-Tier Punchlines', () => {
    it('generates appropriate daily summary punchlines for neutral tone', () => {
      const statsComplete = {
        completedTasks: 5,
        pendingTasks: 0,
        completedHabits: 3,
        totalHabits: 3,
        spentToday: 500,
        monthlyBudget: 30000,
      };

      const line = getDailyPunchline(statsComplete, 'neutral');
      expect(line).toContain('Идеальный день');

      const statsPartial = {
        completedTasks: 2,
        pendingTasks: 3,
        completedHabits: 1,
        totalHabits: 3,
        spentToday: 1200,
        monthlyBudget: 30000,
      };

      const linePartial = getDailyPunchline(statsPartial, 'neutral');
      expect(linePartial).toContain('прогресс');
    });

    it('generates humorous and witty punchlines for ironic tone', () => {
      const statsComplete = {
        completedTasks: 4,
        pendingTasks: 0,
        completedHabits: 2,
        totalHabits: 2,
        spentToday: 0,
        monthlyBudget: 25000,
      };

      const lineIronic = getDailyPunchline(statsComplete, 'ironic');
      expect(lineIronic).toContain('прокрастинатор');
    });

    it('generates high-energy and spicy punchlines for sassy tone', () => {
      const statsComplete = {
        completedTasks: 5,
        pendingTasks: 0,
        completedHabits: 4,
        totalHabits: 4,
        spentToday: 0,
        monthlyBudget: 30000,
      };

      const lineSassy = getDailyPunchline(statsComplete, 'sassy');
      expect(lineSassy).toContain('Абсолютный разнос');
    });
  });

  describe('Sprint 4: Tauri 2.0 Desktop Bridge & SQLite v6', () => {
    it('returns SQLite schema version 6 in database stats', async () => {
      const stats = await getDatabaseStats();
      expect(stats).not.toBeNull();
      expect(stats?.version).toBe(6);
    });

    it('provides database optimization command with safe fallback', async () => {
      const result = await optimizeDatabase();
      expect(result).not.toBeNull();
      expect(result?.status).toBeDefined();
    });

    it('provides system tray status information with registered shortcuts', async () => {
      const tray = await getSystemTrayStatus();
      expect(tray).not.toBeNull();
      expect(tray?.tray_enabled).toBe(true);
      expect(tray?.menu_items).toContain('open_main');
      expect(tray?.menu_items).toContain('toggle_hud');
      expect(tray?.hotkey).toBe('Ctrl+Space');
    });
  });

  describe('Sprint 2: Habits Frozen Status & Streak Protection', () => {
    it('supports freeze toggle and records frozen date', () => {
      const store = useTrackerStore.getState();
      store.addHabit({
        title: 'Утренняя пробежка',
        category: 'Здоровье/Спорт',
      });

      const habit = useTrackerStore.getState().habits[0];
      expect(habit).toBeDefined();

      const success = store.freezeHabit(habit.id);
      expect(success).toBe(true);

      const updated = useTrackerStore.getState().habits[0];
      const today = new Date().toISOString().split('T')[0];
      expect(updated.frozenDates).toContain(today);
    });

    it('calculates weekly habit progress accurately', () => {
      const today = new Date().toISOString().split('T')[0];
      const history = [today];
      const result = getWeeklyProgress(history);
      expect(result.count).toBe(1);
      expect(result.ratePercent).toBeGreaterThanOrEqual(14);
    });
  });

  describe('Sprint 2: Recurring Tasks & Time Estimation', () => {
    it('advances a daily recurring task and resets its checklist', () => {
      const store = useTrackerStore.getState();
      store.addTask({
        title: 'Ежедневный стендап',
        category: 'Работа',
        recurrence: 'daily',
        estimatedMinutes: 25,
        dueDate: '2026-11-01T10:00:00.000Z',
      });

      const task = useTrackerStore.getState().tasks[0];
      expect(task).toBeDefined();
      expect(task.recurrence).toBe('daily');
      expect(task.estimatedMinutes).toBe(25);

      store.advanceRecurringTask(task.id);

      const updatedTask = useTrackerStore.getState().tasks[0];
      expect(updatedTask.completed).toBe(false);
      expect(updatedTask.dueDate).toBeDefined();
    });
  });

  describe('Sprint 3: Web Audio FX Procedural Catalog', () => {
    it('provides sound preset catalog with interactive previews', () => {
      expect(SOUND_FX_CATALOG.length).toBeGreaterThanOrEqual(10);
      const keys = SOUND_FX_CATALOG.map((s) => s.id);
      expect(keys).toContain('coin');
      expect(keys).toContain('habit');
      expect(keys).toContain('task');
      expect(keys).toContain('recurrence');
      expect(keys).toContain('milestone');
    });

    it('executes procedural sound generators safely without audio context crash', () => {
      expect(() => playRecurrenceSound()).not.toThrow();
      expect(() => playVictoryTrumpetSound()).not.toThrow();
      expect(() => playTimerCompleteSound()).not.toThrow();
    });
  });
});
