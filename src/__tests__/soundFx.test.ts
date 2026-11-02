import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  playCoinSound,
  playHabitCheckSound,
  playAchievementFanfare,
  playCatSound,
  playOverageAlarm,
  playLevelUpSound,
  playClickSound,
  playTaskCompleteSound,
  playStreakFreezeSound,
} from '../lib/soundFx';
import { useTrackerStore } from '../store/useTrackerStore';

describe('soundFx procedural Web Audio synthesizer', () => {
  let createdOscillators: Array<{
    type: string;
    freq: number;
    started: boolean;
    stopped: boolean;
  }> = [];
  let createdGains: Array<{
    gainValues: number[];
  }> = [];

  beforeEach(() => {
    useTrackerStore.getState().resetAll();
    createdOscillators = [];
    createdGains = [];

    // Mock AudioContext for Web Audio API synthesis
    class MockGainNode {
      gain = {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      };
      connect = vi.fn();
    }

    class MockOscillatorNode {
      type = 'sine';
      frequency = {
        value: 440,
        setValueAtTime: vi.fn((val: number) => {
          this.frequency.value = val;
        }),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      };
      connect = vi.fn();
      start = vi.fn(() => {
        createdOscillators.push({
          type: this.type,
          freq: this.frequency.value,
          started: true,
          stopped: false,
        });
      });
      stop = vi.fn();
    }

    class MockBiquadFilterNode {
      type = 'lowpass';
      frequency = {
        value: 1000,
        setValueAtTime: vi.fn(),
      };
      connect = vi.fn();
    }

    class MockAudioContext {
      state = 'running';
      currentTime = 0.5;
      destination = {};
      createOscillator() {
        return new MockOscillatorNode();
      }
      createGain() {
        const g = new MockGainNode();
        createdGains.push({ gainValues: [] });
        return g;
      }
      createBiquadFilter() {
        return new MockBiquadFilterNode();
      }
      resume = vi.fn().mockResolvedValue(undefined);
    }

    // Attach to global window
    (globalThis as unknown as { window: Record<string, unknown> }).window =
      globalThis as unknown as Record<string, unknown>;
    (globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
      MockAudioContext;
  });

  it('plays coin sound with dual metallic tones', () => {
    playCoinSound();
    expect(createdOscillators.length).toBeGreaterThanOrEqual(2);
  });

  it('plays habit check sound with wooden transient snap', () => {
    playHabitCheckSound();
    expect(createdOscillators.length).toBeGreaterThanOrEqual(2);
  });

  it('plays task completion sound chord', () => {
    playTaskCompleteSound();
    expect(createdOscillators.length).toBeGreaterThanOrEqual(3);
  });

  it('plays streak freeze sound with crystalline high tones', () => {
    playStreakFreezeSound();
    expect(createdOscillators.length).toBeGreaterThanOrEqual(4);
  });

  it('plays achievement fanfare arpeggio', () => {
    playAchievementFanfare();
    expect(createdOscillators.length).toBeGreaterThanOrEqual(4);
  });

  it('plays cat purr / meow chirps', () => {
    playCatSound();
    expect(createdOscillators.length).toBeGreaterThanOrEqual(1);
  });

  it('plays overage alarm pulsing tones', () => {
    playOverageAlarm();
    expect(createdOscillators.length).toBeGreaterThanOrEqual(2);
  });

  it('plays UI tactile click', () => {
    playClickSound();
    expect(createdOscillators.length).toBe(1);
  });

  it('plays level up sound', () => {
    playLevelUpSound();
    expect(createdOscillators.length).toBeGreaterThanOrEqual(4);
  });

  it('silences all sound FX when soundEnabled is false', () => {
    useTrackerStore.getState().toggleSound();
    expect(useTrackerStore.getState().soundEnabled).toBe(false);

    createdOscillators = [];
    playCoinSound();
    playTaskCompleteSound();
    playStreakFreezeSound();
    playAchievementFanfare();
    playClickSound();

    expect(createdOscillators.length).toBe(0);
  });
});
