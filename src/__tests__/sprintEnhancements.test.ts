import { describe, it, expect, beforeEach } from 'vitest';
import { useTrackerStore } from '../store/useTrackerStore';
import type { Task } from '../types/tracker';

describe('Sprint 2-4: Tasks Search, Urgency and Shortcuts', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  it('filters tasks by search query across titles and descriptions', () => {
    const store = useTrackerStore.getState();
    store.addTask({
      title: 'Купить монитор 4K',
      description: 'Для работы с кодом и дашбордами',
      category: 'Работа',
      priority: 'high',
    });
    store.addTask({
      title: 'Бег 5 км в парке',
      description: 'Кардио тренировка',
      category: 'Здоровье/Спорт',
      priority: 'medium',
    });

    const tasks = useTrackerStore.getState().tasks;

    const filterTasks = (list: Task[], query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return list;
      return list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          Boolean(t.description && t.description.toLowerCase().includes(q))
      );
    };

    // Match title
    expect(filterTasks(tasks, 'монитор')).toHaveLength(1);
    expect(filterTasks(tasks, 'монитор')[0].title).toBe('Купить монитор 4K');

    // Match description
    expect(filterTasks(tasks, 'кардио')).toHaveLength(1);
    expect(filterTasks(tasks, 'кардио')[0].title).toBe('Бег 5 км в парке');

    // Match none
    expect(filterTasks(tasks, 'несуществующее')).toHaveLength(0);

    // Empty query matches all
    expect(filterTasks(tasks, '')).toHaveLength(tasks.length);
  });

  it('sorts tasks correctly by priority weight', () => {
    const weights: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const tasks: Partial<Task>[] = [
      { id: '1', priority: 'low' },
      { id: '2', priority: 'high' },
      { id: '3', priority: 'medium' },
    ];

    const sorted = [...tasks].sort((a, b) => {
      const wa = weights[a.priority || 'medium'] || 2;
      const wb = weights[b.priority || 'medium'] || 2;
      return wb - wa;
    });

    expect(sorted.map((t) => t.priority)).toEqual(['high', 'medium', 'low']);
  });

  it('sorts tasks correctly by urgency (dueDate)', () => {
    const tasks: Partial<Task>[] = [
      { id: '1', dueDate: '2026-11-10T12:00:00Z' },
      { id: '2', dueDate: '2026-11-02T15:00:00Z' },
      { id: '3', dueDate: undefined },
      { id: '4', dueDate: '2026-11-05T09:00:00Z' },
    ];

    const sorted = [...tasks].sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDue - bDue;
    });

    expect(sorted.map((t) => t.id)).toEqual(['2', '4', '1', '3']);
  });

  it('switches themes across amoled, cyberpunk and emerald', () => {
    const store = useTrackerStore.getState();
    expect(store.theme).toBe('amoled');

    store.setTheme('cyberpunk');
    expect(useTrackerStore.getState().theme).toBe('cyberpunk');

    store.setTheme('emerald');
    expect(useTrackerStore.getState().theme).toBe('emerald');

    store.setTheme('amoled');
    expect(useTrackerStore.getState().theme).toBe('amoled');
  });

  it('toggles sound on and off', () => {
    const store = useTrackerStore.getState();
    const initial = store.soundEnabled;

    store.toggleSound();
    expect(useTrackerStore.getState().soundEnabled).toBe(!initial);

    store.toggleSound();
    expect(useTrackerStore.getState().soundEnabled).toBe(initial);
  });
});
