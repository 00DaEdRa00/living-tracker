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
  QrCode,
  Star,
} from 'lucide-react';
import type { ToneMode, Habit } from '../types/tracker';
import { useTrackerStore } from '../store/useTrackerStore';
import { playShareSound, playClickSound, playCertificateSound } from '../lib/soundFx';

interface StreakCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null;
}

export interface CertificateData {
  streak: number;
  bestStreak: number;
  totalCheckins: number;
  freezesUsed: number;
  tierName: string;
  tierBadge: string;
  punchline: string;
  issueDate: string;
}

export function calculateCertificateData(habit: Habit, tone: ToneMode): CertificateData {
  const streak = habit.streak || 0;
  const bestStreak = Math.max(habit.bestStreak || 0, streak);
  const totalCheckins = habit.history?.length || 0;
  const freezesUsed = habit.frozenDates?.length || 0;

  let tierName = 'Новичок';
  let tierBadge = '⚡';

  if (streak >= 100) {
    tierName = 'Легендарный Титан';
    tierBadge = '👑';
  } else if (streak >= 60) {
    tierName = 'Гранд-Магистр';
    tierBadge = '🏆';
  } else if (streak >= 30) {
    tierName = 'Непоколебимый Чемпион';
    tierBadge = '🥇';
  } else if (streak >= 14) {
    tierName = 'Железный Ветеран';
    tierBadge = '🥈';
  } else if (streak >= 7) {
    tierName = 'Уверенный Воин';
    tierBadge = '🥉';
  }

  let punchline = '';
  if (tone === 'sassy') {
    if (streak >= 30) {
      punchline = 'Железобетонная сталь. Прокрастинация рыдает в углу, пока ты держишь стрик как абсолютный бог.';
    } else if (streak >= 7) {
      punchline = 'Красиво идешь! Главное не слей эту серию на выходных под предлогом внезапной лени.';
    } else {
      punchline = 'Начало положено. Но если бросишь завтра — кот будет смотреть на тебя с осуждением.';
    }
  } else if (tone === 'ironic') {
    if (streak >= 30) {
      punchline = 'Юридически заверенная победа биологической воли над алгоритмами бесконечной ленты соцсетей.';
    } else if (streak >= 7) {
      punchline = 'Удивительно, но факт: привычка приживается. Наука пока затрудняется это объяснить.';
    } else {
      punchline = 'Первые уверенные шаги навстречу иллюзии тотального контроля над собственной жизнью.';
    }
  } else {
    // neutral
    if (streak >= 30) {
      punchline = 'Официальное признание выдающейся самодисциплины и железной приверженности поставленной цели.';
    } else if (streak >= 7) {
      punchline = 'Отличный устойчивый темп и доказанная регулярность в формировании полезного жизненного навыка.';
    } else {
      punchline = 'Уверенный старт новой полезной привычки. Каждый шаг формирует прочный фундамент мастерства.';
    }
  }

  const issueDate = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    streak,
    bestStreak,
    totalCheckins,
    freezesUsed,
    tierName,
    tierBadge,
    punchline,
    issueDate,
  };
}

export const StreakCertificateModal: React.FC<StreakCertificateModalProps> = ({
  isOpen,
  onClose,
  habit,
}) => {
  const tone = useTrackerStore((state) => state.tone);
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && habit) {
      playCertificateSound();
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // safe
      }
    }
  }, [isOpen, habit]);

  if (!isOpen || !habit) return null;

  const cert = calculateCertificateData(habit, tone);

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setCopying(true);
      playClickSound();
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0914',
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
              particleCount: 35,
              spread: 55,
              origin: { y: 0.7 },
            });
          } catch {
            // safe
          }
        } catch {
          // Fallback to auto-download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `streak-certificate-${habit.title.toLowerCase().replace(/\s+/g, '-')}.png`;
          a.click();
          URL.revokeObjectURL(url);
          playShareSound();
        } finally {
          setCopying(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to copy certificate:', err);
      setCopying(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      playClickSound();
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0914',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `streak-certificate-${habit.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      a.click();
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
    } catch (err) {
      console.error('Failed to download certificate:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-200">Сертификат Мастера Стриков</h3>
                <p className="text-xs text-amber-400/80">Официальный диплом Зала Славы</p>
              </div>
            </div>
            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Certificate Canvas Area */}
          <div className="p-4 sm:p-6 overflow-x-auto flex justify-center bg-slate-950/60">
            <div
              ref={cardRef}
              className="w-[480px] p-8 rounded-2xl bg-gradient-to-b from-slate-950 via-[#110d24] to-[#0a0818] border-2 border-amber-500/40 shadow-2xl relative flex flex-col items-center text-center overflow-hidden"
              style={{
                boxShadow: '0 0 40px rgba(245, 158, 11, 0.15), inset 0 0 30px rgba(245, 158, 11, 0.05)',
              }}
            >
              {/* Ornate corner accents */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/60 rounded-tl-lg" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/60 rounded-tr-lg" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/60 rounded-bl-lg" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/60 rounded-br-lg" />

              {/* Top Branding */}
              <div className="flex items-center gap-2 mb-2 text-amber-400/80 text-xs font-semibold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Living Tracker • Hall of Fame</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>

              {/* Title Header */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 tracking-tight mb-1 font-serif">
                СЕРТИФИКАТ МАСТЕРА
              </h1>
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-6">
                Настоящим удостоверяется достижение
              </p>

              {/* Big Tier Badge */}
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-yellow-400/10 border border-amber-400/50 flex flex-col items-center justify-center shadow-lg shadow-amber-500/10 backdrop-blur-sm">
                  <span className="text-3xl">{cert.tierBadge}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  {cert.tierName}
                </div>
              </div>

              {/* Habit Title */}
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  «{habit.title}»
                </h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  <span>{habit.category || 'Личное развитие'}</span>
                </div>
              </div>

              {/* Key Stats Row */}
              <div className="grid grid-cols-3 gap-2 w-full my-4">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 flex flex-col items-center">
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-lg">
                    <Flame className="w-4 h-4 fill-amber-400" />
                    <span>{cert.streak} дн.</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Текущий стрик</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 flex flex-col items-center">
                  <div className="flex items-center gap-1 text-yellow-300 font-bold text-lg">
                    <Award className="w-4 h-4" />
                    <span>{cert.bestStreak} дн.</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Лучший рекорд</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 flex flex-col items-center">
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{cert.totalCheckins}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Всего чекинов</span>
                </div>
              </div>

              {/* Punchline Quote */}
              <div className="w-full my-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs italic text-amber-200/90 leading-relaxed text-center">
                "{cert.punchline}"
              </div>

              {/* Footer Verification */}
              <div className="w-full flex items-center justify-between pt-4 mt-2 border-t border-amber-500/20 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5 text-left">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <div className="text-white font-medium">{cert.issueDate}</div>
                    <div className="text-[9px] text-slate-500">Дата фиксации рекорда</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div className="text-amber-300 font-bold tracking-wider">VERIFIED</div>
                    <div className="text-[9px] text-slate-500">Living Tracker v2.0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-amber-500/20 bg-slate-900">
            <button
              onClick={handleCopyImage}
              disabled={copying}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors border border-amber-500/20 shadow-md"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>{copying ? 'Копирование...' : 'Копировать PNG'}</span>
            </button>
            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Сохранение...' : 'Скачать PNG'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
