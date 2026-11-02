import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pluginRegistry, PluginDefinition } from '../lib/plugins';
import type * as React from 'react';

const DummyComponent: React.FC = () => null;

describe('PluginRegistry and UI Slot Engine', () => {
  const dummyPlugin: PluginDefinition = {
    manifest: {
      id: 'test-widget-plugin',
      name: 'Test Widget Plugin',
      version: '1.0.0',
      author: 'Tester',
      description: 'A test widget plugin',
      icon: '🧪',
      slot: 'dashboard.widgets',
      defaultEnabled: true,
      tags: ['test'],
    },
    component: DummyComponent,
  };

  beforeEach(() => {
    pluginRegistry.unregister('test-widget-plugin');
  });

  it('registers and retrieves plugins for designated slot', () => {
    pluginRegistry.register(dummyPlugin);
    const widgetPlugins = pluginRegistry.getForSlot('dashboard.widgets');
    expect(widgetPlugins.some((p) => p.manifest.id === 'test-widget-plugin')).toBe(true);

    const navPlugins = pluginRegistry.getForSlot('sidebar.nav');
    expect(navPlugins.some((p) => p.manifest.id === 'test-widget-plugin')).toBe(false);
  });

  it('toggles plugin state and excludes disabled plugins from slot queries', () => {
    pluginRegistry.register(dummyPlugin);
    expect(pluginRegistry.isEnabled('test-widget-plugin')).toBe(true);

    // Disable plugin
    const newState = pluginRegistry.togglePlugin('test-widget-plugin', false);
    expect(newState).toBe(false);
    expect(pluginRegistry.isEnabled('test-widget-plugin')).toBe(false);

    const activeWidgets = pluginRegistry.getForSlot('dashboard.widgets');
    expect(activeWidgets.some((p) => p.manifest.id === 'test-widget-plugin')).toBe(false);

    // Re-enable
    pluginRegistry.togglePlugin('test-widget-plugin', true);
    expect(pluginRegistry.isEnabled('test-widget-plugin')).toBe(true);
    expect(pluginRegistry.getForSlot('dashboard.widgets').some((p) => p.manifest.id === 'test-widget-plugin')).toBe(true);
  });

  it('executes onInit and cleanup when registered and disabled', () => {
    const cleanupSpy = vi.fn();
    const onInitSpy = vi.fn().mockReturnValue(cleanupSpy);

    const lifecyclePlugin: PluginDefinition = {
      manifest: {
        id: 'lifecycle-plugin',
        name: 'Lifecycle Plugin',
        version: '1.0.0',
        author: 'Tester',
        description: 'Test lifecycle',
        icon: '🔄',
        slot: 'dashboard.widgets',
        defaultEnabled: true,
        tags: ['test'],
      },
      component: DummyComponent,
      onInit: onInitSpy,
    };

    pluginRegistry.register(lifecyclePlugin);
    expect(onInitSpy).toHaveBeenCalled();

    pluginRegistry.togglePlugin('lifecycle-plugin', false);
    expect(cleanupSpy).toHaveBeenCalled();

    pluginRegistry.unregister('lifecycle-plugin');
  });
});
