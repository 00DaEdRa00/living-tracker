import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  X,
  Sparkles,
  Lock,
  CheckCircle2,
  Share2,
  Filter,
  Zap,
} from 'lucide-react';
import { useTrackerStore, ACHIEVEMENTS, getAchievementText } from '../store/useTrackerStore';
import { CATEGORIES_META, RARITIES_META } from '../data/achievements';
import type { AchievementCategory, AchievementRarity } from '../types/tracker';
import { playClickSound } from '../lib/soundFx';

interface AchievementsGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementsGalleryModal: React.FC<AchievementsGalleryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const unlockedAchievements = useTrackerStore((state) => state.unlockedAchievements);
  const openAchievementModal = useTrackerStore((state) => state.openAchievementModal);
  const tone = useTrackerStore((state) => state.tone);

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  if (!isOpen) return null;

  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = Object.keys(unlockedAchievements).length;
  const progressPercent = Math.round((unlockedCount / Math.max(1, totalCount)) * 100);

  const filteredAchievements = ACHIEVEMENTS.filter((ach) => {
    const isUnlocked = Boolean(unlockedAchievements[ach.id]);

    const matchesCategory =
      selectedCategory === 'all' || ach.category === selectedCategory;

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'unlocked'
        ? isUnlocked
        : !isUnlocked;

    return matchesCategory && matchesStatus;
  });

  const handleOpenCard = (ach: (typeof ACHIEVEMENTS)[0]) => {
    playClickSound();
    openAchievementModal(ach);
  };

  const categoriesList: Array<{ id: AchievementCategory | 'all'; label: string; icon: string }> = [
    { id: 'all', label: 'Все', icon: '✨' },
    { id: 'finance', label: 'Финансы', icon: '💰' },
    { id: 'habits', label: 'Привычки', icon: '⚡' },
    { id: 'tasks', label: 'Задачи', icon: '📋' },
    { id: 'easter_egg', label: 'Секретки', icon: '🐱' },
    { id: 'system', label: 'Система', icon: '⚙️' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        {/* Backdrop clickable */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] my-auto flex flex-col bg-surface-card border border-surface-border rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-surface-border bg-surface/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>Зал славы и Достижения</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-accent/20 text-accent border border-accent/30">
                    {unlockedCount} / {totalCount}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Выполняй цели, прокачивай дисциплину и генерируй карточки шеринга (html2canvas)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 sm:static p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
              title="Закрыть галерею"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar & Filters */}
          <div className="px-5 sm:px-6 py-4 bg-slate-900/60 border-b border-surface-border/60 space-y-4">
            {/* Global Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Прогресс разблокировки трофеев:</span>
                </span>
                <span className="font-black text-accent">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-accent via-purple-500 to-amber-400 shadow-md"
                />
              </div>
            </div>

            {/* Filter Tabs: Categories & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedCategory(cat.id);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-accent text-slate-950 shadow-md shadow-accent/20'
                        : 'bg-surface hover:bg-slate-800 text-slate-400 hover:text-white border border-surface-border'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Status Filter Toggle */}
              <div className="flex items-center p-1 bg-surface rounded-xl border border-surface-border text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-accent/20 text-accent font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Все ({ACHIEVEMENTS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('unlocked')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    statusFilter === 'unlocked'
                      ? 'bg-emerald-500/20 text-emerald-400 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Открыто ({unlockedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('locked')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    statusFilter === 'locked'
                      ? 'bg-slate-700 text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Закрыто ({totalCount - unlockedCount})
                </button>
              </div>
            </div>
          </div>

          {/* Achievements Grid Content */}
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4">
            {filteredAchievements.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-surface/30 border border-dashed border-surface-border">
                <Trophy className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-400">
                  В этой выборке нет достижений
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAchievements.map((ach) => {
                  const unlockDate = unlockedAchievements[ach.id];
                  const isUnlocked = Boolean(unlockDate);
                  const rarity = ach.rarity || 'common';
                  const rarityMeta = RARITIES_META[rarity] || RARITIES_META.common;
                  const categoryMeta = CATEGORIES_META[ach.category] || CATEGORIES_META.system;
                  const localized = getAchievementText(ach, tone);

                  const dateFormatted = unlockDate
                    ? new Date(unlockDate).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : null;

                  return (
                    <div
                      key={ach.id}
                      className={`relative flex flex-col justify-between p-4 rounded-3xl border transition-all ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-surface to-surface-card border-white/10 hover:border-accent/40 shadow-lg'
                          : 'bg-surface/40 border-surface-border/60 opacity-65'
                      }`}
                      style={{
                        boxShadow: isUnlocked
                          ? `0 4px 20px ${rarityMeta.color}15`
                          : undefined,
                      }}
                    >
                      {/* Top Bar: Icon, Title & Badges */}
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 border ${
                            isUnlocked
                              ? 'bg-slate-800 shadow-md'
                              : 'bg-slate-900 border-slate-800 grayscale'
                          }`}
                          style={{
                            borderColor: isUnlocked ? `${rarityMeta.color}60` : undefined,
                            boxShadow: isUnlocked ? `0 0 16px ${rarityMeta.color}30` : undefined,
                          }}
                        >
                          {isUnlocked ? ach.icon : <Lock className="w-6 h-6 text-slate-500" />}
                        </div>

                        {/* Text info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {/* Category Badge */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              <span>{categoryMeta.icon}</span>
                              <span>{categoryMeta.label}</span>
                            </span>

                            {/* Rarity Badge */}
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                              style={{
                                color: rarityMeta.color,
                                borderColor: `${rarityMeta.color}70`,
                                backgroundColor: `${rarityMeta.color}15`,
                              }}
                            >
                              <span>{rarityMeta.label}</span>
                            </span>
                          </div>

                          <h4 className="text-base font-extrabold text-white truncate">
                            {localized.title}
                          </h4>

                          <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                            {isUnlocked ? (
                              <span>«{localized.description}»</span>
                            ) : (
                              <span className="text-slate-400 italic">
                                Условие: {ach.description}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Footer: Status / Share Action */}
                      <div className="mt-4 pt-3 border-t border-surface-border/50 flex items-center justify-between text-xs">
                        {isUnlocked ? (
                          <>
                            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Открыто {dateFormatted}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleOpenCard(ach)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 hover:text-accent border border-slate-600 transition-colors shadow-sm cursor-pointer"
                              title="Сгенерировать и скопировать PNG карточку"
                            >
                              <Share2 className="w-3.5 h-3.5 text-accent" />
                              <span>Карточка шеринга</span>
                            </button>
                          </>
                        ) : (
                          <div className="w-full flex items-center justify-between text-slate-500 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Заблокировано</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-600">
                              #{ach.id}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 bg-slate-950/60 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-accent" />
              <span>Карточки шеринга рендерятся в PNG высокого качества 2x через html2canvas</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-surface hover:bg-slate-800 text-slate-200 font-bold transition-colors"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AchievementsGalleryModal;
