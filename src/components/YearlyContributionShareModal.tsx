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
  Award,
  Sparkles,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Zap,
} from 'lucide-react';
import type { ToneMode } from '../types/tracker';
import { useTrackerStore } from '../store/useTrackerStore';
import { playShareSound, playClickSound, playAnnualReportFanfare } from '../lib/soundFx';

interface YearlyContributionShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface YearlyStats {
  year: number;
  totalCheckins: number;
  activeDays: number;
  activeDaysPercent: number;
  completedTasksCount: number;
  bestStreak: number;
  shieldsUsed: number;
  punchline: string;
  gridCells: Array<{ date: string; count: number; level: number }>;
}

export function calculateYearlyStats(
  habits: ReturnType<typeof useTrackerStore.getState>['habits'],
  tasks: ReturnType<typeof useTrackerStore.getState>['tasks'],
  tone: ToneMode
): YearlyStats {
  const now = new Date();
  const year = now.getFullYear();

  // Create 52 weeks (364 days) leading up to today
  const gridCells: Array<{ date: string; count: number; level: number }> = [];
  const dateCounts: Record<string, number> = {};

  // Count habit completions by date
  habits.forEach((h) => {
    (h.history || []).forEach((d) => {
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    });
  });

  // Count tasks completed by date
  tasks.forEach((t) => {
    if (t.completed && t.completedAt) {
      const d = t.completedAt.split('T')[0];
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    }
  });

  const totalDays = 364; // exactly 52 weeks
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const iso = d.toISOString().split('T')[0];
    const count = dateCounts[iso] || 0;
    let level = 0;
    if (count >= 5) level = 4;
    else if (count >= 3) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;

    gridCells.push({ date: iso, count, level });
  }

  const activeDays = gridCells.filter((c) => c.count > 0).length;
  const activeDaysPercent = Math.min(100, Math.round((activeDays / totalDays) * 100));
  const totalCheckins = gridCells.reduce((acc, c) => acc + c.count, 0);

  const bestStreak = habits.reduce(
    (max, h) => Math.max(max, h.bestStreak || h.streak || 0),
    0
  );

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const shieldsUsed = habits.reduce(
    (acc, h) => acc + (h.frozenDates?.length || 0),
    0
  );

  let punchline = '';
  if (tone === 'sassy') {
    if (activeDays >= 200) {
      punchline = 'Машина продуктивности! Пока остальные придумывали отмазки, ты методично перемалывал цели весь год.';
    } else if (activeDays >= 80) {
      punchline = 'Солидный год! Были паузы, но стрик не умер, а лень была успешно отправлена в нокаут.';
    } else {
      punchline = 'Год контрастов. Главное, что трекер живой и ты не сдаешься — врубай турборежим!';
    }
  } else if (tone === 'ironic') {
    if (activeDays >= 200) {
      punchline = 'Официально зафиксировано: 52 недели системного превозмогания бытия и гравитации дивана.';
    } else if (activeDays >= 80) {
      punchline = 'Периодическая победа разума над хаосом. Теория вероятностей аплодирует стоя.';
    } else {
      punchline = 'Вклад в развитие трекера и тестирование устойчивости к прокрастинации успешно принят.';
    }
  } else {
    if (activeDays >= 200) {
      punchline = 'Исключительная дисциплина и постоянство. Превосходный результат годовой активности!';
    } else if (activeDays >= 80) {
      punchline = 'Уверенный прогресс и устойчивый ритм на протяжении 52 недель.';
    } else {
      punchline = 'Хорошая база для развития привычек и системного роста в новом цикле.';
    }
  }

  return {
    year,
    totalCheckins,
    activeDays,
    activeDaysPercent,
    completedTasksCount,
    bestStreak,
    shieldsUsed,
    punchline,
    gridCells,
  };
}

export const YearlyContributionShareModal: React.FC<YearlyContributionShareModalProps> = ({
  isOpen,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const habits = useTrackerStore((state) => state.habits);
  const tasks = useTrackerStore((state) => state.tasks);
  const tone = useTrackerStore((state) => state.tone);
  const theme = useTrackerStore((state) => state.theme);

  useEffect(() => {
    if (isOpen) {
      playAnnualReportFanfare();
      confetti({
        particleCount: 50,
        spread: 75,
        origin: { y: 0.5 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const stats = calculateYearlyStats(habits, tasks, tone);

  const handleCopyImage = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    playShareSound();

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#090d16',
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsExporting(false);
          return;
        }

        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2500);
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `living-tracker-year-${stats.year}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        } catch {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `living-tracker-year-${stats.year}.png`;
          a.click();
          URL.revokeObjectURL(url);
        } finally {
          setIsExporting(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to export yearly contribution card:', err);
      setIsExporting(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    playShareSound();

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#090d16',
      });

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `living-tracker-year-${stats.year}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to download yearly card:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-xl bg-surface-card border border-surface-border rounded-3xl p-4 sm:p-6 shadow-2xl text-left my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-surface-border mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Годовая карта активности (365 дней)
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                    52 недели
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Готовая карточка для шеринга в соцсетях и Telegram
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

          {/* Printable / Shareable Card Container (1080x1080 styled canvas) */}
          <div className="overflow-hidden rounded-2xl border border-surface-border bg-slate-950/70 p-1 mb-4">
            <div
              ref={cardRef}
              data-theme={theme}
              className="w-full bg-gradient-to-b from-[#090d16] via-[#101726] to-[#090d16] text-white p-5 sm:p-6 rounded-xl border border-white/10 relative overflow-hidden shadow-2xl"
            >
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

              {/* Card Header */}
              <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-lg font-black">
                    ⚡
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-accent font-bold">
                      Living Tracker • Annual Report
                    </div>
                    <div className="text-lg font-black tracking-tight text-white">
                      Активность {stats.year} • 52 Недели
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/15 text-xs font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>365 дней</span>
                </div>
              </div>

              {/* 52-Week Contribution Matrix Heatmap Grid */}
              <div className="relative z-10 mb-4 bg-black/40 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
                  <span>52 недели активности (GitHub Heatmap)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">Меньше</span>
                    <span className="w-2 h-2 rounded-xs bg-slate-800" />
                    <span className="w-2 h-2 rounded-xs bg-emerald-900/60" />
                    <span className="w-2 h-2 rounded-xs bg-emerald-700" />
                    <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                    <span className="w-2 h-2 rounded-xs bg-emerald-400" />
                    <span className="text-[10px] text-slate-500">Больше</span>
                  </div>
                </div>

                {/* Grid rendered in 52 columns x 7 rows */}
                <div className="grid grid-flow-col grid-rows-7 gap-0.5 sm:gap-1 overflow-x-auto pb-1 max-w-full">
                  {stats.gridCells.map((cell) => {
                    let bg = 'bg-slate-800/80';
                    if (cell.level === 1) bg = 'bg-emerald-900/80';
                    else if (cell.level === 2) bg = 'bg-emerald-700';
                    else if (cell.level === 3) bg = 'bg-emerald-500';
                    else if (cell.level === 4) bg = 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]';

                    return (
                      <div
                        key={cell.date}
                        title={`${cell.date}: ${cell.count} действий`}
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-xs transition-colors ${bg}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 4 Annual Metric Counters */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Всего чекинов</div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">
                    {stats.totalCheckins}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Активных дней</div>
                  <div className="text-xl font-black text-accent mt-0.5">
                    {stats.activeDays} <span className="text-xs text-slate-500">/ 364</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Задач закрыто</div>
                  <div className="text-xl font-black text-purple-400 mt-0.5">
                    {stats.completedTasksCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Лучший стрик</div>
                  <div className="text-xl font-black text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4 fill-amber-400" />
                    {stats.bestStreak}д
                  </div>
                </div>
              </div>

              {/* Punchline Quote */}
              <div className="relative z-10 p-3 rounded-xl bg-accent/10 border border-accent/30 mb-3">
                <div className="text-[11px] font-semibold text-slate-200 italic leading-relaxed">
                  "{stats.punchline}"
                </div>
              </div>

              {/* Footer */}
              <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  SQLite v12 • Offline First • Zero Server
                </span>
                <span className="font-mono text-slate-500">github.com/00DaEdRa00/living-tracker</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleCopyImage}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-slate-950 font-extrabold text-xs hover:bg-accent/90 transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span>{copySuccess ? 'Скопировано! ✓' : 'Копировать PNG'}</span>
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadImage}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-white font-bold text-xs hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Скачать PNG</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-slate-400 font-bold text-xs hover:text-white transition-all cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default YearlyContributionShareModal;
