import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Wine, Utensils, Dumbbell, Gamepad2, Lightbulb, Package, Flame, AlertCircle } from 'lucide-react';
import { useTrackerStore } from '../store/useTrackerStore';
import type { TransactionType } from '../types/tracker';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  emoji: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'Еда', label: 'Еда', icon: <Utensils className="w-4 h-4" />, emoji: '🍕' },
  { id: 'Алкоголь', label: 'Алкоголь', icon: <Wine className="w-4 h-4" />, emoji: '🍷' },
  { id: 'Спорт', label: 'Спорт', icon: <Dumbbell className="w-4 h-4" />, emoji: '🏋️' },
  { id: 'Развлечения', label: 'Развлечения', icon: <Gamepad2 className="w-4 h-4" />, emoji: '🎮' },
  { id: 'ЖКХ', label: 'ЖКХ', icon: <Lightbulb className="w-4 h-4" />, emoji: '💡' },
  { id: 'Другое', label: 'Другое', icon: <Package className="w-4 h-4" />, emoji: '📦' },
];

const PRESET_AMOUNTS = [200, 500, 1000, 3000, 5000];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const addTransaction = useTrackerStore((state) => state.addTransaction);
  const tone = useTrackerStore((state) => state.tone);

  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Еда');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const isAlcohol = category.toLowerCase().includes('алкоголь') || category === 'Алкоголь';

  const getAlcoholWarning = () => {
    if (tone === 'neutral') {
      return 'Транзакция будет учтена в алкогольной статистике за месяц.';
    }
    if (tone === 'ironic') {
      return 'Печень напряглась, но кошелёк пострадал ещё сильнее.';
    }
    return 'Бухло детектид! Завтра будешь жалеть, но сегодня живем на полную!';
  };

  const handleAddPreset = (val: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/\s+/g, '').replace(',', '.'));

    if (isNaN(num) || num <= 0) {
      setError('Введите корректную сумму больше 0');
      return;
    }

    addTransaction({
      amount: num,
      category,
      description: description.trim() || undefined,
      type,
    });

    // Reset and close
    setAmount('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Диалоговое окно */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          className="relative z-10 w-full max-w-lg rounded-3xl bg-surface-card border border-surface-border p-6 sm:p-7 shadow-2xl text-left"
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-accent/10 border border-accent/30 text-accent">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Новая транзакция
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-surface border border-transparent hover:border-surface-border transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Переключатель Типа: Расход / Доход */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface rounded-xl border border-surface-border">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                💸 Расход
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                💰 Доход
              </button>
            </div>

            {/* Ввод суммы */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Сумма (₽)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  className="w-full px-4 py-3 bg-surface rounded-2xl border border-surface-border focus:border-accent focus:ring-2 focus:ring-accent/20 text-2xl font-bold text-white placeholder-slate-600 outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-500">
                  ₽
                </span>
              </div>
              {error && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Быстрые пресеты сумм */}
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddPreset(val)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface hover:bg-surface-border text-slate-300 hover:text-accent border border-surface-border transition-colors"
                >
                  +{val.toLocaleString('ru-RU')} ₽
                </button>
              ))}
            </div>

            {/* Категории быстрый выбор */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Категория
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  const isAlc = cat.id === 'Алкоголь';
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                        isSelected
                          ? isAlc
                            ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                            : 'bg-accent/20 border-accent text-accent shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                          : 'bg-surface hover:bg-surface-border border-surface-border text-slate-300'
                      }`}
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Специальный баннер при категории Алкоголь */}
            {isAlcohol && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-2xl bg-gradient-to-r from-rose-950/70 to-purple-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5"
              >
                <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-300 flex items-center gap-1">
                    <span>🍷 Алкогольный радар активен</span>
                  </div>
                  <p className="mt-0.5 text-rose-200/90 leading-tight">
                    {getAlcoholWarning()}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Описание / комментарий */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Комментарий (опционально)
              </label>
              <input
                type="text"
                placeholder="Например: Пятничный ужин с друзьями"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-surface-border focus:border-accent text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Кнопка отправки */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-accent to-blue-600 hover:from-accent hover:to-blue-500 shadow-lg shadow-accent/25 hover:shadow-accent/40 border border-cyan-400/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Зафиксировать операцию</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickAddModal;
