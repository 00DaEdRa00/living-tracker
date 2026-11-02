import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Pin,
  PinOff,
  ExternalLink,
  X,
  Minus,
  CheckCircle2,
  Circle,
  Flame,
  ShieldCheck,
  Clock,
  Sparkles,
  TrendingDown,
  AlertTriangle,
  Cat,
  Plus,
  Snowflake,
  Timer,
  Palette,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrackerStore } from '../store/useTrackerStore';
import {
  isTauri,
  showMainWindow,
  setHudAlwaysOnTop,
  hideCurrentWindow,
  startWindowDragging,
} from '../lib/tauriBridge';
import {
  playCoinSound,
  playHabitCheckSound,
  playStreakFreezeSound,
  playCatSound,
  playAchievementFanfare,
  playPomodoroTickSound,
  playTimerCompleteSound,
  playClickSound,
  playThemeSwitchSound,
} from '../lib/soundFx';

interface HudWidgetProps {
  onClose?: () => void;
  isOverlay?: boolean;
}

export const HudWidget: React.FC<HudWidgetProps> = ({ onClose, isOverlay = false }) => {
  const [alwaysOnTop, setAlwaysOnTopState] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'habits' | 'tasks' | 'focus' | 'expense'>('overview');
  const [hudNewTask, setHudNewTask] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('Еда');
  const [quickDesc, setQuickDesc] = useState('');
  const [hudFocusSeconds, setHudFocusSeconds] = useState(25 * 60);
  const [isHudFocusActive, setIsHudFocusActive] = useState(false);
  const [hudFocusTaskId, setHudFocusTaskId] = useState('');

  // Zustand state
  const budget = useTrackerStore((state) => state.budget);
  const habits = useTrackerStore((state) => state.habits);
  const tasks = useTrackerStore((state) => state.tasks);
  const catClicks = useTrackerStore((state) => state.catClicks);
  const toggleHabit = useTrackerStore((state) => state.toggleHabit);
  const freezeHabit = useTrackerStore((state) => state.freezeHabit);
  const freezeAllHabitsToday = useTrackerStore((state) => state.freezeAllHabitsToday);
  const toggleTask = useTrackerStore((state) => state.toggleTask);
  const toggleTaskPin = useTrackerStore((state) => state.toggleTaskPin);
  const advanceRecurringTask = useTrackerStore((state) => state.advanceRecurringTask);
  const addTask = useTrackerStore((state) => state.addTask);
  const addTransaction = useTrackerStore((state) => state.addTransaction);
  const clickCat = useTrackerStore((state) => state.clickCat);
  const tone = useTrackerStore((state) => state.tone);
  const theme = useTrackerStore((state) => state.theme);
  const setTheme = useTrackerStore((state) => state.setTheme);
  const freezeShields = useTrackerStore((state) => state.freezeShields ?? 3);
  const recordFocusSession = useTrackerStore((state) => state.recordFocusSession);

  const handleCycleTheme = () => {
    const themes: Array<typeof theme> = [
      'amoled',
      'cyberpunk',
      'emerald',
      'synthwave',
      'nord',
      'dracula',
      'tokyo',
      'crimson',
      'matrix',
      'sunset',
      'aurora',
    ];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
    playThemeSwitchSound();
  };

  // HUD Pomodoro Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isHudFocusActive && hudFocusSeconds > 0) {
      interval = setInterval(() => {
        setHudFocusSeconds((prev) => {
          if (prev <= 1) {
            setIsHudFocusActive(false);
            playTimerCompleteSound();
            recordFocusSession(25, hudFocusTaskId || undefined);
            try {
              confetti({
                particleCount: 35,
                spread: 50,
                origin: { y: 0.7 },
              });
            } catch {
              // safe
            }
            return 0;
          }
          if (prev % 60 === 0) {
            playPomodoroTickSound();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHudFocusActive, hudFocusSeconds, hudFocusTaskId, recordFocusSession]);

  // Budget calculations
  const spentPercent =
    budget.monthlyLimit > 0
      ? Math.min(Math.round((budget.spent / budget.monthlyLimit) * 100), 100)
      : 0;
  const isOverBudget = budget.spent > budget.monthlyLimit;
  const remaining = Math.max(0, budget.monthlyLimit - budget.spent);

  // Urgent tasks (uncompleted, prioritized, pinned first)
  const urgentTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return 0;
    })
    .slice(0, 4);

  // Habits remaining today
  const pendingHabits = habits.slice(0, 4);

  const handleToggleAlwaysOnTop = async () => {
    const nextState = !alwaysOnTop;
    setAlwaysOnTopState(nextState);
    if (isTauri()) {
      await setHudAlwaysOnTop(nextState);
    }
  };

  const handleOpenMain = async () => {
    if (isTauri()) {
      await showMainWindow();
    } else if (onClose) {
      onClose();
    }
  };

  const handleClose = async () => {
    if (isTauri()) {
      await hideCurrentWindow();
    } else if (onClose) {
      onClose();
    }
  };

  const handleHabitClick = (habitId: string) => {
    toggleHabit(habitId);
    playHabitCheckSound();
  };

  const handleFreezeHabit = (habitId: string) => {
    const success = freezeHabit(habitId);
    if (success) {
      playStreakFreezeSound();
      try {
        confetti({
          particleCount: 35,
          spread: 45,
          origin: { y: 0.75 },
          colors: ['#38bdf8', '#0284c7', '#e0f2fe'],
        });
      } catch {
        // safe fallback
      }
    }
  };

  const handleTaskClick = (taskId: string) => {
    toggleTask(taskId);
    playCoinSound();
    try {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
      });
    } catch {
      // safe fallback
    }
  };

  const handleQuickExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickAmount);
    if (!val || val <= 0) return;

    addTransaction({
      amount: val,
      category: quickCategory,
      description: quickDesc.trim() || undefined,
      type: 'expense',
    });

    playCoinSound();
    setQuickAmount('');
    setQuickDesc('');
    try {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#facc15', '#34d399'],
      });
    } catch {
      // safe
    }
  };

  const handleAdvanceRecurring = (taskId: string) => {
    advanceRecurringTask(taskId);
    try {
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.75 },
      });
    } catch {
      // safe
    }
  };

  const handleCatClick = () => {
    clickCat();
    playCatSound();
  };

  // Mini circular ring stroke calculations
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (spentPercent / 100) * circumference;

  return (
    <div
      className={`w-full max-w-[380px] h-[520px] rounded-3xl bg-slate-950/90 text-slate-100 flex flex-col overflow-hidden border border-accent/30 shadow-[0_0_35px_rgba(56,189,248,0.22)] backdrop-blur-2xl select-none font-sans ${
        isOverlay ? 'fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in-95' : ''
      }`}
    >
      {/* Draggable HUD Header */}
      <div
        data-tauri-drag-region
        onMouseDown={() => startWindowDragging()}
        className="px-4 py-3 bg-surface/90 border-b border-surface-border flex items-center justify-between cursor-move"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-accent to-purple-600 shadow-md">
            <Zap className="w-4 h-4 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-white leading-none">
                Живой трекер
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-accent/20 text-accent rounded-full uppercase tracking-wider">
                HUD
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">
              Плавающий виджет
            </p>
          </div>
        </div>

        {/* HUD Window Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCycleTheme}
            title={`Тема: ${theme} (нажмите для смены темы)`}
            className="p-1.5 rounded-lg bg-surface-card border border-surface-border text-slate-400 hover:text-accent hover:border-accent/40 transition-colors"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleAlwaysOnTop}
            title={alwaysOnTop ? 'Закреплен поверх окон' : 'Обычный режим'}
            className={`p-1.5 rounded-lg border transition-all ${
              alwaysOnTop
                ? 'bg-accent/20 border-accent/40 text-accent'
                : 'bg-surface-card border-surface-border text-slate-400 hover:text-white'
            }`}
          >
            {alwaysOnTop ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleOpenMain}
            title="Открыть главный дашборд"
            className="p-1.5 rounded-lg bg-surface-card border border-surface-border text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleClose}
            title="Свернуть виджет"
            className="p-1.5 rounded-lg bg-surface-card border border-surface-border text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Quick Nav Pills */}
      <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5 border-b border-surface-border/50 bg-slate-900/60">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Обзор
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('habits')}
          className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-all ${
            activeTab === 'habits'
              ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Привычки ({habits.filter((h) => h.completedToday).length}/{habits.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-all ${
            activeTab === 'tasks'
              ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Задачи ({tasks.filter((t) => !t.completed).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('focus')}
          className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-all ${
            activeTab === 'focus'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Фокус ⏱️
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-all ${
            activeTab === 'expense'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          + Расход
        </button>
      </div>

      {/* HUD Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {activeTab === 'overview' && (
          <>
            {/* Compact Mini Budget Ring Card */}
            <div className="p-3 rounded-2xl bg-surface-card/90 border border-surface-border flex items-center justify-between gap-3 shadow-sm">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  <span>Бюджет месяца</span>
                  {isOverBudget && (
                    <span className="text-rose-400 flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" /> Превышен
                    </span>
                  )}
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  {budget.spent.toLocaleString('ru-RU')} {budget.currency}
                </div>
                <div className="text-[11px] text-slate-400">
                  из {budget.monthlyLimit.toLocaleString('ru-RU')} {budget.currency} (
                  <span className={isOverBudget ? 'text-rose-400 font-bold' : 'text-accent'}>
                    {spentPercent}%
                  </span>
                  )
                </div>
              </div>

              {/* Mini SVG Ring */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    className="stroke-slate-800"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke={isOverBudget ? '#ef4444' : '#38bdf8'}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <span className="absolute text-[11px] font-black text-white">
                  {spentPercent}%
                </span>
              </div>
            </div>

            {/* Quick Habits Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                <span>Быстрый чек-ин привычек</span>
                <span className="text-accent">Топ дня</span>
              </div>
              <div className="space-y-1.5">
                {pendingHabits.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => handleHabitClick(h.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      h.completedToday
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-surface-card border-surface-border text-slate-200 hover:border-accent/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base select-none">{h.icon || '🎯'}</span>
                      <span className="text-xs font-semibold truncate max-w-[170px]">
                        {h.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="flex items-center text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                        <Flame className="w-2.5 h-2.5 mr-0.5 fill-amber-400" />
                        {h.streak}
                      </span>
                      {h.completedToday ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 hover:text-accent" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tasks List */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                <span>Горящие задачи</span>
                <span className="text-rose-400">Срочно</span>
              </div>
              {urgentTasks.length === 0 ? (
                <div className="p-3 rounded-xl bg-surface-card border border-surface-border text-center text-xs text-slate-400">
                  🎉 Все задачи закрыты! Красава!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {urgentTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleTaskClick(t.id)}
                      className="flex items-center justify-between p-2 rounded-xl bg-surface-card border border-surface-border hover:border-accent/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm select-none">{t.icon || '📌'}</span>
                        <span className="text-xs font-medium text-slate-200 truncate max-w-[190px]">
                          {t.title}
                        </span>
                      </div>
                      <Circle className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'habits' && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                const count = freezeAllHabitsToday();
                if (count > 0) {
                  playStreakFreezeSound();
                  try {
                    confetti({
                      particleCount: 40,
                      spread: 50,
                      origin: { y: 0.75 },
                      colors: ['#38bdf8', '#0284c7', '#e0f2fe'],
                    });
                  } catch {
                    // safe
                  }
                }
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>Заморозить все на сегодня</span>
            </button>
            {habits.map((h) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isFrozen = (h.frozenDates || []).includes(todayStr);
              return (
                <div
                  key={h.id}
                  onClick={() => handleHabitClick(h.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    h.completedToday
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isFrozen
                      ? 'bg-sky-500/10 border-sky-500/30'
                      : 'bg-surface-card border-surface-border hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{h.icon || '🎯'}</span>
                    <div>
                      <div className="text-xs font-semibold text-white truncate max-w-[170px]">
                        {h.title}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span>Стрик: {h.streak} дн.</span>
                        {isFrozen && (
                          <span className="text-sky-300 font-bold flex items-center gap-0.5">
                            <Snowflake className="w-2.5 h-2.5" /> Заморожен
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!h.completedToday && !isFrozen && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFreezeHabit(h.id);
                        }}
                        title="Заморозить стрик на сегодня (защита от сгорания)"
                        className="p-1 rounded-lg bg-sky-500/15 text-sky-400 hover:bg-sky-500/30 border border-sky-500/30 transition-all cursor-pointer"
                      >
                        <Snowflake className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {h.completedToday ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 hover:text-accent shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-2">
            {/* Быстрое добавление задачи прямо из виджета */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!hudNewTask.trim()) return;
                addTask({
                  title: hudNewTask.trim(),
                  category: 'Работа',
                  icon: '📌',
                  priority: 'medium',
                });
                setHudNewTask('');
                playCoinSound();
              }}
              className="flex items-center gap-1.5 p-1 bg-surface-card rounded-xl border border-surface-border focus-within:border-accent"
            >
              <input
                type="text"
                placeholder="+ Добавить быструю задачу..."
                value={hudNewTask}
                onChange={(e) => setHudNewTask(e.target.value)}
                className="flex-1 bg-transparent px-2 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="p-1 rounded-lg bg-accent/20 text-accent hover:bg-accent hover:text-slate-950 transition-colors cursor-pointer"
                title="Добавить задачу"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </form>

            {[...tasks]
              .sort((a, b) => (Boolean(a.isPinned) !== Boolean(b.isPinned) ? (a.isPinned ? -1 : 1) : 0))
              .map((t) => (
              <div
                key={t.id}
                onClick={() => handleTaskClick(t.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  t.completed
                    ? 'bg-slate-900/60 border-slate-800 opacity-60'
                    : 'bg-surface-card border-surface-border hover:border-accent/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{t.icon || '📌'}</span>
                  <div>
                    <div
                      className={`text-xs font-medium text-white truncate max-w-[200px] flex items-center gap-1.5 ${
                        t.completed ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      <span>{t.title}</span>
                      {t.isPinned && (
                        <span className="text-amber-400 font-bold" title="Закреплено">
                          📌
                        </span>
                      )}
                    </div>
                    {t.dueDate && (
                      <div className="text-[9px] text-amber-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        До {new Date(t.dueDate).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                    {t.checklist && t.checklist.length > 0 && (
                      <div className="text-[9px] text-accent flex items-center gap-1 font-semibold mt-0.5">
                        <span>Шаги: {t.checklist.filter((s) => s.completed).length}/{t.checklist.length}</span>
                      </div>
                    )}
                    {t.recurrence && t.recurrence !== 'none' && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          🔁 {t.recurrence === 'daily' ? 'День' : t.recurrence === 'weekly' ? 'Неделя' : 'Месяц'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdvanceRecurring(t.id);
                          }}
                          title="Перенести на следующий цикл"
                          className="text-[9px] font-bold text-accent hover:underline cursor-pointer"
                        >
                          След. цикл
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {t.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 hover:text-accent shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Focus / Pomodoro Tab */}
        {activeTab === 'focus' && (
          <div className="space-y-3 p-1 text-center">
            <div className="p-3.5 rounded-2xl bg-surface-card border border-surface-border">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                <span>Глубокий фокус</span>
                <span className="text-emerald-400">Pomodoro 25м</span>
              </div>

              {/* Task Selector for Focus */}
              <select
                value={hudFocusTaskId}
                onChange={(e) => setHudFocusTaskId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-surface border border-surface-border text-white text-xs mb-3 focus:outline-none focus:border-emerald-400"
              >
                <option value="">🎯 Сфокусироваться без задачи</option>
                {urgentTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon || '📌'} {t.title}
                  </option>
                ))}
              </select>

              {/* Countdown Display */}
              <div className="my-2 text-5xl font-black font-mono tracking-tight text-white">
                {String(Math.floor(hudFocusSeconds / 60)).padStart(2, '0')}:
                {String(hudFocusSeconds % 60).padStart(2, '0')}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 mb-3">
                <span className={`w-2 h-2 rounded-full ${isHudFocusActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span>{isHudFocusActive ? 'Сессия активна • Тик каждую минуту' : 'Готов к старту'}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsHudFocusActive(!isHudFocusActive);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isHudFocusActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {isHudFocusActive ? 'Пауза ⏸️' : 'Старт фокуса ▶️'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setHudFocusSeconds(25 * 60);
                  }}
                  className="px-3 py-2 rounded-xl bg-surface hover:bg-slate-800 text-slate-300 text-xs font-bold border border-surface-border transition-colors cursor-pointer"
                >
                  25м
                </button>
              </div>
            </div>

            {/* Quick Freeze Shields Info */}
            <div className="p-2.5 rounded-xl bg-surface/60 border border-surface-border text-left flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span className="text-slate-300">Щиты от выгорания:</span>
              </div>
              <span className="font-extrabold text-sky-300">{freezeShields} 🛡️</span>
            </div>
          </div>
        )}

        {/* Quick Expense Form Tab */}
        {activeTab === 'expense' && (
          <form onSubmit={handleQuickExpense} className="space-y-2.5 p-1 text-left">
            <div className="p-2.5 rounded-2xl bg-surface-card border border-surface-border">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Сумма расхода (₽) *
              </label>
              <input
                type="number"
                step="any"
                required
                autoFocus
                placeholder="Например: 350"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-white text-base font-extrabold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="p-2.5 rounded-2xl bg-surface-card border border-surface-border">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Категория
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['Еда', 'Алкоголь', 'Спорт', 'ЖКХ', 'Транспорт', 'Другое'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setQuickCategory(cat)}
                    className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      quickCategory === cat
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-surface text-slate-400 border-surface-border hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-surface-card border border-surface-border">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Заметка (опционально)
              </label>
              <input
                type="text"
                placeholder="Обед, кофе, такси..."
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
            >
              Записать расход 💸
            </button>
          </form>
        )}
      </div>

      {/* Mini Footer: Dopamine Cat Clicker + System status */}
      <div className="p-2.5 bg-surface/90 border-t border-surface-border flex items-center justify-between">
        {/* Cat Clicker Button */}
        <button
          type="button"
          onClick={handleCatClick}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-all text-xs font-bold active:scale-95"
          title="Погладить кота (+5 XP)"
        >
          <Cat className="w-3.5 h-3.5" />
          <span>Гладить кота</span>
          <span className="text-[10px] text-purple-400">({catClicks})</span>
        </button>

        {/* Desktop / Tauri Status */}
        <div className="text-[10px] font-medium text-slate-400 flex items-center gap-2">
          <span className="flex items-center gap-1 font-mono text-[9px] text-slate-500 bg-surface px-1.5 py-0.5 rounded border border-surface-border">
            Ctrl+Space
          </span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{isTauri() ? 'Tauri 2.0 • SQLite v8' : 'HUD Preview • SQLite v8'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HudWidget;
