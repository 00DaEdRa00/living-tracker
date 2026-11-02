import { describe, it, expect } from 'vitest';
import { getTranslation, translations } from '../lib/i18n';

describe('i18n and Tone Localization Rule', () => {
  it('returns Russian dictionary by default with full 3-tier humor', () => {
    const dict = getTranslation('ru');
    expect(dict.appName).toBe('Живой трекер');
    expect(dict.headlines.neutral).toBe('Финансовый и поведенческий дашборд');
    expect(dict.headlines.ironic).toBe('Имитация контроля над собственной жизнью');
    expect(dict.headlines.sassy).toContain('Укроти бабки');
  });

  it('adheres to Tone Localization Rule for English: clean and polite tone', () => {
    const dict = getTranslation('en');
    expect(dict.appName).toBe('Living Tracker');
    expect(dict.headlines.neutral).toBe('Personal Productivity and Financial Command Center');
    // Ensure English does not contain crude slang or profanity
    expect(dict.headlines.sassy).not.toContain('бабки');
    expect(dict.headlines.sassy).toBe('Level up your discipline and take control of your time');
  });

  it('provides complete tabs and navigation labels across languages', () => {
    ['ru', 'en'].forEach((lang) => {
      const dict = getTranslation(lang as any);
      expect(dict.tabs.dashboard).toBeDefined();
      expect(dict.tabs.tasks).toBeDefined();
      expect(dict.tabs.habits).toBeDefined();
      expect(dict.tabs.finances).toBeDefined();
      expect(dict.tabs.plugins).toBeDefined();
    });
  });
});
