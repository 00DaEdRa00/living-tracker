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
  CheckCircle2,
  Trophy,
  Sparkles,
  Calendar,
  Layers,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { ToneMode } from '../types/tracker';
import { useTrackerStore } from '../store/useTrackerStore';
import { playShareSound, playClickSound, playSummaryFanfareSound } from '../lib/soundFx';

interface DailySummaryShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function getDailyPunchline(
  stats: {
    completedTasks: number;
    pendingTasks: number;
    completedHabits: number;
    totalHabits: number;
    spentToday: number;
    monthlyBudget: number;
  },
  tone: ToneMode
): string {
  const allTasksDone = stats.pendingTasks === 0 && stats.completedTasks > 0;
  const allHabitsDone = stats.totalHabits > 0 && stats.completedHabits === stats.totalHabits;

  if (tone === 'sassy') {
    if (allTasksDone && allHabitsDone) {
      return 'Абсолютный разнос! Все задачи закрыты, стрики горят, дисциплина титана. Завистники кусают локти!';
    }
    if (allTasksDone) {
      return 'Все дела на сегодня раскатаны в блин! Никаких отговорок — день прожит с максимальной отдачей.';
    }
    if (allHabitsDone) {
      return 'Стрики в огне! Дисциплина железная, тело и разум в строю. Завтра повторяем!';
    }
    if (stats.completedTasks > 0 || stats.completedHabits > 0) {
      return 'Прогресс зафиксирован! Движение идет, слабость отменяется — дожимаем день до конца!';
    }
    return 'День в разгаре! Хватит медитировать на монитор — пора вычеркивать цели из списка!';
  }

  if (tone === 'ironic') {
    if (allTasksDone && allHabitsDone) {
      return '100% результат. Где-то в параллельной вселенной мой прокрастинатор плачет от зависти.';
    }
    if (allTasksDone) {
      return 'План выполнен. Теперь можно с кристально чистой совестью лежать и смотреть в потолок.';
    }
    if (allHabitsDone) {
      return 'Привычки закрыты. Организм в шоке от такой внезапной и пугающей осознанности.';
    }
    if (stats.completedTasks > 0 || stats.completedHabits > 0) {
      return 'Не нулевой день — уже повод для гордости перед зеркалом.';
    }
    return 'Великие дела требуют времени. А пока можно еще раз перепроверить список задач.';
  }

  // neutral
  if (allTasksDone && allHabitsDone) {
    return 'Идеальный день продуктивности. Все задачи и ежедневные ритуалы выполнены в полном объеме.';
  }
  if (allTasksDone) {
    return 'Все запланированные задачи успешно закрыты. Отличный фокус и системный результат.';
  }
  if (allHabitsDone) {
    return 'Все привычки выполнены сегодня. Непрерывность и устойчивая дисциплина.';
  }
  if (stats.completedTasks > 0 || stats.completedHabits > 0) {
    return 'Уверенный прогресс по ключевым направлениям дня. Каждый шаг приближает к целям.';
  }
  return 'Дневная сводка активностей: планирование и баланс сфер жизни.';
}

export const DailySummaryShareModal: React.FC<DailySummaryShareModalProps> = ({
  isOpen,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const globalTone = useTrackerStore((state) => state.tone);
  const tasks = useTrackerStore((state) => state.tasks);
  const habits = useTrackerStore((state) => state.habits);
  const budget = useTrackerStore((state) => state.budget);
  const transactions = useTrackerStore((state) => state.transactions);

  const [currentTone, setCurrentTone] = useState<ToneMode>(globalTone);
  const [copying, setCopying] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayIso = new Date().toISOString().split('T')[0];
  const todayFormatted = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const completedHabits = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;

  const spentToday = transactions
    .filter((tx) => tx.date && tx.date.startsWith(todayIso) && (tx.type === 'expense' || !tx.type))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  const stats = {
    completedTasks,
    pendingTasks,
    completedHabits,
    totalHabits,
    spentToday,
    monthlyBudget: budget.monthlyLimit,
  };

  const punchline = getDailyPunchline(stats, currentTone);

  const taskPercent =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const habitPercent =
    totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

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
            setAlertMsg('Карточка скопирована в буфер обмена! 📸');
          } else {
            handleDownload();
            setAlertMsg('Буфер картинок недоступен, файл сохранен на диск 📥');
          }
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {
          handleDownload();
          setAlertMsg('Буфер картинок заблокирован системой, файл скачан 📥');
        } finally {
          setCopying(false);
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Share copy error:', err);
      setCopying(false);
      setAlertMsg('Ошибка экспорта карточки');
    }
  };

  const handleDownload = async () => {
    setCopying(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      playShareSound();
      playSummaryFanfareSound();

      const image = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = image;
      a.download = `living-tracker-daily-summary-${todayIso}.png`;
      a.click();
      setAlertMsg('Карточка успешно скачана! 📥');

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch (err) {
      console.warn('Share download error:', err);
      setAlertMsg('Ошибка скачивания карточки');
    } finally {
      setCopying(false);
    }
  };

  const handleCopyText = async () => {
    const shareText = `📊 «Живой трекер» — Сводка за ${todayFormatted}\n\n` +
      `🎯 Задачи: ${completedTasks} закрыто / ${pendingTasks} в работе (${taskPercent}%)\n` +
      `🔥 Привычки: ${completedHabits} из ${totalHabits} выполнено (${habitPercent}%), макс. стрик: ${maxStreak} дн.\n` +
      `💰 Финансы: ${spentToday.toLocaleString('ru-RU')} ₽ за сегодня\n\n` +
      `«${punchline}»\n\n` +
      `⚡ living-tracker.app • Твой персональный командный центр`;

    try {
      await navigator.clipboard.writeText(shareText);
      playClickSound();
      setAlertMsg('Текст сводки скопирован для Telegram! 📋');
    } catch {
      setAlertMsg('Не удалось скопировать текст');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-surface-card rounded-3xl border border-surface-border shadow-2xl overflow-hidden my-auto"
        >
          {/* Верхняя шапка модалки */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-border bg-surface/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-accent/20">
                <Share2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Поделиться сводкой дня
                </h3>
                <p className="text-xs text-slate-400">
                  Готовая карточка 1080×1080 для соцсетей и мессенджеров
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface border border-transparent hover:border-surface-border transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Переключатель тона */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-surface border border-surface-border">
              <span className="text-xs font-semibold text-slate-400 pl-2">
                Тон панчлайна:
              </span>
              <div className="flex items-center gap-1">
                {(['neutral', 'ironic', 'sassy'] as ToneMode[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setCurrentTone(t);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentTone === t
                        ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'neutral' ? 'Спокойный' : t === 'ironic' ? 'Ирония' : 'Дерзкий'}
                  </button>
                ))}
              </div>
            </div>

            {/* Карточка шеринга для рендера в canvas (1080x1080 пропорции) */}
            <div className="relative mx-auto rounded-3xl p-6 sm:p-7 bg-gradient-to-b from-[#111827] via-[#0b101c] to-[#090d16] border border-surface-border shadow-2xl max-w-md overflow-hidden text-left"
              ref={cardRef}
            >
              {/* Фоновые декоративные сферы */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Логотип и заголовок */}
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌱</span>
                  <div>
                    <h4 className="text-sm font-black text-white tracking-wider uppercase">
                      Живой трекер
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 capitalize">
                      {todayFormatted}
                    </span>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-[11px] font-bold text-accent flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Дневной отчёт</span>
                </div>
              </div>

              {/* Сетка метрик дня */}
              <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
                <div className="p-3.5 rounded-2xl bg-surface-card/90 border border-surface-border">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                      Задачи
                    </span>
                    <span className="font-bold text-white">{taskPercent}%</span>
                  </div>
                  <div className="text-lg font-black text-white">
                    {completedTasks}{' '}
                    <span className="text-xs font-normal text-slate-400">/ {tasks.length}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${taskPercent}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-card/90 border border-surface-border">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Привычки
                    </span>
                    <span className="font-bold text-white">{habitPercent}%</span>
                  </div>
                  <div className="text-lg font-black text-white">
                    {completedHabits}{' '}
                    <span className="text-xs font-normal text-slate-400">/ {totalHabits}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full"
                      style={{ width: `${habitPercent}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-card/90 border border-surface-border">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 mb-1">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Макс. стрик</span>
                  </div>
                  <div className="text-lg font-black text-amber-400">
                    {maxStreak} <span className="text-xs font-normal text-slate-300">дней 🔥</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-card/90 border border-surface-border">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 mb-1">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Расходы за день</span>
                  </div>
                  <div className="text-lg font-black text-emerald-400">
                    {spentToday.toLocaleString('ru-RU')}{' '}
                    <span className="text-xs font-normal text-slate-300">₽</span>
                  </div>
                </div>
              </div>

              {/* Панчлайн дня */}
              <div className="p-4 rounded-2xl bg-surface-card/90 border border-surface-border mb-4 relative z-10">
                <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span>⚡ Вердикт дня:</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-snug italic">
                  «{punchline}»
                </p>
              </div>

              {/* Футер карточки с брендингом */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 relative z-10">
                <span>living-tracker.app</span>
                <span className="flex items-center gap-1 text-slate-300 font-semibold">
                  <span>Персональный командный центр</span>
                </span>
              </div>
            </div>

            {/* Сообщение об успешном действии */}
            {alertMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-xl bg-accent/20 border border-accent/40 text-accent text-xs font-bold text-center"
              >
                {alertMsg}
              </motion.div>
            )}

            {/* Кнопки действий */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                disabled={copying}
                onClick={handleCopyImage}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-accent text-slate-950 font-bold text-xs shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all cursor-pointer disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                <span>{copying ? 'Рендер...' : 'Скопировать PNG'}</span>
              </button>

              <button
                type="button"
                disabled={copying}
                onClick={handleDownload}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Скачать PNG</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Текст для TG</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};