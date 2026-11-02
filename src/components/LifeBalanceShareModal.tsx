import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import {
  X,
  Share2,
  Download,
  Copy,
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
  Zap,
  Target,
  ShieldCheck,
} from 'lucide-react';
import { useTrackerStore } from '../store/useTrackerStore';
import { LIFE_SPHERES, calculateLifeBalanceScore } from './TasksSection';
import { playShareSound, playSummaryFanfareSound } from '../lib/soundFx';
import type { ToneMode } from '../types/tracker';

interface LifeBalanceShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function getLifeBalancePunchline(balanceScore: number, tone: ToneMode): string {
  if (balanceScore >= 80) {
    if (tone === 'sassy') {
      return 'Абсолютный баланс и тотальный контроль! Пока другие распыляются, все 6 сфер жизни заряжены на 100%.';
    }
    if (tone === 'ironic') {
      return 'Колесо баланса настолько идеальное, что на нем можно уехать в закат. Никакого выгорания, только дзен.';
    }
    return 'Великолепная гармония ключевых сфер жизни. Высокая продуктивность при сохранении здоровья и отдыха.';
  }

  if (balanceScore >= 50) {
    if (tone === 'sassy') {
      return 'Твердая база собрана, но пара сфер проседают. Подтяни хвосты и сделай жизнь пуленепробиваемой!';
    }
    if (tone === 'ironic') {
      return 'Колесо баланса немного восьмерит, но едет! Главное — не забывать про сон и реальную жизнь.';
    }
    return 'Уверенный прогресс. Равномерное распределение усилий между работой, здоровьем и личными целями.';
  }

  if (tone === 'sassy') {
    return 'Перекос обнаружен! Хватит зацикливаться на одном — добавь огня в остальные сферы!';
  }
  if (tone === 'ironic') {
    return 'Работа кипит, а баланс слегка в коме. Пора разбавить рутину спортом и хобби!';
  }
  return 'Начало формирования баланса. Обратите внимание на отстающие сферы для устойчивого роста.';
}

export const LifeBalanceShareModal: React.FC<LifeBalanceShareModalProps> = ({ isOpen, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const tasks = useTrackerStore((state) => state.tasks);
  const habits = useTrackerStore((state) => state.habits);
  const tone = useTrackerStore((state) => state.tone);
  const theme = useTrackerStore((state) => state.theme);
  const freezeShields = useTrackerStore((state) => state.freezeShields ?? 3);

  if (!isOpen) return null;

  const { score: balanceScore, counts: sphereCounts } = calculateLifeBalanceScore(tasks);
  const punchline = getLifeBalancePunchline(balanceScore, tone);

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);
  const todayStr = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const generateCanvas = async () => {
    if (!cardRef.current) return null;
    return await html2canvas(cardRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#090d16',
    });
  };

  const handleCopyImage = async () => {
    setCopying(true);
    setAlertMsg(null);
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      playShareSound();
      playSummaryFanfareSound();

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setCopying(false);
          return;
        }

        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setAlertMsg('Карточка скопирована в буфер обмена! 🚀');
          } else {
            handleDownload();
            setAlertMsg('Файл карточки сохранен на диск 📥');
          }
          confetti({
            particleCount: 45,
            spread: 55,
            origin: { y: 0.65 },
          });
        } catch {
          handleDownload();
          setAlertMsg('Картинка скачана на устройство 📥');
        } finally {
          setCopying(false);
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Copy balance card error:', err);
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
      a.download = `living-tracker-life-balance-${Date.now()}.png`;
      a.click();
      setAlertMsg('Карточка успешно скачана! 📥');

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
      });
    } catch (err) {
      console.warn('Download error:', err);
      setAlertMsg('Ошибка скачивания');
    } finally {
      setCopying(false);
    }
  };

  const handleCopyText = async () => {
    const shareText =
      `🌐 «Живой трекер» — Колесо жизненного баланса\n\n` +
      `⚡ Оценка баланса: ${balanceScore}% из 100%\n` +
      `🎯 Закрыто задач: ${completedTasksCount}\n` +
      `🔥 Текущий стрик: ${maxStreak} дн. (рекорд: ${bestStreak} дн.)\n` +
      `🛡️ Щиты от выгорания: ${freezeShields}\n\n` +
      `«${punchline}»\n\n` +
      `living-tracker.app • Твой персональный командный центр`;

    try {
      await navigator.clipboard.writeText(shareText);
      setAlertMsg('Текст сводки скопирован! 📋');
      playShareSound();
    } catch {
      setAlertMsg('Не удалось скопировать текст');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl text-left overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-accent/20 border border-accent/40 text-accent">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Карточка жизненного баланса
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                    Radar 1080p
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Визуализация колеса жизни и стриков для сторис и отчетов
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

          {/* Visual Share Card (Export Target) */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div
              ref={cardRef}
              className="p-6 rounded-3xl bg-[#090d16] border border-cyan-500/30 text-white relative overflow-hidden shadow-2xl"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {/* Background gradient decorative glow */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Card Header */}
              <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Zap className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-sm font-black tracking-tight flex items-center gap-1.5">
                      <span>Живой трекер</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                        LIFE RADAR
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{todayStr}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Баланс
                  </div>
                  <div className="text-2xl font-black text-cyan-400">
                    {balanceScore}%
                  </div>
                </div>
              </div>

              {/* Life Spheres Grid */}
              <div className="relative z-10 py-5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                  <span>Распределение по 6 сферам жизни</span>
                  <span className="text-cyan-400 font-mono text-[11px]">
                    {Object.values(sphereCounts).reduce((a, b) => a + b, 0)} задач в базе
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {LIFE_SPHERES.filter((s) => s.id !== 'all').map((sphere) => {
                    const count = sphereCounts[sphere.id] || 0;
                    return (
                      <div
                        key={sphere.id}
                        className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl select-none">{sphere.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-slate-200">
                              {sphere.label}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {count} {count === 1 ? 'задача' : count > 4 ? 'задач' : 'задачи'}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {count > 0 ? `+${count}` : '0'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats Highlights Bar */}
              <div className="relative z-10 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-around text-center my-1">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Выполнено задач
                  </div>
                  <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                    {completedTasksCount}
                  </div>
                </div>
                <div className="w-[1px] h-7 bg-slate-800" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Макс. стрик
                  </div>
                  <div className="text-base font-extrabold text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{maxStreak} дн.</span>
                  </div>
                </div>
                <div className="w-[1px] h-7 bg-slate-800" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Щиты заморозки
                  </div>
                  <div className="text-base font-extrabold text-sky-400 mt-0.5 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{freezeShields}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Tone Punchline */}
              <div className="relative z-10 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-purple-950/40 border border-cyan-500/20 text-xs italic text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-cyan-300 not-italic mr-1.5">
                    Вердикт ({tone}):
                  </span>
                  <span>«{punchline}»</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="relative z-10 pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>living-tracker.app • Персональный командный центр</span>
                <span className="font-mono">Tauri 2.0 • Web Audio</span>
              </div>
            </div>
          </div>

          {/* Action Alerts */}
          {alertMsg && (
            <div className="mt-3 p-2 rounded-xl bg-accent/20 border border-accent/40 text-accent text-xs font-bold text-center">
              {alertMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 mt-2 border-t border-surface-border flex items-center justify-between shrink-0 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface hover:bg-slate-800 text-slate-300 text-xs font-bold border border-surface-border transition-colors cursor-pointer"
            >
              Закрыть
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyImage}
                disabled={copying}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-purple-600 hover:opacity-90 text-slate-950 font-black text-xs shadow-lg shadow-accent/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                <span>{copying ? 'Экспорт...' : 'Копировать в буфер'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={copying}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Скачать PNG</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Текст TG</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
