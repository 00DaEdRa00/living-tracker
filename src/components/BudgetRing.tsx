import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle, Calendar, Wallet } from 'lucide-react';
import { useTrackerStore } from '../store/useTrackerStore';

interface BudgetRingProps {
  onOpenAddExpense?: () => void;
}

export const BudgetRing: React.FC<BudgetRingProps> = ({ onOpenAddExpense }) => {
  const budget = useTrackerStore((state) => state.budget);
  const clickPrice = useTrackerStore((state) => state.clickPrice);

  // Режим отображения: 'month' (лимит месяца) | 'daily' (в день до конца месяца)
  const [viewMode, setViewMode] = useState<'month' | 'daily'>('month');

  const radius = 120;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  const spent = budget.spent;
  const limit = budget.monthlyLimit;
  const remaining = limit - spent;
  const ratio = limit > 0 ? spent / limit : 0;
  const isOverbudget = ratio >= 1.0;
  const isWarning = ratio >= 0.75 && ratio < 1.0;

  // Clamped progress for the ring stroke: 0 to 1
  const progressClamped = Math.min(Math.max(ratio, 0), 1);
  const strokeDashoffset = circumference * (1 - progressClamped);

  // Расчёт дней до конца месяца
  const now = new Date();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeft = Math.max(1, totalDaysInMonth - currentDay + 1);
  const dailyBudget = remaining > 0 ? Math.round(remaining / daysLeft) : 0;

  // Определение градиента и цвета
  let gradientId = 'gradient-safe';
  let strokeFilter = 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.45))';
  let ringColorClass = 'text-emerald-400';

  if (isOverbudget) {
    gradientId = 'gradient-danger';
    strokeFilter = 'drop-shadow(0 0 18px rgba(239, 68, 68, 0.85))';
    ringColorClass = 'text-red-500';
  } else if (isWarning) {
    gradientId = 'gradient-warning';
    strokeFilter = 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.55))';
    ringColorClass = 'text-amber-400';
  }

  const handleToggleMode = () => {
    setViewMode((prev) => (prev === 'month' ? 'daily' : 'month'));
    clickPrice(); // Триггер пасхалки и ачивки
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Контейнер SVG кольца */}
      <div className="relative w-[300px] h-[300px] flex items-center justify-center">
        <svg
          className="w-full h-full -rotate-90 transform"
          viewBox="0 0 280 280"
        >
          <defs>
            {/* Безопасный режим: бирюзовый/изумрудный */}
            <linearGradient id="gradient-safe" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Предупреждение: желто-оранжевый */}
            <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>

            {/* Опасность / перерасход: агрессивный неоновый красный */}
            <linearGradient id="gradient-danger" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>

          {/* Фоновая подложка кольца */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            className="opacity-40"
          />

          {/* Активная дуга прогресса */}
          <motion.circle
            cx="140"
            cy="140"
            r={radius}
            fill="transparent"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ filter: strokeFilter }}
            className={isOverbudget ? 'animate-pulse-glow' : ''}
          />
        </svg>

        {/* Контент внутри кольца */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none pointer-events-auto">
          {/* Индикатор перерасхода */}
          {isOverbudget ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.05, 1], opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center gap-1 px-2.5 py-0.5 mb-1 bg-red-950/80 border border-red-500/50 rounded-full text-red-400 text-xs font-black tracking-wider uppercase shadow-[0_0_12px_rgba(239,68,68,0.5)]"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>ПЕРЕРАСХОД!</span>
            </motion.div>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
              Потрачено
            </span>
          )}

          {/* Главная сумма */}
          <motion.div
            key={spent}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-sans ${
              isOverbudget
                ? 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]'
                : 'text-white'
            }`}
          >
            {spent.toLocaleString('ru-RU')}{' '}
            <span className="text-xl sm:text-2xl font-semibold text-slate-400">₽</span>
          </motion.div>

          {/* Кликабельный переключатель дней / лимита */}
          <button
            type="button"
            onClick={handleToggleMode}
            title="Нажмите, чтобы переключить вид (пасхалка ценника)"
            className="mt-2 group flex flex-col items-center px-3 py-1.5 rounded-xl bg-surface/70 hover:bg-surface border border-surface-border hover:border-accent/40 transition-all duration-200 focus:outline-none"
          >
            <AnimatePresence mode="wait">
              {viewMode === 'month' ? (
                <motion.div
                  key="month"
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  className="flex flex-col items-center text-xs"
                >
                  <span className="text-slate-400 flex items-center gap-1 group-hover:text-slate-200">
                    <Wallet className="w-3 h-3 text-slate-400 group-hover:text-accent" />
                    из {limit.toLocaleString('ru-RU')} ₽
                  </span>
                  <span
                    className={`font-semibold mt-0.5 ${
                      isOverbudget
                        ? 'text-red-400'
                        : remaining <= limit * 0.25
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {remaining >= 0
                      ? `Осталось: ${remaining.toLocaleString('ru-RU')} ₽`
                      : `Перерасход: ${Math.abs(remaining).toLocaleString('ru-RU')} ₽`}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="daily"
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  className="flex flex-col items-center text-xs"
                >
                  <span className="text-slate-400 flex items-center gap-1 group-hover:text-slate-200">
                    <Calendar className="w-3 h-3 text-accent" />
                    Осталось {daysLeft} дн.
                  </span>
                  <span className="font-semibold text-cyan-400 mt-0.5">
                    ~{dailyBudget.toLocaleString('ru-RU')} ₽ / день
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-[9px] text-slate-400 group-hover:text-accent/80 transition-colors mt-0.5">
              клик для смены режима ⇄
            </span>
          </button>
        </div>
      </div>

      {/* Процент использования */}
      <div className="mt-2 text-xs font-medium text-slate-400">
        Израсходовано{' '}
        <span className={`font-bold ${ringColorClass}`}>
          {Math.round(ratio * 100)}%
        </span>{' '}
        месячного лимита
      </div>

      {/* Кнопка «+ Добавить расход» */}
      {onOpenAddExpense && (
        <motion.button
          type="button"
          onClick={onOpenAddExpense}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-accent to-blue-600 hover:from-accent hover:to-blue-500 shadow-lg shadow-accent/25 hover:shadow-accent/40 border border-cyan-400/30 transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Добавить расход</span>
        </motion.button>
      )}
    </div>
  );
};

export default BudgetRing;
