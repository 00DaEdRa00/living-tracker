import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTrackerStore } from '../store/useTrackerStore';
import { HABIT_CATEGORY_PILLS } from '../components/HabitsSection';
import { playSubtaskSound } from '../lib/soundFx';

describe('Sprint 2-4: Subtasks, Habit Category Filters & Web Audio FX', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  it('initializes tasks with sample subtasks checklist', () => {
    const tasks = useTrackerStore.getState().tasks;
    const task1 = tasks.find((t) => t.id === 'task-1');
    expect(task1).toBeDefined();
    expect(task1?.checklist).toBeDefined();
    expect(task1?.checklist?.length).toBeGreaterThan(0);
    expect(task1?.checklist?.[0].title).toBe('Входящие Telegram');
    expect(task1?.checklist?.[0].completed).toBe(true);
  });

  it('adds subtask to an existing task correctly', () => {
    const tasks = useTrackerStore.getState().tasks;
    const target = tasks[0];
    const initialCount = target.checklist?.length || 0;

    useTrackerStore.getState().addSubtask(target.id, 'Новый проверочный шаг');

    const updated = useTrackerStore.getState().tasks.find((t) => t.id === target.id);
    expect(updated?.checklist?.length).toBe(initialCount + 1);
    const added = updated?.checklist?.find((st) => st.title === 'Новый проверочный шаг');
    expect(added).toBeDefined();
    expect(added?.completed).toBe(false);
  });

  it('toggles subtask completion state', () => {
    const tasks = useTrackerStore.getState().tasks;
    const task = tasks.find((t) => t.id === 'task-1');
    expect(task?.checklist).toBeDefined();
    const firstSubtask = task!.checklist![0];
    const initialStatus = firstSubtask.completed;

    useTrackerStore.getState().toggleSubtask(task!.id, firstSubtask.id);

    const updated = useTrackerStore.getState().tasks.find((t) => t.id === task!.id);
    const toggled = updated!.checklist!.find((st) => st.id === firstSubtask.id);
    expect(toggled?.completed).toBe(!initialStatus);
  });

  it('removes subtask from task checklist', () => {
    const tasks = useTrackerStore.getState().tasks;
    const task = tasks.find((t) => t.id === 'task-1');
    const firstSubtask = task!.checklist![0];
    const initialCount = task!.checklist!.length;

    useTrackerStore.getState().removeSubtask(task!.id, firstSubtask.id);

    const updated = useTrackerStore.getState().tasks.find((t) => t.id === task!.id);
    expect(updated?.checklist?.length).toBe(initialCount - 1);
    expect(updated?.checklist?.some((st) => st.id === firstSubtask.id)).toBe(false);
  });

  it('verifies habit category filter pills definition', () => {
    expect(HABIT_CATEGORY_PILLS).toBeDefined();
    expect(HABIT_CATEGORY_PILLS.length).toBeGreaterThanOrEqual(6);
    const allPill = HABIT_CATEGORY_PILLS.find((p) => p.id === 'all');
    const sportPill = HABIT_CATEGORY_PILLS.find((p) => p.id === 'Здоровье/Спорт');
    expect(allPill).toBeDefined();
    expect(sportPill).toBeDefined();
  });

  it('executes playSubtaskSound without throwing', () => {
    expect(() => playSubtaskSound()).not.toThrow();
  });
});
