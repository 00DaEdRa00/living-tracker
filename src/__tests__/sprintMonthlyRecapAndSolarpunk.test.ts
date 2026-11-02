import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMonthlyRecapStats,
  getMonthlyRecapPunchline,
} from '../components/MonthlyRecapShareModal';
import { getHeatmapDays } from '../components/HabitsSection';
import { useTrackerStore } from '../store/useTrackerStore';
import {
  SOUND_FX_CATALOG,
  playSolarSound,
  playFocusLogSound,
  playMilestoneCheerSound,
} from '../lib/soundFx';
import { getDatabaseStats, getSystemMetrics, getSqliteVersion } from '../lib/tauriBridge';
import type { Task, Habit, Budget } from '../types/tracker';

describe('Sprint 2-4: Monthly Recap Share, Solarpunk Theme, Task Focus & SQLite v10', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  describe('Sprint 2: Monthly Recap Stats & Stability Math', () => {
    it('calculates monthly stats with 30-day task completion and habit consistency', () => {
      const now = new Date();
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(now.getDate() - 10);

      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(now.getDate() - 40);

      const tasks: Task[] = [
        {
          id: 't1',
          title: 'Recent Completed Task',
          completed: true,
          completedAt: tenDaysAgo.toISOString(),
          category: 'Работа',
          createdAt: tenDaysAgo.toISOString(),
        },
        {
          id: 't2',
          title: 'Old Completed Task',
          completed: true,
          completedAt: fortyDaysAgo.toISOString(),
          category: 'Работа',
          createdAt: fortyDaysAgo.toISOString(),
        },
        {
          id: 't3',
          title: 'Pending Task',
          completed: false,
          category: 'Здоровье/Спорт',
          createdAt: now.toISOString(),
        },
      ];

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];

      const habits: Habit[] = [
        {
          id: 'h1',
          title: 'Morning Yoga',
          streak: 14,
          completedToday: true,
          history: [todayStr, yesterdayStr],
          category: 'Здоровье/Спорт',
          createdAt: now.toISOString(),
        },
        {
          id: 'h2',
          title: 'Read Books',
          streak: 5,
          completedToday: false,
          history: [yesterdayStr],
          category: 'Саморазвитие',
          createdAt: now.toISOString(),
        },
      ];

      const budget: Budget = {
        monthlyLimit: 60000,
        spent: 18500,
      };

      const stats = calculateMonthlyRecapStats(tasks, habits, budget, 120, 2);

      expect(stats.completedTasksThisMonth).toBe(1);
      expect(stats.totalTasks).toBe(3);
      expect(stats.longestStreak).toBe(14);
      expect(stats.focusMinutes).toBe(120);
      expect(stats.monthlySpent).toBe(18500);
      expect(stats.freezeShieldsRemaining).toBe(2);
      expect(stats.overallScore).toBeGreaterThanOrEqual(15);
      expect(stats.overallScore).toBeLessThanOrEqual(100);
      expect(stats.sphereBreakdown['Здоровье']).toBeGreaterThanOrEqual(14);
      expect(stats.sphereBreakdown['Работа']).toBeGreaterThanOrEqual(1);
    });

    it('generates tone-adapted punchlines in all 3 modes', () => {
      const highStats = {
        completedTasksThisMonth: 15,
        totalTasks: 20,
        habitConsistencyRate: 90,
        longestStreak: 25,
        focusMinutes: 1800,
        monthlySpent: 20000,
        monthlyBudgetLimit: 50000,
        freezeShieldsRemaining: 3,
        overallScore: 88,
        sphereBreakdown: {},
      };

      const midStats = { ...highStats, overallScore: 65 };
      const lowStats = { ...highStats, overallScore: 30 };

      // Sassy
      expect(getMonthlyRecapPunchline(highStats, 'sassy')).toContain('Месяц разорван в клочья');
      expect(getMonthlyRecapPunchline(midStats, 'sassy')).toContain('Добротный месячный марафон');
      expect(getMonthlyRecapPunchline(lowStats, 'sassy')).toContain('Месяц на чилле');

      // Ironic
      expect(getMonthlyRecapPunchline(highStats, 'ironic')).toContain('таск-трекера');
      expect(getMonthlyRecapPunchline(midStats, 'ironic')).toContain('балансе');
      expect(getMonthlyRecapPunchline(lowStats, 'ironic')).toContain('созерцания');

      // Neutral
      expect(getMonthlyRecapPunchline(highStats, 'neutral')).toContain('Превосходные');
      expect(getMonthlyRecapPunchline(midStats, 'neutral')).toContain('Уверенное');
      expect(getMonthlyRecapPunchline(lowStats, 'neutral')).toContain('Месячный цикл');
    });

    it('generates 140-day heatmap window correctly', () => {
      const days = getHeatmapDays(140);
      expect(days).toHaveLength(140);
      const today = new Date().toISOString().split('T')[0];
      expect(days[days.length - 1]).toBe(today);
    });

    it('tracks spentMinutes on tasks and logs focus time', () => {
      const store = useTrackerStore.getState();
      store.addTask({
        id: 'test-task-focus',
        title: 'Deep Coding Session',
        estimatedMinutes: 60,
        priority: 'high',
      });

      expect(useTrackerStore.getState().tasks.find((t) => t.id === 'test-task-focus')?.spentMinutes).toBeUndefined();

      store.logTaskFocusTime('test-task-focus', 25);

      const task = useTrackerStore.getState().tasks.find((t) => t.id === 'test-task-focus');
      expect(task?.spentMinutes).toBe(25);
      expect(useTrackerStore.getState().focusMinutesSpent).toBe(25);

      // Record another Pomodoro session
      store.recordFocusSession(25, 'test-task-focus');
      const updatedTask = useTrackerStore.getState().tasks.find((t) => t.id === 'test-task-focus');
      expect(updatedTask?.spentMinutes).toBe(50);
      expect(useTrackerStore.getState().focusMinutesSpent).toBe(50);
    });
  });

  describe('Sprint 3: Solarpunk Theme & Web Audio FX', () => {
    it('sets Solarpunk theme and verifies theme store state', () => {
      const store = useTrackerStore.getState();
      store.setTheme('solarpunk');
      expect(useTrackerStore.getState().theme).toBe('solarpunk');
    });

    it('contains solarpunk, focus_log and milestone_cheer in Web Audio FX catalog', () => {
      const solarPreset = SOUND_FX_CATALOG.find((p) => p.id === 'solarpunk');
      expect(solarPreset).toBeDefined();
      expect(solarPreset?.icon).toBe('☀️');

      const focusPreset = SOUND_FX_CATALOG.find((p) => p.id === 'focus_log');
      expect(focusPreset).toBeDefined();

      const milestoneCheerPreset = SOUND_FX_CATALOG.find((p) => p.id === 'milestone_cheer');
      expect(milestoneCheerPreset).toBeDefined();

      // Sound functions execute without exceptions
      expect(() => playSolarSound()).not.toThrow();
      expect(() => playFocusLogSound()).not.toThrow();
      expect(() => playMilestoneCheerSound()).not.toThrow();
    });
  });

  describe('Sprint 4: Tauri 2.0 SQLite v10 Schema Integration', () => {
    it('validates SQLite schema version 10 in database stats', async () => {
      const stats = await getDatabaseStats();
      expect(stats).not.toBeNull();
      expect(stats?.version).toBe(10);
    });

    it('validates SQLite schema version 10 in system metrics', async () => {
      const metrics = await getSystemMetrics();
      expect(metrics).not.toBeNull();
      expect(metrics?.sqlite_version).toBe(10);
    });

    it('retrieves SQLite version 10 via bridge helper', async () => {
      const version = await getSqliteVersion();
      expect(version).toBe(10);
    });
  });
});
