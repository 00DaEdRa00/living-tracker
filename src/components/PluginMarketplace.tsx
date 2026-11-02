import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Blocks,
  Check,
  Power,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { pluginRegistry, PluginDefinition, PluginSlot } from '../lib/plugins';
import { playClickSound, playCoinSound } from '../lib/soundFx';

export const PluginMarketplace: React.FC = () => {
  const [plugins, setPlugins] = useState<PluginDefinition[]>(() => pluginRegistry.getAll());
  const [, setRevision] = useState(0);

  useEffect(() => {
    const unsub = pluginRegistry.subscribe(() => {
      setPlugins(pluginRegistry.getAll());
      setRevision((r) => r + 1);
    });
    return unsub;
  }, []);

  const handleToggle = (id: string) => {
    const next = pluginRegistry.togglePlugin(id);
    playClickSound();
  };

  const getSlotBadge = (slot: PluginSlot) => {
    switch (slot) {
      case 'dashboard.widgets':
        return {
          label: 'Слот: Виджеты Дашборда',
          color: 'bg-accent/15 text-accent border-accent/30',
        };
      case 'sidebar.nav':
        return {
          label: 'Слот: Навигация / Трей',
          color: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        };
      case 'task.actions':
        return {
          label: 'Слот: Действия Задач',
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Шапка каталога дополнений */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-surface-card border border-surface-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent to-purple-600 text-white shadow-lg shadow-accent/20">
            <Blocks className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Каталог дополнений & UI Слоты
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                ТЗ Секция 2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Модульная архитектура расширяемости. Плагины подключаются к UI-слотам (
              <code className="text-sky-300 text-[11px]">dashboard.widgets</code>,{' '}
              <code className="text-sky-300 text-[11px]">task.actions</code>,{' '}
              <code className="text-sky-300 text-[11px]">sidebar.nav</code>) и реагируют на события шины EventBus.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <span>Всего плагинов: {plugins.length}</span>
          </div>
        </div>
      </div>

      {/* Список плагинов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plugins.map((plugin) => {
          const isEnabled = pluginRegistry.isEnabled(plugin.manifest.id);
          const slotBadge = getSlotBadge(plugin.manifest.slot);

          return (
            <motion.div
              key={plugin.manifest.id}
              whileHover={{ y: -2 }}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isEnabled
                  ? 'bg-surface-card border-surface-border shadow-md'
                  : 'bg-slate-950/60 border-slate-900 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl select-none">{plugin.manifest.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {plugin.manifest.name}
                        </h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          v{plugin.manifest.version}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Автор: {plugin.manifest.author}
                      </p>
                    </div>
                  </div>

                  {/* Тумблер включения/выключения */}
                  <button
                    type="button"
                    onClick={() => handleToggle(plugin.manifest.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      isEnabled ? 'bg-accent' : 'bg-slate-800'
                    }`}
                    title={isEnabled ? 'Отключить плагин' : 'Включить плагин'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {plugin.manifest.description}
                </p>
              </div>

              <div className="pt-3 border-t border-surface-border/50 flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${slotBadge.color}`}
                >
                  {slotBadge.label}
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {plugin.manifest.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
