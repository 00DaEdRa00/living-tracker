import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { useTrackerStore } from '../store/useTrackerStore';

interface FloatingFeedback {
  id: number;
  text: string;
  x: number;
}

export const CatClicker: React.FC = () => {
  const catClicks = useTrackerStore((state) => state.catClicks);
  const clickCat = useTrackerStore((state) => state.clickCat);
  const tone = useTrackerStore((state) => state.tone);

  const [floaters, setFloaters] = useState<FloatingFeedback[]>([]);
  const [showBubble, setShowBubble] = useState(false);

  // Фразы кота в зависимости от тона и количества кликов
  const getCatPhrase = () => {
    if (catClicks >= 10) {
      if (tone === 'neutral') return 'Кот получил максимум внимания.';
      if (tone === 'ironic') return 'Кошачий культ завершён. Может, поработаешь?';
      return 'Хватит лапать кота, маньячелло!';
    }
    if (catClicks >= 1) {
      if (tone === 'neutral') return 'Мяу. Кот замурчал.';
      if (tone === 'ironic') return 'Гладить кота приятнее, чем закрывать задачи.';
      return 'Мур-р! Чеши за ушком, кожаный мешок!';
    }
    if (tone === 'neutral') return 'Погладить кота';
    if (tone === 'ironic') return 'Кликни кота для поднятия самооценки';
    return 'Тыкни котейку, не будь занудой!';
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    clickCat();
    setShowBubble(true);

    // Добавляем вылетающий смайлик или сердечко
    const icons = ['🐾', '❤️', '✨', '+1', '😻', '🐟'];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    const randomX = (Math.random() - 0.5) * 40;

    const newFloater: FloatingFeedback = {
      id: Date.now() + Math.random(),
      text: randomIcon,
      x: randomX,
    };

    setFloaters((prev) => [...prev.slice(-6), newFloater]);

    // Скрываем бабл через время
    setTimeout(() => {
      setShowBubble(false);
    }, 2800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end select-none">
      {/* Всплывающее облачко с мыслями кота */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            className="mb-2 max-w-[210px] p-2.5 rounded-2xl bg-surface-card/95 border border-purple-500/40 text-xs text-slate-200 shadow-xl shadow-purple-950/50 backdrop-blur-md relative"
          >
            <div className="flex items-center gap-1.5 font-bold text-accent mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Кот говорит:</span>
            </div>
            <p className="leading-snug text-slate-300">{getCatPhrase()}</p>
            {/* Хвостик спичбабла */}
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-surface-card border-r border-b border-purple-500/40 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Вылетающие частицы кликов */}
      <div className="relative">
        <AnimatePresence>
          {floaters.map((floater) => (
            <motion.span
              key={floater.id}
              initial={{ opacity: 1, y: 0, x: floater.x, scale: 0.8 }}
              animate={{ opacity: 0, y: -60, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute pointer-events-none text-base font-extrabold text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] z-50 -top-2 left-6"
            >
              {floater.text}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Кнопка-кот */}
        <motion.button
          type="button"
          onClick={handleClick}
          whileHover={{ scale: 1.1, rotate: [0, -3, 3, 0] }}
          whileTap={{ scale: 0.85 }}
          title="Погладить кота (Пасхалка)"
          className="relative group flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-900/80 via-slate-900 to-surface-card border border-purple-500/40 shadow-xl shadow-purple-950/60 hover:shadow-purple-500/30 hover:border-accent transition-all duration-200 cursor-pointer focus:outline-none"
        >
          {/* Свечение позади кота */}
          <div className="absolute inset-0 rounded-2xl bg-purple-500/10 group-hover:bg-purple-500/20 blur-sm transition-all" />

          {/* SVG или Эмодзи кота */}
          <span className="text-3xl filter drop-shadow-[0_2px_8px_rgba(168,85,247,0.5)] transform group-hover:scale-110 transition-transform">
            {catClicks >= 10 ? '😻' : catClicks > 0 ? '🐱' : '😺'}
          </span>

          {/* Бейдж счётчика кликов */}
          {catClicks > 0 && (
            <motion.span
              key={catClicks}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -left-2 min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full text-[11px] font-black bg-gradient-to-r from-pink-500 to-rose-600 text-white border-2 border-surface shadow-md"
            >
              {catClicks}
            </motion.span>
          )}

          {/* Иконка сердечка */}
          <Heart className="absolute -bottom-1 -right-1 w-4 h-4 text-pink-400 fill-pink-500 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
        </motion.button>
      </div>

      {/* Текстовая плашка-подпись */}
      <span className="mt-1 text-[10px] font-semibold text-slate-400 tracking-wider">
        Кликов по коту: <span className="text-accent">{catClicks}</span>
      </span>
    </div>
  );
};

export default CatClicker;
