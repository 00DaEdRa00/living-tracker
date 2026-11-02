import React, { useState } from 'react';
import { Quote, RefreshCw, Sparkles } from 'lucide-react';
import { PluginDefinition } from '../lib/plugins';
import { useTrackerStore } from '../store/useTrackerStore';
import { ToneMode } from '../types/tracker';

const QUOTES_BY_TONE: Record<ToneMode, string[]> = {
  neutral: [
    'Дисциплина — это решение делать то, чего не хочется, чтобы достичь того, чего действительно желаешь.',
    'Маленькие ежедневные шаги приводят к масштабным результатам.',
    'Контроль внимания — это контроль качества жизни.',
    'Фокусируйся на процессе, а не только на финальной цели.',
  ],
  ironic: [
    'Если откладывать всё на последний момент, на это уйдёт всего один момент.',
    'Прокрастинация — это искусство не делать то, что нужно, делая вид, что делаешь то, что важно.',
    'Твой список задач смотрит на тебя с немым укором и легким сочувствием.',
    'Главное не победа, главное — не признаваться себе, сколько времени ушло на мемы.',
  ],
  sassy: [
    'Хватит скроллить ленту, иди закрой хоть одну задачу, тряпка!',
    'Твой стрик держится на честном слове и синей изоленте. Не позорься!',
    'Мечтаешь об успехе? Подними задницу и начни пахать!',
    'Самодисциплина — это когда ты делаешь дело, даже когда лень орать.',
  ],
};

export const ZenQuotesComponent: React.FC = () => {
  const tone = useTrackerStore((state) => state.tone);
  const [index, setIndex] = useState(0);

  const quotes = QUOTES_BY_TONE[tone] || QUOTES_BY_TONE.neutral;
  const currentQuote = quotes[index % quotes.length];

  const nextQuote = () => {
    setIndex((prev) => prev + 1);
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/20 via-surface-card to-accent/5 border border-purple-500/20 shadow-sm flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
          <Quote className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Дзен & Мотивация
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300">
              {tone}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 italic font-medium">
            «{currentQuote}»
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={nextQuote}
        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/60 shrink-0"
        title="Следующая цитата"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ZenQuotesPlugin: PluginDefinition = {
  manifest: {
    id: 'zen-quotes',
    name: 'Zen & Tone Quotes',
    version: '1.0.0',
    author: 'Living Tracker Community',
    description: 'Контекстная адаптивная цитата дня, меняющая характер в зависимости от выбранного тона (нейтральный, ироничный, дерзкий).',
    icon: '🔮',
    slot: 'dashboard.widgets',
    defaultEnabled: true,
    tags: ['мотивация', 'дзен', 'цитаты', 'тон'],
  },
  component: ZenQuotesComponent,
};
