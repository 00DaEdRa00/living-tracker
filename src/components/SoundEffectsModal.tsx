import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Music,
  Play,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrackerStore } from '../store/useTrackerStore';
import { SOUND_FX_CATALOG, playClickSound, SoundPreset } from '../lib/soundFx';

interface SoundEffectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundEffectsModal: React.FC<SoundEffectsModalProps> = ({ isOpen, onClose }) => {
  const soundEnabled = useTrackerStore((state) => state.soundEnabled);
  const soundVolume = useTrackerStore((state) => state.soundVolume ?? 0.7);
  const toggleSound = useTrackerStore((state) => state.toggleSound);
  const setSoundVolume = useTrackerStore((state) => state.setSoundVolume);

  if (!isOpen) return null;

  const handleTestSound = (preset: SoundPreset) => {
    preset.play();
    if (preset.id === 'fanfare' || preset.id === 'milestone') {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl text-left overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-accent/20 border border-accent/40 text-accent">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Процедурные звуки (Web Audio FX)
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                    Zero Latency
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Мгновенный тактильный отклик синтезатором без внешних mp3-файлов
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

          {/* Master Sound Switch & Volume Slider */}
          <div className="p-3.5 rounded-2xl bg-surface border border-surface-border mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {soundEnabled ? 'Звуковые эффекты активны' : 'Звук полностью отключен'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {soundEnabled ? 'Воспроизведение при действиях и стриках' : 'Тихий режим без аудиосигналов'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  toggleSound();
                  playClickSound();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  soundEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                }`}
              >
                {soundEnabled ? 'Выключить' : 'Включить'}
              </button>
            </div>

            {/* Volume Control Slider */}
            <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Sliders className="w-3.5 h-3.5 text-accent" />
                <span>Громкость:</span>
                <span className="font-mono font-bold text-white">
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                className="w-48 accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
            </div>
          </div>

          {/* Sound catalog grid */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {SOUND_FX_CATALOG.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-surface/70 hover:bg-surface border border-surface-border/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-card flex items-center justify-center text-base border border-surface-border">
                    {preset.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{preset.name}</div>
                    <div className="text-[10px] text-slate-400">{preset.description}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTestSound(preset)}
                  className="px-2.5 py-1 rounded-xl bg-accent/15 hover:bg-accent/25 border border-accent/30 text-accent text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Тест</span>
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-4 mt-3 border-t border-surface-border flex items-center justify-between text-[11px] text-slate-400">
            <span>Синтез частот через Web Audio OscillatorNode</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface hover:bg-slate-800 text-slate-200 text-xs font-bold border border-surface-border transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
