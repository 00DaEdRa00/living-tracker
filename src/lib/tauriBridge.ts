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
