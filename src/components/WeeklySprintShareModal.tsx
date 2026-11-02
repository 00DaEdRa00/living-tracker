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
  Layers,
  ShieldCheck,
  Zap,
  Clock,
  Target,
} from 'lucide-react';
import type { ToneMode } from '../types/tracker';
import { useTrackerStore } from '../store/useTrackerStore';
import { playShareSound, playClickSound, playSummaryFanfareSound } from '../lib/soundFx';

interface WeeklySprintShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface WeeklySprintStats {
  completedTasksThisWeek: number;
  totalTasks: number;
  activeStreaksCount: number;
  longestStreak: number;
  focusMinutes: number;
  freezeShields: number;
  productivityScore: number;
}

export function calculateWeeklySprintStats(
  tasks: Array<{ completed: boolean; completedAt?: string }>,
  habits: Array<{ streak: number; history?: string[] }>,
  focusMinutesSpent: number,
  freezeShields: number
): WeeklySprintStats {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoMs = oneWeekAgo.getTime();

  const completedTasksThisWeek = tasks.filter((t) => {
    if (!t.completed) return false;
    if (!t.completedAt) return true;
    return new Date(t.completedAt).getTime() >= oneWeekAgoMs;
  }).length;

  const activeStreaksCount = habits.filter((h) => h.streak > 0).length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  // Оценка продуктивности недели от 0 до 100
  let rawScore = 30;
  rawScore += Math.min(40, completedTasksThisWeek * 8);
  rawScore += Math.min(20, activeStreaksCount * 5);
  rawScore += Math.min(10, Math.floor(focusMinutesSpent / 30) * 2);
  const productivityScore = Math.min(100, Math.max(10, rawScore));

  return {
    completedTasksThisWeek,
    totalTasks: tasks.length,
    activeStreaksCount,
    longestStreak,
    focusMinutes: focusMinutesSpent,
    freezeShields,
    productivityScore,
  };
}

export function getWeeklySprintPunchline(stats: WeeklySprintStats, tone: ToneMode): string {
  const score = stats.productivityScore;

  if (tone === 'sassy') {
    if (score >= 80) {
      return 'Неделя закрыта с ноги! Задачи горят, фокус космический, стрики стальные. Конкуренты нервно курят!';
    }
    if (score >= 50) {
      return 'Крепкий забег! Главные цели взяты, щиты удержаны. На следующей неделе жмем газ до упора!';
    }
    return 'Раскачка закончена — пора врубать форсаж и выносить бэклог вперед ногами!';
  }

  if (tone === 'ironic') {
    if (score >= 80) {
      return 'Продуктивность на максимуме. Мой диван объявил мне бойкот за предательство.';
    }
    if (score >= 50) {
      return 'Неделя прошла в режиме тактического лавирования между делами и кофе. Жить можно.';
    }
    return 'Неделя размышлений о великом. Зато потенциал для рывка колоссальный.';
  }

  // neutral
  if (score >= 80) {
    return 'Выдающиеся недельные результаты. Высокий показатель завершенных задач и стабильность стриков.';
  }
  if (score >= 50) {
    return 'Уверенный прогресс по ключевым направлениям и поддержание регулярного ритма.';
  }
  return 'Базовый прогресс зафиксирован. Рекомендуется сфокусироваться на приоритетных задачах.';
}

export const WeeklySprintShareModal: React.FC<WeeklySprintShareModalProps> = ({
  isOpen,
  onClose,
}) => {
  const tasks = useTrackerStore((state) => state.tasks);
  const habits = useTrackerStore((state) => state.habits);
  const focusMinutesSpent = useTrackerStore((state) => state.focusMinutesSpent ?? 0);
  const freezeShields = useTrackerStore((state) => state.freezeShields ?? 3);
  const tone = useTrackerStore((state) => state.tone);

  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  const stats = calculateWeeklySprintStats(tasks, habits, focusMinutesSpent, freezeShields);
  const punchline = getWeeklySprintPunchline(stats, tone);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    if (isOpen) {
      playSummaryFanfareSound();
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.55 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateCanvas = async () => {
    if (!cardRef.current) return null;
    return await html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: '#090d16',
      useCORS: true,
      logging: false,
    });
  };

  const handleCopyImage = async () => {
    setCopying(true);
    setAlertMsg(null);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error('Не удалось сформировать холст');

      playShareSound();

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Не удалось получить изображение');
        try {
          if (navigator.clipboard && 'write' in navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setAlertMsg('Карточка спринта скопирована в буфер обмена! 📸');
          } else {
            const item = new Blob([blob], { type: 'image/png' });
            const url = URL.createObjectURL(item);
            const a = document.createElement('a');
            a.href = url;
            a.download = `weekly-sprint-${now.toISOString().split('T')[0]}.png`;
            a.click();
            URL.revokeObjectURL(url);
            setAlertMsg('Изображение скачано (буфер обмена недоступен)!');
          }
        } catch {
          setAlertMsg('Скопируйте через скачивание файла.');
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setAlertMsg('Ошибка при копировании.');
    } finally {
      setCopying(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setAlertMsg(null);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error('Не удалось сформировать холст');

      playShareSound();

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly-sprint-${now.toISOString().split('T')[0]}.png`;
      a.click();
      setAlertMsg('Карточка сохранена! 🚀');
    } catch (err) {
      console.error(err);
      setAlertMsg('Ошибка при скачивании.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl my-8"
        >
          {/* Header modal */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border">
            <div className="flex items-center gap-2 text-accent">
              <Share2 className="w-5 h-5" />
              <h2 className="text-lg font-bold text-white">Итоги недельного спринта</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-surface transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Share Canvas Card */}
          <div className="flex justify-center mb-6">
            <div
              ref={cardRef}
              className="w-full max-w-md bg-gradient-to-br from-[#090d16] via-[#10192b] to-[#090d16] p-6 rounded-3xl border border-sky-500/30 shadow-[0_0_35px_rgba(56,189,248,0.15)] flex flex-col justify-between text-white relative overflow-hidden"
              style={{ minHeight: '490px' }}
            >
              {/* Glow spots */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Card top banner */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-wider uppercase text-slate-200">
                        Живой трекер
                      </h3>
                      <p className="text-[10px] text-accent font-semibold tracking-widest uppercase">
                        Weekly Sprint Review
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-surface-border text-xs text-slate-300 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    <span>{dateFormatted}</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="p-4 rounded-2xl bg-surface-card/90 border border-surface-border backdrop-blur-sm mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Индекс продуктивности спринта
                    </span>
                    <span className="text-lg font-black text-accent">
                      {stats.productivityScore}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${stats.productivityScore}%` }}
                    />
                  </div>
                </div>

                {/* Stats 2x2 Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3.5 rounded-2xl bg-surface-card/60 border border-surface-border">
                    <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[11px] font-semibold">Закрыто задач</span>
                    </div>
                    <p className="text-xl font-black text-white">
                      {stats.completedTasksThisWeek}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">за 7 дней</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-card/60 border border-surface-border">
                    <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                      <Flame className="w-4 h-4 fill-amber-400" />
                      <span className="text-[11px] font-semibold">Активных стриков</span>
                    </div>
                    <p className="text-xl font-black text-white">
                      {stats.activeStreaksCount}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">макс: {stats.longestStreak} дн.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-card/60 border border-surface-border">
                    <div className="flex items-center gap-1.5 text-sky-400 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-[11px] font-semibold">Фокус Помодоро</span>
                    </div>
                    <p className="text-xl font-black text-white">
                      {stats.focusMinutes} <span className="text-xs font-normal text-slate-300">мин</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">глубокая работа</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-card/60 border border-surface-border">
                    <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[11px] font-semibold">Щиты защиты</span>
                    </div>
                    <p className="text-xl font-black text-white">
                      {stats.freezeShields} <span className="text-xs font-normal text-slate-300">шт.</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">streak freeze bank</p>
                  </div>
                </div>

                {/* Tone Punchline Box */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 italic relative leading-relaxed mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400 absolute -top-2 -left-2" />
                  "{punchline}"
                </div>
              </div>

              {/* Watermark Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Автономный трекер привычек и целей
                </span>
                <span className="font-mono text-slate-400">github.com/00DaEdRa00/living-tracker</span>
              </div>
            </div>
          </div>

          {/* Action alerts */}
          {alertMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-accent/15 border border-accent/30 text-accent text-center text-xs font-semibold"
            >
              {alertMsg}
            </motion.div>
          )}

          {/* Footer modal buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={copying}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-accent text-slate-950 font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent-glow transition-all shadow-lg shadow-accent/20 cursor-pointer disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span>{copying ? 'Формирование...' : 'Скопировать PNG в буфер'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-surface border border-surface-border text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-surface-card transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Скачать</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WeeklySprintShareModal;
