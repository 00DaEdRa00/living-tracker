import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import {
  Copy,
  Download,
  X,
  Trophy,
  Check,
  Zap,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useTrackerStore, getAchievementText } from '../store/useTrackerStore';
import { RARITIES_META, CATEGORIES_META } from '../data/achievements';
import { playAchievementFanfare, playClickSound } from '../lib/soundFx';
import type { ToneMode } from '../types/tracker';

export const AchievementModal: React.FC = () => {
  const recentUnlocked = useTrackerStore((state) => state.recentUnlocked);
  const closeAchievementModal = useTrackerStore((state) => state.closeAchievementModal);
  const storeTone = useTrackerStore((state) => state.tone);

  const [currentTone, setCurrentTone] = useState<ToneMode>(storeTone);
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedAlert, setCopiedAlert] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Синхронизация тона при открытии новой ачивки
  useEffect(() => {
    if (recentUnlocked) {
      setCurrentTone(storeTone);
      setCopiedAlert(null);
      // Победный мажорный арпеджио-аккорд
      playAchievementFanfare();

      // Салют конфетти при открытии
      try {
        confetti({
          particleCount: 120,
          spread: 85,
          origin: { y: 0.55 },
          colors: ['#38bdf8', '#a855f7', '#f59e0b', '#10b981', '#ef4444'],
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  }, [recentUnlocked, storeTone]);

  if (!recentUnlocked) {
    return null;
  }

  const rarity = recentUnlocked.rarity || 'common';
  const rarityMeta = RARITIES_META[rarity] || RARITIES_META.common;
  const categoryMeta = CATEGORIES_META[recentUnlocked.category] || CATEGORIES_META.system;
  const localized = getAchievementText(recentUnlocked, currentTone);

  const shareText = `🏆 «Живой трекер» — Достижение разблокировано!\n${recentUnlocked.icon} ${localized.title} [${rarityMeta.label}]\n«${localized.description}»\n⚡ living-tracker.app`;

  // Генерация canvas с масштабом 2x (retina quality)
  const generateCanvas = async () => {
    if (!cardRef.current) return null;
    return await html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: '#0c121e',
      useCORS: true,
      logging: false,
    });
  };

  // Копирование Blob PNG напрямую в буфер обмена
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
        setCopiedAlert('Картинка скопирована! Вставь в Telegram через Ctrl+V');
        setTimeout(() => setCopiedAlert(null), 4500);
      } else {
        // Fallback: копирование текста
        await navigator.clipboard.writeText(shareText);
        setCopiedAlert('Текст ачивки скопирован!');
        setTimeout(() => setCopiedAlert(null), 3000);
      }
    } catch (err) {
      console.warn('Image clipboard write failed, fallback to text:', err);
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedAlert('Текст ачивки скопирован!');
        setTimeout(() => setCopiedAlert(null), 3000);
      } catch {
        setCopiedAlert('Не удалось скопировать. Нажмите «Скачать PNG»');
        setTimeout(() => setCopiedAlert(null), 3500);
      }
    } finally {
      setCopying(false);
    }
  };

  // Быстрое копирование текста ачивки
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedAlert('Текст ачивки скопирован в буфер обмена!');
      setTimeout(() => setCopiedAlert(null), 3000);
    } catch {
      setCopiedAlert('Не удалось скопировать текст');
      setTimeout(() => setCopiedAlert(null), 3000);
    }
  };

  // Скачивание PNG карточки в высоком качестве (2x)
  const handleDownloadPng = async () => {
    if (!cardRef.current || downloading) return;
    try {
      setDownloading(true);
      const canvas = await generateCanvas();
      if (!canvas) throw new Error('Canvas not generated');

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `living-tracker-${recentUnlocked.id}-${currentTone}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export achievement image:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleToneChange = (newTone: ToneMode) => {
    playClickSound();
    setCurrentTone(newTone);
  };

  const todayStr = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        {/* Backdrop clickable */}
        <div className="fixed inset-0" onClick={closeAchievementModal} />

        {/* Контейнер модалки */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-[480px] my-auto flex flex-col items-center"
        >
          {/* Кнопка закрытия модалки */}
          <button
            type="button"
            onClick={closeAchievementModal}
            className="absolute -top-3 -right-3 z-30 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 shadow-xl transition-colors focus:outline-none"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          {/* КАРТОЧКА АЧИВКИ (для экспорта через html2canvas) */}
          <div
            ref={cardRef}
            className="w-full relative overflow-hidden rounded-3xl p-6 sm:p-7 text-center select-none"
            style={{
              backgroundColor: '#0c121e',
              border: `2px solid ${rarityMeta.color}`,
              boxShadow: `0 0 35px ${rarityMeta.color}40, inset 0 0 30px rgba(0,0,0,0.7)`,
            }}
          >
            {/* Неоновый градиентный фон */}
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40"
              style={{ backgroundColor: rarityMeta.color }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/60 pointer-events-none" />

            {/* Верхняя плашка карточки: Логотип приложения + Бейджи */}
            <div className="relative z-10 flex items-center justify-between gap-2 pb-4 border-b border-white/10">
              {/* Логотип «Живой трекер» */}
              <div className="flex items-center gap-2 text-left">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-purple-600 shadow-md">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-black text-white tracking-tight leading-none">
                    Живой трекер
                  </div>
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none mt-0.5">
                    Достижения
                  </div>
                </div>
              </div>

              {/* Бейджи категории и редкости */}
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/90 text-slate-300 border border-slate-700">
                  <span>{categoryMeta.icon}</span>
                  <span className="hidden xs:inline">{categoryMeta.label}</span>
                </span>

                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm"
                  style={{
                    color: rarityMeta.color,
                    borderColor: `${rarityMeta.color}70`,
                    backgroundColor: `${rarityMeta.color}20`,
                  }}
                >
                  <Trophy className="w-3 h-3" />
                  <span>{rarityMeta.label}</span>
                </span>
              </div>
            </div>

            {/* Большая светящаяся иконка ачивки */}
            <div className="relative z-10 my-5 flex flex-col items-center justify-center">
              <div
                className="relative w-24 h-24 flex items-center justify-center rounded-3xl bg-gradient-to-b from-white/15 to-transparent border shadow-inner"
                style={{
                  borderColor: `${rarityMeta.color}60`,
                  boxShadow: `0 0 30px ${rarityMeta.color}50`,
                }}
              >
                <span className="text-5xl select-none filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
                  {recentUnlocked.icon}
                </span>
                <Sparkles
                  className="w-4 h-4 absolute -top-1.5 -right-1.5"
                  style={{ color: rarityMeta.color }}
                />
              </div>

              {/* Оверлайн */}
              <div className="mt-4 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-accent flex items-center gap-1.5">
                <span>✦</span>
                <span>Достижение разблокировано</span>
                <span>✦</span>
              </div>

              {/* Название ачивки */}
              <h3 className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight">
                {localized.title}
              </h3>
            </div>

            {/* Описание строго в выбранном тоне (нейтральный / ироничный / дерзкий) */}
            <div className="relative z-10 text-left bg-black/40 border border-white/10 rounded-2xl p-3.5 mb-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Тон формулировки:
                </span>
                <div className="flex items-center gap-1">
                  {(['neutral', 'ironic', 'sassy'] as ToneMode[]).map((tMode) => (
                    <button
                      key={tMode}
                      type="button"
                      onClick={() => handleToneChange(tMode)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        currentTone === tMode
                          ? 'bg-accent text-slate-950 font-black shadow-sm'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {tMode === 'neutral'
                        ? 'Сдержанный'
                        : tMode === 'ironic'
                        ? 'Ироничный'
                        : 'Дерзкий'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                «{localized.description}»
              </p>
            </div>

            {/* Нижний колонтитул карточки */}
            <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-medium">{todayStr}</span>
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <span>⚡</span>
                <span>living-tracker.app</span>
              </span>
            </div>
          </div>

          {/* Уведомление о копировании */}
          <AnimatePresence>
            {copiedAlert && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="w-full mt-3 px-4 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{copiedAlert}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ПАНЕЛЬ КНОПОК ДЕЙСТВИЙ (ВНЕ КАРТОЧКИ) */}
          <div className="w-full mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Кнопка «Скопировать картинку» */}
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={copying}
              className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-accent transition-all duration-200 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Copy className="w-4 h-4 text-accent" />
              <span>{copying ? 'Копирование...' : 'Скопировать PNG'}</span>
            </button>

            {/* Кнопка «Скопировать текст» */}
            <button
              type="button"
              onClick={handleCopyText}
              title="Скопировать текстовое описание для мессенджера"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-accent transition-all duration-200 cursor-pointer shadow-md"
            >
              <FileText className="w-4 h-4 text-slate-300" />
              <span className="hidden xs:inline">Текст</span>
            </button>

            {/* Кнопка «Скачать PNG» */}
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={downloading}
              title="Скачать карточку в формате PNG (2x)"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-accent transition-all duration-200 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-accent" />
              <span className="hidden xs:inline">{downloading ? '...' : 'Файл'}</span>
            </button>

            {/* Кнопка «Круто!» */}
            <button
              type="button"
              onClick={closeAchievementModal}
              className="flex items-center justify-center px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-accent to-blue-600 hover:from-accent hover:to-blue-500 shadow-lg shadow-accent/25 transition-all duration-200 cursor-pointer"
            >
              <span>Круто!</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AchievementModal;
