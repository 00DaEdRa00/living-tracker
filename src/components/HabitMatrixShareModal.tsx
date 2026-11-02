import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import {
  X,
  Share2,
  Download,
  Copy,
  Flame,
  Snowflake,
  Trophy,
  Zap,
  Sparkles,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import type { Habit, ToneMode } from '../types/tracker';
import { useTrackerStore } from '../store/useTrackerStore';
import { playShareSound, playClickSound, playSummaryFanfareSound } from '../lib/soundFx';
import { getHeatmapDays } from './HabitsSection';

interface HabitMatrixShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function getHabitsMatrixPunchline(
  stats: {
    totalHabits: number;
    completedToday: number;
    avgStreak: number;
    bestStreak: number;
    consistencyPercent: number;
  },
  tone: ToneMode
): string {
  const { consistencyPercent, completedToday, totalHabits } = stats;
  const allToday = totalHabits > 0 && completedToday === totalHabits;

  if (tone === 'sassy') {
    if (allToday || consistencyPercent >= 85) {
      return 'Каток дисциплины на полной мощности! Никаких соплей и отговорок, стрики горят адским пламенем!';
    }
    if (consistencyPercent >= 60) {
      return 'Держим удар. Не идеально, но на две головы выше тех, кто остался залипать на диване!';
    }
    return 'Матрица привычек в режиме перезагрузки. Собрали яйца в кулак и погнали заново!';
  }

  if (tone === 'ironic') {
    if (allToday || consistencyPercent >= 85) {
      return 'Уровень осознанности зашкаливает. Кажется, пора открывать свой платный марафон успешного успеха.';
    }
    if (consistencyPercent >= 60) {
      return 'Баланс хаоса и порядка держится на тоненькой ниточке, но трекер фиксирует чистую победу.';
    }
    return 'Мотивационные цитаты временно бессильны, но научный эксперимент над собой продолжается.';
  }

  // neutral
  if (allToday || consistencyPercent >= 85) {
    return 'Высокая дисциплина и стабильное выполнение ключевых привычек за последние 4 недели.';
  }
  if (consistencyPercent >= 60) {
    return 'Уверенная системная работа и поддержание здорового ритма жизни.';
  }
  return 'Формирование новых полезных ритуалов. Регулярность важнее сиюминутного идеала.';
}

export const HabitMatrixShareModal: React.FC<HabitMatrixShareModalProps> = ({
  isOpen,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const habits = useTrackerStore((state) => state.habits);
  const currentTone = useTrackerStore((state) => state.tone);
  const freezeShields = useTrackerStore((state) => state.freezeShields ?? 3);

  if (!isOpen) return null;

  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => h.completedToday).length;
  const bestStreak = Math.max(0, ...habits.map((h) => h.bestStreak || h.streak || 0));
  const totalStreaks = habits.reduce((acc, h) => acc + (h.streak || 0), 0);
  const avgStreak = totalHabits > 0 ? Math.round(totalStreaks / totalHabits) : 0;

  // Calculate consistency over past 28 days
  const heatmapDays = getHeatmapDays(28);
  const todayStr = new Date().toISOString().split('T')[0];

  let totalCheckinsIn28Days = 0;
  habits.forEach((h) => {
    const historySet = new Set(h.history || []);
    const frozenSet = new Set(h.frozenDates || []);
    heatmapDays.forEach((d) => {
      if (historySet.has(d) || frozenSet.has(d) || (d === todayStr && h.completedToday)) {
        totalCheckinsIn28Days++;
      }
    });
  });

  const maxPossibleCheckins = totalHabits * 28;
  const consistencyPercent =
    maxPossibleCheckins > 0 ? Math.min(100, Math.round((totalCheckinsIn28Days / maxPossibleCheckins) * 100)) : 0;

  const stats = {
    totalHabits,
    completedToday,
    avgStreak,
    bestStreak,
    consistencyPercent,
  };

  const punchline = getHabitsMatrixPunchline(stats, currentTone);

  const shareText = `🔥 «Живой трекер» — Матрица привычек и дисциплины!\n📊 Закрыто сегодня: ${completedToday}/${totalHabits}\n⚡ Рекордный стрик: ${bestStreak} дн. | Средний: ${avgStreak} дн.\n📈 Стабильность за 4 недели: ${consistencyPercent}%\n🛡️ Банк щитов: ${freezeShields}\n«${punchline}»\n⚡ living-tracker.app`;

  const generateCanvas = async () => {
    if (!cardRef.current) return null;
    return await html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: '#0c121e',
      useCORS: true,
      logging: false,
    });
  };

  const handleCopyImage = async () => {
    if (!cardRef.current || copying) return;
    try {
      setCopying(true);
      const canvas = await generateCanvas();
      if (!canvas) throw new Error('Canvas generation failed');

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
      });

      if (!blob) throw new Error('Failed to create PNG blob');

      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof ClipboardItem !== 'undefined' &&
        navigator.clipboard.write
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }

      setCopied(true);
      playShareSound();
      try {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#38bdf8', '#34d399', '#ec4899'],
        });
      } catch {
        // safe
      }
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.warn('Failed to copy matrix image to clipboard:', err);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } finally {
      setCopying(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return;
    try {
      setDownloading(true);
      const canvas = await generateCanvas();
      if (!canvas) return;

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `living-tracker-habits-matrix-${todayStr}.png`;
      a.click();
      playShareSound();
    } catch (err) {
      console.warn('Failed to download image:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl text-left my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Flame className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  Карточка матрицы привычек
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                    1080×1080 HD
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Поделись общей стабильностью и стриками в соцсетях или Telegram
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

          {/* Превью генерируемой карточки (Ref для html2canvas) */}
          <div className="flex justify-center mb-6 overflow-hidden">
            <div
              ref={cardRef}
              style={{ width: '480px' }}
              className="relative p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a101d] to-[#120a1c] border-2 border-amber-500/30 shadow-2xl text-white select-none overflow-hidden"
            >
              {/* Фоновые декоративные круги */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Карточка: Шапка */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐱</span>
                  <div>
                    <div className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 bg-clip-text text-transparent">
                      Живой Трекер
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">
                      Система анти-выгорания & привычки
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" />
                    <span>{todayStr}</span>
                  </div>
                  <div className="text-[9px] text-slate-500">Матрица дисциплины</div>
                </div>
              </div>

              {/* Показатели в шапке */}
              <div className="grid grid-cols-3 gap-2 my-4 relative z-10">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-slate-400 font-semibold mb-0.5">Выполнено сегодня</div>
                  <div className="text-lg font-black text-amber-400">
                    {completedToday} <span className="text-xs text-slate-400 font-normal">/ {totalHabits}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-slate-400 font-semibold mb-0.5">Стабильность (28д)</div>
                  <div className="text-lg font-black text-emerald-400">{consistencyPercent}%</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-slate-400 font-semibold mb-0.5">Банк щитов</div>
                  <div className="text-lg font-black text-sky-400 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{freezeShields}</span>
                  </div>
                </div>
              </div>

              {/* Сетка списка активных привычек */}
              <div className="space-y-2 mb-4 relative z-10">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Привычки & Стрики</span>
                  <span className="text-amber-400 font-mono">Топ стрик: {bestStreak} дн.</span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-hidden">
                  {habits.slice(0, 5).map((h) => {
                    const isFrozen = (h.frozenDates || []).includes(todayStr);
                    return (
                      <div
                        key={h.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">{h.icon || '💧'}</span>
                          <span className="font-semibold text-slate-200 truncate">{h.title}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isFrozen ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              <Snowflake className="w-2.5 h-2.5" />
                              <span>Freeze</span>
                            </span>
                          ) : h.completedToday ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Выполнено</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">В процессе</span>
                          )}
                          <span className="flex items-center gap-0.5 text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                            <Flame className="w-3 h-3 fill-amber-400" />
                            <span>{h.streak} дн</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {habits.length > 5 && (
                    <div className="text-center text-[10px] text-slate-400 pt-0.5">
                      ...и еще {habits.length - 5} привычек в системе
                    </div>
                  )}
                </div>
              </div>

              {/* Цитата / Панчлайн в зависимости от тона */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 relative z-10">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    «{punchline}»
                  </p>
                </div>
              </div>

              {/* Футер карточки */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[9px] text-slate-400 relative z-10">
                <div className="flex items-center gap-1 font-mono text-slate-300">
                  <span>⚡ Tauri 2.0</span>
                  <span>•</span>
                  <span>SQLite Offline</span>
                  <span>•</span>
                  <span>CRDT P2P</span>
                </div>
                <div className="font-semibold text-accent flex items-center gap-1">
                  <span>living-tracker.app</span>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки действия */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-surface hover:bg-slate-800 text-slate-200 text-xs font-bold border border-surface-border transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Сохранение...' : 'Скачать PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyImage}
              disabled={copying}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Скопировано в буфер!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-950" />
                  <span>{copying ? 'Рендеринг...' : 'Копировать карточку'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HabitMatrixShareModal;