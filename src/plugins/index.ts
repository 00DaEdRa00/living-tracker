/**
 * Community and Official Plugins Registry Bootstrapper
 */

import { pluginRegistry } from '../lib/plugins';
import { PomodoroPlugin } from './PomodoroPlugin';
import { ZenQuotesPlugin } from './ZenQuotesPlugin';
import { P2PSyncPlugin } from './P2PSyncPlugin';
import { TaskMatrixPlugin } from './TaskMatrixPlugin';

export function initializePlugins(): void {
  pluginRegistry.register(PomodoroPlugin);
  pluginRegistry.register(ZenQuotesPlugin);
  pluginRegistry.register(P2PSyncPlugin);
  pluginRegistry.register(TaskMatrixPlugin);
}
