import React from 'react';
import { CheckCheck, Trash2, Zap, Sparkles } from 'lucide-react';
import { PluginDefinition } from '../lib/plugins';
import { useTrackerStore } from '../store/useTrackerStore';
import { playCoinSound, playLevelUpSound } from '../lib/soundFx';

export const TaskMatrixComponent: React.FC = () => {
  const tasks = useTrackerStore((state) => state.tasks);
  const toggleTask = useTrackerStore((state) => state.toggleTask);
  const deleteTask = useTrackerStore((state) => state.deleteTask);

  const completedCount = tasks.filter((t) => t.completed).length;

  const handleClearCompleted = () => {
    const toDelete = tasks.filter((t) => t.completed).map((t) => t.id);
    toDelete.forEach((id) => deleteTask(id));
    if (toDelete.length > 0) {
      playCoinSound();
    }
  };

  const handleCompleteAllPending = () => {
    const toComplete = tasks.filter((t) => !t.completed).map((t) => t.id);
    toComplete.forEach((id) => toggleTask(id));
    if (toComplete.length > 0) {
      playLevelUpSound();
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap py-1">
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
        Плагин [task.actions]:
      </span>
      <button
        type="button"
        onClick={handleCompleteAllPending}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-colors cursor-pointer"
        title="Завершить все оставшиеся задачи"
      >
        <CheckCheck className="w-3.5 h-3.5" />
        <span>Закрыть все активные</span>
      </button>

      {completedCount > 0 && (
        <button
          type="button"
          onClick={handleClearCompleted}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-colors cursor-pointer"
          title="Удалить выполненные задачи"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Очистить завершенные ({completedCount})</span>
        </button>
      )}
    </div>
  );
};

export const TaskMatrixPlugin: PluginDefinition = {
  manifest: {
    id: 'task-matrix-actions',
    name: 'Task Batch Actions & Matrix',
    version: '1.0.0',
    author: 'Living Tracker Community',
    description: 'Быстрые групповые действия для задач (массовое закрытие, очистка завершенных) через слот task.actions.',
    icon: '⚡',
    slot: 'task.actions',
    defaultEnabled: true,
    tags: ['задачи', 'батч', 'управление'],
  },
  component: TaskMatrixComponent,
};
