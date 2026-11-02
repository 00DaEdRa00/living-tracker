import { describe, it, expect, beforeEach } from 'vitest';
import { useTrackerStore } from '../store/useTrackerStore';
import { getLifeBalancePunchline } from '../components/LifeBalanceShareModal';
import {
  playPomodoroTickSound,
  playFreezeShieldEarnedSound,
  playLaserSound,
  playCyberpunkAlertSound,
  getMasterVolume,
  SOUND_FX_CATALOG,
} from '../lib/soundFx';
import {
  getDatabaseStats,
  getSystemMetrics,
} from '../lib/tauriBridge';

describe('Sprint 2-4: Pomodoro Focus, Matrix Theme & Life Balance Radar', () => {
  beforeEach(() => {
    useTrackerStore.getState().resetAll();
  });

  describe('Sprint 2: Focus Mode & Burnout Shield Bank', () => {
    it('initializes freeze shields bank with default 3 shields', () => {
      const state = useTrackerStore.getState();
      expect(state.freezeShields).toBe(3);
    });

    it('records focus session minutes and updates focusMinutesSpent', () => {
      const store = useTrackerStore.getState();
      expect(store.focusMinutesSpent).toBe(0);

      store.recordFocusSession(25, 'task-1');
      expect(useTrackerStore.getState().focusMinutesSpent).toBe(25);

      store.recordFocusSession(50, 'task-2');
      expect(useTrackerStore.getState().focusMinutesSpent).toBe(75);
    });

    it('allows adding and replenishing freeze shields', () => {
      const store = useTrackerStore.getState();
      store.addFreezeShield(2);
      expect(useTrackerStore.getState().freezeShields).toBe(5);
    });
  });

  describe('Sprint 3: Matrix Theme & Master Volume Control', () => {
    it('supports matrix hacker theme in TrackerStore', () => {
      const store = useTrackerStore.getState();
      store.setTheme('matrix');
      expect(useTrackerStore.getState().theme).toBe('matrix');
    });

    it('sets and bounds master sound volume between 0.0 and 1.0', () => {
      const store = useTrackerStore.getState();
      expect(store.soundVolume).toBe(0.7);

      store.setSoundVolume(0.4);
      expect(useTrackerStore.getState().soundVolume).toBe(0.4);
      expect(getMasterVolume()).toBe(0.4);

      // Clamping bounds
      store.setSoundVolume(1.5);
      expect(useTrackerStore.getState().soundVolume).toBe(1.0);

      store.setSoundVolume(-0.2);
      expect(useTrackerStore.getState().soundVolume).toBe(0.0);
    });

    it('safely synthesizes new zero-latency audio presets without error', () => {
      expect(() => playPomodoroTickSound()).not.toThrow();
      expect(() => playFreezeShieldEarnedSound()).not.toThrow();
      expect(() => playLaserSound()).not.toThrow();
      expect(() => playCyberpunkAlertSound()).not.toThrow();
    });

    it('includes newly added sound effects in SOUND_FX_CATALOG', () => {
      const ids = SOUND_FX_CATALOG.map((item) => item.id);
      expect(ids).toContain('tick');
      expect(ids).toContain('shield_earned');
      expect(ids).toContain('laser');
      expect(ids).toContain('cyber');
    });
  });

  describe('Sprint 3: Life Balance Radar Punchlines & Multi-Tier Localization', () => {
    it('produces high-balance punchlines for all tone modes', () => {
      const sassy = getLifeBalancePunchline(85, 'sassy');
      expect(sassy).toContain('Абсолютный баланс');

      const ironic = getLifeBalancePunchline(90, 'ironic');
      expect(ironic).toContain('Колесо баланса');

      const neutral = getLifeBalancePunchline(80, 'neutral');
      expect(neutral).toContain('гармония');
    });

    it('produces mid-balance punchlines for partial coverage', () => {
      const sassy = getLifeBalancePunchline(60, 'sassy');
      expect(sassy).toContain('Твердая база');

      const ironic = getLifeBalancePunchline(50, 'ironic');
      expect(ironic).toContain('восьмерит');

      const neutral = getLifeBalancePunchline(65, 'neutral');
      expect(neutral).toContain('Уверенный прогресс');
    });

    it('produces motivational punchlines for low-balance scenarios', () => {
      const sassy = getLifeBalancePunchline(30, 'sassy');
      expect(sassy).toContain('Перекос обнаружен');

      const ironic = getLifeBalancePunchline(20, 'ironic');
      expect(ironic).toContain('коме');
    });
  });

  describe('Sprint 4: Desktop Bridge SQLite v7 & System Metrics', () => {
    it('reports database version 7 with SQLite support', async () => {
      const stats = await getDatabaseStats();
      expect(stats).not.toBeNull();
      expect(stats?.version).toBe(7);
    });

    it('provides system health metrics via Tauri bridge', async () => {
      const metrics = await getSystemMetrics();
      expect(metrics).not.toBeNull();
      expect(metrics?.status).toBe('healthy');
      expect(metrics?.sqlite_version).toBe(7);
      expect(metrics?.memory_mb).toBeGreaterThan(0);
    });
  });
});
