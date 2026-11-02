/**
 * Living Tracker Plugin Architecture & Manifest Registry
 * Supporting dynamic UI Slots:
 * - 'dashboard.widgets': Interactive modular dashboard widgets
 * - 'sidebar.nav': Additional navigation actions or quick shortcuts
 * - 'task.actions': Contextual batch operations or triage on tasks
 */

import type { ComponentType } from 'react';
import { eventBus } from './eventBus';
import { AppEvent } from '../types/tracker';

export type PluginSlot = 'dashboard.widgets' | 'sidebar.nav' | 'task.actions';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon: string;
  slot: PluginSlot;
  defaultEnabled: boolean;
  homepage?: string;
  tags: string[];
}

export interface PluginComponentProps {
  pluginId: string;
  slot: PluginSlot;
}

export interface PluginDefinition {
  manifest: PluginManifest;
  component: React.ComponentType<PluginComponentProps>;
  onInit?: (bus: typeof eventBus) => () => void; // returns cleanup function
}

class PluginRegistry {
  private plugins: Map<string, PluginDefinition> = new Map();
  private enabledPlugins: Set<string> = new Set();
  private disabledPlugins: Set<string> = new Set();
  private activeCleanups: Map<string, () => void> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadPersistedState();
  }

  private loadPersistedState() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedEnabled = window.localStorage.getItem('living_tracker_enabled_plugins');
        if (savedEnabled) {
          this.enabledPlugins = new Set(JSON.parse(savedEnabled));
        }
        const savedDisabled = window.localStorage.getItem('living_tracker_disabled_plugins');
        if (savedDisabled) {
          this.disabledPlugins = new Set(JSON.parse(savedDisabled));
        }
      } catch {
        // fallback
      }
    }
  }

  private savePersistedState() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          'living_tracker_enabled_plugins',
          JSON.stringify(Array.from(this.enabledPlugins))
        );
        window.localStorage.setItem(
          'living_tracker_disabled_plugins',
          JSON.stringify(Array.from(this.disabledPlugins))
        );
      } catch {
        // ignore
      }
    }
  }

  public register(plugin: PluginDefinition): void {
    this.plugins.set(plugin.manifest.id, plugin);

    if (this.isEnabled(plugin.manifest.id)) {
      this.initPlugin(plugin);
    }
    this.notify();
  }

  public unregister(pluginId: string): void {
    this.cleanupPlugin(pluginId);
    this.plugins.delete(pluginId);
    this.enabledPlugins.delete(pluginId);
    this.disabledPlugins.delete(pluginId);
    this.notify();
  }

  public isEnabled(pluginId: string): boolean {
    if (this.disabledPlugins.has(pluginId)) return false;
    if (this.enabledPlugins.has(pluginId)) return true;
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    return Boolean(plugin.manifest.defaultEnabled);
  }

  public togglePlugin(pluginId: string, enabled?: boolean): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    const targetState = enabled !== undefined ? enabled : !this.isEnabled(pluginId);

    if (targetState) {
      this.enabledPlugins.add(pluginId);
      this.disabledPlugins.delete(pluginId);
      this.initPlugin(plugin);
    } else {
      this.disabledPlugins.add(pluginId);
      this.enabledPlugins.delete(pluginId);
      this.cleanupPlugin(pluginId);
    }

    this.savePersistedState();
    this.notify();
    return targetState;
  }

  private initPlugin(plugin: PluginDefinition): void {
    if (this.activeCleanups.has(plugin.manifest.id)) return;
    if (plugin.onInit) {
      try {
        const cleanup = plugin.onInit(eventBus);
        if (typeof cleanup === 'function') {
          this.activeCleanups.set(plugin.manifest.id, cleanup);
        }
      } catch (err) {
        console.error(`[PluginRegistry] Failed to initialize plugin "${plugin.manifest.id}":`, err);
      }
    }
  }

  private cleanupPlugin(pluginId: string): void {
    const cleanup = this.activeCleanups.get(pluginId);
    if (cleanup) {
      try {
        cleanup();
      } catch (err) {
        console.error(`[PluginRegistry] Failed cleanup for plugin "${pluginId}":`, err);
      }
      this.activeCleanups.delete(pluginId);
    }
  }

  public getAll(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  public getForSlot(slot: PluginSlot): PluginDefinition[] {
    return Array.from(this.plugins.values()).filter(
      (p) => p.manifest.slot === slot && this.isEnabled(p.manifest.id)
    );
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[PluginRegistry] Listener error:', err);
      }
    });
  }
}

export const pluginRegistry = new PluginRegistry();
