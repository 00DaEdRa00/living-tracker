import type {
  Achievement,
  AchievementCategory,
  AchievementRarity,
  ToneMode,
  AchievementToneContent,
} from '../types/tracker';

export type { Achievement, AchievementCategory, AchievementRarity };
export type AchievementTone = ToneMode;
export type AchievementLocalizedText = AchievementToneContent;

export interface AchievementCondition {
  type: string;
  target?: number;
  [key: string]: any;
}

export interface CategoryMeta {
  id: AchievementCategory;
  label: string;
  icon: string;
}

export interface RarityMeta {
  id: AchievementRarity;
  label: string;
  color: string;
}

export const CATEGORIES_META: Record<AchievementCategory, CategoryMeta> = {
  finance: { id: 'finance', label: 'Финансы', icon: '💰' },
  habits: { id: 'habits', label: 'Привычки', icon: '⚡' },
  tasks: { id: 'tasks', label: 'Задачи', icon: '📋' },
  easter_egg: { id: 'easter_egg', label: 'Секретки', icon: '🐱' },
  system: { id: 'system', label: 'Система', icon: '⚙️' },
};

export const RARITIES_META: Record<AchievementRarity, RarityMeta> = {
  common: { id: 'common', label: 'Обычная', color: '#94a3b8' },
  rare: { id: 'rare', label: 'Редкая', color: '#38bdf8' },
  epic: { id: 'epic', label: 'Эпическая', color: '#a855f7' },
  legendary: { id: 'legendary', label: 'Легендарная', color: '#f59e0b' },
};

export const ACHIEVEMENTS: Achievement[] = [
  // --- Финансы ---
  {
    id: 'first_transaction',
    icon: '💸',
    category: 'finance',
    rarity: 'common',
    title: 'Первая трата',
    description: 'Зафиксирована первая транзакция в системе',
    tones: {
      neutral: {
        title: 'Первая транзакция',
        description: 'Зафиксирован первый расход в приложении.',
      },
      ironic: {
        title: 'Прощай, заначка',
        description: 'Кажется, кто-то снова не смог удержаться и распечатал кубышку.',
      },
      sassy: {
        title: 'Понеслась п**да по кочкам',
        description: 'Первая покупка залетела! Кошелёк напрягся, держись крепче.',
      },
    },
  },
  {
    id: 'overbudget',
    icon: '🚨',
    category: 'finance',
    rarity: 'epic',
    title: 'Лимит превышен',
    description: 'Расходы превысили установленный месячный бюджет',
    tones: {
      neutral: {
        title: 'Превышение бюджета',
        description: 'Расходы превысили установленный месячный лимит.',
      },
      ironic: {
        title: 'Красиво жить не запретишь',
        description: 'Бюджет официально капитулировал перед вашими хотелками.',
      },
      sassy: {
        title: 'Финансовое дно пробито',
        description: 'Лимит пошёл по п**де! Гуляем на все бабки, живём один раз!',
      },
    },
  },
  {
    id: 'big_spender',
    icon: '💎',
    category: 'finance',
    rarity: 'rare',
    title: 'Крупный чек',
    description: 'Разовая покупка на сумму от 10 000 ₽',
    tones: {
      neutral: {
        title: 'Крупная покупка',
        description: 'Совершена покупка на сумму более 10 000 ₽.',
      },
      ironic: {
        title: 'Гулять так гулять',
        description: 'Надеемся, это была жизненно важная вещь, а не капибара в худи.',
      },
      sassy: {
        title: 'Мажор в здании',
        description: 'Всадил котлету за один присест. Надеюсь, оно того стоило!',
      },
    },
  },

  // --- Привычки ---
  {
    id: 'first_habit',
    icon: '🌱',
    category: 'habits',
    rarity: 'common',
    title: 'Первый росток',
    description: 'Выполнена первая полезная привычка',
    tones: {
      neutral: {
        title: 'Первый шаг',
        description: 'Выполнена первая полезная привычка.',
      },
      ironic: {
        title: 'Начало положено',
        description: 'Один раз сделал — теперь можно неделю гордиться собой.',
      },
      sassy: {
        title: 'С почином, б**!',
        description: 'Осилил привычку. Смотри не надорвись от собственной крутости.',
      },
    },
  },
  {
    id: 'streak_3',
    icon: '🔥',
    category: 'habits',
    rarity: 'common',
    title: 'Огонёк разгорается',
    description: 'Стрик привычки достиг 3 дней',
    tones: {
      neutral: {
        title: 'Серия 3 дня',
        description: 'Привычка выполняется 3 дня подряд.',
      },
      ironic: {
        title: 'Три дня не срок',
        description: 'Три дня без пропусков — ученые поражены вашей стойкостью.',
      },
      sassy: {
        title: 'Втягиваешься, чертяка',
        description: '3 дня подряд! Главное теперь — не сорваться на радостях в запой.',
      },
    },
  },
  {
    id: 'streak_7',
    icon: '⚡',
    category: 'habits',
    rarity: 'rare',
    title: 'Недельный стрик',
    description: 'Привычка выполняется 7 дней без единого пропуска',
    tones: {
      neutral: {
        title: 'Неделя дисциплины',
        description: 'Привычка выполняется 7 дней подряд без срывов.',
      },
      ironic: {
        title: 'Мастер самоконтроля',
        description: 'Целая неделя! Пора продавать курсы успешного успеха.',
      },
      sassy: {
        title: 'Железные яйца',
        description: '7 дней подряд без отмазок! Ты грёбаная машина продуктивности.',
      },
    },
  },

  // --- Задачи ---
  {
    id: 'first_task',
    icon: '✅',
    category: 'tasks',
    rarity: 'common',
    title: 'Минус дело',
    description: 'Выполнена первая задача из списка',
    tones: {
      neutral: {
        title: 'Дело сделано',
        description: 'Выполнена первая задача из списка.',
      },
      ironic: {
        title: 'Минус одна отмазка',
        description: 'Одной задачей меньше, сотней больше. Но галочка приятная.',
      },
      sassy: {
        title: 'Раскидал вопросик',
        description: 'Таска закрыта, красава! Накати чайку за победу.',
      },
    },
  },
  {
    id: 'speedrunner',
    icon: '🏎️',
    category: 'tasks',
    rarity: 'rare',
    title: 'Спидраннер',
    description: 'Задача выполнена в день создания',
    tones: {
      neutral: {
        title: 'Быстрый старт',
        description: 'Задача закрыта в день её создания.',
      },
      ironic: {
        title: 'Слишком шустро',
        description: 'Сделал сразу? Подозрительная продуктивность, сходи проверься.',
      },
      sassy: {
        title: 'Скорострел по таскам',
        description: 'Едва создал — уже закрыл. Мощь, скорость, разъёб.',
      },
    },
  },
  {
    id: 'procrastinator_cured',
    icon: '🦕',
    category: 'tasks',
    rarity: 'rare',
    title: 'Победа над мхом',
    description: 'Завершена задача, ожидавшая более 3 дней',
    tones: {
      neutral: {
        title: 'Долгожданный финал',
        description: 'Завершена задача, ожидавшая более 3 дней.',
      },
      ironic: {
        title: 'Спустя эпоху',
        description: 'Эта задача уже покрылась пылью, но чудо всё-таки произошло.',
      },
      sassy: {
        title: 'Родил наконец-то!',
        description: 'Таска мариновалась несколько дней, но ты её всё-таки дожал, монстр.',
      },
    },
  },

  // --- Пасхалки и клики ---
  {
    id: 'cat_clicked_1',
    icon: '🐱',
    category: 'easter_egg',
    rarity: 'common',
    title: 'Друг кота',
    description: 'Вы погладили кота',
    tones: {
      neutral: {
        title: 'Внимание к питомцу',
        description: 'Вы погладили виртуального кота.',
      },
      ironic: {
        title: 'Приоритеты на высоте',
        description: 'Вместо важных дел гладим кота на экране. Уважаемо.',
      },
      sassy: {
        title: 'Почесал котейку',
        description: 'Кот довольно замурчал. +100 к карме, -10 к тревожности.',
      },
    },
  },
  {
    id: 'cat_clicked_10',
    icon: '🐾',
    category: 'easter_egg',
    rarity: 'rare',
    title: 'Кошачий гипноз',
    description: 'Кот нажат 10 раз',
    tones: {
      neutral: {
        title: 'Кошачий культ',
        description: 'Кот нажат 10 раз.',
      },
      ironic: {
        title: 'Котомания',
        description: 'Кот уже подумывает вызвать полицию за домогательства.',
      },
      sassy: {
        title: 'Хватит лапать кота!',
        description: '10 кликов по коту подряд. Иди поработай, маньячелло шерстяной!',
      },
    },
  },
  {
    id: 'price_clicked_1',
    icon: '🏷️',
    category: 'easter_egg',
    rarity: 'common',
    title: 'Клик по ценнику',
    description: 'Вы нажали на элемент стоимости',
    tones: {
      neutral: {
        title: 'Интерес к деталям',
        description: 'Вы нажали на элемент стоимости.',
      },
      ironic: {
        title: 'Жаба шевелится?',
        description: 'Клик по ценнику. Думали, от клика цифра станет меньше?',
      },
      sassy: {
        title: 'Чё, дорого?',
        description: 'Тык по ценнику не уменьшит сумму, бро. Придётся платить.',
      },
    },
  },
  {
    id: 'page_explorer',
    icon: '🧭',
    category: 'system',
    rarity: 'common',
    title: 'Исследователь',
    description: 'Просмотрен новый раздел приложения',
    tones: {
      neutral: {
        title: 'Навигатор',
        description: 'Просмотрен раздел приложения.',
      },
      ironic: {
        title: 'Экскурсия началась',
        description: 'Ищете тайную кнопку «Решить все проблемы автоматически»?',
      },
      sassy: {
        title: 'Любопытный нос',
        description: 'Заглянул во вкладку. Разнюхиваешь обстановку? Одобряем.',
      },
    },
  },
];

export function getAchievementText(
  achievement: Achievement,
  tone: ToneMode = 'sassy'
): { title: string; description: string } {
  if (achievement.tones?.[tone]) {
    return achievement.tones[tone]!;
  }
  return {
    title: achievement.title,
    description: achievement.description,
  };
}
