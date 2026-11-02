import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  AlertTriangle,
  Flame,
  Calendar,
  Trash2,
  X,
  Sparkles,
  Layers,
  ChevronDown,
  Timer,
  Image as ImageIcon,
  ArrowUpDown,
  Search,
  Edit3,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTrackerStore } from '../store/useTrackerStore';
import type { Task } from '../types/tracker';
import { PluginSlotRenderer } from './PluginSlots';
import { playTaskCompleteSound, playClickSound, playTrashSound, playEditSound } from '../lib/soundFx';
import { TaskShareModal } from './TaskShareModal';

export interface LifeSphere {
  id: string;
  label: string;
  icon: string;
  badgeClass: string;
}

export const LIFE_SPHERES: LifeSphere[] = [
  { id: 'all', label: 'Все', icon: '✨', badgeClass: 'bg-accent/15 text-accent border-accent/30' },
  { id: 'Работа', label: 'Работа', icon: '💼', badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { id: 'Здоровье/Спорт', label: 'Здоровье/Спорт', icon: '🏋️', badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'Быт', label: 'Быт', icon: '💡', badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { id: 'Финансы', label: 'Финансы', icon: '💰', badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  { id: 'Хобби', label: 'Хобби', icon: '📚', badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
];

export const TASK_ICON_PRESETS = [
  { icon: '🏋️', label: 'Тренировка', sphere: 'Здоровье/Спорт' },
  { icon: '💡', label: 'ЖКХ/Счета', sphere: 'Быт' },
  { icon: '📚', label: 'Книга/Учёба', sphere: 'Хобби' },
  { icon: '💻', label: 'Кодинг/Работа', sphere: 'Работа' },
  { icon: '💰', label: 'Финансы', sphere: 'Финансы' },
  { icon: '🛒', label: 'Покупки', sphere: 'Быт' },
  { icon: '🩺', label: 'Здоровье', sphere: 'Здоровье/Спорт' },
  { icon: '🎨', label: 'Творчество', sphere: 'Хобби' },
  { icon: '🧹', label: 'Уборка', sphere: 'Быт' },
  { icon: '🚀', label: 'Релиз/Проект', sphere: 'Работа' },
  { icon: '🎯', label: 'Главная цель', sphere: 'Работа' },
  { icon: '🔥', label: 'Срочно!', sphere: 'Все' },
];

export const TASK_IMAGE_PRESETS = [
  {
    label: 'Кодинг/Фокус',
    icon: '💻',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Спорт/Зал',
    icon: '🏋️',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Финансы/Инвест',
    icon: '💰',
    url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Дом/Уют',
    icon: '💡',
    url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Книги/Учёба',
    icon: '📚',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Природа/Отдых',
    icon: '🌲',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
  },
];

export function formatTimeLeft(dueDateStr: string, now: Date): {
  status: 'overdue' | 'urgent' | 'warning' | 'safe';
  text: string;
  pillClass: string;
  dotColor: string;
} {
  const due = new Date(dueDateStr).getTime();
  const current = now.getTime();
  const diffMs = due - current;

  if (diffMs < 0) {
    const overdueMs = Math.abs(diffMs);
    const hours = Math.floor(overdueMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const text =
      days > 0
        ? `Просрочено на ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`
        : `Просрочено на ${Math.max(1, hours)} ч`;
    return {
      status: 'overdue',
      text,
      pillClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/50',
      dotColor: 'bg-rose-400 animate-ping',
    };
  }

  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const daysLeft = Math.floor(hoursLeft / 24);

  if (hoursLeft < 24) {
    const text =
      hoursLeft > 0
        ? `Горит! Осталось ${hoursLeft} ч ${minutesLeft} мин`
        : `Горит! Осталось ${Math.max(1, minutesLeft)} мин`;
    return {
      status: 'urgent',
      text,
      pillClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-950/50',
      dotColor: 'bg-amber-400 animate-pulse',
    };
  }

  if (daysLeft <= 3) {
    return {
      status: 'warning',
      text: `Осталось ${daysLeft} ${daysLeft === 1 ? 'день' : 'дня'}`,
      pillClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      dotColor: 'bg-yellow-400',
    };
  }

  return {
    status: 'safe',
    text: `В запасе ${daysLeft} ${daysLeft < 5 ? 'дня' : 'дней'}`,
    pillClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  };
}

export type DeadlineFilter = 'all' | 'burning' | 'today' | 'week' | 'nodate';

export function matchesDeadlineFilter(
  task: Task,
  filter: DeadlineFilter,
  now: Date
): boolean {
  if (filter === 'all') return true;
  if (filter === 'nodate') return !task.dueDate;
  if (!task.dueDate) return false;

  const due = new Date(task.dueDate).getTime();
  const current = now.getTime();
  const diffHours = (due - current) / (1000 * 60 * 60);

  if (filter === 'burning') {
    return diffHours < 12; // Просрочено или осталось менее 12 часов
  }

  if (filter === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    const dueStr = new Date(due).toISOString().split('T')[0];
    return todayStr === dueStr;
  }

  if (filter === 'week') {
    return diffHours >= 0 && diffHours <= 7 * 24;
  }

  return true;
}

export const TasksSection: React.FC = () => {
  const tasks = useTrackerStore((state) => state.tasks);
  const toggleTask = useTrackerStore((state) => state.toggleTask);
  const addTask = useTrackerStore((state) => state.addTask);
  const updateTask = useTrackerStore((state) => state.updateTask);
  const deleteTask = useTrackerStore((state) => state.deleteTask);
  const clearCompletedTasks = useTrackerStore((state) => state.clearCompletedTasks);
  const tone = useTrackerStore((state) => state.tone);

  const [selectedSphere, setSelectedSphere] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
  const [sortMode, setSortMode] = useState<'default' | 'urgency' | 'priority'>('default');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Модалки шеринга и редактирования
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Форма добавления задачи
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSphere, setFormSphere] = useState('Работа');
  const [formIcon, setFormIcon] = useState('💻');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  // Форма редактирования задачи
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSphere, setEditSphere] = useState('Работа');
  const [editIcon, setEditIcon] = useState('💻');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Обновление таймера каждую минуту
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenEditModal = (task: Task) => {
    playClickSound();
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditSphere(task.category || 'Работа');
    setEditIcon(task.icon || '💻');
    setEditPriority(task.priority || 'medium');
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
    setEditImageUrl(task.imageUrl || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    updateTask(editingTask.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      category: editSphere,
      icon: editIcon,
      priority: editPriority,
      imageUrl: editImageUrl.trim() || undefined,
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
    });

    playEditSound();
    setEditingTask(null);
  };

  const handleClearCompleted = () => {
    if (typeof window !== 'undefined' && window.confirm('Очистить все завершённые задачи?')) {
      clearCompletedTasks();
      playTrashSound();
    }
  };

  const handleToggle = (id: string, completed: boolean) => {
    if (!completed) {
      playTaskCompleteSound();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#38bdf8', '#34d399', '#f59e0b'],
        });
      } catch {
        // no-op
      }
    } else {
      playClickSound();
    }
    toggleTask(id);
  };

  const handleOpenModal = () => {
    setFormTitle('');
    setFormDescription('');
    setFormImageUrl('');
    setFormSphere(selectedSphere === 'all' ? 'Работа' : selectedSphere);
    setFormIcon('💻');
    setFormPriority('medium');
    // По умолчанию дедлайн: завтра в 20:00
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 1);
    defaultDate.setHours(20, 0, 0, 0);
    const localIso = defaultDate.toISOString().slice(0, 16);
    setFormDueDate(localIso);
    setIsModalOpen(true);
  };

  const handleQuickDeadline = (hoursFromNow: number | null) => {
    if (hoursFromNow === null) {
      setFormDueDate('');
      return;
    }
    const d = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormDueDate(localIso);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    addTask({
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formSphere,
      icon: formIcon,
      priority: formPriority,
      imageUrl: formImageUrl.trim() || undefined,
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : undefined,
    });

    setIsModalOpen(false);
  };

  const handleSnooze = (taskId: string, hoursToAdd: number) => {
    playClickSound();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const baseDate = task.dueDate ? new Date(task.dueDate) : new Date();
    const effectiveBase = baseDate.getTime() < Date.now() ? new Date() : baseDate;
    const newDueDate = new Date(effectiveBase.getTime() + hoursToAdd * 60 * 60 * 1000).toISOString();
    updateTask(taskId, { dueDate: newDueDate });
  };

  // Фильтрация задач
  const filteredTasks = tasks.filter((task) => {
    const matchesSphere =
      selectedSphere === 'all' ||
      task.category === selectedSphere ||
      (!task.category && selectedSphere === 'Работа');

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? !task.completed
        : task.completed;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      Boolean(task.description && task.description.toLowerCase().includes(query));

    const matchesDeadline = matchesDeadlineFilter(task, deadlineFilter, currentTime);

    return matchesSphere && matchesStatus && matchesSearch && matchesDeadline;
  });

  // Сортировка задач
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortMode === 'urgency') {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDue - bDue;
    }
    if (sortMode === 'priority') {
      const weights: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const wa = weights[a.priority || 'medium'] || 2;
      const wb = weights[b.priority || 'medium'] || 2;
      return wb - wa;
    }
    return 0;
  });

  // Подсчёт задач по сферам
  const countBySphere = (sphereId: string) => {
    if (sphereId === 'all') return tasks.filter((t) => !t.completed).length;
    return tasks.filter((t) => !t.completed && (t.category === sphereId || (!t.category && sphereId === 'Работа'))).length;
  };

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const burningCount = tasks.filter(
    (t) => !t.completed && matchesDeadlineFilter(t, 'burning', currentTime)
  ).length;
  const todayCount = tasks.filter(
    (t) => !t.completed && matchesDeadlineFilter(t, 'today', currentTime)
  ).length;

  return (
    <section className="space-y-6">
      {/* Шапка секции */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-surface-card border border-surface-border shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent/20 to-sky-500/30 border border-accent/40 flex items-center justify-center text-accent shadow-lg shadow-accent/10">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Командный центр задач
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                {activeCount} в огне
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {tone === 'sassy'
                ? 'Закрывай дедлайны вовремя, иначе они похоронят твой покой!'
                : tone === 'ironic'
                ? 'Имитируем кипучую деятельность или реально разгребем завалы?'
                : 'Контроль сроков, дедлайнов и приоритетов по ключевым сферам жизни.'}
            </p>
          </div>
        </div>

        {/* Кнопка создания задачи */}
        <button
          type="button"
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-sky-500 text-slate-950 font-bold text-sm shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Новая задача</span>
        </button>
      </div>

      {/* Панель фильтров: Сферы жизни и статусы */}
      <div className="space-y-3">
        {/* Строка поиска задач */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или описанию задачи..."
            className="w-full pl-10 pr-9 py-2 rounded-2xl bg-surface/80 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-card transition-colors"
              title="Очистить поиск"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Сферы жизни */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {LIFE_SPHERES.map((sphere) => {
            const count = countBySphere(sphere.id);
            const isSelected = selectedSphere === sphere.id;
            return (
              <button
                key={sphere.id}
                type="button"
                onClick={() => setSelectedSphere(sphere.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
                  isSelected
                    ? 'bg-accent/20 text-white border-accent shadow-md shadow-accent/20 scale-[1.02]'
                    : 'bg-surface-card/80 text-slate-400 border-surface-border hover:bg-surface-card hover:text-slate-200'
                }`}
              >
                <span>{sphere.icon}</span>
                <span>{sphere.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isSelected ? 'bg-accent text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Переключатель статуса (Все / Активные / Завершенные) */}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center p-1 rounded-xl bg-surface border border-surface-border">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-surface-card text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'active'
                  ? 'bg-surface-card text-accent shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              В работе ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-surface-card text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Завершённые ({completedCount})
            </button>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleClearCompleted}
                title="Очистить все завершённые задачи"
                className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Очистить</span>
              </button>
            )}
          </div>

          {/* Сортировка */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-surface-border text-xs">
            <span className="text-[10px] text-slate-500 font-bold px-1.5 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span className="hidden xs:inline">Сорт:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setSortMode('default');
              }}
              className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                sortMode === 'default'
                  ? 'bg-surface-card text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Обычная
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setSortMode('urgency');
              }}
              className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                sortMode === 'urgency'
                  ? 'bg-surface-card text-rose-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Срочные 🔥
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setSortMode('priority');
              }}
              className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                sortMode === 'priority'
                  ? 'bg-surface-card text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Приоритет ⚡
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline-block">
            Показано: <strong className="text-white">{sortedTasks.length}</strong>
          </span>
        </div>

        {/* Фильтры дедлайнов и срочности */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-border/40 text-xs overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold px-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="hidden xs:inline">Сроки:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setDeadlineFilter('all');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                deadlineFilter === 'all'
                  ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все сроки
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setDeadlineFilter('burning');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                deadlineFilter === 'burning'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              <span>🔥 Горят ({burningCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setDeadlineFilter('today');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                deadlineFilter === 'today'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              ⏰ Сегодня ({todayCount})
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setDeadlineFilter('week');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                deadlineFilter === 'week'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📅 На этой неделе
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setDeadlineFilter('nodate');
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                deadlineFilter === 'nodate'
                  ? 'bg-surface-card text-slate-300 border border-surface-border shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Без срока
            </button>
          </div>
        </div>

        {/* Слот плагинов: task.actions */}
        <PluginSlotRenderer slot="task.actions" className="pt-2 border-t border-surface-border/40" />
      </div>

      {/* Список карточек задач */}
      {sortedTasks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface-card/60 border border-dashed border-surface-border">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
            <CheckCircle2 className="w-7 h-7 text-accent" />
          </div>
          <h3 className="text-base font-bold text-white">Здесь чисто и спокойно</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {selectedSphere !== 'all'
              ? `В категории «${selectedSphere}» нет задач с выбранным фильтром.`
              : 'Все задачи закрыты или ещё не добавлены. Отличный повод расслабиться или поставить новую амбициозную цель!'}
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="mt-4 px-4 py-2 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border text-xs font-semibold text-accent transition-colors"
          >
            + Добавить задачу
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {sortedTasks.map((task) => {
              const urgency = task.dueDate && !task.completed
                ? formatTimeLeft(task.dueDate, currentTime)
                : null;

              const sphereMeta =
                LIFE_SPHERES.find((s) => s.id === task.category) ||
                LIFE_SPHERES.find((s) => s.id === 'Работа')!;

              const isOverdue = urgency?.status === 'overdue';
              const isUrgent = urgency?.status === 'urgent';

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`group relative flex flex-col justify-between p-4 rounded-3xl bg-surface-card border transition-all ${
                    task.completed
                      ? 'border-surface-border/50 bg-surface-card/40 opacity-70'
                      : isOverdue
                      ? 'border-rose-500/40 bg-gradient-to-br from-rose-950/20 via-surface-card to-surface-card shadow-lg shadow-rose-950/20'
                      : isUrgent
                      ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-surface-card to-surface-card shadow-lg shadow-amber-950/20'
                      : 'border-surface-border hover:border-slate-600 shadow-md'
                  }`}
                >
                  {/* Обложка-картинка карточки задачи */}
                  {task.imageUrl && (
                    <div className="relative h-28 -mx-4 -mt-4 mb-3 overflow-hidden rounded-t-3xl bg-slate-900 border-b border-surface-border">
                      <img
                        src={task.imageUrl}
                        alt={task.title}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          task.completed ? 'grayscale contrast-75 opacity-40' : ''
                        }`}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/20 to-transparent" />
                    </div>
                  )}

                  {/* Верхняя строка карточки: Сфера, Иконка и Действия */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {/* Иконка задачи */}
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg border ${
                            task.completed
                              ? 'bg-slate-800/60 border-surface-border text-slate-500'
                              : 'bg-surface border-surface-border shadow-inner'
                          }`}
                        >
                          {task.icon || sphereMeta.icon || '🎯'}
                        </div>

                        {/* Сфера жизни */}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${sphereMeta.badgeClass}`}
                        >
                          {task.category || 'Работа'}
                        </span>
                      </div>

                      {/* Приоритет и удаление */}
                      <div className="flex items-center gap-1.5">
                        {task.priority && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              task.priority === 'high'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : task.priority === 'medium'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {task.priority === 'high'
                              ? 'Высокий'
                              : task.priority === 'medium'
                              ? 'Средний'
                              : 'Обычный'}
                          </span>
                        )}

                        {/* Кнопка шеринга карточки */}
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setSharingTask(task);
                          }}
                          title="Поделиться карточкой задачи"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-accent rounded-lg hover:bg-surface transition-all cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Кнопка редактирования */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(task)}
                          title="Редактировать задачу"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-sky-300 rounded-lg hover:bg-surface transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Кнопка удаления */}
                        <button
                          type="button"
                          onClick={() => {
                            deleteTask(task.id);
                            playTrashSound();
                          }}
                          title="Удалить задачу"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-surface transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Название и описание с тактильным чекбоксом */}
                    <div className="flex items-start gap-3 my-2">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.82 }}
                        onClick={() => handleToggle(task.id, task.completed)}
                        className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          task.completed
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/40'
                            : 'border-2 border-slate-500 hover:border-accent hover:bg-accent/10'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                      </motion.button>

                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-sm font-bold leading-snug transition-colors ${
                            task.completed
                              ? 'line-through text-slate-500'
                              : 'text-white'
                          }`}
                        >
                          {task.title}
                        </h4>

                        {task.description && (
                          <p
                            className={`text-xs mt-1 line-clamp-2 ${
                              task.completed ? 'text-slate-600 line-through' : 'text-slate-400'
                            }`}
                          >
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Нижняя панель карточки: Дедлайн с таймером и статус срочности */}
                  <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs">
                    {task.completed ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Выполнено</span>
                      </span>
                    ) : urgency ? (
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${urgency.pillClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${urgency.dotColor}`} />
                        {isOverdue && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                        {isUrgent && <Flame className="w-3.5 h-3.5 shrink-0 text-amber-400" />}
                        {!isOverdue && !isUrgent && <Clock className="w-3.5 h-3.5 shrink-0" />}
                        <span>{urgency.text}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px] flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        Без дедлайна
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {task.dueDate && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(task.dueDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}

                      {!task.completed && (
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleSnooze(task.id, 24)}
                            title="Перенести дедлайн на +1 день"
                            className="px-1.5 py-0.5 rounded-md bg-surface hover:bg-slate-800 text-[10px] font-bold text-slate-400 hover:text-accent border border-surface-border transition-colors cursor-pointer"
                          >
                            +1д
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnooze(task.id, 72)}
                            title="Перенести дедлайн на +3 дня"
                            className="px-1.5 py-0.5 rounded-md bg-surface hover:bg-slate-800 text-[10px] font-bold text-slate-400 hover:text-accent border border-surface-border transition-colors cursor-pointer"
                          >
                            +3д
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Модальное окно создания новой задачи */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-3xl bg-surface-card border border-surface-border shadow-2xl overflow-hidden p-6 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Кнопка закрытия */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl bg-surface hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Новая боевая задача</h3>
                  <p className="text-xs text-slate-400">
                    Добавьте цель, выберите сферу жизни и настройте дедлайн
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                {/* Название */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Название задачи *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Например: Силовая тренировка или Передать счетчики"
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:border-accent placeholder:text-slate-600"
                    autoFocus
                  />
                </div>

                {/* Описание */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Описание / заметка
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Детали, ссылки, список или шаги выполнения..."
                    className="w-full px-4 py-2 rounded-2xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:border-accent placeholder:text-slate-600 resize-none"
                  />
                </div>

                {/* Сфера жизни */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Сфера жизни
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {LIFE_SPHERES.filter((s) => s.id !== 'all').map((sphere) => (
                      <button
                        key={sphere.id}
                        type="button"
                        onClick={() => {
                          setFormSphere(sphere.id);
                          // Автоподбор дефолтной иконки для сферы
                          const match = TASK_ICON_PRESETS.find((p) => p.sphere === sphere.id);
                          if (match) setFormIcon(match.icon);
                        }}
                        className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          formSphere === sphere.id
                            ? 'bg-accent/20 text-white border-accent shadow-sm'
                            : 'bg-surface text-slate-400 border-surface-border hover:text-slate-200'
                        }`}
                      >
                        <span>{sphere.icon}</span>
                        <span className="truncate">{sphere.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Кастомная иконка */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Иконка задачи
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TASK_ICON_PRESETS.map((preset) => (
                      <button
                        key={preset.icon}
                        type="button"
                        onClick={() => setFormIcon(preset.icon)}
                        title={preset.label}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-transform hover:scale-110 cursor-pointer ${
                          formIcon === preset.icon
                            ? 'bg-accent/20 border-accent scale-110'
                            : 'bg-surface border-surface-border'
                        }`}
                      >
                        {preset.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Дедлайн */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Дедлайн задачи
                    </label>
                    <span className="text-[11px] text-slate-500">Таймер срочности</span>
                  </div>

                  <input
                    type="datetime-local"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:border-accent"
                  />

                  {/* Быстрые пресеты дедлайна */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(8)}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:border-slate-600 text-[11px] text-slate-300 font-medium"
                    >
                      ⚡ Сегодня (+8ч)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(24)}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:border-slate-600 text-[11px] text-slate-300 font-medium"
                    >
                      📅 Завтра
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(72)}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:border-slate-600 text-[11px] text-slate-300 font-medium"
                    >
                      ⏳ Через 3 дня
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(168)}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:border-slate-600 text-[11px] text-slate-300 font-medium"
                    >
                      🎯 Неделя
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDeadline(null)}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:border-slate-600 text-[11px] text-slate-400 font-medium"
                    >
                      Без срока
                    </button>
                  </div>
                </div>

                {/* Приоритет */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Приоритет
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPriority('low')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        formPriority === 'low'
                          ? 'bg-slate-700 text-white border-slate-500'
                          : 'bg-surface text-slate-400 border-surface-border'
                      }`}
                    >
                      ☕ Обычный
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPriority('medium')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        formPriority === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-surface text-slate-400 border-surface-border'
                      }`}
                    >
                      ⚡ Средний
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPriority('high')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        formPriority === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                          : 'bg-surface text-slate-400 border-surface-border'
                      }`}
                    >
                      🔥 Высокий
                    </button>
                  </div>
                </div>

                {/* Обложка / Картинка карточки */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-accent" />
                      Картинка-обложка (опционально)
                    </label>
                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Убрать картинку
                      </button>
                    )}
                  </div>

                  {/* Быстрые пресеты красивых фото-обложек */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {TASK_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFormImageUrl(preset.url)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                          formImageUrl === preset.url
                            ? 'bg-accent/25 border-accent text-white shadow-sm'
                            : 'bg-surface border-surface-border text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs">{preset.icon}</span>
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Поле для ввода произвольного URL картинки */}
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Или вставьте ссылку на картинку (https://...)"
                    className="w-full px-4 py-2 rounded-2xl bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-accent placeholder:text-slate-600"
                  />

                  {/* Превью выбранной картинки */}
                  {formImageUrl && (
                    <div className="mt-2 relative h-20 rounded-2xl overflow-hidden border border-accent/40 bg-slate-900">
                      <img
                        src={formImageUrl}
                        alt="Превью обложки"
                        className="w-full h-full object-cover"
                        onError={() => setFormImageUrl('')}
                      />
                      <span className="absolute bottom-1 right-2 text-[10px] bg-black/60 px-2 py-0.5 rounded text-white font-mono">
                        Превью обложки
                      </span>
                    </div>
                  )}
                </div>

                {/* Кнопка отправки */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-accent to-sky-500 text-slate-950 font-bold text-sm shadow-xl shadow-accent/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Поставить задачу
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Модалка шеринга карточки задачи */}
        {sharingTask && (
          <TaskShareModal
            task={sharingTask}
            onClose={() => setSharingTask(null)}
          />
        )}

        {/* Модальное окно редактирования задачи */}
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-surface-card border border-surface-border rounded-3xl p-6 shadow-2xl my-8 text-left"
            >
              <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-accent/20 border border-accent/40 text-accent">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Редактировать задачу</h3>
                    <p className="text-xs text-slate-400">Обновите параметры или срок выполнения</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-surface transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Название цели / задачи *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface border border-surface-border text-white text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Описание (опционально)
                  </label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-2xl bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Сфера жизни
                    </label>
                    <select
                      value={editSphere}
                      onChange={(e) => setEditSphere(e.target.value)}
                      className="w-full px-3 py-2 rounded-2xl bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-accent"
                    >
                      {LIFE_SPHERES.filter((s) => s.id !== 'all').map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Приоритет
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditPriority(p)}
                          className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                            editPriority === p
                              ? p === 'high'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                                : p === 'medium'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                                : 'bg-surface text-slate-300 border-slate-600 shadow-sm'
                              : 'bg-surface/50 border-surface-border text-slate-400 hover:text-white'
                          }`}
                        >
                          {p === 'high' ? 'Высок' : p === 'medium' ? 'Средн' : 'Обычн'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Дедлайн (дата и время)
                  </label>
                  <input
                    type="datetime-local"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-2xl bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Ссылка на картинку-обложку
                  </label>
                  <input
                    type="url"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2 rounded-2xl bg-surface border border-surface-border text-white text-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2.5 rounded-xl bg-surface hover:bg-slate-800 text-slate-300 font-bold text-xs border border-surface-border cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-sky-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Сохранить изменения
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default TasksSection;