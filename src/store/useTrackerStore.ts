import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  TrackerState,
  TrackerActions,
  TrackerStore,
  Transaction,
  Habit,
  Task,
  Budget,
  ToneMode,
  AppTheme,
  AppEvent,
  Achievement,
} from '../types/tracker';
import { eventBus } from '../lib/eventBus';
import { ACHIEVEMENTS } from '../data/achievements';
import {
  playCoinSound,
  playHabitCheckSound,
  playCatSound,
  playOverageAlarm,
  playRecurrenceSound,
} from '../lib/soundFx';
import { hybridStorage } from '../lib/storageRepository';

export { eventBus };
export { ACHIEVEMENTS, getAchievementText } from '../data/achievements';

const initialBudget: Budget = {
  monthlyLimit: 50000,
  spent: 0,
  currency: '₽',
};

const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const initialHabits: Habit[] = [
  {
    id: 'habit-1',
    title: 'Выпить 2л чистой воды',
    description: 'Очистить организм и держать водный баланс',
    category: 'Здоровье/Спорт',
    icon: '💧',
    streak: 4,
    bestStreak: 12,
    completedToday: false,
    history: [getPastDateStr(4), getPastDateStr(3), getPastDateStr(2), getPastDateStr(1)],
    frozenDates: [],
    targetDaysPerWeek: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-2',
    title: '15 минут зарядки и растяжки',
    description: 'Разминка шеи и спины после рабочего дня',
    category: 'Здоровье/Спорт',
    icon: '🏋️',
    streak: 1,
    bestStreak: 5,
    completedToday: false,
    history: [getPastDateStr(1)],
    frozenDates: [],
    targetDaysPerWeek: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-3',
    title: 'Чтение книги 30 мин',
    description: 'Развитие концентрации без залипания в соцсетях',
    category: 'Хобби',
    icon: '📚',
    streak: 6,
    bestStreak: 14,
    completedToday: false,
    history: [
      getPastDateStr(6),
      getPastDateStr(5),
      getPastDateStr(4),
      getPastDateStr(3),
      getPastDateStr(2),
      getPastDateStr(1),
    ],
    frozenDates: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-4',
    title: 'Кодинг пет-проекта',
    description: 'Минимум 1 коммит каждый рабочий день',
    category: 'Работа',
    icon: '💻',
    streak: 3,
    bestStreak: 9,
    completedToday: false,
    history: [getPastDateStr(3), getPastDateStr(2), getPastDateStr(1)],
    frozenDates: [],
    createdAt: new Date().toISOString(),
  },
];

const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Разобрать завал в почте и мессенджерах',
    description: 'Ответить на зависшие диалоги с клиентами',
    completed: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // Просрочено (красный)
    priority: 'high',
    category: 'Работа',
    icon: '💻',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    recurrence: 'daily',
    estimatedMinutes: 25,
    checklist: [
      { id: 'st-1-1', title: 'Входящие Telegram', completed: true },
      { id: 'st-1-2', title: 'Рабочая почта и тикеты', completed: false },
      { id: 'st-1-3', title: 'Архивация спама', completed: false },
    ],
  },
  {
    id: 'task-2',
    title: 'Оплатить счета ЖКХ и подписки',
    description: 'Передать показания счетчиков воды и света',
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // Горит сегодня (желтый)
    priority: 'high',
    category: 'Быт',
    icon: '💡',
    checklist: [
      { id: 'st-2-1', title: 'Показания счетчика воды', completed: true },
      { id: 'st-2-2', title: 'Квитанция за свет', completed: false },
    ],
  },
  {
    id: 'task-3',
    title: 'Силовая тренировка: спина и плечи',
    description: 'Гантели, подтягивания и растяжка',
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // Завтра
    priority: 'medium',
    category: 'Здоровье/Спорт',
    icon: '🏋️',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'task-4',
    title: 'Сформировать подушку безопасности',
    description: 'Перевести 10% дохода на накопительный счёт',
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Через 3 дня (зеленый)
    priority: 'medium',
    category: 'Финансы',
    icon: '💰',
  },
  {
    id: 'task-5',
    title: 'Изучить 2 главы по системному дизайну',
    description: 'Разобрать шардирование БД и консистентное хеширование',
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // В запасе
    priority: 'low',
    category: 'Хобби',
    icon: '📚',
  },
];

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // browser storage disabled or restricted
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // browser storage disabled or restricted
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // browser storage disabled or restricted
    }
  },
};

/**
 * Проверка условий достижений на основе наступившего события и текущего состояния стора.
 */
export function checkAchievements(
  event: AppEvent,
  state: TrackerState,
  setState: (
    partial:
      | Partial<TrackerState>
      | ((prevState: TrackerState) => Partial<TrackerState>)
  ) => void
): void {
  const currentUnlocked = { ...state.unlockedAchievements };
  let newlyUnlocked: Achievement | null = null;

  const tryUnlock = (achievementId: string) => {
    if (currentUnlocked[achievementId]) return;
    const achievement = ACHIEVEMENTS.find((item) => item.id === achievementId);
    if (!achievement) return;

    currentUnlocked[achievementId] = new Date().toISOString();
    newlyUnlocked = achievement;
  };

  switch (event.type) {
    case 'TRANSACTION_ADDED': {
      tryUnlock('first_transaction');
      if (state.budget.spent > state.budget.monthlyLimit) {
        tryUnlock('overbudget');
      }
      if (event.payload.amount >= 10000) {
        tryUnlock('big_spender');
      }
      break;
    }
    case 'HABIT_COMPLETED': {
      tryUnlock('first_habit');
      if (event.payload.streak >= 3) {
        tryUnlock('streak_3');
      }
      if (event.payload.streak >= 7) {
        tryUnlock('streak_7');
      }
      if (event.payload.streak >= 30) {
        tryUnlock('streak_30');
      }
      break;
    }
    case 'HABIT_FROZEN': {
      tryUnlock('freeze_used');
      break;
    }
    case 'TASK_COMPLETED': {
      tryUnlock('first_task');
      if (event.payload.daysPending === 0) {
        tryUnlock('speedrunner');
      }
      if (event.payload.daysPending >= 3) {
        tryUnlock('procrastinator_cured');
      }
      break;
    }
    case 'CAT_CLICKED': {
      if (event.payload.totalClicks >= 1) {
        tryUnlock('cat_clicked_1');
      }
      if (event.payload.totalClicks >= 10) {
        tryUnlock('cat_clicked_10');
      }
      break;
    }
    case 'PRICE_CLICKED': {
      if (event.payload.totalClicks >= 1) {
        tryUnlock('price_clicked_1');
      }
      break;
    }
    case 'PAGE_VIEWED': {
      tryUnlock('page_explorer');
      break;
    }
  }

  if (newlyUnlocked) {
    setState({
      unlockedAchievements: currentUnlocked,
      recentUnlocked: newlyUnlocked,
    });
  }
}

export const useTrackerStore = create<TrackerStore>()(
  persist(
    (set, get) => {
      const getState = get;
      const setState = set;

      return {
        // Начальное состояние
        budget: initialBudget,
        transactions: [],
        habits: initialHabits,
        tasks: initialTasks,
        tone: 'sassy',
        theme: 'amoled',
        soundEnabled: true,
        soundVolume: 0.7,
        freezeShields: 3,
        focusMinutesSpent: 0,
        catClicks: 0,
        priceClicks: 0,
        unlockedAchievements: {},
        recentUnlocked: null,

        // Экшены
        addTransaction: (t) => {
          const id =
            t.id ||
            (typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
          const date = t.date || new Date().toISOString();
          const transaction: Transaction = {
            ...t,
            id,
            date,
            type: t.type || 'expense',
          };

          const isExpense = transaction.type !== 'income';
          const prevSpent = getState().budget.spent;
          const newSpent = isExpense
            ? prevSpent + transaction.amount
            : Math.max(0, prevSpent - transaction.amount);

          setState((state) => ({
            transactions: [transaction, ...state.transactions],
            budget: {
              ...state.budget,
              spent: newSpent,
            },
          }));

          // Звуковой эффект: если расход превышает лимит — тревожный зуммер, иначе звон монет
          if (isExpense && newSpent > getState().budget.monthlyLimit) {
            playOverageAlarm();
          } else {
            playCoinSound();
          }

          const event: AppEvent = {
            type: 'TRANSACTION_ADDED',
            payload: transaction,
          };
          eventBus.emit(event);
          checkAchievements(event, getState(), setState);
        },

        toggleHabit: (id) => {
          const state = getState();
          const habit = state.habits.find((h) => h.id === id);
          if (!habit) return;

          const today = new Date().toISOString().split('T')[0];
          const willBeCompleted = !habit.completedToday;

          let newStreak = habit.streak;
          let newHistory = [...habit.history];

          if (willBeCompleted) {
            newStreak = habit.streak + 1;
            if (!newHistory.includes(today)) {
              newHistory.push(today);
            }
            playHabitCheckSound();
          } else {
            newStreak = Math.max(0, habit.streak - 1);
            newHistory = newHistory.filter((d) => d !== today);
          }

          const updatedHabits = state.habits.map((h) =>
            h.id === id
              ? {
                  ...h,
                  completedToday: willBeCompleted,
                  streak: newStreak,
                  bestStreak: Math.max(h.bestStreak || 0, newStreak),
                  history: newHistory,
                }
              : h
          );

          setState({ habits: updatedHabits });

          if (willBeCompleted) {
            const event: AppEvent = {
              type: 'HABIT_COMPLETED',
              payload: { habitId: id, streak: newStreak },
            };
            eventBus.emit(event);
            checkAchievements(event, getState(), setState);
          }
        },

        freezeHabit: (id) => {
          const state = getState();
          const habit = state.habits.find((h) => h.id === id);
          if (!habit) return false;

          const today = new Date().toISOString().split('T')[0];
          const currentMonth = today.slice(0, 7); // 'YYYY-MM'
          const frozenDates = habit.frozenDates || [];

          if (frozenDates.includes(today)) {
            // Already frozen today: toggle unfreeze
            const updated = frozenDates.filter((d) => d !== today);
            setState({
              habits: state.habits.map((h) =>
                h.id === id ? { ...h, frozenDates: updated } : h
              ),
              freezeShields: (state.freezeShields || 0) + 1,
            });
            return true;
          }

          // Check monthly limit (max 2 freezes in calendar month per habit)
          const freezesThisMonth = frozenDates.filter((d) => d.startsWith(currentMonth)).length;
          if (freezesThisMonth >= 2) {
            return false;
          }

          const updated = [...frozenDates, today];
          setState({
            habits: state.habits.map((h) =>
              h.id === id ? { ...h, frozenDates: updated } : h
            ),
            freezeShields: Math.max(0, (state.freezeShields || 0) - 1),
          });

          const event: AppEvent = {
            type: 'HABIT_FROZEN',
            payload: { habitId: id, date: today },
          };
          eventBus.emit(event);
          checkAchievements(event, getState(), setState);

          return true;
        },

        freezeAllHabitsToday: () => {
          const state = getState();
          const today = new Date().toISOString().split('T')[0];
          const currentMonth = today.slice(0, 7);
          let frozenCount = 0;

          const updatedHabits = state.habits.map((h) => {
            if (h.completedToday) return h;
            const frozenDates = h.frozenDates || [];
            if (frozenDates.includes(today)) return h;

            const freezesThisMonth = frozenDates.filter((d) => d.startsWith(currentMonth)).length;
            if (freezesThisMonth >= 2) return h;

            frozenCount++;
            return {
              ...h,
              frozenDates: [...frozenDates, today],
            };
          });

          if (frozenCount > 0) {
            setState({ habits: updatedHabits });
            const event: AppEvent = {
              type: 'HABIT_FROZEN',
              payload: { habitId: 'all', date: today },
            };
            eventBus.emit(event);
            checkAchievements(event, getState(), setState);
          }

          return frozenCount;
        },

        toggleTask: (id) => {
          const state = getState();
          const task = state.tasks.find((t) => t.id === id);
          if (!task) return;

          const willBeCompleted = !task.completed;
          const now = new Date();

          let daysPending = 0;
          if (task.createdAt) {
            const createdTime = new Date(task.createdAt).getTime();
            const diffMs = now.getTime() - createdTime;
            daysPending = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          }

          const updatedTasks = state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: willBeCompleted,
                  completedAt: willBeCompleted ? now.toISOString() : undefined,
                }
              : t
          );

          setState({ tasks: updatedTasks });

          if (willBeCompleted) {
            const event: AppEvent = {
              type: 'TASK_COMPLETED',
              payload: { taskId: id, daysPending },
            };
            eventBus.emit(event);
            checkAchievements(event, getState(), setState);
          }
        },

        advanceRecurringTask: (id) => {
          const state = getState();
          const task = state.tasks.find((t) => t.id === id);
          if (!task) return;

          const now = new Date();
          const recurrence = task.recurrence || 'daily';
          const baseDate = task.dueDate ? new Date(task.dueDate) : now;
          const effectiveBase = baseDate.getTime() < now.getTime() ? now : baseDate;
          const nextDate = new Date(effectiveBase);

          if (recurrence === 'daily') {
            nextDate.setDate(nextDate.getDate() + 1);
          } else if (recurrence === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7);
          } else if (recurrence === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
          } else {
            nextDate.setDate(nextDate.getDate() + 1);
          }

          const nextDueDateIso = nextDate.toISOString();

          let daysPending = 0;
          if (task.createdAt) {
            const createdTime = new Date(task.createdAt).getTime();
            daysPending = Math.max(0, Math.floor((now.getTime() - createdTime) / (1000 * 60 * 60 * 24)));
          }

          const updatedChecklist = task.checklist ? task.checklist.map((st) => ({ ...st, completed: false })) : [];

          const updatedTasks = state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: false,
                  dueDate: nextDueDateIso,
                  checklist: updatedChecklist,
                  completedAt: undefined,
                }
              : t
          );

          setState({ tasks: updatedTasks });
          playRecurrenceSound();

          const completedEvent: AppEvent = {
            type: 'TASK_COMPLETED',
            payload: { taskId: id, daysPending },
          };
          eventBus.emit(completedEvent);

          const recurredEvent: AppEvent = {
            type: 'TASK_RECURRED',
            payload: { taskId: id, nextDueDate: nextDueDateIso },
          };
          eventBus.emit(recurredEvent);

          checkAchievements(completedEvent, getState(), setState);
        },

        clickCat: () => {
          const nextClicks = getState().catClicks + 1;
          setState({ catClicks: nextClicks });

          playCatSound();

          const event: AppEvent = {
            type: 'CAT_CLICKED',
            payload: { totalClicks: nextClicks },
          };
          eventBus.emit(event);
          checkAchievements(event, getState(), setState);
        },

        clickPrice: () => {
          const nextClicks = getState().priceClicks + 1;
          setState({ priceClicks: nextClicks });

          const event: AppEvent = {
            type: 'PRICE_CLICKED',
            payload: { totalClicks: nextClicks },
          };
          eventBus.emit(event);
          checkAchievements(event, getState(), setState);
        },

        setTone: (tone: ToneMode) => {
          setState({ tone });
        },

        setTheme: (theme: AppTheme) => {
          setState({ theme });
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
            document.documentElement.className = `theme-${theme}`;
          }
        },

        toggleSound: () => {
          setState((state) => ({ soundEnabled: !state.soundEnabled }));
        },

        setSoundEnabled: (soundEnabled: boolean) => {
          setState({ soundEnabled });
        },

        setSoundVolume: (soundVolume: number) => {
          setState({ soundVolume: Math.max(0, Math.min(1, soundVolume)) });
        },

        addFreezeShield: (count = 1) => {
          setState((state) => ({
            freezeShields: Math.max(0, (state.freezeShields || 0) + count),
          }));
        },

        recordFocusSession: (minutes: number, taskId?: string) => {
          setState((state) => ({
            focusMinutesSpent: (state.focusMinutesSpent || 0) + minutes,
          }));
        },

        closeAchievementModal: () => {
          setState({ recentUnlocked: null });
        },

        openAchievementModal: (achievementOrId) => {
          const ach =
            typeof achievementOrId === 'string'
              ? ACHIEVEMENTS.find((a) => a.id === achievementOrId) || null
              : achievementOrId;
          if (ach) {
            setState({ recentUnlocked: ach });
          }
        },

        // Расширенные вспомогательные методы
        setBudgetLimit: (monthlyLimit: number) => {
          setState((state) => ({
            budget: {
              ...state.budget,
              monthlyLimit,
            },
          }));
        },

        addHabit: (habit) => {
          const id =
            habit.id ||
            (typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `hb_${Date.now()}`);
          const newHabit: Habit = {
            ...habit,
            id,
            streak: 0,
            bestStreak: 0,
            completedToday: false,
            history: [],
            frozenDates: habit.frozenDates || [],
            icon: habit.icon || '⚡',
            createdAt: habit.createdAt || new Date().toISOString(),
          };
          setState((state) => ({ habits: [...state.habits, newHabit] }));
        },

        addTask: (task) => {
          const id =
            task.id ||
            (typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `tk_${Date.now()}`);
          const newTask: Task = {
            ...task,
            id,
            completed: false,
            icon: task.icon || '🎯',
            createdAt: task.createdAt || new Date().toISOString(),
          };
          setState((state) => ({ tasks: [...state.tasks, newTask] }));
        },

        updateHabit: (id, updates) => {
          setState((state) => ({
            habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
          }));
        },

        deleteHabit: (id) => {
          setState((state) => ({
            habits: state.habits.filter((h) => h.id !== id),
          }));
        },

        updateTask: (id, updates) => {
          setState((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          }));
        },

        toggleSubtask: (taskId, subtaskId) => {
          setState((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id !== taskId || !t.checklist) return t;
              return {
                ...t,
                checklist: t.checklist.map((st) =>
                  st.id === subtaskId ? { ...st, completed: !st.completed } : st
                ),
              };
            }),
          }));
        },

        addSubtask: (taskId, title) => {
          if (!title.trim()) return;
          const subId =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `st_${Date.now()}`;
          setState((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id !== taskId) return t;
              const current = t.checklist || [];
              return {
                ...t,
                checklist: [...current, { id: subId, title: title.trim(), completed: false }],
              };
            }),
          }));
        },

        removeSubtask: (taskId, subtaskId) => {
          setState((state) => ({
            tasks: state.tasks.map((t) => {
              if (t.id !== taskId || !t.checklist) return t;
              return {
                ...t,
                checklist: t.checklist.filter((st) => st.id !== subtaskId),
              };
            }),
          }));
        },

        deleteTask: (id) => {
          setState((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
          }));
        },

        clearCompletedTasks: () => {
          setState((state) => ({
            tasks: state.tasks.filter((t) => !t.completed),
          }));
        },

        deleteTransaction: (id) => {
          const state = getState();
          const target = state.transactions.find((tx) => tx.id === id);
          if (!target) return;

          const isExpense = target.type !== 'income';
          const newSpent = isExpense
            ? Math.max(0, state.budget.spent - target.amount)
            : state.budget.spent + target.amount;

          setState({
            transactions: state.transactions.filter((tx) => tx.id !== id),
            budget: {
              ...state.budget,
              spent: newSpent,
            },
          });
        },

        resetAll: () => {
          setState({
            budget: initialBudget,
            transactions: [],
            habits: initialHabits,
            tasks: initialTasks,
            tone: 'sassy',
            theme: 'amoled',
            soundEnabled: true,
            soundVolume: 0.7,
            freezeShields: 3,
            focusMinutesSpent: 0,
            catClicks: 0,
            priceClicks: 0,
            unlockedAchievements: {},
            recentUnlocked: null,
          });
        },
      };
    },
    {
      name: 'living-tracker-storage',
      storage: createJSONStorage(() => hybridStorage),
    }
  )
);
