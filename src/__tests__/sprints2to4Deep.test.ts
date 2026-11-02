import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTrackerStore } from '../store/useTrackerStore';
import { getTaskPunchline } from '../components/TaskShareModal';
import { getHeatmapDays } from '../components/HabitsSection';
import { playTrashSound, playEditSound } from '../lib/soundFx';
import type { Task, Habit } from '../types/tracker';

describe('Sprints 2-4 Deep Features Test Suite', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  describe('Task Operations & Batch Actions (Sprint 2)', () => {
    it('should clear only completed tasks when clearCompletedTasks is called', () => {
      const { addTask, toggleTask, clearCompletedTasks } = useTrackerStore.getState();

      addTask({
        id: 'task-active-1',
        title: 'Active Task 1',
        category: 'Работа',
      });
      addTask({
        id: 'task-done-1',
        title: 'Completed Task 1',
        category: 'Быт',
      });
      addTask({
        id: 'task-done-2',
        title: 'Completed Task 2',
        category: 'Финансы',
      });

      // Mark 2 tasks as completed
      toggleTask('task-done-1');
      toggleTask('task-done-2');

      const tasksBefore = useTrackerStore.getState().tasks;
      expect(tasksBefore.filter((t) => t.completed).length).toBe(2);

      // Perform clear
      clearCompletedTasks();

      const tasksAfter = useTrackerStore.getState().tasks;
      expect(tasksAfter.some((t) => t.id === 'task-done-1')).toBe(false);
      expect(tasksAfter.some((t) => t.id === 'task-done-2')).toBe(false);
      expect(tasksAfter.some((t) => t.id === 'task-active-1')).toBe(true);
    });

    it('should update task details via updateTask', () => {
      const { addTask, updateTask } = useTrackerStore.getState();

      addTask({
        id: 'task-edit-test',
        title: 'Initial Title',
        category: 'Работа',
        priority: 'low',
      });

      updateTask('task-edit-test', {
        title: 'Updated Title',
        category: 'Хобби',
        priority: 'high',
        imageUrl: 'https://images.unsplash.com/test.jpg',
      });

      const updated = useTrackerStore.getState().tasks.find((t) => t.id === 'task-edit-test');
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.category).toBe('Хобби');
      expect(updated?.priority).toBe('high');
      expect(updated?.imageUrl).toBe('https://images.unsplash.com/test.jpg');
    });
  });

  describe('Habit Operations & Extended Heatmap (Sprint 2)', () => {
    it('should update habit details via updateHabit', () => {
      const { addHabit, updateHabit } = useTrackerStore.getState();

      addHabit({
        id: 'habit-edit-test',
        title: 'Morning Yoga',
        category: 'Здоровье/Спорт',
        icon: '🧘',
      });

      updateHabit('habit-edit-test', {
        title: 'Evening Meditation',
        icon: '🌙',
        category: 'Развитие',
      });

      const updated = useTrackerStore.getState().habits.find((h) => h.id === 'habit-edit-test');
      expect(updated?.title).toBe('Evening Meditation');
      expect(updated?.icon).toBe('🌙');
      expect(updated?.category).toBe('Развитие');
    });

    it('should generate correct number of days for 28-day and 56-day heatmap ranges', () => {
      const days28 = getHeatmapDays(28);
      expect(days28.length).toBe(28);

      const days56 = getHeatmapDays(56);
      expect(days56.length).toBe(56);

      // Verify date format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(dateRegex.test(days28[0])).toBe(true);
      expect(dateRegex.test(days56[0])).toBe(true);
    });
  });

  describe('Task Sharing & Punchline Generation (Sprint 3)', () => {
    const mockTask: Task = {
      id: 'task-share-1',
      title: 'Release Version 1.0',
      completed: true,
      priority: 'high',
      category: 'Работа',
      createdAt: new Date().toISOString(),
    };

    it('should generate sarcastic, ironic, and neutral punchlines for completed high priority task', () => {
      const sassy = getTaskPunchline(mockTask, 'sassy');
      const ironic = getTaskPunchline(mockTask, 'ironic');
      const neutral = getTaskPunchline(mockTask, 'neutral');

      expect(sassy).toContain('Горящая цель раскатана в асфальт');
      expect(ironic).toContain('Кризис века успешно предотвращен');
      expect(neutral).toContain('Приоритетная задача успешно выполнена');
    });

    it('should generate punchlines for in-progress tasks', () => {
      const inProgressTask: Task = { ...mockTask, completed: false };
      const sassy = getTaskPunchline(inProgressTask, 'sassy');
      const neutral = getTaskPunchline(inProgressTask, 'neutral');

      expect(sassy).toContain('Цель зафиксирована в прицеле');
      expect(neutral).toContain('Цель поставлена');
    });
  });

  describe('Audio FX & Theme Synthesizer (Sprint 3)', () => {
    it('should execute playTrashSound and playEditSound without throwing exceptions', () => {
      expect(() => playTrashSound()).not.toThrow();
      expect(() => playEditSound()).not.toThrow();
    });

    it('should switch to synthwave theme and store state correctly', () => {
      const { setTheme } = useTrackerStore.getState();
      setTheme('synthwave');
      expect(useTrackerStore.getState().theme).toBe('synthwave');
    });
  });
});
