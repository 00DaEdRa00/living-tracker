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
 * Получить коэффициент громкости (0.0 .. 1.0)
 */
export function getMasterVolume(): number {
  try {
    const vol = useTrackerStore.getState().soundVolume;
    return typeof vol === 'number' && !isNaN(vol) ? Math.max(0, Math.min(1, vol)) : 0.7;
  } catch {
    return 0.7;
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

/**
 * 10. playShareSound() — сочный футуристический восходящий перезвон при генерации и копировании шеринг-карточки
 */
export function playShareSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.14, vol: 0.22 }, // C5
      { freq: 659.25, time: 0.05, dur: 0.14, vol: 0.24 }, // E5
      { freq: 783.99, time: 0.1, dur: 0.16, vol: 0.26 }, // G5
      { freq: 1046.5, time: 0.16, dur: 0.35, vol: 0.3 }, // C6
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
    console.warn('Audio playShareSound error:', err);
  }
}

/**
 * 11. playTrashSound() — быстрый тактильный шум/свуш удаления элемента или очистки завершенных задач
 */
export function playTrashSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.09);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch (err) {
    console.warn('Audio playTrashSound error:', err);
  }
}

/**
 * 12. playEditSound() — мягкий приятный перезвон (D5 -> G5) при успешном редактировании и сохранении
 */
export function playEditSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 587.33, time: 0.0, dur: 0.09, vol: 0.18 }, // D5
      { freq: 783.99, time: 0.05, dur: 0.18, vol: 0.22 }, // G5
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(vol, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.01);
    });
  } catch (err) {
    console.warn('Audio playEditSound error:', err);
  }
}

/**
 * 13. playSubtaskSound() — кристальный быстрый щелчок (F#6 -> A6) при выполнении подзадачи / чек-листа
 */
export function playSubtaskSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1396.91, now);
    osc.frequency.exponentialRampToValueAtTime(1760.0, now + 0.04);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch (err) {
    console.warn('Audio playSubtaskSound error:', err);
  }
}

/**
 * 14. playStreakMilestoneSound() — триумфальное праздничное арпеджио при юбилее стрика (7, 14, 21, 30+ дней)
 */
export function playStreakMilestoneSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // D-мажорное фанфарное восхождение: D5 -> F#5 -> A5 -> D6 -> F#6
    const notes = [
      { freq: 587.33, time: 0.0, dur: 0.12, vol: 0.22 }, // D5
      { freq: 739.99, time: 0.07, dur: 0.12, vol: 0.24 }, // F#5
      { freq: 880.0, time: 0.14, dur: 0.14, vol: 0.26 }, // A5
      { freq: 1174.66, time: 0.21, dur: 0.25, vol: 0.3 }, // D6
      { freq: 1479.98, time: 0.3, dur: 0.65, vol: 0.34 }, // F#6
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
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
    console.warn('Audio playStreakMilestoneSound error:', err);
  }
}

/**
 * 15. playSnoozeSound() — мягкий двухтональный перелив (A4 -> E4) при откладывании дедлайна
 */
export function playSnoozeSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 440.0, time: 0.0, dur: 0.1, vol: 0.2 }, // A4
      { freq: 329.63, time: 0.08, dur: 0.18, vol: 0.18 }, // E4
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
      osc.stop(now + time + dur + 0.01);
    });
  } catch (err) {
    console.warn('Audio playSnoozeSound error:', err);
  }
}

/**
 * 16. playThemeSwitchSound() — футуристический скользящий синт-перелив при смене темы оформления
 */
export function playThemeSwitchSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.07);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  } catch (err) {
    console.warn('Audio playThemeSwitchSound error:', err);
  }
}

/**
 * 17. playShieldSound() — кристаллический аккорд защиты (C6, E6, G6) при активации щита стрика / заморозке всех привычек
 */
export function playShieldSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const freqs = [1046.5, 1318.51, 1567.98]; // C6, E6, G6

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.03 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.36);
    });
  } catch (err) {
    console.warn('Audio playShieldSound error:', err);
  }
}

/**
 * 18. playSummaryFanfareSound() — праздничное восходящее арпеджио для дневной сводки
 */
export function playSummaryFanfareSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.42);
    });
  } catch (err) {
    console.warn('Audio playSummaryFanfareSound error:', err);
  }
}

/**
 * 19. playUploadSound() — футуристический высокочастотный sweep при прикреплении изображения
 */
export function playUploadSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {
    console.warn('Audio playUploadSound error:', err);
  }
}

/**
 * 20. playQuickDateSound() — резкий приятный клик выбора быстрого дедлайна
 */
export function playQuickDateSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (err) {
    console.warn('Audio playQuickDateSound error:', err);
  }
}

/**
 * 21. playRecurrenceSound() — искрящийся восходящий аккорд возобновления повторяющейся задачи
 */
export function playRecurrenceSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.38);
    });
  } catch (err) {
    console.warn('Audio playRecurrenceSound error:', err);
  }
}

/**
 * 22. playVictoryTrumpetSound() — торжественные фанфары триумфа и рекордов
 */
export function playVictoryTrumpetSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chords = [
      { freq: 440, delay: 0.0, dur: 0.15 },
      { freq: 554.37, delay: 0.12, dur: 0.15 },
      { freq: 659.25, delay: 0.24, dur: 0.2 },
      { freq: 880, delay: 0.38, dur: 0.5 },
    ];

    chords.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(0.22, now + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.05);
    });
  } catch (err) {
    console.warn('Audio playVictoryTrumpetSound error:', err);
  }
}

/**
 * 23. playTimerCompleteSound() — двойной гармоничный колокольчик завершения фокус-сессии / Помодоро
 */
export function playTimerCompleteSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const vol = getMasterVolume();
    const chimes = [
      { freq: 880, delay: 0.0 },
      { freq: 1318.51, delay: 0.15 },
    ];

    chimes.forEach(({ freq, delay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(0.25 * vol, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.65);
    });
  } catch (err) {
    console.warn('Audio playTimerCompleteSound error:', err);
  }
}

/**
 * 24. playPomodoroTickSound() — мягкий тактильный тик таймера фокуса
 */
export function playPomodoroTickSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const vol = getMasterVolume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.08 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (err) {
    console.warn('Audio playPomodoroTickSound error:', err);
  }
}

/**
 * 25. playFreezeShieldEarnedSound() — хрустальный перезвон получения щита от выгорания
 */
export function playFreezeShieldEarnedSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const vol = getMasterVolume();
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(0.2 * vol, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.45);
    });
  } catch (err) {
    console.warn('Audio playFreezeShieldEarnedSound error:', err);
  }
}

/**
 * 26. playLaserSound() — футуристический лазерный импульс
 */
export function playLaserSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const vol = getMasterVolume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);

    gain.gain.setValueAtTime(0.18 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  } catch (err) {
    console.warn('Audio playLaserSound error:', err);
  }
}

/**
 * 27. playCyberpunkAlertSound() — неоновый сигнал тревоги киберпанк
 */
export function playCyberpunkAlertSound(): void {
  if (!canPlaySound()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const vol = getMasterVolume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(850, now + 0.08);

    gain.gain.setValueAtTime(0.12 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  } catch (err) {
    console.warn('Audio playCyberpunkAlertSound error:', err);
  }
}

/**
 * Каталог доступных процедурных Web Audio FX для звукового теста и превью
 */
export interface SoundPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  play: () => void;
}

export const SOUND_FX_CATALOG: SoundPreset[] = [
  { id: 'coin', name: 'Звон монет', description: 'Расход / доход бюджета', icon: '🪙', play: playCoinSound },
  { id: 'habit', name: 'Чек-ин привычки', description: 'Отметка привычки на сегодня', icon: '💧', play: playHabitCheckSound },
  { id: 'task', name: 'Выполнение задачи', description: 'Чекбокс закрытия дела', icon: '🎯', play: playTaskCompleteSound },
  { id: 'recurrence', name: 'Цикл повтора', description: 'Перенос повторяющейся задачи', icon: '🔁', play: playRecurrenceSound },
  { id: 'freeze', name: 'Заморозка стрика', description: 'Streak Freeze от выгорания', icon: '❄️', play: playStreakFreezeSound },
  { id: 'shield', name: 'Активация щита', description: 'Защита всех стриков на день', icon: '🛡️', play: playShieldSound },
  { id: 'shield_earned', name: 'Получение щита', description: 'Награда за стрик 7+ дней', icon: '💎', play: playFreezeShieldEarnedSound },
  { id: 'milestone', name: 'Стрик-рекорд', description: 'Рубеж 7, 14, 21, 30 дней', icon: '⚡', play: playStreakMilestoneSound },
  { id: 'fanfare', name: 'Ачивка', description: 'Разблокировка трофея', icon: '🎺', play: playAchievementFanfare },
  { id: 'level_up', name: 'Повышение уровня', description: 'Новый ранг и победа', icon: '🏆', play: playLevelUpSound },
  { id: 'timer', name: 'Таймер Помодоро', description: 'Завершение фокус-раунда', icon: '⏱️', play: playTimerCompleteSound },
  { id: 'tick', name: 'Тик фокуса', description: 'Тактильный стук таймера', icon: '⏳', play: playPomodoroTickSound },
  { id: 'laser', name: 'Кибер-лазер', description: 'Мгновенное быстрое действие', icon: '⚡', play: playLaserSound },
  { id: 'cyber', name: 'Cyber Alert', description: 'Неоновый кибер-сигнал', icon: '🚨', play: playCyberpunkAlertSound },
  { id: 'cat', name: 'Мяуканье кота', description: 'Клик по котику-талисману', icon: '🐱', play: playCatSound },
  { id: 'share', name: 'Шеринг карточки', description: 'Копирование или сохранение PNG', icon: '📤', play: playShareSound },
];
