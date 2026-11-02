/**
 * Core type definitions for Living Tracker (Живой трекер).
 */

export type ToneMode = 'neutral' | 'ironic' | 'sassy';

export type AppTheme = 'amoled' | 'cyberpunk' | 'emerald' | 'synthwave' | 'nord' | 'dracula' | 'tokyo' | 'crimson' | 'matrix' | 'sunset';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string; // ISO date string
  type?: TransactionType;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: string;
  streak: number;
  bestStreak?: number;
  completedToday: boolean;
  history: string[]; // ISO date strings ('YYYY-MM-DD')
  frozenDates?: string[]; // ISO date strings ('YYYY-MM-DD')
  targetDaysPerWeek?: number; // 1 to 7 target frequency
  createdAt: string; // ISO date string
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string; // ISO date string
  completedAt?: string; // ISO date string
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  icon?: string;
  imageUrl?: string;
  checklist?: Subtask[];
  recurrence?: TaskRecurrence;
  estimatedMinutes?: number;
  isPinned?: boolean;
  tags?: string[];
}

export interface Budget {
  monthlyLimit: number;
  spent: number;
  currency?: string;
}

export type AchievementCategory = 'finance' | 'habits' | 'tasks' | 'easter_egg' | 'system';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementToneContent {
  title: string;
  description: string;
}

export type AchievementTones = Record<ToneMode, AchievementToneContent>;

export interface Achievement {
  id: string;
  icon: string;
  category: AchievementCategory;
  rarity?: AchievementRarity;
  title: string;
  description: string;
  tones?: Partial<AchievementTones>;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string; // ISO date string
  achievement?: Achievement;
}

/**
 * Event bus events union
 */
export type AppEvent =
  | { type: 'TRANSACTION_ADDED'; payload: Transaction }
  | { type: 'HABIT_COMPLETED'; payload: { habitId: string; streak: number } }
  | { type: 'HABIT_FROZEN'; payload: { habitId: string; date: string } }
  | { type: 'TASK_COMPLETED'; payload: { taskId: string; daysPending: number } }
  | { type: 'TASK_RECURRED'; payload: { taskId: string; nextDueDate?: string } }
  | { type: 'CAT_CLICKED'; payload: { totalClicks: number } }
  | { type: 'PRICE_CLICKED'; payload: { totalClicks: number } }
  | { type: 'PAGE_VIEWED'; payload: { page: string } };

export type AppEventType = AppEvent['type'];

export type EventHandler<T extends AppEvent = AppEvent> = (event: T) => void;

export interface IEventBus {
  on<T extends AppEventType>(
    type: T | '*',
    handler: (event: T extends AppEventType ? Extract<AppEvent, { type: T }> : AppEvent) => void
  ): () => void;
  emit(event: AppEvent): void;
}

export interface TrackerState {
  budget: Budget;
  transactions: Transaction[];
  habits: Habit[];
  tasks: Task[];
  tone: ToneMode;
  theme: AppTheme;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0 (defaults to 0.7)
  freezeShields: number; // Burnout protection shields bank
  focusMinutesSpent: number; // Pomodoro / deep work minutes
  catClicks: number;
  priceClicks: number;
  unlockedAchievements: Record<string, string>; // achievement ID -> unlock ISO date
  recentUnlocked: Achievement | null;
}

export interface TrackerActions {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'> & { id?: string; date?: string }) => void;
  toggleHabit: (id: string) => void;
  freezeHabit: (id: string) => boolean;
  freezeAllHabitsToday: () => number;
  toggleTask: (id: string) => void;
  advanceRecurringTask: (id: string) => void;
  clickCat: () => void;
  clickPrice: () => void;
  setTone: (tone: ToneMode) => void;
  setTheme: (theme: AppTheme) => void;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  addFreezeShield: (count?: number) => void;
  recordFocusSession: (minutes: number, taskId?: string) => void;
  closeAchievementModal: () => void;
  openAchievementModal: (achievementOrId: string | Achievement) => void;
  
  // Extended helper actions
  setBudgetLimit: (monthlyLimit: number) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'completedToday' | 'history' | 'createdAt'> & { id?: string; createdAt?: string }) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt'> & { id?: string; createdAt?: string }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskPin: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  deleteHabit: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompletedTasks: () => void;
  deleteTransaction: (id: string) => void;
  resetAll: () => void;
}

export type TrackerStore = TrackerState & TrackerActions;
