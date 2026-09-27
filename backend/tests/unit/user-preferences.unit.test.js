import { describe, it, expect, vi } from 'vitest';
import {
  normalizeLanguage,
  defaultLanguageForRole,
  getSavedLanguage,
  saveLanguage,
  languageFieldsFor,
  SUPPORTED_LANGUAGES
} from '../../src/services/user-preferences.js';

function fakeClient(rows = []) {
  return {
    $queryRaw: vi.fn(async () => rows),
    $executeRaw: vi.fn(async () => 1)
  };
}

describe('user preferences service', () => {
  it('supports Marathi, English and Hindi', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['mr', 'en', 'hi']);
  });

  it.each([
    ['mr', 'mr'], ['EN', 'en'], [' hi ', 'hi'], ['en-IN', 'en'], ['fr', null], ['', null], [null, null], [undefined, null]
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeLanguage(input)).toBe(expected);
  });

  it('defaults students to Marathi and staff to English', () => {
    expect(defaultLanguageForRole('STUDENT')).toBe('mr');
    expect(defaultLanguageForRole('student')).toBe('mr');
    for (const role of ['INSTITUTE', 'BOARD', 'SUPER_ADMIN', undefined]) {
      expect(defaultLanguageForRole(role)).toBe('en');
    }
  });

  it('reads a saved language', async () => {
    expect(await getSavedLanguage(fakeClient([{ language: 'hi' }]), 3)).toBe('hi');
  });

  it('returns null when nothing is saved, no user, or the table is missing', async () => {
    expect(await getSavedLanguage(fakeClient([]), 3)).toBeNull();
    expect(await getSavedLanguage(fakeClient([]), null)).toBeNull();
    const broken = { $queryRaw: vi.fn(async () => { throw new Error("Table 'user_preferences' doesn't exist"); }) };
    expect(await getSavedLanguage(broken, 3)).toBeNull();
  });

  it('saves a normalized language', async () => {
    const client = fakeClient();
    expect(await saveLanguage(client, 3, 'HI')).toBe('hi');
    expect(client.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('refuses unsupported languages with a 400', async () => {
    await expect(saveLanguage(fakeClient(), 3, 'de')).rejects.toMatchObject({ status: 400 });
  });

  it('builds the auth response fields', async () => {
    expect(await languageFieldsFor(fakeClient([{ language: 'en' }]), 3, 'STUDENT'))
      .toEqual({ preferredLanguage: 'en', defaultLanguage: 'mr' });
    expect(await languageFieldsFor(fakeClient([]), 3, 'BOARD'))
      .toEqual({ preferredLanguage: null, defaultLanguage: 'en' });
  });
});
