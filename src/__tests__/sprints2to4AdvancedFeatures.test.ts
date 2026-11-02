import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTrackerStore } from '../store/useTrackerStore';
import {
  calculateLifeBalanceScore,
  classifyEisenhower,
} from '../components/TasksSection';
import {
  getNextMilestone,
  get30DayRate,
} from '../components/HabitsSection';
import {
  playThemeSwitchSound,
  playShieldSound,
} from '../lib/soundFx';
import {
  getDatabaseStats,
  registerGlobalShortcut,
} from '../lib/tauriBridge';

describe('Sprints 2-4 Advanced Features Suite', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  describe('Sprint 2: Emergency Freeze All & Consistency Rate', () => {
    it('freezes all uncompleted and unfrozen habits for today in batch', () => {
      const store = useTrackerStore.getState();
      const initialHabits = store.habits;
      expect(initialHabits.length).toBeGreaterThan(0);

      // Run batch freeze
      const count = store.freezeAllHabitsToday();
      expect(count).toBe(initialHabits.length);

      const today = new Date().toISOString().split('T')[0];
      const updated = useTrackerStore.getState().habits;
      updated.forEach((h) => {
        expect(h.frozenDates).toContain(today);
      });

      // Subsequent freeze today returns 0 since all are already frozen
      const secondCall = store.freezeAllHabitsToday();
      expect(secondCall).toBe(0);
    });

    it('calculates next streak milestone target and remaining days', () => {
      const m0 = getNextMilestone(0);
      expect(m0.target).toBe(7);
      expect(m0.remaining).toBe(7);

      const m5 = getNextMilestone(5);
      expect(m5.target).toBe(7);
      expect(m5.remaining).toBe(2);

      const m8 = getNextMilestone(8);
      expect(m8.target).toBe(14);
      expect(m8.remaining).toBe(6);

      const m15 = getNextMilestone(15);
      expect(m15.target).toBe(21);
      expect(m15.remaining).toBe(6);

      const m22 = getNextMilestone(22);
      expect(m22.target).toBe(30);
      expect(m22.remaining).toBe(8);

      const m35 = getNextMilestone(35);
      expect(m35.target).toBe(50);
      expect(m35.remaining).toBe(15);
    });

    it('calculates 30-day consistency percentage accurately', () => {
      const now = new Date();
      const dates: string[] = [];
      // Generate 15 dates in the past 15 days
      for (let i = 0; i < 15; i++) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dates.push(d);
      }

      const rate = get30DayRate(dates);
      expect(rate.count).toBe(15);
      expect(rate.ratePercent).toBe(50); // 15 / 30 = 50%
    });
  });

  describe('Sprint 2: Life Balance Radar & Eisenhower Matrix', () => {
    it('calculates life balance score based on sphere distribution', () => {
      const store = useTrackerStore.getState();
      const emptyBalance = calculateLifeBalanceScore([]);
      expect(emptyBalance.score).toBe(100);

      const tasks = [
        { id: '1', title: 'Спорт', category: 'Здоровье', completed: false, createdAt: '' },
        { id: '2', title: 'Код', category: 'Работа', completed: false, createdAt: '' },
        { id: '3', title: 'Бюджет', category: 'Финансы', completed: false, createdAt: '' },
      ];

      const balance = calculateLifeBalanceScore(tasks);
      // 3 of 6 spheres active = 50%
      expect(balance.score).toBe(50);
      expect(balance.counts['Здоровье']).toBe(1);
      expect(balance.counts['Работа']).toBe(1);
      expect(balance.counts['Финансы']).toBe(1);
      expect(balance.counts['Хобби']).toBe(0);
    });

    it('classifies tasks into 4 Eisenhower Matrix quadrants', () => {
      const now = new Date();

      // Q1: High priority + due in 12h (urgent)
      const q1Task = {
        id: 'q1',
        title: 'Сервер упал',
        completed: false,
        priority: 'high' as const,
        dueDate: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
        createdAt: '',
      };
      expect(classifyEisenhower(q1Task, now)).toBe('q1');

      // Q2: High priority + due in 5 days (not urgent)
      const q2Task = {
        id: 'q2',
        title: 'Стратегия на год',
        completed: false,
        priority: 'high' as const,
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: '',
      };
      expect(classifyEisenhower(q2Task, now)).toBe('q2');

      // Q3: Low/medium priority + due in 6 hours (urgent)
      const q3Task = {
        id: 'q3',
        title: 'Купить хлеб',
        completed: false,
        priority: 'low' as const,
        dueDate: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        createdAt: '',
      };
      expect(classifyEisenhower(q3Task, now)).toBe('q3');

      // Q4: Low/medium priority + no due date or far date
      const q4Task = {
        id: 'q4',
        title: 'Посмотреть фильм',
        completed: false,
        priority: 'low' as const,
        createdAt: '',
      };
      expect(classifyEisenhower(q4Task, now)).toBe('q4');
    });
  });

  describe('Sprint 3: Dracula Theme & Procedural Sound FX', () => {
    it('supports Dracula theme in store and switching', () => {
      const store = useTrackerStore.getState();
      store.setTheme('dracula');
      expect(useTrackerStore.getState().theme).toBe('dracula');
    });

    it('synthesizes playThemeSwitchSound and playShieldSound safely', () => {
      class MockOscillator {
        type = 'sine';
        frequency = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
        connect = vi.fn();
        start = vi.fn();
        stop = vi.fn();
      }
      class MockGain {
        gain = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
        connect = vi.fn();
      }
      class MockAudioCtx {
        state = 'running';
        currentTime = 0;
        destination = {};
        createOscillator() { return new MockOscillator(); }
        createGain() { return new MockGain(); }
        resume = vi.fn().mockResolvedValue(undefined);
      }

      (globalThis as any).AudioContext = MockAudioCtx;

      expect(() => playThemeSwitchSound()).not.toThrow();
      expect(() => playShieldSound()).not.toThrow();
    });
  });

  describe('Sprint 4: Desktop Tauri 2.0 Bridge & Database Stats', () => {
    it('returns database stats fallback in web environment', async () => {
      const stats = await getDatabaseStats();
      expect(stats).not.toBeNull();
      expect(stats?.version).toBeGreaterThanOrEqual(4);
      expect(stats?.storage).toBe('localStorage');
    });

    it('handles global shortcut registration gracefully in web', async () => {
      const registered = await registerGlobalShortcut('CommandOrControl+Shift+Space');
      expect(registered).toBe(true);
    });
  });
});
