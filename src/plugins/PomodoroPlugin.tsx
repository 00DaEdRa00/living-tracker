import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, Award } from 'lucide-react';
import { PluginDefinition } from '../lib/plugins';
import { playLevelUpSound, playCoinSound } from '../lib/soundFx';
import { eventBus } from '../lib/eventBus';

export const PomodoroComponent: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (!isBreak) {
        // Завершение фокус-сессии
        playLevelUpSound();
        const nextSessions = completedSessions + 1;
        setCompletedSessions(nextSessions);
        setIsBreak(true);
        setTimeLeft(5 * 60); // 5 минут перерыв
        eventBus.emit({
          type: 'PAGE_VIEWED',
          payload: { page: `pomodoro_session_${nextSessions}` },
        });
      } else {
        // Завершение перерыва
        playCoinSound();
        setIsBreak(false);
        setTimeLeft(25 * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, isBreak, completedSessions]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    playCoinSound();
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const totalSeconds = isBreak ? 5 * 60 : 25 * 60;
  const progressPercent = Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100);

  return (
    <div className="p-4 rounded-2xl bg-surface-card border border-surface-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
            isBreak
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}
        >
          <Timer className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {isBreak ? '☕ Время перерыва' : '🎯 Помодоро Фокус'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              Слот: dashboard.widgets
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {isBreak
              ? 'Откиньтесь на спинку кресла и дайте глазам отдохнуть'
              : '25 минут концентрированной работы без отвлечений'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
        {/* Счетчик сессий */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-bold text-amber-400">
          <Award className="w-4 h-4" />
          <span>{completedSessions}</span>
          <span className="text-[10px] text-slate-400 font-normal">сессий</span>
        </div>

        {/* Цифровой таймер */}
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black font-mono tracking-tight text-white">
            {formattedTime}
          </span>
          <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
            <div
              className={`h-full transition-all duration-300 ${
                isBreak ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTimer}
            className={`p-2.5 rounded-xl text-white font-bold transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                : 'bg-accent hover:bg-accent-hover shadow-lg shadow-accent/20'
            }`}
            title={isRunning ? 'Пауза' : 'Старт'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
          <button
            type="button"
            onClick={resetTimer}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            title="Сброс"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const PomodoroPlugin: PluginDefinition = {
  manifest: {
    id: 'pomodoro-timer',
    name: 'Pomodoro Focus Engine',
    version: '1.0.0',
    author: 'Living Tracker Community',
    description: 'Интерактивный таймер глубокой концентрации (25 мин работы / 5 мин отдыха) со звуковым оповещением.',
    icon: '🎯',
    slot: 'dashboard.widgets',
    defaultEnabled: true,
    tags: ['продуктивность', 'таймер', 'фокус'],
  },
  component: PomodoroComponent,
};
