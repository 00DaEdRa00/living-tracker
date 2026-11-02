import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import {
  X,
  Share2,
  Download,
  Copy,
  Flame,
  CheckCircle2,
  Trophy,
  Sparkles,
  Calendar,
  ShieldCheck,
  Zap,
  Clock,
  Target,
  Sun,
  PieChart,
} from 'lucide-react';
import type { ToneMode, Habit, Task, Budget } from '../types/tracker';
import { useTrackerStore } from '../store/useTrackerStore';
import { playShareSound, playClickSound, playSolarSound } from '../lib/soundFx';

interface MonthlyRecapShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface MonthlyRecapStats {
  completedTasksThisMonth: number;
  totalTasks: number;
  habitConsistencyRate: number;
  longestStreak: number;
  focusMinutes: number;
  monthlySpent: number;
  monthlyBudgetLimit: number;
  freezeShieldsRemaining: number;
  overallScore: number;
  sphereBreakdown: Record<string, number>;
}

export function calculateMonthlyRecapStats(
  tasks: Task[],
  habits: Habit[],
  budget: Budget,
  focusMinutesSpent: number,
  freezeShields: number
): MonthlyRecapStats {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoMs = thirtyDaysAgo.getTime();

  // Tasks completed within last 30 days
  const completedTasksThisMonth = tasks.filter((t) => {
    if (!t.completed) return false;
    if (!t.completedAt) return true;
    return new Date(t.completedAt).getTime() >= thirtyDaysAgoMs;
  }).length;

  // Habit consistency calculation for the last 30 days
  const last30Days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last30Days.push(d.toISOString().split('T')[0]);
  }

  let totalCheckinsIn30Days = 0;
  habits.forEach((h) => {
    const checks = (h.history || []).filter((d) => last30Days.includes(d)).length;
    const frozen = (h.frozenDates || []).filter((d) => last30Days.includes(d)).length;
    totalCheckinsIn30Days += checks + frozen;
  });

  const maxPossibleCheckins = Math.max(1, habits.length * 30);
  const habitConsistencyRate = Math.min(
    100,
    Math.round((totalCheckinsIn30Days / maxPossibleCheckins) * 100)
  );

  const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  // Spheres breakdown
  const sphereBreakdown: Record<string, number> = {
    'Здоровье': 0,
    'Работа': 0,
    'Финансы': 0,
    'Саморазвитие': 0,
    'Отдых': 0,
  };

  tasks.forEach((t) => {
    if (t.completed) {
      const cat = t.category || 'Работа';
      if (cat.includes('Здоровье') || cat.includes('Спорт')) sphereBreakdown['Здоровье'] += 1;
      else if (cat.includes('Финансы')) sphereBreakdown['Финансы'] += 1;
      else if (cat.includes('Саморазвитие') || cat.includes('Обучение')) sphereBreakdown['Саморазвитие'] += 1;
      else if (cat.includes('Отдых') || cat.includes('Хобби')) sphereBreakdown['Отдых'] += 1;
      else sphereBreakdown['Работа'] += 1;
    }
  });

  habits.forEach((h) => {
    const cat = h.category || 'Здоровье/Спорт';
    if (cat.includes('Здоровье') || cat.includes('Спорт')) sphereBreakdown['Здоровье'] += h.streak;
    else if (cat.includes('Финансы')) sphereBreakdown['Финансы'] += h.streak;
    else if (cat.includes('Саморазвитие')) sphereBreakdown['Саморазвитие'] += h.streak;
    else if (cat.includes('Отдых')) sphereBreakdown['Отдых'] += h.streak;
    else sphereBreakdown['Работа'] += h.streak;
  });

  // Overall Score (0 - 100)
  let rawScore = 35;
  rawScore += Math.min(30, completedTasksThisMonth * 2.5);
  rawScore += Math.min(25, habitConsistencyRate * 0.3);
  rawScore += Math.min(10, Math.floor(focusMinutesSpent / 60) * 1.5);
  const overallScore = Math.min(100, Math.max(15, Math.round(rawScore)));

  return {
    completedTasksThisMonth,
    totalTasks: tasks.length,
    habitConsistencyRate,
    longestStreak,
    focusMinutes: focusMinutesSpent,
    monthlySpent: budget.spent || 0,
    monthlyBudgetLimit: budget.monthlyLimit || 50000,
    freezeShieldsRemaining: freezeShields,
    overallScore,
    sphereBreakdown,
  };
}

export function getMonthlyRecapPunchline(stats: MonthlyRecapStats, tone: ToneMode): string {
  const score = stats.overallScore;

  if (tone === 'sassy') {
    if (score >= 80) {
      return 'Месяц разорван в клочья! Дисциплина титаническая, стрики пылают, цели повержены. Легендарный уровень!';
    }
    if (score >= 50) {
      return 'Добротный месячный марафон! Потери минимальны, ключевые высоты взяты. В следующем месяце газуем еще сильнее!';
    }
    return 'Месяц на чилле и тактических раздумьях. Пора выходить из спячки и крушить дела!';
  }

  if (tone === 'ironic') {
    if (score >= 80) {
      return 'Месяц эпической продуктивности. Родные начинают забывать, как я выгляжу без открытого таск-трекера.';
    }
    if (score >= 50) {
      return 'Месяц прожит в балансе: задачи закрывались ровно так, чтобы совесть не грызла по ночам.';
    }
    return 'Месяц созерцания вселенной. Главное — сохранены нервные клетки и верность любимому креслу.';
  }

  // neutral
  if (score >= 80) {
    return 'Превосходные показатели месяца. Высокая стабильность регулярных привычек и закрытие стратегических задач.';
  }
  if (score >= 50) {
    return 'Уверенное выполнение запланированных ориентиров и сохранение устойчивого темпа.';
  }
  return 'Месячный цикл зафиксирован. Рекомендуется оптимизировать приоритеты и повысить частоту ключевых практик.';
}

export const MonthlyRecapShareModal: React.FC<MonthlyRecapShareModalProps> = ({
  isOpen,
  onClose,
}) => {
  const tasks = useTrackerStore((state) => state.tasks);
  const habits = useTrackerStore((state) => state.habits);
  const budget = useTrackerStore((state) => state.budget);
  const focusMinutesSpent = useTrackerStore((state) => state.focusMinutesSpent ?? 0);
  const freezeShields = useTrackerStore((state) => state.freezeShields ?? 3);
  const tone = useTrackerStore((state) => state.tone);

  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const stats = calculateMonthlyRecapStats(tasks, habits, budget, focusMinutesSpent, freezeShields);
  const punchline = getMonthlyRecapPunchline(stats, tone);

  const monthName = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  useEffect(() => {
    if (isOpen) {
      playSolarSound();
      try {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.55 },
          colors: ['#eab308', '#10b981', '#38bdf8', '#fbbf24'],
        });
      } catch {
        // safe
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setCopying(true);
      playClickSound();
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a1a14',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setCopying(false);
          return;
        }
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          playShareSound();
          try {
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.7 },
            });
          } catch {
            // safe
          }
        } catch {
          // fallback
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `living-tracker-monthly-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          playShareSound();
        } finally {
          setCopying(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to copy card image:', err);
      setCopying(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      playClickSound();
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a1a14',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly-recap-${Date.now()}.png`;
      a.click();
      playShareSound();
    } catch (err) {
      console.error('Failed to download image:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyText = async () => {
    playClickSound();
    const text = `☀️ [Живой трекер] Итоги месяца: ${capitalizedMonth}
🎯 Завершено задач: ${stats.completedTasksThisMonth}
💧 Стабильность привычек: ${stats.habitConsistencyRate}%
🔥 Рекордный стрик: ${stats.longestStreak} дн.
⏱️ Время в фокусе: ${Math.round(stats.focusMinutes / 60)} ч
🛡️ Щиты выгорания: ${stats.freezeShieldsRemaining}
📊 Индекс продуктивности: ${stats.overallScore}/100

«${punchline}»`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      playShareSound();
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // safe
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-xl bg-surface-card border border-surface-border rounded-3xl p-5 sm:p-6 shadow-2xl text-left my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Sun className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Итоги месяца: {capitalizedMonth}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Solar Recap
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Месячный отчет по задачам, стрикам, фокусу и сферам жизни
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Карточка 1080x1080 для экспорта (Share Card) */}
          <div className="flex justify-center mb-5">
            <div
              ref={cardRef}
              className="w-full rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden shadow-2xl border border-amber-500/30"
              style={{
                background: 'radial-gradient(circle at top right, #16352a 0%, #0a1a14 55%, #050d0a 100%)',
              }}
            >
              {/* Фоновые декоративные элементы */}
              <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

              {/* Заголовок карточки */}
              <div className="relative z-10 flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">☀️</span>
                  <div>
                    <div className="text-[10px] tracking-wider uppercase font-bold text-amber-400">
                      Живой трекер • Monthly Executive
                    </div>
                    <div className="text-sm sm:text-base font-black text-white">
                      {capitalizedMonth}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                    Индекс
                  </div>
                  <div className="text-lg font-black text-amber-300 flex items-center justify-end gap-1">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{stats.overallScore}</span>
                    <span className="text-[10px] text-slate-400 font-normal">/100</span>
                  </div>
                </div>
              </div>

              {/* Сетка ключевых показателей */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Задачи (30д)</span>
                  </div>
                  <div className="text-lg font-black text-emerald-300">
                    {stats.completedTasksThisMonth}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Рекорд стрика</span>
                  </div>
                  <div className="text-lg font-black text-amber-300">
                    {stats.longestStreak} дн.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Стабильность</span>
                  </div>
                  <div className="text-lg font-black text-cyan-300">
                    {stats.habitConsistencyRate}%
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Фокус</span>
                  </div>
                  <div className="text-lg font-black text-sky-300">
                    {Math.round(stats.focusMinutes / 60)} ч
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Щиты</span>
                  </div>
                  <div className="text-lg font-black text-emerald-300">
                    {stats.freezeShieldsRemaining} 🛡️
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                    <Target className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>Бюджет</span>
                  </div>
                  <div className="text-xs font-black text-fuchsia-300 truncate">
                    {stats.monthlySpent.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>

              {/* Распределение по сферам жизни */}
              <div className="relative z-10 p-3 rounded-2xl bg-white/5 border border-white/10 mb-4">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-2">
                  <span className="flex items-center gap-1">
                    <PieChart className="w-3.5 h-3.5 text-amber-400" />
                    <span>Баланс сфер жизни</span>
                  </span>
                  <span className="text-slate-400 text-[9px]">Активность за месяц</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center">
                  {Object.entries(stats.sphereBreakdown).map(([sphere, count]) => (
                    <div key={sphere} className="p-1 rounded-lg bg-black/20">
                      <div className="text-[9px] text-slate-400 truncate">{sphere}</div>
                      <div className="text-xs font-bold text-amber-300">{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Цитата / Punchline */}
              <div className="relative z-10 p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm text-xs italic text-slate-200">
                «{punchline}»
              </div>

              {/* Футер карточки */}
              <div className="relative z-10 mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>living-tracker.app</span>
                <span>Tauri 2.0 • Local SQLite</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={copying}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-accent text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span>{copying ? 'Генерация...' : 'Скопировать PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={downloading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-surface border border-surface-border text-white font-bold text-xs hover:bg-surface-card active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{downloading ? 'Сохранение...' : 'Скачать PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-surface border border-surface-border text-white font-bold text-xs hover:bg-surface-card active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>{copiedText ? 'Скопировано! ✅' : 'Текст для поста'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
