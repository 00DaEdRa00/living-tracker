import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Trophy,
  Flame,
  Wine,
  CheckCircle2,
  Circle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

import { useTrackerStore, ACHIEVEMENTS } from './store/useTrackerStore';
import ToneToggle from './components/ToneToggle';
import BudgetRing from './components/BudgetRing';
import CatClicker from './components/CatClicker';
import AchievementModal from './components/AchievementModal';
import QuickAddModal from './components/QuickAddModal';

export const App: React.FC = () => {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Стор
  const budget = useTrackerStore((state) => state.budget);
  const transactions = useTrackerStore((state) => state.transactions);
  const habits = useTrackerStore((state) => state.habits);
  const tasks = useTrackerStore((state) => state.tasks);
  const tone = useTrackerStore((state) => state.tone);
  const catClicks = useTrackerStore((state) => state.catClicks);
  const unlockedAchievements = useTrackerStore((state) => state.unlockedAchievements);
  const toggleHabit = useTrackerStore((state) => state.toggleHabit);
  const toggleTask = useTrackerStore((state) => state.toggleTask);
  const deleteTransaction = useTrackerStore((state) => state.deleteTransaction);

  // Расчёт XP и уровня
  const unlockedCount = Object.keys(unlockedAchievements).length;
  const habitsScore = habits.reduce((acc, h) => acc + h.streak * 20 + (h.completedToday ? 30 : 0), 0);
  const tasksScore = tasks.filter((t) => t.completed).length * 50;
  const catScore = catClicks * 5;
  const totalXP = unlockedCount * 150 + habitsScore + tasksScore + catScore;
  const xpPerLevel = 300;
  const currentLevel = Math.floor(totalXP / xpPerLevel) + 1;
  const xpProgress = Math.min(Math.round(((totalXP % xpPerLevel) / xpPerLevel) * 100), 100);

  // Алкогольная статистика
  const alcoholTransactions = transactions.filter(
    (tx) => tx.category === 'Алкоголь' || tx.category.toLowerCase().includes('алкоголь')
  );
  const alcoholSpent = alcoholTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  const alcoholBudgetShare =
    budget.spent > 0 ? Math.round((alcoholSpent / budget.spent) * 100) : 0;

  // Тексты в зависимости от тона
  const getToneHeadline = () => {
    if (tone === 'neutral') return 'Финансовый и поведенческий дашборд';
    if (tone === 'ironic') return 'Имитация контроля над собственной жизнью';
    return 'Укроти бабки и не слей свою жизнь в унитаз!';
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-accent/30 selection:text-white">
      {/* Шапка дашборда */}
      <header className="sticky top-0 z-30 w-full bg-surface/85 backdrop-blur-xl border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Логотип */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-accent to-purple-600 shadow-lg shadow-accent/20">
              <Zap className="w-6 h-6 text-white" />
              <div className="absolute -inset-0.5 rounded-2xl bg-accent/30 blur-sm -z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Живой трекер
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 bg-accent/15 border border-accent/40 text-accent rounded-full uppercase tracking-wider">
                  v0.1
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
                {getToneHeadline()}
              </p>
            </div>
          </div>

          {/* Правая часть шапки: переключатель тона и XP */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Переключатель тона */}
            <ToneToggle />

            {/* Баланс очков / XP */}
            <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-surface-card border border-surface-border shadow-sm">
              <div className="flex flex-col text-right">
                <div className="flex items-center justify-end gap-1 text-xs font-bold text-white">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ур. {currentLevel}</span>
                  <span className="text-[10px] font-medium text-slate-400 ml-1">
                    ({totalXP} XP)
                  </span>
                </div>
                {/* XP прогрессбар */}
                <div className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Верхняя секция: Центральный круг бюджета и ключевые виджеты */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Центральный круг бюджета */}
          <section className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-surface-card/70 border border-surface-border shadow-xl backdrop-blur-sm relative overflow-hidden">
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Бюджет месяца
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Лимит: {budget.monthlyLimit.toLocaleString('ru-RU')} ₽
              </span>
            </div>

            {/* SVG Кольцо */}
            <BudgetRing onOpenAddExpense={() => setIsAddExpenseOpen(true)} />
          </section>

          {/* Быстрые статы и радар алкоголя */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Виджет: Алкогольный радар */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-950/30 via-surface-card to-surface-card border border-rose-500/30 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <Wine className="w-5 h-5 text-rose-400" />
                  <span>Алкогольный радар</span>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {alcoholBudgetShare}% бюджета
                </span>
              </div>

              <div className="mt-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  {alcoholSpent.toLocaleString('ru-RU')}{' '}
                  <span className="text-lg text-slate-400 font-normal">₽</span>
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  {alcoholSpent === 0
                    ? 'Трезвость — норма жизни! Ни копейки на алко.'
                    : tone === 'sassy'
                    ? 'Печень шлёт тебе лучи «добра», а кошелёк просит пощады!'
                    : tone === 'ironic'
                    ? 'Инвестиции в душевное равновесие и головную боль.'
                    : 'Суммарные траты по категории алкоголя.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>Чеков на алко:</span>
                <span className="font-bold text-white">{alcoholTransactions.length}</span>
              </div>
            </div>

            {/* Виджет: Ачивки и прогресс */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-950/30 via-surface-card to-surface-card border border-purple-500/30 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Достижения</span>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {unlockedCount} / {ACHIEVEMENTS.length}
                </span>
              </div>

              <div className="flex items-center gap-3 my-3">
                <div className="flex -space-x-2 overflow-hidden py-1">
                  {ACHIEVEMENTS.slice(0, 5).map((ach) => {
                    const isUnlocked = Boolean(unlockedAchievements[ach.id]);
                    return (
                      <div
                        key={ach.id}
                        title={ach.title}
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center border-2 border-surface text-lg transition-transform hover:scale-110 ${
                          isUnlocked
                            ? 'bg-purple-900/60 shadow-md shadow-purple-500/20'
                            : 'bg-slate-800/80 grayscale opacity-40'
                        }`}
                      >
                        {ach.icon}
                      </div>
                    );
                  })}
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {unlockedCount === ACHIEVEMENTS.length ? 'Все открыты!' : 'Охота продолжается'}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-2">
                {tone === 'sassy'
                  ? 'Выполняй привычки и кликай секретки, чтобы закрыть коллекцию!'
                  : 'Открывайте новые достижения за активность и дисциплину.'}
              </p>
            </div>

            {/* Виджет: Дисциплина и привычки */}
            <div className="p-5 rounded-3xl bg-surface-card border border-surface-border shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>Привычки сегодня</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  {habits.filter((h) => h.completedToday).length} / {habits.length}
                </span>
              </div>

              <div className="space-y-2 mt-3">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-surface/70 hover:bg-surface border border-surface-border cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {habit.completedToday ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 group-hover:text-accent shrink-0" />
                      )}
                      <span
                        className={`text-xs font-medium truncate ${
                          habit.completedToday
                            ? 'line-through text-slate-500'
                            : 'text-slate-200'
                        }`}
                      >
                        {habit.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-amber-400 text-xs font-bold pl-2">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{habit.streak}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Виджет: Горящие задачи */}
            <div className="p-5 rounded-3xl bg-surface-card border border-surface-border shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  <span>Задачи в фокусе</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  {tasks.filter((t) => t.completed).length} / {tasks.length}
                </span>
              </div>

              <div className="space-y-2 mt-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-surface/70 hover:bg-surface border border-surface-border cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 group-hover:text-accent shrink-0" />
                      )}
                      <span
                        className={`text-xs font-medium truncate ${
                          task.completed
                            ? 'line-through text-slate-500'
                            : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {task.priority && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          task.priority === 'high'
                            ? 'bg-red-950/60 text-red-400 border border-red-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя секция: Список транзакций */}
        <section className="p-6 rounded-3xl bg-surface-card border border-surface-border shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Последние операции</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface text-slate-400 border border-surface-border">
                {transactions.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-white px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить</span>
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Транзакций пока нет</p>
              <p className="text-xs text-slate-600 mt-1">
                Нажмите «Добавить расход», чтобы начать учёт
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border mt-2">
              {transactions.slice(0, 8).map((tx) => {
                const isExpense = tx.type !== 'income';
                return (
                  <div
                    key={tx.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isExpense
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {isExpense ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">
                            {tx.category}
                          </span>
                          {tx.category === 'Алкоголь' && (
                            <span className="text-xs">🍷</span>
                          )}
                        </div>
                        {tx.description && (
                          <p className="text-xs text-slate-400 truncate">
                            {tx.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div
                        className={`text-sm sm:text-base font-extrabold ${
                          isExpense ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {tx.amount.toLocaleString('ru-RU')} ₽
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteTransaction(tx.id)}
                        title="Удалить запись"
                        className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg hover:bg-surface transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Кот-кликер в нижнем углу */}
      <CatClicker />

      {/* Модалка достижений */}
      <AchievementModal />

      {/* Модалка быстрого добавления расхода */}
      <QuickAddModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />
    </div>
  );
};

export default App;
