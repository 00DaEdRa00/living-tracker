import type { AppEvent, AppEventType, EventHandler, IEventBus } from '../types/tracker';

export class EventBus implements IEventBus {
  private listeners: Map<string, Set<EventHandler<any>>> = new Map();

  on<T extends AppEventType>(
    type: T | '*',
    handler: (event: T extends AppEventType ? Extract<AppEvent, { type: T }> : AppEvent) => void
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const set = this.listeners.get(type)!;
    set.add(handler as EventHandler<any>);

    return () => {
      set.delete(handler as EventHandler<any>);
      if (set.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  emit(event: AppEvent): void {
    // Specific listeners
    const specific = this.listeners.get(event.type);
    if (specific) {
      specific.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[EventBus] Error in listener for "${event.type}":`, error);
        }
      });
    }

    // Wildcard listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error('[EventBus] Error in wildcard listener:', error);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
