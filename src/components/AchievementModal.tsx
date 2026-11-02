import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { Share2, X, Trophy, Check, Download } from 'lucide-react';
import { useTrackerStore, getAchievementText } from '../store/useTrackerStore';
import { RARITIES_META, CATEGORIES_META } from '../data/achievements';

export const AchievementModal: React.FC = () => {
  const recentUnlocked = useTrackerStore((state) => state.recentUnlocked);
  const closeAchievementModal = useTrackerStore((state) => state.closeAchievementModal);
  const tone = useTrackerStore((state) => state.tone);

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recentUnlocked) {
      setCopied(false);
      // Салют конфетти при открытии
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#38bdf8', '#a855f7', '#f59e0b', '#10b981', '#ef4444'],
        });
      } catch (err) {
        // Safe fallback in case canvas-confetti has environment issue
        console.warn('Confetti error:', err);
      }
    }
  }, [recentUnlocked]);

  if (!recentUnlocked) {
    return null;
  }

  const rarity = recentUnlocked.rarity || 'common';
  const rarityMeta = RARITIES_META[rarity] || RARITIES_META.common;
  const categoryMeta = CATEGORIES_META[recentUnlocked.category] || CATEGORIES_META.system;
  const localized = getAchievementText(recentUnlocked, tone);

  const handleShare = async () => {
    const textToShare = `🏆 «Живой трекер» — Достижение разблокировано!\n${recentUnlocked.icon} ${localized.title} [${rarityMeta.label}]\n«${localized.description}»`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(textToShare);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Fallback
      }
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current || downloading) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(cardRef.current, {
        background: '#090d16',
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `achievement-${recentUnlocked.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export achievement image:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop clickable */}
        <div
          className="absolute inset-0"
          onClick={closeAchievementModal}
        />

        {/* Карточка ачивки */}
        <motion.div
          ref={cardRef}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-surface-card border border-surface-border p-6 sm:p-8 shadow-2xl shadow-purple-950/40 text-center"
        >
          {/* Световые неоновые блики */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40"
            style={{ backgroundColor: rarityMeta.color }}
          />

          {/* Кнопка закрытия */}
          <button
            type="button"
            onClick={closeAchievementModal}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-surface/50 hover:bg-surface border border-surface-border transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Верхняя плашка: категория и редкость */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              <span>{categoryMeta.icon}</span>
              <span>{categoryMeta.label}</span>
            </span>

            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm"
              style={{
                color: rarityMeta.color,
                borderColor: `${rarityMeta.color}60`,
                backgroundColor: `${rarityMeta.color}15`,
              }}
            >
              <Trophy className="w-3 h-3" />
              <span>{rarityMeta.label}</span>
            </span>
          </div>

          {/* Большая иконка ачивки с анимацией */}
          <motion.div
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative mx-auto my-3 w-24 h-24 flex items-center justify-center rounded-3xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 shadow-inner"
            style={{
              boxShadow: `0 0 35px ${rarityMeta.color}40`,
            }}
          >
            <span className="text-5xl select-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {recentUnlocked.icon}
            </span>
          </motion.div>

          {/* Заголовок */}
          <div className="text-[11px] font-bold text-accent tracking-widest uppercase mb-1">
            Новое достижение!
          </div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            {localized.title}
          </h3>

          {/* Описание с учётом тона */}
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto mb-6 bg-surface/40 p-3 rounded-2xl border border-white/5">
            {localized.description}
          </p>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm text-white bg-surface hover:bg-surface-border border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Скопировано!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-accent" />
                  <span>Поделиться</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={downloading}
              title="Сохранить картинку ачивки"
              className="p-2.5 rounded-2xl font-semibold text-sm text-slate-300 hover:text-white bg-surface hover:bg-surface-border border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={closeAchievementModal}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-accent to-blue-600 hover:from-accent hover:to-blue-500 shadow-lg shadow-accent/25 transition-all"
            >
              Круто!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AchievementModal;
