/**
 * Lightweight internationalization (i18n) module for Living Tracker.
 * Adheres to Tone Localization Rule from autonomous-dev-sprints-v4:
 * - Primary language (RU): multi-tier humor (neutral, ironic, sassy).
 * - Secondary language (EN): clean, polite, and neutral.
 */

import { ToneMode } from '../types/tracker';

export type SupportedLanguage = 'ru' | 'en';

export interface I18nDictionary {
  appName: string;
  tabs: {
    dashboard: string;
    tasks: string;
    habits: string;
    finances: string;
    plugins: string;
  };
  headlines: Record<ToneMode, string>;
  xpLevel: string;
  hudWidget: string;
  sound: {
    enabled: string;
    disabled: string;
  };
  budget: {
    title: string;
    monthlyLimit: string;
    spent: string;
    remaining: string;
    overbudget: string;
  };
  tasks: {
    title: string;
    addTask: string;
    completed: string;
    pending: string;
  };
  habits: {
    title: string;
    streak: string;
    bestStreak: string;
    freeze: string;
    heatmap: string;
  };
  plugins: {
    title: string;
    subtitle: string;
    installed: string;
    enable: string;
    disable: string;
  };
  sync: {
    title: string;
    export: string;
    import: string;
    p2pRoom: string;
  };
}

export const translations: Record<SupportedLanguage, I18nDictionary> = {
  ru: {
    appName: 'Живой трекер',
    tabs: {
      dashboard: 'Дашборд (Все блоки)',
      tasks: 'Задачи',
      habits: 'Привычки & Стрики',
      finances: 'Финансы',
      plugins: 'Плагины & Слоты',
    },
    headlines: {
      neutral: 'Финансовый и поведенческий дашборд',
      ironic: 'Имитация контроля над собственной жизнью',
      sassy: 'Укроти бабки и не слей свою жизнь в унитаз!',
    },
    xpLevel: 'Ур.',
    hudWidget: 'HUD виджет',
    sound: {
      enabled: 'Звук включен',
      disabled: 'Звук выключен',
    },
    budget: {
      title: 'Бюджет & Расходы',
      monthlyLimit: 'Лимит на месяц',
      spent: 'Потрачено',
      remaining: 'Остаток',
      overbudget: 'Превышение бюджета!',
    },
    tasks: {
      title: 'Задачи и Дедлайны',
      addTask: 'Новая задача',
      completed: 'Выполнено',
      pending: 'В процессе',
    },
    habits: {
      title: 'Привычки и Стрики',
      streak: 'Текущий стрик',
      bestStreak: 'Рекорд',
      freeze: 'Заморозить стрик',
      heatmap: 'Тепловая карта активности',
    },
    plugins: {
      title: 'Каталог плагинов и UI Слоты',
      subtitle: 'Расширяйте возможности трекера через модульные компоненты и EventBus',
      installed: 'Установленные плагины',
      enable: 'Включить',
      disable: 'Отключить',
    },
    sync: {
      title: 'P2P Синхронизация & Бэкап',
      export: 'Экспорт JSON снапшота',
      import: 'Импорт из бэкапа',
      p2pRoom: 'WebRTC P2P комната',
    },
  },
  en: {
    appName: 'Living Tracker',
    tabs: {
      dashboard: 'Dashboard (Overview)',
      tasks: 'Tasks',
      habits: 'Habits & Streaks',
      finances: 'Finances',
      plugins: 'Plugins & Slots',
    },
    // Tone Localization Rule: English translations remain clean and polite across all tones
    headlines: {
      neutral: 'Personal Productivity and Financial Command Center',
      ironic: 'Smart Tracking for Focused Daily Execution',
      sassy: 'Level up your discipline and take control of your time',
    },
    xpLevel: 'Lvl.',
    hudWidget: 'HUD Widget',
    sound: {
      enabled: 'Sound FX Enabled',
      disabled: 'Sound FX Disabled',
    },
    budget: {
      title: 'Budget & Expenses',
      monthlyLimit: 'Monthly Limit',
      spent: 'Spent',
      remaining: 'Remaining',
      overbudget: 'Budget exceeded!',
    },
    tasks: {
      title: 'Tasks & Deadlines',
      addTask: 'New Task',
      completed: 'Completed',
      pending: 'In Progress',
    },
    habits: {
      title: 'Habits & Streaks',
      streak: 'Current Streak',
      bestStreak: 'Best Streak',
      freeze: 'Freeze Streak',
      heatmap: 'Activity Heatmap',
    },
    plugins: {
      title: 'Plugin Marketplace & UI Slots',
      subtitle: 'Extend tracker capabilities with modular components and EventBus hooks',
      installed: 'Installed Plugins',
      enable: 'Enable',
      disable: 'Disable',
    },
    sync: {
      title: 'P2P Sync & Data Vault',
      export: 'Export JSON Snapshot',
      import: 'Import from Backup',
      p2pRoom: 'WebRTC P2P Room',
    },
  },
};

export function getTranslation(lang: SupportedLanguage = 'ru'): I18nDictionary {
  return translations[lang] || translations.ru;
}
