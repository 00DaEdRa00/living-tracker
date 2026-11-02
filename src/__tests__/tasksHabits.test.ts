import { describe, it, expect, beforeEach } from 'vitest';
import { useTrackerStore } from '../store/useTrackerStore';
import {
  formatTimeLeft,
  LIFE_SPHERES,
  TASK_ICON_PRESETS,
  TASK_IMAGE_PRESETS,
} from '../components/TasksSection';
import {
  getHeatmapDays,
  formatDayName,
  HABIT_ICON_PRESETS,
  HABIT_CATEGORIES,
} from '../components/HabitsSection';

describe('Sprint 2: Tasks & Life Spheres logic', () => {
  const now = new Date('2026-11-02T12:00:00.000Z');

  it('correctly calculates overdue task status', () => {
    const overdueTime = new Date('2026-11-01T12:00:00.000Z').toISOString();
    const result = formatTimeLeft(overdueTime, now);
    expect(result.status).toBe('overdue');
    expect(result.text).toContain('Просрочено');
  });

  it('correctly calculates urgent task status (<24 hours left)', () => {
    const urgentTime = new Date('2026-11-02T18:00:00.000Z').toISOString();
    const result = formatTimeLeft(urgentTime, now);
    expect(result.status).toBe('urgent');
    expect(result.text).toContain('Горит!');
  });

  it('correctly calculates warning task status (between 1 and 3 days)', () => {
    const warningTime = new Date('2026-11-04T12:00:00.000Z').toISOString();
    const result = formatTimeLeft(warningTime, now);
    expect(result.status).toBe('warning');
    expect(result.text).toContain('Осталось 2 дн');
  });

  it('correctly calculates safe task status (>3 days)', () => {
    const safeTime = new Date('2026-11-10T12:00:00.000Z').toISOString();
    const result = formatTimeLeft(safeTime, now);
    expect(result.status).toBe('safe');
  });

  it('has life spheres and preset covers defined', () => {
    expect(LIFE_SPHERES.length).toBeGreaterThanOrEqual(6);
    expect(TASK_ICON_PRESETS.length).toBeGreaterThanOrEqual(10);
    expect(TASK_IMAGE_PRESETS.length).toBeGreaterThanOrEqual(6);
  });
});

describe('Sprint 2: Habits, Streak Freeze & Activity Heatmap', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  it('generates 28 days for the activity heatmap', () => {
    const days = getHeatmapDays(28);
    expect(days.length).toBe(28);
    const todayStr = new Date().toISOString().split('T')[0];
    expect(days[days.length - 1]).toBe(todayStr);
  });

  it('formats localized day names for tooltip/display', () => {
    const sampleDate = '2026-11-02';
    const formatted = formatDayName(sampleDate);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('contains expected categories and icon presets for habits', () => {
    expect(HABIT_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    expect(HABIT_ICON_PRESETS.length).toBeGreaterThanOrEqual(10);
  });

  it('manages streak counter on toggle on and toggle off', () => {
    const store = useTrackerStore.getState();
    const habit = store.habits[0];
    const initialStreak = habit.streak;

    // Toggle on
    store.toggleHabit(habit.id);
    let updated = useTrackerStore.getState().habits.find((h) => h.id === habit.id);
    expect(updated?.completedToday).toBe(true);
    expect(updated?.streak).toBe(initialStreak + 1);

    // Toggle off
    useTrackerStore.getState().toggleHabit(habit.id);
    updated = useTrackerStore.getState().habits.find((h) => h.id === habit.id);
    expect(updated?.completedToday).toBe(false);
    expect(updated?.streak).toBe(initialStreak);
  });

  it('handles streak freeze and unfreeze correctly', () => {
    const store = useTrackerStore.getState();
    const habit = store.habits[0];
    const today = new Date().toISOString().split('T')[0];

    // First freeze today
    const success1 = store.freezeHabit(habit.id);
    expect(success1).toBe(true);
    let updated = useTrackerStore.getState().habits.find((h) => h.id === habit.id);
    expect(updated?.frozenDates).toContain(today);

    // Calling again toggles unfreeze
    const successToggle = store.freezeHabit(habit.id);
    expect(successToggle).toBe(true);
    updated = useTrackerStore.getState().habits.find((h) => h.id === habit.id);
    expect(updated?.frozenDates).not.toContain(today);
  });

  it('enforces streak freeze limit (maximum 2 freezes per month)', () => {
    const store = useTrackerStore.getState();
    const habit = store.habits[0];
    const currentMonth = new Date().toISOString().split('T')[0].slice(0, 7);

    // Set 2 frozen dates already in this month (not matching today)
    const today = new Date().toISOString().split('T')[0];
    const day = today.slice(8, 10);
    const date1 = day === '15' ? `${currentMonth}-10` : `${currentMonth}-15`;
    const date2 = day === '16' ? `${currentMonth}-11` : `${currentMonth}-16`;

    useTrackerStore.setState({
      habits: store.habits.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              frozenDates: [date1, date2],
            }
          : h
      ),
    });

    // Attempting a third freeze on a different date today should return false
    const success = useTrackerStore.getState().freezeHabit(habit.id);
    expect(success).toBe(false);
  });
});
