import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  LayoutGrid,
  CheckSquare,
  CreditCard,
  ChevronRight,
  Calendar,
  Volume2,
  VolumeX,
  Blocks,
  Globe,
} from 'lucide-react';

import { useTrackerStore, ACHIEVEMENTS, eventBus } from './store/useTrackerStore';
import ToneToggle from './components/ToneToggle';
import ThemeSelector from './components/ThemeSelector';
import BudgetRing from './components/BudgetRing';
import CatClicker from './components/CatClicker';
import AchievementModal from './components/AchievementModal';
import AchievementsGalleryModal from './components/AchievementsGalleryModal';
import QuickAddModal from './components/QuickAddModal';
import TasksSection from './components/TasksSection';
import HabitsSection from './components/HabitsSection';
import HudWidget from './components/HudWidget';
import { PluginSlotRenderer } from './components/PluginSlots';
import { PluginMarketplace } from './components/PluginMarketplace';
import { initializePlugins } from './plugins';
import { SupportedLanguage, getTranslation } from './lib/i18n';
import { isTauri, toggleHudWindow } from './lib/tauriBridge';
import { playCoinSound, playClickSound } from './lib/soundFx';

export type DashboardTab = 'all' | 'tasks' | 'habits' | 'finances' | 'plugins';

export const App: React.FC = () => {
  const isHudWindow =
    typeof window !== 'undefined' &&
    (window.location.search.includes('window=hud') ||
      window.location.hash.includes('hud'));

  const [activeTab, setActiveTab] = useState<DashboardTab>('all');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isHudPreviewOpen, setIsHudPreviewOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>('ru');

  // Инициализация системы плагинов при монтировании
  useEffect(() => {
    initializePlugins();
  }, []);

  const t = getTranslation(language);

  // Стор
  const budget = useTrackerStore((state) => state.budget);
  const transactions = useTrackerStore((state) => state.transactions);
  const habits = useTrackerStore((state) => state.habits);
  const tasks = useTrackerStore((state) => state.tasks);
  const tone = useTrackerStore((state) => state.tone);
  const theme = useTrackerStore((state) => state.theme);
  const soundEnabled = useTrackerStore((state) => state.soundEnabled);
  const toggleSound = useTrackerStore((state) => state.toggleSound);
  const catClicks = useTrackerStore((state) => state.catClicks);
  const unlockedAchievements = useTrackerStore((state) => state.unlockedAchievements);
  const toggleHabit = useTrackerStore((state) => state.toggleHabit);
  const toggleTask = useTrackerStore((state) => state.toggleTask);
  const deleteTransaction = useTrackerStore((state) => state.deleteTransaction);

  // Синхронизация темы с корневым DOM-элементом
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.className = `theme-${theme}`;
    }
  }, [theme]);

  // Подсчёт XP и уровня
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

  // Счетчики для вкладок
  const activeTasksCount = tasks.filter((t) => !t.completed).length;
  const habitsRemainingCount = habits.filter((h) => !h.completedToday).length;

  const handleTabChange = (newTab: DashboardTab) => {
    setActiveTab(newTab);
    eventBus.emit({ type: 'PAGE_VIEWED', payload: { page: newTab } });
  };

  // Тексты в зависимости от тона с соблюдением Tone Localization Rule
  const getToneHeadline = () => {
    if (language === 'en') {
      return t.headlines[tone] || t.headlines.neutral;
    }
    if (tone === 'neutral') return 'Финансовый и поведенческий дашборд';
    if (tone === 'ironic') return 'Имитация контроля над собственной жизнью';
    return 'Укроти бабки и не слей свою жизнь в унитаз!';
  };

  // Режим плавающего окна HUD виджета
  if (isHudWindow) {
    return (
      <div className="w-full h-screen bg-transparent flex items-center justify-center p-0 m-0 overflow-hidden">
        <HudWidget />
      </div>
    );
  }

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
                  Sprint 4 • Tauri
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
                {getToneHeadline()}
              </p>
            </div>
          </div>

          {/* Правая часть шапки: темы, тон, звук и XP */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* Переключатель языка (RU / EN) */}
            <button
              type="button"
              onClick={() => {
                const nextLang = language === 'ru' ? 'en' : 'ru';
                setLanguage(nextLang);
                playClickSound();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-surface-card border border-surface-border hover:border-slate-500 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Переключить язык (RU / EN)"
            >
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span className="uppercase text-[11px] font-mono">{language}</span>
            </button>

            {/* Переключатель темы */}
            <ThemeSelector />

            {/* Переключатель тона */}
            <ToneToggle />

            {/* Тумблер звука (громкоговоритель 🔊/🔇) */}
            <button
              type="button"
              onClick={() => {
                const willEnable = !soundEnabled;
                toggleSound();
                if (willEnable) {
                  setTimeout(() => playCoinSound(), 50);
                }
              }}
              title={
                soundEnabled
                  ? 'Звуковые эффекты: Включены (клик для отключения)'
                  : 'Звуковые эффекты: Выключены (клик для включения)'
              }
              aria-label={soundEnabled ? 'Выключить звук' : 'Включить звук'}
              className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border transition-all duration-200 cursor-pointer focus:outline-none ${
                soundEnabled
                  ? 'bg-accent/15 border-accent/40 text-accent shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:bg-accent/25'
                  : 'bg-surface-card border-surface-border text-slate-500 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Кнопка вызова плавающего HUD-виджета */}
            <button
              type="button"
              onClick={async () => {
                if (isTauri()) {
                  await toggleHudWindow();
                } else {
                  setIsHudPreviewOpen(!isHudPreviewOpen);
                  playCoinSound();
                }
              }}
              title={
                isTauri()
                  ? 'Переключить нативный плавающий HUD виджет'
                  : 'Превью плавающего HUD виджета'
              }
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all duration-200 cursor-pointer focus:outline-none text-xs font-bold ${
                isHudPreviewOpen
                  ? 'bg-accent/20 border-accent/40 text-accent shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                  : 'bg-surface-card border-surface-border text-slate-300 hover:text-white hover:border-slate-500'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="hidden sm:inline">HUD</span>
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-accent/20 text-accent uppercase font-black">
                виджет
              </span>
            </button>

            {/* Баланс очков / XP */}
            <div
              onClick={() => {
                playClickSound();
                setIsGalleryOpen(true);
              }}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-surface-card border border-surface-border shadow-sm hover:border-amber-500/50 cursor-pointer transition-all"
              title="Открыть зал славы и трофеи"
            >
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

        {/* Навигационная панель командного центра (Табы) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none border-t border-surface-border/50">
          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-card/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t.tabs.dashboard}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('tasks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-card/60'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{t.tabs.tasks}</span>
              {activeTasksCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/30 text-sky-200 font-extrabold">
                  {activeTasksCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('habits')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'habits'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-card/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{t.tabs.habits}</span>
              {habitsRemainingCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 font-extrabold">
                  {habitsRemainingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('finances')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'finances'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-card/60'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t.tabs.finances}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('plugins')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'plugins'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-surface-card/60'
              }`}
            >
              <Blocks className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.tabs.plugins}</span>
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Система в норме</span>
            </span>
          </div>
        </div>
      </header>

      {/* Основной контент дашборда */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Режим: Все блоки (Главный командный центр) */}
        {activeTab === 'all' && (
          <div className="space-y-8">
            {/* Верхняя панель: Кольцо бюджета + Радар + Ачивки + Быстрый фокус */}
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

                <BudgetRing onOpenAddExpense={() => setIsAddExpenseOpen(true)} />
              </section>

              {/* Статы, радар и карточки быстрого перехода */}
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

                {/* Виджет: Достижения */}
                <div
                  onClick={() => {
                    playClickSound();
                    setIsGalleryOpen(true);
                  }}
                  className="p-4 rounded-3xl bg-surface-card border border-surface-border hover:border-amber-500/50 shadow-lg cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
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
                  <span className="text-[11px] text-amber-400 font-semibold mt-2 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Открыть зал славы и карточки шеринга →
                  </span>
                </div>

                {/* Виджет: Быстрый доступ к задачам */}
                <div
                  onClick={() => handleTabChange('tasks')}
                  className="p-4 rounded-3xl bg-surface-card border border-surface-border hover:border-sky-500/50 shadow-lg cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4 text-accent" />
                      <span>Задачи в фокусе</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-accent transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="text-xl font-extrabold text-white">
                    {activeTasksCount}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      активных из {tasks.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-accent font-semibold mt-2 inline-flex items-center gap-1">
                    Перейти к управлению задачами →
                  </span>
                </div>

                {/* Виджет: Быстрый доступ к привычкам */}
                <div
                  onClick={() => handleTabChange('habits')}
                  className="p-4 rounded-3xl bg-surface-card border border-surface-border hover:border-amber-500/50 shadow-lg cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>Привычки сегодня</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="text-xl font-extrabold text-white">
                    {habits.filter((h) => h.completedToday).length}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      из {habits.length} выполнено
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-semibold mt-2 inline-flex items-center gap-1">
                    Открыть стрик-трекер и карту →
                  </span>
                </div>
              </div>
            </div>

            {/* Слот плагинов: dashboard.widgets (Помодоро, Дзен-цитаты, P2P комната и др.) */}
            <div className="pt-2">
              <PluginSlotRenderer slot="dashboard.widgets" />
            </div>

            {/* Блок 1: Полноценная секция задач */}
            <div className="pt-2">
              <TasksSection />
            </div>

            {/* Блок 2: Полноценная секция привычек */}
            <div className="pt-2">
              <HabitsSection />
            </div>

            {/* Блок 3: Список финансовых операций */}
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
                  className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-white px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить операцию</span>
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Транзакций пока нет</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Нажмите «Добавить операцию», чтобы зафиксировать первый расход или доход
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
                            className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg hover:bg-surface transition-colors cursor-pointer"
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
          </div>
        )}

        {/* Режим: Выделенный экран задач */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <TasksSection />
          </div>
        )}

        {/* Режим: Выделенный экран привычек */}
        {activeTab === 'habits' && (
          <div className="space-y-6">
            <HabitsSection />
          </div>
        )}

        {/* Режим: Выделенный экран финансов */}
        {activeTab === 'finances' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <section className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-3xl bg-surface-card/70 border border-surface-border shadow-xl backdrop-blur-sm">
                <div className="w-full flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Круг бюджета
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">
                    Лимит: {budget.monthlyLimit.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <BudgetRing onOpenAddExpense={() => setIsAddExpenseOpen(true)} />
              </section>

              <div className="lg:col-span-6 p-6 rounded-3xl bg-surface-card border border-surface-border shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <Wine className="w-5 h-5" />
                    <span>Алкогольный радар трат</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {alcoholBudgetShare}% бюджета
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {alcoholSpent.toLocaleString('ru-RU')} ₽
                </div>
                <p className="text-xs text-slate-300">
                  {alcoholSpent === 0
                    ? 'Трезвость и чистый ум! Расходов на алкоголь в этом месяце нет.'
                    : 'Контролируйте чеки на алкоголь и бары, чтобы они не пожирали финансовую подушку.'}
                </p>
                <div className="pt-4 border-t border-surface-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-accent text-slate-950 font-bold text-xs hover:bg-accent/90 transition-colors cursor-pointer"
                  >
                    + Записать чек / расход
                  </button>
                </div>
              </div>
            </div>

            {/* Полный список операций */}
            <section className="p-6 rounded-3xl bg-surface-card border border-surface-border shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <h3 className="text-lg font-bold text-white">История транзакций</h3>
                <span className="text-xs text-slate-400">Всего: {transactions.length}</span>
              </div>
              <div className="divide-y divide-surface-border mt-2">
                {transactions.map((tx) => {
                  const isExpense = tx.type !== 'income';
                  return (
                    <div
                      key={tx.id}
                      className="py-3.5 flex items-center justify-between gap-4 px-2"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isExpense
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isExpense ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{tx.category}</div>
                          {tx.description && <div className="text-xs text-slate-400">{tx.description}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${isExpense ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isExpense ? '-' : '+'}{tx.amount.toLocaleString('ru-RU')} ₽
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Режим: Каталог дополнений и UI Слоты */}
        {activeTab === 'plugins' && (
          <div className="space-y-6">
            <PluginMarketplace />
          </div>
        )}
      </main>

      {/* Кот-кликер в нижнем углу */}
      <CatClicker />

      {/* Модалка достижений */}
      <AchievementModal />

      {/* Галерея достижений и зал славы */}
      <AchievementsGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      {/* Модалка быстрого добавления расхода */}
      <QuickAddModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />

      {/* Плавающий HUD-виджет для браузерного превью */}
      {isHudPreviewOpen && (
        <HudWidget isOverlay onClose={() => setIsHudPreviewOpen(false)} />
      )}
    </div>
  );
};

export default App;