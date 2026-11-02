import { describe, it, expect, beforeEach } from 'vitest';
import { useTrackerStore } from '../store/useTrackerStore';

describe('useTrackerStore', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  it('updates tone mode across neutral, ironic and sassy', () => {
    const store = useTrackerStore.getState();
    expect(store.tone).toBe('sassy');

    store.setTone('ironic');
    expect(useTrackerStore.getState().tone).toBe('ironic');

    store.setTone('neutral');
    expect(useTrackerStore.getState().tone).toBe('neutral');
  });

  it('updates themes across amoled, cyberpunk and emerald', () => {
    const store = useTrackerStore.getState();
    expect(store.theme).toBe('amoled');

    store.setTheme('cyberpunk');
    expect(useTrackerStore.getState().theme).toBe('cyberpunk');

    store.setTheme('emerald');
    expect(useTrackerStore.getState().theme).toBe('emerald');
  });

  it('adds transactions and increments spent budget', () => {
    const initialSpent = useTrackerStore.getState().budget.spent;

    useTrackerStore.getState().addTransaction({
      amount: 1500,
      category: 'Еда',
      description: 'Пицца и сок',
      type: 'expense',
    });

    const updatedState = useTrackerStore.getState();
    expect(updatedState.budget.spent).toBe(initialSpent + 1500);
    expect(updatedState.transactions.length).toBeGreaterThan(0);
    expect(updatedState.transactions[0].amount).toBe(1500);
  });

  it('adds task with image cover and toggles completion', () => {
    const customImg = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c';
    useTrackerStore.getState().addTask({
      title: 'Сдать спринт в срок',
      category: 'Работа',
      priority: 'high',
      imageUrl: customImg,
    });

    const tasks = useTrackerStore.getState().tasks;
    const added = tasks.find((t) => t.title === 'Сдать спринт в срок');
    expect(added).toBeDefined();
    expect(added?.imageUrl).toBe(customImg);
    expect(added?.completed).toBe(false);

    // Toggle task
    useTrackerStore.getState().toggleTask(added!.id);
    const toggled = useTrackerStore.getState().tasks.find((t) => t.id === added!.id);
    expect(toggled?.completed).toBe(true);
    expect(toggled?.completedAt).toBeDefined();
  });

  it('freezes a habit streak safely preventing burnout loss', () => {
    const habits = useTrackerStore.getState().habits;
    const testHabit = habits[0];
    expect(testHabit).toBeDefined();

    const initialStreak = testHabit.streak;
    const success = useTrackerStore.getState().freezeHabit(testHabit.id);

    expect(success).toBe(true);
    const updatedHabit = useTrackerStore.getState().habits.find((h) => h.id === testHabit.id);
    expect(updatedHabit?.streak).toBe(initialStreak); // streak preserved
    expect(updatedHabit?.frozenDates?.length).toBeGreaterThan(0);
  });
});
