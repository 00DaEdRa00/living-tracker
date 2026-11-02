import React from 'react';
import { motion } from 'framer-motion';
import { useTrackerStore } from '../store/useTrackerStore';
import type { AppTheme } from '../types/tracker';
import { playThemeSwitchSound } from '../lib/soundFx';

interface ThemeOption {
  id: AppTheme;
  label: string;
  shortLabel: string;
  icon: string;
  accentColor: string;
  desc: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'amoled',
    label: 'AMOLED',
    shortLabel: 'AMOLED',
    icon: '🌌',
    accentColor: '#38bdf8',
    desc: 'Midnight Black & Cyan (#090d16)',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    shortLabel: 'Cyber',
    icon: '⚡',
    accentColor: '#facc15',
    desc: 'Neon Purple & Yellow (#120726)',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    shortLabel: 'Emerald',
    icon: '🍃',
    accentColor: '#fbbf24',
    desc: 'Deep Emerald & Soft Gold (#061a14)',
  },
  {
    id: 'synthwave',
    label: 'Synthwave',
    shortLabel: 'Synth',
    icon: '🌆',
    accentColor: '#f43f5e',
    desc: 'Retrowave Violet & Neon Pink (#180a28)',
  },
  {
    id: 'nord',
    label: 'Nordic',
    shortLabel: 'Nord',
    icon: '❄️',
    accentColor: '#38bdf8',
    desc: 'Arctic Frost & Glacier Cyan (#0f172a)',
  },
  {
    id: 'dracula',
    label: 'Dracula',
    shortLabel: 'Drac',
    icon: '🧛',
    accentColor: '#bd93f9',
    desc: 'Vampire Violet & Cyber Green (#1a1a24)',
  },
  {
    id: 'tokyo',
    label: 'Tokyo Night',
    shortLabel: 'Tokyo',
    icon: '🗼',
    accentColor: '#7aa2f7',
    desc: 'Tokyo Night Indigo & Neon Sky (#1a1b26)',
  },
  {
    id: 'crimson',
    label: 'Crimson',
    shortLabel: 'Crimson',
    icon: '🩸',
    accentColor: '#f43f5e',
    desc: 'Velvet Wine & Neon Scarlet (#150810)',
  },
];

export const ThemeSelector: React.FC = () => {
  const theme = useTrackerStore((state) => state.theme);
  const setTheme = useTrackerStore((state) => state.setTheme);

  return (
    <div
      role="group"
      aria-label="Селектор темы оформления"
      className="relative inline-flex items-center p-1 bg-surface-card/90 backdrop-blur-md rounded-2xl border border-surface-border shadow-lg"
    >
      {THEME_OPTIONS.map((opt) => {
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.desc}
            onClick={() => {
              setTheme(opt.id);
              playThemeSwitchSound();
            }}
            className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? 'text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="theme-active-pill"
                className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                style={{
                  borderColor: `${opt.accentColor}70`,
                  boxShadow: `0 0 14px ${opt.accentColor}30`,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="text-sm leading-none select-none relative z-10">
              {opt.icon}
            </span>
            <span className="hidden sm:inline relative z-10">
              {opt.label}
            </span>
            <span className="sm:hidden relative z-10">
              {opt.shortLabel}
            </span>
            <span
              className="w-2 h-2 rounded-full relative z-10 border border-white/30"
              style={{ backgroundColor: opt.accentColor }}
            />
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSelector;
