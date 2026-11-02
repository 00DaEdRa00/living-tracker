import React, { useState, useEffect } from 'react';
import { pluginRegistry, PluginSlot, PluginDefinition } from '../lib/plugins';

interface PluginSlotRendererProps {
  slot: PluginSlot;
  className?: string;
}

export const PluginSlotRenderer: React.FC<PluginSlotRendererProps> = ({ slot, className = '' }) => {
  const [plugins, setPlugins] = useState<PluginDefinition[]>(() => pluginRegistry.getForSlot(slot));

  useEffect(() => {
    const unsubscribe = pluginRegistry.subscribe(() => {
      setPlugins(pluginRegistry.getForSlot(slot));
    });
    return unsubscribe;
  }, [slot]);

  if (plugins.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {plugins.map((plugin) => {
        const Component = plugin.component;
        return (
          <div key={plugin.manifest.id} className="relative group">
            <Component pluginId={plugin.manifest.id} slot={slot} />
          </div>
        );
      })}
    </div>
  );
};
