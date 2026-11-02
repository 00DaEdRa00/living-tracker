import React, { useState } from 'react';
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
} from '../lib/soundFx';

interface HudWidgetProps {
  onClose?: () => void;
  isOverlay?: boolean;
}

export const HudWidget: React.FC<HudWidgetProps> = ({ onClose, isOverlay = false }) => {
  const [alwaysOnTop, setAlwaysOnTopState] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'habits' | 'tasks'>('overview');
  const [hudNewTask, setHudNewTask] = useState('');

  // Zustand state
  const budget = useTrackerStore((state) => state.budget);
  const habits = useTrackerStore((state) => state.habits);
  const tasks = useTrackerStore((state) => state.tasks);
  const catClicks = useTrackerStore((state) => state.catClicks);
  const toggleHabit = useTrackerStore((state) => state.toggleHabit);
  const freezeHabit = useTrackerStore((state) => state.freezeHabit);
  const freezeAllHabitsToday = useTrackerStore((state) => state.freezeAllHabitsToday);
  const toggleTask = useTrackerStore((state) => state.toggleTask);
  const addTask = useTrackerStore((state) => state.addTask);
  const clickCat = useTrackerStore((state) => state.clickCat);
  const tone = useTrackerStore((state) => state.tone);

  // Budget calculations
  const spentPercent =
    budget.monthlyLimit > 0
      ? Math.min(Math.round((budget.spent / budget.monthlyLimit) * 100), 100)
      : 0;
  const isOverBudget = budget.spent > budget.monthlyLimit;
  const remaining = Math.max(0, budget.monthlyLimit - budget.spent);

  // Urgent tasks (uncompleted, prioritized)
  const urgentTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
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

            {tasks.map((t) => (
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
                      className={`text-xs font-medium text-white truncate max-w-[200px] ${
                        t.completed ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {t.title}
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
        <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{isTauri() ? 'Tauri 2.0 Native' : 'HUD Preview'}</span>
        </div>
      </div>
    </div>
  );
};

export default HudWidget;
