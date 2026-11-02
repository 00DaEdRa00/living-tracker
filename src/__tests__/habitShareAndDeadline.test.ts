import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTrackerStore } from '../store/useTrackerStore';
import { getHabitStreakPunchline } from '../components/HabitShareModal';
import { matchesDeadlineFilter } from '../components/TasksSection';
import { playShareSound } from '../lib/soundFx';
import type { Habit, Task } from '../types/tracker';

describe('Habit Streak Share Modal and Tasks Deadline Filter', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  describe('getHabitStreakPunchline', () => {
    const createHabit = (streak: number): Habit => ({
      id: 'h-1',
      title: 'Утренняя зарядка',
      streak,
      bestStreak: streak,
      completedToday: true,
      category: 'Здоровье/Спорт',
      icon: '🏋️',
      history: [],
      frozenDates: [],
      createdAt: '2026-11-01T00:00:00Z',
    });

    it('generates sassy tone punchlines for various streak tiers', () => {
      expect(getHabitStreakPunchline(createHabit(35), 'sassy')).toContain('30+');
      expect(getHabitStreakPunchline(createHabit(14), 'sassy')).toContain('режиме зверя');
      expect(getHabitStreakPunchline(createHabit(7), 'sassy')).toContain('Недельный стрик');
      expect(getHabitStreakPunchline(createHabit(4), 'sassy')).toContain('Разогрев закончен');
      expect(getHabitStreakPunchline(createHabit(1), 'sassy')).toContain('День первый');
      expect(getHabitStreakPunchline(createHabit(0), 'sassy')).toContain('перезапущен');
    });

    it('generates ironic tone punchlines for various streak tiers', () => {
      expect(getHabitStreakPunchline(createHabit(30), 'ironic')).toContain('Месяц дисциплины');
      expect(getHabitStreakPunchline(createHabit(15), 'ironic')).toContain('секту');
      expect(getHabitStreakPunchline(createHabit(8), 'ironic')).toContain('прокрастинатор');
      expect(getHabitStreakPunchline(createHabit(3), 'ironic')).toContain('Наука бессильна');
      expect(getHabitStreakPunchline(createHabit(1), 'ironic')).toContain('меняется судьба');
      expect(getHabitStreakPunchline(createHabit(0), 'ironic')).toContain('Тактическое отступление');
    });

    it('generates neutral tone punchlines for various streak tiers', () => {
      expect(getHabitStreakPunchline(createHabit(30), 'neutral')).toContain('30+');
      expect(getHabitStreakPunchline(createHabit(14), 'neutral')).toContain('Две недели');
      expect(getHabitStreakPunchline(createHabit(7), 'neutral')).toContain('7 дней');
      expect(getHabitStreakPunchline(createHabit(3), 'neutral')).toContain('3 дня');
      expect(getHabitStreakPunchline(createHabit(1), 'neutral')).toContain('Первый шаг');
      expect(getHabitStreakPunchline(createHabit(0), 'neutral')).toContain('Новый старт');
    });
  });

  describe('matchesDeadlineFilter', () => {
    const fixedNow = new Date('2026-11-02T12:00:00.000Z');

    it('matches "all" filter for any task', () => {
      const taskWithDue: Task = {
        id: 't-1',
        title: 'Task 1',
        completed: false,
        priority: 'medium',
        dueDate: '2026-11-02T15:00:00.000Z',
        createdAt: '2026-11-01T00:00:00.000Z',
      };
      const taskNoDue: Task = {
        id: 't-2',
        title: 'Task 2',
        completed: false,
        priority: 'low',
        createdAt: '2026-11-01T00:00:00.000Z',
      };

      expect(matchesDeadlineFilter(taskWithDue, 'all', fixedNow)).toBe(true);
      expect(matchesDeadlineFilter(taskNoDue, 'all', fixedNow)).toBe(true);
    });

    it('matches "nodate" filter only when dueDate is absent', () => {
      const taskWithDue: Task = {
        id: 't-1',
        title: 'Task 1',
        completed: false,
        priority: 'medium',
        dueDate: '2026-11-02T15:00:00.000Z',
        createdAt: '2026-11-01T00:00:00.000Z',
      };
      const taskNoDue: Task = {
        id: 't-2',
        title: 'Task 2',
        completed: false,
        priority: 'low',
        createdAt: '2026-11-01T00:00:00.000Z',
      };

      expect(matchesDeadlineFilter(taskWithDue, 'nodate', fixedNow)).toBe(false);
      expect(matchesDeadlineFilter(taskNoDue, 'nodate', fixedNow)).toBe(true);
    });

    it('matches "burning" when overdue or due in less than 12 hours', () => {
      const overdueTask: Task = {
        id: 't-overdue',
        title: 'Overdue',
        completed: false,
        priority: 'high',
        dueDate: '2026-11-02T10:00:00.000Z', // 2 hours in the past
        createdAt: '2026-11-01T00:00:00.000Z',
      };
      const burningSoonTask: Task = {
        id: 't-burning',
        title: 'Burning Soon',
        completed: false,
        priority: 'high',
        dueDate: '2026-11-02T18:00:00.000Z', // 6 hours in the future (< 12h)
        createdAt: '2026-11-01T00:00:00.000Z',
      };
      const safeTask: Task = {
        id: 't-safe',
        title: 'Safe Task',
        completed: false,
        priority: 'low',
        dueDate: '2026-11-04T12:00:00.000Z', // 48 hours in the future
        createdAt: '2026-11-01T00:00:00.000Z',
      };

      expect(matchesDeadlineFilter(overdueTask, 'burning', fixedNow)).toBe(true);
      expect(matchesDeadlineFilter(burningSoonTask, 'burning', fixedNow)).toBe(true);
      expect(matchesDeadlineFilter(safeTask, 'burning', fixedNow)).toBe(false);
    });

    it('matches "today" when dueDate matches current calendar date', () => {
      const todayTask: Task = {
        id: 't-today',
        title: 'Today Task',
        completed: false,
        priority: 'medium',
        dueDate: '2026-11-02T22:00:00.000Z',
        createdAt: '2026-11-01T00:00:00.000Z',
      };
      const tomorrowTask: Task = {
        id: 't-tomorrow',
        title: 'Tomorrow Task',
        completed: false,
        priority: 'medium',
        dueDate: '2026-11-03T10:00:00.000Z',
        createdAt: '2026-11-01T00:00:00.000Z',
      };

      expect(matchesDeadlineFilter(todayTask, 'today', fixedNow)).toBe(true);
      expect(matchesDeadlineFilter(tomorrowTask, 'today', fixedNow)).toBe(false);
    });

    it('matches "week" when dueDate is within next 7 days', () => {
      const inFourDays: Task = {
        id: 't-week',
        title: 'Within Week',
        completed: false,
        priority: 'medium',
        dueDate: '2026-11-06T12:00:00.000Z',
        createdAt: '2026-11-01T00:00:00.000Z',
      };
      const inTenDays: Task = {
        id: 't-later',
        title: 'Later',
        completed: false,
        priority: 'low',
        dueDate: '2026-11-12T12:00:00.000Z',
        createdAt: '2026-11-01T00:00:00.000Z',
      };

      expect(matchesDeadlineFilter(inFourDays, 'week', fixedNow)).toBe(true);
      expect(matchesDeadlineFilter(inTenDays, 'week', fixedNow)).toBe(false);
    });
  });

  describe('updateTask and updateHabit in Zustand Store', () => {
    it('updates task properties like dueDate and priority dynamically', () => {
      const store = useTrackerStore.getState();
      store.addTask({
        title: 'Подготовить релиз',
        priority: 'medium',
        dueDate: '2026-11-02T20:00:00Z',
      });

      const task = useTrackerStore.getState().tasks.find((t) => t.title === 'Подготовить релиз')!;
      expect(task).toBeDefined();
      expect(task.priority).toBe('medium');

      store.updateTask(task.id, {
        priority: 'high',
        dueDate: '2026-11-03T20:00:00Z',
      });

      const updated = useTrackerStore.getState().tasks.find((t) => t.id === task.id)!;
      expect(updated.priority).toBe('high');
      expect(updated.dueDate).toBe('2026-11-03T20:00:00Z');
    });

    it('updates habit properties like title and category dynamically', () => {
      const store = useTrackerStore.getState();
      store.addHabit({
        title: 'Пить воду',
        category: 'Быт',
        icon: '💧',
        frozenDates: [],
      });

      const habit = useTrackerStore.getState().habits.find((h) => h.title === 'Пить воду')!;
      expect(habit).toBeDefined();
      expect(habit.title).toBe('Пить воду');

      store.updateHabit(habit.id, {
        title: 'Пить 2л чистой воды',
        category: 'Здоровье/Спорт',
      });

      const updated = useTrackerStore.getState().habits.find((h) => h.id === habit.id)!;
      expect(updated.title).toBe('Пить 2л чистой воды');
      expect(updated.category).toBe('Здоровье/Спорт');
    });
  });

  describe('playShareSound', () => {
    it('executes safely without error', () => {
      expect(() => playShareSound()).not.toThrow();
    });
  });
});
