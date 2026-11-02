import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Trophy,
  CheckCircle2,
  Circle,
  Plus,
  Snowflake,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  TrendingUp,
  Calendar,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrackerStore } from '../store/useTrackerStore';
import type { Habit } from '../types/tracker';
import { playHabitCheckSound, playStreakFreezeSound, playClickSound } from '../lib/soundFx';

export const HABIT_ICON_PRESETS = [
  { icon: '💧', label: 'Водный баланс' },
  { icon: '🏋️', label: 'Спорт / Зал' },
  { icon: '🏃', label: 'Бег / Кардио' },
  { icon: '🧘', label: 'Медитация' },
  { icon: '📚', label: 'Чтение' },
  { icon: '💻', label: 'Кодинг / Учёба' },
  { icon: '🥦', label: 'Здоровое питание' },
  { icon: '💤', label: 'Режим сна' },
  { icon: '🎯', label: 'Фокус-сессия' },
  { icon: '🧹', label: 'Порядок' },
  { icon: '🎨', label: 'Хобби' },
  { icon: '💊', label: 'Витамины' },
];

export const HABIT_CATEGORIES = [
  'Здоровье/Спорт',
  'Работа',
  'Хобби',
  'Быт',
  'Развитие',
];

// Генерация последних 28 дней для тепловой карты (4 недели)
function getHeatmapDays(daysCount = 28): string[] {
  const result: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

function formatDayName(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const HabitsSection: React.FC = () => {
  const habits = useTrackerStore((state) => state.habits);
  const toggleHabit = useTrackerStore((state) => state.toggleHabit);
  const freezeHabit = useTrackerStore((state) => state.freezeHabit);
  const addHabit = useTrackerStore((state) => state.addHabit);
  const deleteHabit = useTrackerStore((state) => state.deleteHabit);
  const tone = useTrackerStore((state) => state.tone);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<{
    habitId: string;
    date: string;
    status: 'completed' | 'frozen' | 'missed' | 'today';
  } | null>(null);

  // Форма добавления привычки
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Здоровье/Спорт');
  const [formIcon, setFormIcon] = useState('💧');

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // 'YYYY-MM'
  const heatmapDays = getHeatmapDays(28);

  const handleToggle = (id: string, completedToday: boolean) => {
    if (!completedToday) {
      playHabitCheckSound();
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#10b981', '#38bdf8', '#fbbf24', '#f43f5e'],
        });
      } catch {
        // no-op
      }
    } else {
      playClickSound();
    }
    toggleHabit(id);
  };

  const handleFreeze = (id: string) => {
    const success = freezeHabit(id);
    if (success) {
      playStreakFreezeSound();
      try {
        // Ледяной сине-белый фейерверк
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.65 },
          colors: ['#38bdf8', '#0284c7', '#e0f2fe', '#a5f3fc'],
        });
      } catch {
        // no-op
      }
    }
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    addHabit({
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      icon: formIcon,
      frozenDates: [],
    });

    setFormTitle('');
    setFormDescription('');
    setIsModalOpen(false);
  };

  // Вычисление общих показателей
  const completedTodayCount = habits.filter((h) => h.completedToday).length;
  const bestOverallStreak = Math.max(0, ...habits.map((h) => h.bestStreak || h.streak || 0));

  return (
    <section className="space-y-6">
      {/* Шапка секции привычек */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-surface-card border border-surface-border shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Flame className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Дисциплина и Привычки
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {completedTodayCount} из {habits.length} закрыто сегодня
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {tone === 'sassy'
                ? 'Не прерывай цепочку! Если прижало — врубай заморозку стрика, но не сливайся.'
                : tone === 'ironic'
                ? 'Строим лучшую версию себя квадратик за квадратиком.'
                : 'Контроль регулярных ритуалов, защита серий и карта стабильности за 4 недели.'}
            </p>
          </div>
        </div>

        {/* Правая часть: кнопка добавления */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Добавить привычку</span>
        </button>
      </div>

      {/* Информационная плашка о механике Streak Freeze */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/30 via-surface-card to-surface-card border border-sky-500/30 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
            <Snowflake className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sky-300">Механика «Заморозка стрика» (Streak Freeze): </span>
            <span className="text-slate-300">
              Если день пропущен по уважительной причине или отдыху, заморозка защищает стрик от сброса в 0.
              Доступно <strong className="text-sky-300">до 2 заморозок в месяц</strong> на каждую привычку.
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0 text-slate-400 font-medium">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Лучший рекорд: <strong className="text-white">{bestOverallStreak} дн.</strong></span>
        </div>
      </div>

      {/* Список карточек привычек */}
      {habits.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-card/60 border border-dashed border-surface-border">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800/80 flex items-center justify-center text-amber-400">
            <Flame className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Список привычек пуст</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Начните с малого: стакан воды утром, 15 минут зарядки или 30 минут чтения книги.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border text-xs font-semibold text-accent transition-colors"
          >
            + Создать первую привычку
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {habits.map((habit) => {
              const frozenDates = habit.frozenDates || [];
              const freezesThisMonth = frozenDates.filter((d) => d.startsWith(currentMonth)).length;
              const isFrozenToday = frozenDates.includes(today);
              const freezesRemaining = Math.max(0, 2 - freezesThisMonth);

              // Расчёт стабильности за последние 28 дней
              const completedInWindow = heatmapDays.filter((d) => habit.history.includes(d)).length;
              const frozenInWindow = heatmapDays.filter((d) => frozenDates.includes(d)).length;
              const stabilityPercent = Math.round(((completedInWindow + frozenInWindow) / 28) * 100);

              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative flex flex-col justify-between p-5 rounded-3xl bg-surface-card border transition-all ${
                    isFrozenToday
                      ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-950/20 via-surface-card to-surface-card shadow-xl shadow-cyan-950/30'
                      : habit.completedToday
                      ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-surface-card to-surface-card shadow-lg shadow-emerald-950/20'
                      : 'border-surface-border hover:border-slate-600 shadow-md'
                  }`}
                >
                  {/* Верх карточки: Иконка, Название, Категория и Стрики */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        {/* Иконка */}
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${
                            isFrozenToday
                              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                              : habit.completedToday
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-surface border-surface-border text-white'
                          }`}
                        >
                          {habit.icon || '⚡'}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white group-hover:text-accent transition-colors">
                              {habit.title}
                            </h3>
                            {isFrozenToday && (
                              <span
                                title="Заморожено на сегодня"
                                className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                              >
                                <Snowflake className="w-3 h-3" />
                                <span>Заморозка</span>
                              </span>
                            )}
                          </div>
                          {habit.description && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                              {habit.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface text-slate-400 border border-surface-border">
                              {habit.category || 'Общее'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Стабильность: <strong className="text-emerald-400">{stabilityPercent}%</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Кнопка удаления */}
                      <button
                        type="button"
                        onClick={() => deleteHabit(habit.id)}
                        title="Удалить привычку"
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-surface transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Счётчики стрика: Текущий стрик и Рекорд */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {/* Текущий стрик */}
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-surface to-surface border border-amber-500/20 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider">
                            Текущий стрик
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-2xl font-black text-white">
                              {habit.streak}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">дней</span>
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Flame className="w-5 h-5 fill-amber-400 animate-pulse" />
                        </div>
                      </div>

                      {/* Лучший стрик */}
                      <div className="p-3 rounded-2xl bg-surface border border-surface-border flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Лучший рекорд
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-2xl font-black text-slate-200">
                              {habit.bestStreak || habit.streak || 0}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">дней</span>
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                          <Trophy className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Тепловая карта стабильности (Heatmap 28 дней) */}
                    <div className="p-3.5 rounded-2xl bg-surface/60 border border-surface-border mb-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2.5">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-accent" />
                          <span>История стабильности (4 недели)</span>
                        </span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-slate-800 border border-slate-700" />
                            <span>Пропуск</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-cyan-400" />
                            <span>Заморозка</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded bg-emerald-500" />
                            <span>Выполнено</span>
                          </span>
                        </div>
                      </div>

                      {/* Сетка квадратиков активности */}
                      <div className="grid grid-cols-14 sm:grid-cols-28 gap-1.5 items-center">
                        {heatmapDays.map((dayDate) => {
                          const isCompleted = habit.history.includes(dayDate);
                          const isFrozen = frozenDates.includes(dayDate);
                          const isCurrentDay = dayDate === today;

                          let bgClass = 'bg-slate-800/80 border-slate-700/60 hover:border-slate-500';
                          let title = `${formatDayName(dayDate)}: Пропуск`;

                          if (isCompleted) {
                            bgClass = 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/30';
                            title = `${formatDayName(dayDate)}: Выполнено 🔥`;
                          } else if (isFrozen) {
                            bgClass = 'bg-cyan-400 border-cyan-300 shadow-sm shadow-cyan-400/40';
                            title = `${formatDayName(dayDate)}: Заморозка ❄️`;
                          } else if (isCurrentDay) {
                            bgClass = 'bg-slate-800 border-accent animate-pulse';
                            title = `${formatDayName(dayDate)}: Сегодня (ожидает)`;
                          }

                          return (
                            <div
                              key={dayDate}
                              title={title}
                              className={`h-4.5 rounded-md border transition-all cursor-pointer hover:scale-125 ${bgClass} ${
                                isCurrentDay ? 'ring-1 ring-accent' : ''
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Нижняя панель действий: Кнопка заморозки и Быстрый тактильный чек-ин */}
                  <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between gap-3">
                    {/* Кнопка «Заморозить стрик» */}
                    <button
                      type="button"
                      onClick={() => handleFreeze(habit.id)}
                      disabled={freezesRemaining <= 0 && !isFrozenToday}
                      title={
                        isFrozenToday
                          ? 'Нажмите, чтобы отменить сегодняшнюю заморозку'
                          : freezesRemaining <= 0
                          ? 'Лимит 2 заморозки в месяц исчерпан'
                          : 'Защитить стрик от сброса при пропуске (до 2 раз в месяц)'
                      }
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isFrozenToday
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 shadow-md shadow-cyan-950/40'
                          : freezesRemaining <= 0
                          ? 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                          : 'bg-surface hover:bg-slate-800 text-sky-400 border border-sky-500/30 hover:border-sky-500/60'
                      }`}
                    >
                      <Snowflake className={`w-3.5 h-3.5 ${isFrozenToday ? 'animate-spin' : ''}`} />
                      <span>
                        {isFrozenToday
                          ? 'Заморожено ❄️'
                          : `Заморозка (${freezesRemaining}/2)`}
                      </span>
                    </button>

                    {/* Быстрый чек-ин с тактильной анимацией */}
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.90 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleToggle(habit.id, habit.completedToday)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-lg ${
                        habit.completedToday
                          ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-accent to-sky-500 text-slate-950 shadow-accent/25 hover:shadow-accent/40'
                      }`}
                    >
                      {habit.completedToday ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                          <span>Выполнено сегодня 🎉</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 stroke-[2.5]" />
                          <span>Чек-ин на сегодня ✨</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Модальное окно добавления новой привычки */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-3xl bg-surface-card border border-surface-border shadow-2xl overflow-hidden p-6 relative"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl bg-surface hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Flame className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Новая полезная привычка</h3>
                  <p className="text-xs text-slate-400">
                    Регулярность важнее интенсивности. Начните строить стрик!
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateHabit} className="space-y-4">
                {/* Название */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Название привычки *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Например: 2 литра воды, 15 мин зарядки, читать 20 страниц"
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                    autoFocus
                  />
                </div>

                {/* Описание / Мотивация */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Мотивация / зачем это нужно
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Какую пользу это принесёт вашему здоровью, карьере или самочувствию?"
                    className="w-full px-4 py-2 rounded-2xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:border-amber-400 placeholder:text-slate-600 resize-none"
                  />
                </div>

                {/* Категория */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Категория
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          formCategory === cat
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                            : 'bg-surface text-slate-400 border-surface-border hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Выбор иконки */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Иконка привычки
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_ICON_PRESETS.map((preset) => (
                      <button
                        key={preset.icon}
                        type="button"
                        onClick={() => setFormIcon(preset.icon)}
                        title={preset.label}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-transform hover:scale-110 cursor-pointer ${
                          formIcon === preset.icon
                            ? 'bg-amber-500/20 border-amber-400 scale-110'
                            : 'bg-surface border-surface-border'
                        }`}
                      >
                        {preset.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Кнопка создания */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Запустить привычку 🔥
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default HabitsSection;