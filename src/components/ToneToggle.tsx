import React from 'react';
import { motion } from 'framer-motion';
import { useTrackerStore } from '../store/useTrackerStore';
import type { ToneMode } from '../types/tracker';

interface ToneOption {
  id: ToneMode;
  label: string;
  shortLabel: string;
  icon: string;
  badge?: string;
  desc: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    id: 'neutral',
    label: 'Нейтральный',
    shortLabel: 'Норм',
    icon: '😐',
    desc: 'Сухо и по фактам',
  },
  {
    id: 'ironic',
    label: 'Ироничный',
    shortLabel: 'Сарказм',
    icon: '😏',
    desc: 'Тонкий юмор и подколки',
  },
  {
    id: 'sassy',
    label: 'Дерзкий (18+)',
    shortLabel: '18+',
    icon: '🔥',
    badge: '18+',
    desc: 'Без цензуры и тормозов',
  },
];

export const ToneToggle: React.FC = () => {
  const tone = useTrackerStore((state) => state.tone);
  const setTone = useTrackerStore((state) => state.setTone);

  return (
    <div
      role="group"
      aria-label="Переключатель тона юмора"
      className="relative inline-flex items-center p-1 bg-surface-card/90 backdrop-blur-md rounded-2xl border border-surface-border shadow-lg"
    >
      {TONE_OPTIONS.map((opt) => {
        const isActive = tone === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.desc}
            onClick={() => setTone(opt.id)}
            className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="tone-active-pill"
                className="absolute inset-0 bg-gradient-to-r from-accent/25 via-sky-500/30 to-purple-500/25 border border-accent/50 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="text-base leading-none select-none relative z-10">
              {opt.icon}
            </span>
            <span className="hidden sm:inline relative z-10 font-semibold">
              {opt.label}
            </span>
            <span className="sm:hidden relative z-10 font-semibold">
              {opt.shortLabel}
            </span>
            {opt.badge && (
              <span className="relative z-10 text-[9px] font-bold px-1 py-0.5 text-red-300 bg-red-950/70 border border-red-500/40 rounded leading-none">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ToneToggle;
