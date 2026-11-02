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
} from 'lucide-react';
import type { Habit, ToneMode } from '../types/tracker';
import { useTrackerStore } from '../store/useTrackerStore';
import { playShareSound, playClickSound } from '../lib/soundFx';
import { getHeatmapDays } from './HabitsSection';

interface HabitShareModalProps {
  habit: Habit | null;
  onClose: () => void;
}

export function getHabitStreakPunchline(habit: Habit, tone: ToneMode): string {
  const streak = habit.streak;

  if (tone === 'sassy') {
    if (streak >= 30) return '30+ дней непрерывного огня! Дисциплина титана, отговорки идут лесом.';
    if (streak >= 14) return 'Две недели в режиме зверя. Пока слабаки ищут мотивацию, я просто делаю.';
    if (streak >= 7) return 'Недельный стрик! Попробуй повторить, диванный эксперт.';
    if (streak >= 3) return 'Три дня подряд. Разогрев закончен — назад дороги нет!';
    if (streak >= 1) return 'День первый в кармане. Только попробуй завтра слиться!';
    return 'Стрик перезапущен. Но боевой дух не сломлен — завтра рвем вперед!';
  }

  if (tone === 'ironic') {
    if (streak >= 30) return 'Месяц дисциплины. Кажется, пора заводить блог о том, как я превзошел эту вселенную.';
    if (streak >= 14) return 'Две недели стабильности. Друзья уже шепчутся, не попал ли я в секту осознанности.';
    if (streak >= 7) return '7 дней подряд! Мой внутренний прокрастинатор в глубокой депрессии.';
    if (streak >= 3) return 'Три дня подряд. Наука бессильна объяснить эту аномальную продуктивность.';
    if (streak >= 1) return 'Один день сделал — уже чувствую, как меняется судьба.';
    return 'Тактическое отступление для перегруппировки мотивационных ресурсов.';
  }

  // neutral tone
  if (streak >= 30) return '30+ дней осознанной практики. Привычка интегрирована в повседневный ритм жизни.';
  if (streak >= 14) return 'Две недели непрерывного фокуса и системной работы над собой.';
  if (streak >= 7) return '7 дней регулярного прогресса. Отличная основа для устойчивого результата.';
  if (streak >= 3) return '3 дня подряд. Заложен правильный импульс для долгосрочной дисциплины.';
  if (streak >= 1) return 'Первый шаг сделан. Главное — сохранять последовательность.';
  return 'Новый старт. Каждый день — это возможность начать сначала.';
}

export const HabitShareModal: React.FC<HabitShareModalProps> = ({ habit, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const globalTone = useTrackerStore((state) => state.tone);
  const [currentTone, setCurrentTone] = useState<ToneMode>(globalTone);
  const [copying, setCopying] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  if (!habit) return null;

  const punchline = getHabitStreakPunchline(habit, currentTone);
  const heatmapDays = getHeatmapDays(28);
  const completedHistory = new Set(habit.history || []);
  const frozenDates = new Set(habit.frozenDates || []);
  const todayStr = new Date().toISOString().split('T')[0];

  const completedIn28Days = heatmapDays.filter(
    (d) => completedHistory.has(d) || (d === todayStr && habit.completedToday)
  ).length;
  const frozenIn28Days = heatmapDays.filter((d) => frozenDates.has(d)).length;
  const consistencyPercent = Math.round(((completedIn28Days + frozenIn28Days) / 28) * 100);

  const streakDays = habit.streak;
  const streakFlameColor =
    streakDays >= 30
      ? 'from-amber-400 via-rose-500 to-purple-600'
      : streakDays >= 14
      ? 'from-amber-400 to-rose-500'
      : streakDays >= 7
      ? 'from-amber-400 to-orange-500'
      : 'from-amber-400 to-yellow-500';

  const shareText = `🔥 «Живой трекер» — Серия привычки!\n${habit.icon || '🎯'} ${habit.title}\n⚡ Стрик: ${streakDays} ${streakDays === 1 ? 'день' : streakDays < 5 ? 'дня' : 'дней'} подряд (Рекорд: ${habit.bestStreak || streakDays})\n«${punchline}»\nСтабильность за 4 недели: ${consistencyPercent}%\n⚡ living-tracker.app`;

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
      if (!canvas) throw new Error('Canvas not generated');

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
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        playShareSound();
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#ef4444', '#38bdf8'],
          });
        } catch {
          // no-op
        }
        setAlertMsg('Карточка скопирована в буфер обмена! Вставь в Telegram через Ctrl+V');
        setTimeout(() => setAlertMsg(null), 4000);
      } else {
        await navigator.clipboard.writeText(shareText);
        playShareSound();
        setAlertMsg('Текст стрика скопирован!');
        setTimeout(() => setAlertMsg(null), 3000);
      }
    } catch (err) {
      console.warn('Image clipboard write failed, fallback to text:', err);
      try {
        await navigator.clipboard.writeText(shareText);
        setAlertMsg('Текст стрика скопирован в буфер!');
        setTimeout(() => setAlertMsg(null), 3000);
      } catch {
        setAlertMsg('Не удалось скопировать. Нажмите «Скачать PNG»');
        setTimeout(() => setAlertMsg(null), 3500);
      }
    } finally {
      setCopying(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current || copying) return;
    try {
      setCopying(true);
      const canvas = await generateCanvas();
      if (!canvas) return;

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const a = document.createElement('a');
      const safeTitle = habit.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_').toLowerCase();
      a.download = `streak-${safeTitle}-${todayStr}.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      playShareSound();
      setAlertMsg('Карточка успешно скачана в PNG!');
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err) {
      console.error('Download card error:', err);
      setAlertMsg('Ошибка при скачивании карточки');
      setTimeout(() => setAlertMsg(null), 3000);
    } finally {
      setCopying(false);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      playClickSound();
      setAlertMsg('Текст стрика скопирован в буфер!');
      setTimeout(() => setAlertMsg(null), 3000);
    } catch {
      setAlertMsg('Не удалось скопировать текст');
      setTimeout(() => setAlertMsg(null), 3000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-surface-card border border-surface-border rounded-3xl p-5 sm:p-6 shadow-2xl my-auto"
        >
          {/* Кнопка закрытия */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Заголовок модалки */}
          <div className="mb-4 text-left">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-accent" />
              <span>Карточка стрика (html2canvas)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Поделись своей серией привычки в соцсетях или отправь друзьям в Telegram.
            </p>
          </div>

          {/* Переключатель тона внутри модалки */}
          <div className="flex items-center justify-between mb-4 p-2 bg-slate-900/60 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300 ml-2">Тон карточки:</span>
            <div className="flex items-center gap-1">
              {(['neutral', 'ironic', 'sassy'] as ToneMode[]).map((tMode) => (
                <button
                  key={tMode}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setCurrentTone(tMode);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentTone === tMode
                      ? 'bg-accent text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tMode === 'neutral'
                    ? 'Сдержанный'
                    : tMode === 'ironic'
                    ? 'Ироничный'
                    : 'Дерзкий'}
                </button>
              ))}
            </div>
          </div>

          {/* ЭКСПОРТИРУЕМАЯ КАРТОЧКА (html2canvas target) */}
          <div
            ref={cardRef}
            className="relative overflow-hidden rounded-3xl p-5 sm:p-6 text-center select-none border border-amber-500/30"
            style={{
              backgroundColor: '#0c121e',
              boxShadow: '0 0 35px rgba(245, 158, 11, 0.25), inset 0 0 25px rgba(0,0,0,0.8)',
            }}
          >
            {/* Градиентное свечение */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 bg-amber-500" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-black/60 pointer-events-none" />

            {/* Верхняя строка карточки */}
            <div className="relative z-10 flex items-center justify-between gap-2 pb-3 border-b border-white/10 text-left">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 shadow-md">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-black text-white leading-none">
                    Живой трекер
                  </div>
                  <div className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider mt-0.5">
                    Дисциплина & Стрик
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <span>{habit.category || 'Привычка'}</span>
              </span>
            </div>

            {/* Иконка и Название привычки */}
            <div className="relative z-10 my-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/30 border border-amber-500/40 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">
                {habit.icon || '🎯'}
              </div>
              <h4 className="mt-2 text-xl font-black text-white tracking-tight">
                {habit.title}
              </h4>
              {habit.description && (
                <p className="text-xs text-slate-300 mt-0.5 max-w-xs line-clamp-1">
                  {habit.description}
                </p>
              )}
            </div>

            {/* Блок огненного стрика */}
            <div className="relative z-10 my-3 p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-surface to-rose-950/40 border border-amber-500/40 flex items-center justify-around">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
                  <Flame className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>{streakDays}</span>
                </div>
                <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mt-0.5">
                  {streakDays === 1 ? 'День стрика' : streakDays < 5 ? 'Дня стрика' : 'Дней стрика'}
                </div>
              </div>

              <div className="w-px h-8 bg-white/10" />

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-slate-200">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>{habit.bestStreak || streakDays} дн.</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  Лучший рекорд
                </div>
              </div>

              <div className="w-px h-8 bg-white/10" />

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-sky-300">
                  <Snowflake className="w-4 h-4 text-sky-400" />
                  <span>{frozenDates.size}/2</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  Заморозок
                </div>
              </div>
            </div>

            {/* Мини-тепловая карта 28 дней */}
            <div className="relative z-10 p-3 bg-black/40 rounded-2xl border border-white/10 my-3">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-accent" />
                  <span>Активность за 28 дней:</span>
                </div>
                <span className="text-emerald-400 font-bold">
                  {consistencyPercent}% стабильности
                </span>
              </div>

              {/* Сетка 4 недели x 7 дней */}
              <div className="grid grid-cols-7 gap-1.5 justify-center">
                {heatmapDays.map((dateStr) => {
                  const isCompleted =
                    completedHistory.has(dateStr) ||
                    (dateStr === todayStr && habit.completedToday);
                  const isFrozen = frozenDates.has(dateStr);
                  const isToday = dateStr === todayStr;

                  let bgClass = 'bg-slate-800/80 border-slate-700/60 text-transparent';
                  if (isCompleted) {
                    bgClass = 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold';
                  } else if (isFrozen) {
                    bgClass = 'bg-sky-500/80 border-sky-400 text-white';
                  }

                  return (
                    <div
                      key={dateStr}
                      className={`h-5 rounded-md border flex items-center justify-center text-[9px] transition-all ${bgClass} ${
                        isToday ? 'ring-2 ring-accent ring-offset-1 ring-offset-slate-900' : ''
                      }`}
                    >
                      {isCompleted ? '✓' : isFrozen ? '❄' : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Цитата в выбранном тоне */}
            <div className="relative z-10 p-3 bg-white/[0.04] border border-white/10 rounded-2xl text-left my-2">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-accent mb-1">
                <Sparkles className="w-3 h-3 text-accent" />
                <span>
                  {currentTone === 'sassy'
                    ? 'Дерзкий вердикт'
                    : currentTone === 'ironic'
                    ? 'Ироничный взгляд'
                    : 'Мотивация'}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium italic">
                «{punchline}»
              </p>
            </div>

            {/* Нижняя подпись */}
            <div className="relative z-10 pt-2 text-[10px] text-slate-500 font-semibold tracking-wider flex items-center justify-between">
              <span>⚡ living-tracker.app</span>
              <span>Командный центр дисциплины</span>
            </div>
          </div>

          {/* Плашка с уведомлением */}
          {alertMsg && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-2.5 rounded-xl bg-accent/20 border border-accent/40 text-accent text-xs font-bold text-center"
            >
              {alertMsg}
            </motion.div>
          )}

          {/* Кнопки действий */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              disabled={copying}
              onClick={handleCopyImage}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-black text-xs shadow-lg shadow-accent/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span>Копировать PNG</span>
            </button>

            <button
              type="button"
              disabled={copying}
              onClick={handleDownloadImage}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Скачать PNG</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Текст стрика</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
