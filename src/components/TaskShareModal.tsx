import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import {
  X,
  Share2,
  Download,
  Copy,
  CheckCircle2,
  Sparkles,
  Calendar,
  Layers,
  Flame,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { Task, ToneMode } from '../types/tracker';
import { useTrackerStore } from '../store/useTrackerStore';
import { playShareSound, playClickSound } from '../lib/soundFx';

interface TaskShareModalProps {
  task: Task | null;
  onClose: () => void;
}

export function getTaskPunchline(task: Task, tone: ToneMode): string {
  const isCompleted = task.completed;

  if (isCompleted) {
    if (tone === 'sassy') {
      if (task.priority === 'high') {
        return 'Горящая цель раскатана в асфальт! Пока слабаки ныли о дедлайнах, дело уже сделано.';
      }
      return 'Вычеркнуто и закрыто! Минус одна задача — плюс тонна уверенности в себе.';
    }

    if (tone === 'ironic') {
      if (task.priority === 'high') {
        return 'Кризис века успешно предотвращен. Пожалуйста, аплодируйте стоя.';
      }
      return 'Сделал дело — теперь можно с чистой совестью листать мемы еще три часа.';
    }

    // neutral
    if (task.priority === 'high') {
      return 'Приоритетная задача успешно выполнена. Высокий фокус и качественный результат.';
    }
    return 'Задача закрыта вовремя. Дисциплина и последовательное движение к целям.';
  } else {
    // In progress
    if (tone === 'sassy') {
      return 'Цель зафиксирована в прицеле. Отговорки не принимаются — доводим до финиша!';
    }
    if (tone === 'ironic') {
      return 'План безупречен. Осталось совершить маленькое чудо и действительно его сделать.';
    }
    return 'Цель поставлена. Фокус на главном и регулярный прогресс каждый день.';
  }
}

export const TaskShareModal: React.FC<TaskShareModalProps> = ({ task, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const globalTone = useTrackerStore((state) => state.tone);
  const [currentTone, setCurrentTone] = useState<ToneMode>(globalTone);
  const [copying, setCopying] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  if (!task) return null;

  const punchline = getTaskPunchline(task, currentTone);
  const isCompleted = task.completed;

  const shareText = `🎯 «Живой трекер» — ${isCompleted ? 'Задача выполнена!' : 'План в фокусе!'}\n${
    task.icon || '📌'
  } ${task.title}\nСфера: ${task.category || 'Общее'} | Приоритет: ${
    task.priority === 'high' ? 'Высокий 🔥' : task.priority === 'medium' ? 'Средний ⚡' : 'Обычный'
  }\n«${punchline}»\n⚡ living-tracker.app`;

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
        setAlertMsg('Карточка скопирована в буфер обмена! (Ctrl+V)');
        playShareSound();
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // safe
        }
      } else {
        await navigator.clipboard.writeText(shareText);
        setAlertMsg('Текст задачи скопирован!');
        playShareSound();
      }
    } catch (err) {
      console.warn('Image copy failed, falling back to text:', err);
      try {
        await navigator.clipboard.writeText(shareText);
        setAlertMsg('Текст задачи скопирован!');
        playShareSound();
      } catch {
        setAlertMsg('Не удалось скопировать. Нажмите «Скачать PNG»');
      }
    } finally {
      setCopying(false);
      setTimeout(() => setAlertMsg(null), 3500);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `task-${task.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setAlertMsg('PNG сохранён на диск!');
      playShareSound();
    } catch (err) {
      console.warn('Download failed:', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-slate-900 border border-surface-border rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-accent/15 border border-accent/30 text-accent">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Карточка шеринга задачи</h3>
                <p className="text-xs text-slate-400">Генерация высокого разрешения для соцсетей</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tone Selector Pills */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-surface mb-5 border border-surface-border">
            <span className="text-[11px] font-bold text-slate-400 pl-2">Тон карточки:</span>
            <div className="flex gap-1">
              {(['neutral', 'ironic', 'sassy'] as ToneMode[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setCurrentTone(t);
                    playClickSound();
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    currentTone === t
                      ? 'bg-accent text-slate-950 shadow-md shadow-accent/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {t === 'neutral' ? 'Сдержанный' : t === 'ironic' ? 'Ирония' : 'Дерзкий'}
                </button>
              ))}
            </div>
          </div>

          {/* Shareable Card Area for html2canvas */}
          <div
            ref={cardRef}
            className="p-6 rounded-3xl bg-gradient-to-br from-[#0c121e] via-[#111927] to-[#182338] border border-cyan-500/30 shadow-[0_0_40px_rgba(56,189,248,0.15)] text-left relative overflow-hidden"
          >
            {/* Background image cover overlay if task has imageUrl */}
            {task.imageUrl && (
              <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                <img
                  src={task.imageUrl}
                  alt={task.title}
                  className="w-full h-full object-cover filter blur-sm scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c121e] via-[#0c121e]/80 to-transparent" />
              </div>
            )}

            {/* Top brand header */}
            <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-sm font-black text-white tracking-wider">ЖИВОЙ ТРЕКЕР</span>
              </div>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {isCompleted ? '✓ ВЫПОЛНЕНО' : '🎯 В РАБОТЕ'}
              </span>
            </div>

            {/* Task Main Content */}
            <div className="relative z-10 space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl select-none">{task.icon || '📌'}</span>
                <div>
                  <h4 className="text-xl font-black text-white leading-tight">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15">
                      {task.category || 'Общее'}
                    </span>
                    {task.priority === 'high' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Высокий приоритет 🔥
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {task.description && (
                <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10 leading-relaxed">
                  {task.description}
                </p>
              )}

              {task.checklist && task.checklist.length > 0 && (
                <div className="text-[11px] text-accent bg-accent/10 px-3 py-1.5 rounded-xl border border-accent/20 flex items-center justify-between">
                  <span>
                    План шагов: {task.checklist.filter((s) => s.completed).length} из{' '}
                    {task.checklist.length} закрыто
                  </span>
                  <span className="font-bold">
                    {Math.round(
                      (task.checklist.filter((s) => s.completed).length / task.checklist.length) *
                        100
                    )}
                    %
                  </span>
                </div>
              )}
            </div>

            {/* Punchline Card */}
            <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold text-accent tracking-wider mb-1 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-accent" />
                <span>Статус фокуса</span>
              </div>
              <p className="text-sm font-semibold text-slate-100 italic leading-snug">
                «{punchline}»
              </p>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/10">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {task.dueDate
                  ? `Дедлайн: ${new Date(task.dueDate).toLocaleDateString('ru-RU')}`
                  : 'Без строгого дедлайна'}
              </span>
              <span className="font-bold text-slate-300">living-tracker.app</span>
            </div>
          </div>

          {/* Feedback alert toast */}
          {alertMsg && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center"
            >
              {alertMsg}
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              type="button"
              disabled={copying}
              onClick={handleCopyImage}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-accent to-sky-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4 stroke-[2.5]" />
              <span>{copying ? 'Генерация...' : 'Копировать PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-surface hover:bg-slate-800 text-white font-bold text-sm border border-surface-border transition-all cursor-pointer hover:border-slate-500"
            >
              <Download className="w-4 h-4" />
              <span>Скачать файл</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default TaskShareModal;