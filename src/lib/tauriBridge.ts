/**
 * Tauri 2.0 Desktop Bridge & Window Management Helpers
 */

export interface DesktopInfo {
  app: string;
  version: string;
  tauri: string;
  os: string;
  arch: string;
}

/**
 * Check if the application is running inside the Tauri desktop shell
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).__TAURI_INTERNALS__ ||
    (window as any).__TAURI__ ||
    (window as any).__TAURI_METADATA__
  );
}

/**
 * Invoke Tauri Core / Window Commands safely with fallback
 */
export async function toggleHudWindow(): Promise<boolean> {
  if (!isTauri()) {
    console.log('[TauriBridge] Not in Tauri runtime: toggleHud simulated');
    return false;
  }
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<boolean>('toggle_hud_window');
    return result;
  } catch (err) {
    console.warn('[TauriBridge] Failed to toggle HUD window:', err);
    return false;
  }
}

export async function showMainWindow(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('show_main_window');
  } catch (err) {
    console.warn('[TauriBridge] Failed to show main window:', err);
  }
}

export async function setHudAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  if (!isTauri()) return;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('set_hud_always_on_top', { alwaysOnTop });
  } catch (err) {
    console.warn('[TauriBridge] Failed to set always on top:', err);
  }
}

export async function getDesktopInfo(): Promise<DesktopInfo | null> {
  if (!isTauri()) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<DesktopInfo>('get_desktop_info');
  } catch (err) {
    console.warn('[TauriBridge] Failed to get desktop info:', err);
    return null;
  }
}

export interface DatabaseStats {
  status: string;
  storage: string;
  db: string;
  version: number;
}

export async function getDatabaseStats(): Promise<DatabaseStats | null> {
  if (!isTauri()) {
    return {
      status: 'browser_fallback',
      storage: 'localStorage',
      db: 'in-memory/web',
      version: 4,
    };
  }
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<DatabaseStats>('get_database_stats');
  } catch (err) {
    console.warn('[TauriBridge] Failed to get database stats:', err);
    return null;
  }
}

/**
 * Register global shortcut to toggle HUD window
 */
export async function registerGlobalShortcut(
  shortcut = 'CommandOrControl+Shift+Space',
  onTrigger?: () => void
): Promise<boolean> {
  if (!isTauri()) {
    console.log('[TauriBridge] Global shortcut simulated in browser:', shortcut);
    return true;
  }
  try {
    const { register } = await import('@tauri-apps/plugin-global-shortcut');
    await register(shortcut, (event) => {
      if (event.state === 'Pressed') {
        if (onTrigger) {
          onTrigger();
        } else {
          toggleHudWindow();
        }
      }
    });
    return true;
  } catch (err) {
    console.warn('[TauriBridge] Failed to register global shortcut:', err);
    return false;
  }
}

/**
 * Start native dragging on Tauri frameless windows
 */
export async function startWindowDragging(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().startDragging();
  } catch (err) {
    console.warn('[TauriBridge] Failed to start window drag:', err);
  }
}

/**
 * Minimize or hide current window
 */
export async function hideCurrentWindow(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().hide();
  } catch (err) {
    console.warn('[TauriBridge] Failed to hide current window:', err);
  }
}

/**
 * Send native system desktop notification (Tauri or HTML5 Notification fallback)
 */
export async function sendDesktopNotification(title: string, body: string): Promise<void> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('plugin:notification|notify', {
        options: {
          title,
          body,
        },
      });
      return;
    } catch {
      // fallback to HTML5 Notification
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  }
}
