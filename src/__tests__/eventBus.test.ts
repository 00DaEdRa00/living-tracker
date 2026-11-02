import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../lib/eventBus';
import type { AppEvent } from '../types/tracker';

describe('EventBus', () => {
  it('dispatches typed events to specific listeners', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.on('CAT_CLICKED', handler);

    bus.emit({ type: 'CAT_CLICKED', payload: { totalClicks: 42 } });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      type: 'CAT_CLICKED',
      payload: { totalClicks: 42 },
    });

    unsubscribe();
    bus.emit({ type: 'CAT_CLICKED', payload: { totalClicks: 43 } });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('delivers all events to wildcard listeners', () => {
    const bus = new EventBus();
    const wildcardHandler = vi.fn();

    bus.on('*', wildcardHandler);

    const event1: AppEvent = {
      type: 'HABIT_COMPLETED',
      payload: { habitId: 'h-1', streak: 7 },
    };
    const event2: AppEvent = {
      type: 'TASK_COMPLETED',
      payload: { taskId: 't-1', daysPending: 0 },
    };

    bus.emit(event1);
    bus.emit(event2);

    expect(wildcardHandler).toHaveBeenCalledTimes(2);
    expect(wildcardHandler).toHaveBeenNthCalledWith(1, event1);
    expect(wildcardHandler).toHaveBeenNthCalledWith(2, event2);
  });

  it('handles errors inside handlers without crashing event emission', () => {
    const bus = new EventBus();
    const brokenHandler = () => {
      throw new Error('Explosion');
    };
    const safeHandler = vi.fn();

    bus.on('PAGE_VIEWED', brokenHandler);
    bus.on('PAGE_VIEWED', safeHandler);

    expect(() => {
      bus.emit({ type: 'PAGE_VIEWED', payload: { page: 'tasks' } });
    }).not.toThrow();

    expect(safeHandler).toHaveBeenCalledTimes(1);
  });
});
