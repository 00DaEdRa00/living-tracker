import { describe, it, expect, beforeEach } from 'vitest';
import { calculateYearlyStats } from '../components/YearlyContributionShareModal';
import { classifyEisenhower } from '../components/TasksSection';
import { useTrackerStore } from '../store/useTrackerStore';
import {
  SOUND_FX_CATALOG,
  playNebulaSound,
  playCoffeeSound,
  playEisenhowerMoveSound,
  playAnnualReportFanfare,
} from '../lib/soundFx';
import { getSqliteVersion } from '../lib/tauriBridge';
import type { Task, Habit } from '../types/tracker';

describe('Sprint 2-4: 52-Week Contribution Matrix, Eisenhower Matrix, Themes Nebula/Coffee & SQLite v12', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  describe('Sprint 2: Yearly Contribution Heatmap & Eisenhower Matrix', () => {
    it('generates 52-week (364 days) contribution cells accurately', () => {
      const today = new Date().toISOString().split('T')[0];
      const habits: Habit[] = [
        {
          id: 'habit-1',
          title: 'Кодинг',
          streak: 15,
          bestStreak: 20,
          completedToday: true,
          history: [today, '2026-10-01', '2026-09-15'],
          createdAt: '2026-01-01',
        },
      ];
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: 'Зарелизить спринт',
          completed: true,
          completedAt: `${today}T12:00:00.000Z`,
          createdAt: '2026-10-20',
        },
      ];

      const stats = calculateYearlyStats(habits, tasks, 'sassy');
      expect(stats.gridCells.length).toBe(364);
      expect(stats.activeDays).toBeGreaterThanOrEqual(1);
      expect(stats.totalCheckins).toBeGreaterThanOrEqual(2);
      expect(stats.punchline).toBeDefined();

      const todayCell = stats.gridCells.find((c) => c.date === today);
      expect(todayCell).toBeDefined();
      expect(todayCell?.count).toBeGreaterThanOrEqual(2);
      expect(todayCell?.level).toBeGreaterThanOrEqual(2);
    });

    it('classifies tasks by manual quadrant override or urgency/importance heuristic', () => {
      const now = new Date('2026-11-02T12:00:00Z');

      const manualQ3Task: Task = {
        id: 't-manual-q3',
        title: 'Мелкий звонок',
        completed: false,
        eisenhowerQuadrant: 'q3_urgent_not_important',
        createdAt: '2026-11-01',
      };
      expect(classifyEisenhower(manualQ3Task, now)).toBe('q3');

      const urgentImportantTask: Task = {
        id: 't-urgent',
        title: 'Устранить критический баг',
        completed: false,
        priority: 'high',
        dueDate: '2026-11-03T10:00:00Z', // 22 hours away (<48h)
        createdAt: '2026-11-01',
      };
      expect(classifyEisenhower(urgentImportantTask, now)).toBe('q1');

      const backlogTask: Task = {
        id: 't-backlog',
        title: 'Почитать статью',
        completed: false,
        priority: 'low',
        createdAt: '2026-11-01',
      };
      expect(classifyEisenhower(backlogTask, now)).toBe('q4');
    });

    it('updates task quadrant and dependency via store actions', () => {
      const store = useTrackerStore.getState();
      store.addTask({
        id: 'task-lead',
        title: 'Дизайн архитектуры',
        priority: 'high',
      });
      store.addTask({
        id: 'task-dependent',
        title: 'Вёрстка компонентов',
        priority: 'medium',
      });

      store.setTaskDependency('task-dependent', 'task-lead');
      let depTask = useTrackerStore.getState().tasks.find((t) => t.id === 'task-dependent');
      expect(depTask?.dependsOnTaskId).toBe('task-lead');

      store.setTaskQuadrant('task-dependent', 'q2_not_urgent_important');
      depTask = useTrackerStore.getState().tasks.find((t) => t.id === 'task-dependent');
      expect(depTask?.eisenhowerQuadrant).toBe('q2_not_urgent_important');
    });
  });

  describe('Sprint 3: Web Audio FX & Themes (Nebula & Coffee)', () => {
    it('supports setting new themes nebula and coffee in store', () => {
      const store = useTrackerStore.getState();

      store.setTheme('nebula');
      expect(useTrackerStore.getState().theme).toBe('nebula');

      store.setTheme('coffee');
      expect(useTrackerStore.getState().theme).toBe('coffee');
    });

    it('registers new procedural sounds in catalog', () => {
      const nebula = SOUND_FX_CATALOG.find((s) => s.id === 'nebula');
      const coffee = SOUND_FX_CATALOG.find((s) => s.id === 'coffee');
      const eisenhower = SOUND_FX_CATALOG.find((s) => s.id === 'eisenhower_move');
      const annualReport = SOUND_FX_CATALOG.find((s) => s.id === 'annual_report');

      expect(nebula).toBeDefined();
      expect(coffee).toBeDefined();
      expect(eisenhower).toBeDefined();
      expect(annualReport).toBeDefined();

      // Sound functions execute safely without throwing
      expect(() => playNebulaSound()).not.toThrow();
      expect(() => playCoffeeSound()).not.toThrow();
      expect(() => playEisenhowerMoveSound()).not.toThrow();
      expect(() => playAnnualReportFanfare()).not.toThrow();
    });
  });

  describe('Sprint 4: Desktop Tauri SQLite v12', () => {
    it('reports SQLite version 12 in Tauri bridge', async () => {
      const version = await getSqliteVersion();
      expect(version).toBe(12);
    });
  });
});
