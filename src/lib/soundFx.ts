import { useTrackerStore } from '../store/useTrackerStore';

let audioCtx: AudioContext | null = null;

/**
 * Получить или инициализировать singleton AudioContext с авто-разблокировкой
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Проверка, включен ли звук в глобальном сторе
 */
function canPlaySound(): boolean {
  try {
    return useTrackerStore.getState().soundEnabled ?? true;
  } catch {
    return true;
  }
}

/**
 * 1. playCoinSound() — звон монет при добавлении транзакции (два синусоидальных тона с затуханием)
 */
export function playCoinSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Тон 1: B5 (987.77 Гц)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Тон 2: E6 (1318.51 Гц) со смещением 80мс для эффекта звона монеты
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.08);
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.3, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.56);
  } catch (err) {
    console.warn('Audio playCoinSound error:', err);
  }
}

/**
 * 2. playHabitCheckSound() — сочный деревянный щелчок / pop при чекине привычки
 */
export function playHabitCheckSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Основное деревянное тело (быстрый питч-дроп с 540 Гц до 110 Гц)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);

    // Высокий транзиент-щелчок (snap)
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(1200, now);
    snapOsc.frequency.exponentialRampToValueAtTime(320, now + 0.03);
    snapGain.gain.setValueAtTime(0.25, now);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.04);
  } catch (err) {
    console.warn('Audio playHabitCheckSound error:', err);
  }
}

/**
 * 3. playAchievementFanfare() — победный мажорный арпеджио-аккорд при открытии ачивки
 */
export function playAchievementFanfare(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Мажорное восходящее арпеджио: C5 -> E5 -> G5 -> C6
    const arpeggio = [
      { freq: 523.25, time: 0.00, dur: 0.35, gain: 0.22 }, // C5
      { freq: 659.25, time: 0.08, dur: 0.35, gain: 0.24 }, // E5
      { freq: 783.99, time: 0.16, dur: 0.45, gain: 0.26 }, // G5
      { freq: 1046.50, time: 0.24, dur: 0.85, gain: 0.32 }, // C6
    ];

    arpeggio.forEach(({ freq, time, dur, gain: vol }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.setValueAtTime(vol, now + time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + dur + 0.02);
    });

    // Финальный сияющий аккорд (C5 + G5 + C6) с мягким затуханием
    const chord = [523.25, 783.99, 1046.50];
    chord.forEach((freq) => {
      const chordOsc = ctx.createOscillator();
      const chordGain = ctx.createGain();
      chordOsc.type = 'sine';
      chordOsc.frequency.setValueAtTime(freq, now + 0.24);

      chordGain.gain.setValueAtTime(0.0001, now);
      chordGain.gain.setValueAtTime(0.12, now + 0.24);
      chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24 + 0.95);

      chordOsc.connect(chordGain);
      chordGain.connect(ctx.destination);
      chordOsc.start(now + 0.24);
      chordOsc.stop(now + 0.24 + 1.0);
    });
  } catch (err) {
    console.warn('Audio playAchievementFanfare error:', err);
  }
}

/**
 * 4. playCatSound() — короткое забавное мяуканье / мурлыканье при клике на кота
 */
export function playCatSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.36;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    // Интонация мяу: подъем и плавный спад
    osc.frequency.setValueAtTime(430, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(510, now + duration);

    // Модуляция мурлыканья (LFO на 24 Гц)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(24, now);
    lfoGain.gain.setValueAtTime(0.05, now);

    // Огибающая громкости
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    lfo.connect(lfoGain.gain);
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + duration + 0.02);
    lfo.stop(now + duration + 0.02);
  } catch (err) {
    console.warn('Audio playCatSound error:', err);
  }
}

/**
 * 5. playOverageAlarm() — низкий тревожный пульсирующий зуммер при превышении лимита бюджета
 */
export function playOverageAlarm(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // 3 тревожных коротких импульса
    const pulseOffsets = [0.0, 0.13, 0.26];
    const pulseDuration = 0.09;

    pulseOffsets.forEach((offset) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(145, now + offset);
      osc.frequency.linearRampToValueAtTime(115, now + offset + pulseDuration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now + offset);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(0.32, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + pulseDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + pulseDuration + 0.01);
    });
  } catch (err) {
    console.warn('Audio playOverageAlarm error:', err);
  }
}

/**
 * 6. playLevelUpSound() — торжественный восходящий звуковой арпеджио-аккорд
 */
export function playLevelUpSound(): void {
  playAchievementFanfare();
}

/**
 * 7. playClickSound() — быстрый тактильный щелчок переключателя
 */
export function playClickSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch (err) {
    console.warn('Audio playClickSound error:', err);
  }
}

/**
 * 8. playTaskCompleteSound() — кристально чистый аккорд выполнения задачи (A5 -> C#6)
 */
export function playTaskCompleteSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 880.0, time: 0, dur: 0.22, vol: 0.24 }, // A5
      { freq: 1108.73, time: 0.06, dur: 0.35, vol: 0.26 }, // C#6
      { freq: 1318.51, time: 0.12, dur: 0.45, vol: 0.2 }, // E6
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(vol, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.02);
    });
  } catch (err) {
    console.warn('Audio playTaskCompleteSound error:', err);
  }
}

/**
 * 9. playStreakFreezeSound() — ледяной кристаллический перезвон заморозки стрика
 */
export function playStreakFreezeSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Ледяные переливы (высокие гармоники с легким дилеем)
    const iceTones = [
      { freq: 1760.0, time: 0.0, dur: 0.4, vol: 0.18 }, // A6
      { freq: 2093.0, time: 0.05, dur: 0.45, vol: 0.2 }, // C7
      { freq: 2637.02, time: 0.1, dur: 0.55, vol: 0.22 }, // E7
      { freq: 3520.0, time: 0.18, dur: 0.65, vol: 0.16 }, // A7
    ];

    iceTones.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);
      // Небольшое ледяное падение частоты
      osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + time + dur);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(vol, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.02);
    });
  } catch (err) {
    console.warn('Audio playStreakFreezeSound error:', err);
  }
}
