import { describe, it, expect } from 'vitest';
import { isTauri, toggleHudWindow, getDesktopInfo } from '../lib/tauriBridge';

describe('tauriBridge', () => {
  it('detects browser environment when not running inside Tauri', () => {
    expect(isTauri()).toBe(false);
  });

  it('safely handles toggleHudWindow when not running in Tauri', async () => {
    const result = await toggleHudWindow();
    expect(result).toBe(false);
  });

  it('returns null for getDesktopInfo in standard web environment', async () => {
    const info = await getDesktopInfo();
    expect(info).toBeNull();
  });
});
