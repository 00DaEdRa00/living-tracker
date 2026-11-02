import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTrackerStore } from '../store/useTrackerStore';
import { getStreakBadge } from '../components/HabitsSection';
import {
  playStreakMilestoneSound,
  playSnoozeSound,
  playTaskCompleteSound,
  playStreakFreezeSound,
} from '../lib/soundFx';
import { sendDesktopNotification } from '../lib/tauriBridge';

describe('Sprints 2-4 Full Comprehensive Suite', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  describe('Sprint 2: Habits Streaks, Milestones & Freeze', () => {
    it('calculates correct streak milestone badges', () => {
      expect(getStreakBadge(3)).toBeNull();
      expect(getStreakBadge(6)).toBeNull();

      const badge7 = getStreakBadge(7);
      expect(badge7).not.toBeNull();
      expect(badge7?.label).toContain('7 дн');

      const badge14 = getStreakBadge(14);
      expect(badge14).not.toBeNull();
      expect(badge14?.label).toContain('14 дн');

      const badge21 = getStreakBadge(21);
      expect(badge21).not.toBeNull();
      expect(badge21?.label).toContain('21 дн');

      const badge30 = getStreakBadge(35);
      expect(badge30).not.toBeNull();
      expect(badge30?.label).toContain('30+ дн');
    });

    it('freezes a habit and protects the streak without incrementing it', () => {
      const store = useTrackerStore.getState();
      const habit = store.habits[0];
      const initialStreak = habit.streak;

      const frozen = store.freezeHabit(habit.id);
      expect(frozen).toBe(true);

      const updated = useTrackerStore.getState().habits.find((h) => h.id === habit.id);
      const today = new Date().toISOString().split('T')[0];
      expect(updated?.frozenDates).toContain(today);
      expect(updated?.streak).toBe(initialStreak);
    });
  });

  describe('Sprint 2: Tasks, Priorities & Life Spheres', () => {
    it('creates and manages tasks across life spheres and priorities', () => {
      const store = useTrackerStore.getState();

      store.addTask({
        title: 'Запустить рекламную кампанию',
        category: 'Работа',
        priority: 'high',
        icon: '💼',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const added = useTrackerStore.getState().tasks.find((t) => t.title === 'Запустить рекламную кампанию');
      expect(added).toBeDefined();
      expect(added?.priority).toBe('high');
      expect(added?.category).toBe('Работа');
      expect(added?.completed).toBe(false);

      // Toggle completion
      if (added) {
        store.toggleTask(added.id);
        const toggled = useTrackerStore.getState().tasks.find((t) => t.id === added.id);
        expect(toggled?.completed).toBe(true);
      }
    });

    it('manages subtasks within a task checklist', () => {
      const store = useTrackerStore.getState();
      store.addTask({
        id: 'task-subtask-test',
        title: 'Тестовая задача с чек-листом',
        category: 'Работа',
      });

      store.addSubtask('task-subtask-test', 'Составить смету');
      let updated = useTrackerStore.getState().tasks.find((t) => t.id === 'task-subtask-test');
      expect(updated?.checklist?.length).toBe(1);
      expect(updated?.checklist?.[0].title).toBe('Составить смету');
      expect(updated?.checklist?.[0].completed).toBe(false);

      const subId = updated?.checklist?.[0].id!;
      store.toggleSubtask('task-subtask-test', subId);
      updated = useTrackerStore.getState().tasks.find((t) => t.id === 'task-subtask-test');
      expect(updated?.checklist?.[0].completed).toBe(true);

      store.removeSubtask('task-subtask-test', subId);
      updated = useTrackerStore.getState().tasks.find((t) => t.id === 'task-subtask-test');
      expect(updated?.checklist?.length).toBe(0);
    });
  });

  describe('Sprint 3: Procedural Web Audio FX & Themes', () => {
    it('switches between 5 visual themes including the new Nordic theme', () => {
      const store = useTrackerStore.getState();
      expect(store.theme).toBe('amoled');

      store.setTheme('nord');
      expect(useTrackerStore.getState().theme).toBe('nord');

      store.setTheme('synthwave');
      expect(useTrackerStore.getState().theme).toBe('synthwave');

      store.setTheme('cyberpunk');
      expect(useTrackerStore.getState().theme).toBe('cyberpunk');

      store.setTheme('emerald');
      expect(useTrackerStore.getState().theme).toBe('emerald');
    });

    it('synthesizes procedural Web Audio FX without crashing', () => {
      // Mock AudioContext
      class MockOscillator {
        type = 'sine';
        frequency = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
        connect = vi.fn();
        start = vi.fn();
        stop = vi.fn();
      }
      class MockGain {
        gain = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
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

      expect(() => playStreakMilestoneSound()).not.toThrow();
      expect(() => playSnoozeSound()).not.toThrow();
      expect(() => playTaskCompleteSound()).not.toThrow();
      expect(() => playStreakFreezeSound()).not.toThrow();
    });
  });

  describe('Sprint 4: Desktop Tauri Integration & Notification Bridge', () => {
    it('handles sendDesktopNotification gracefully in browser environment', async () => {
      // Should not throw even when running outside Tauri or without notification permission
      await expect(sendDesktopNotification('Test Notification', 'Body message')).resolves.not.toThrow();
    });
  });
});
