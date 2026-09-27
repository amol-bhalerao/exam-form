import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { I18nService, normalizeLanguage } from './i18n.service';
import { API_BASE_URL } from './api';

describe('I18nService', () => {
  let http: HttpTestingController;

  function create(): I18nService {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(I18nService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    http?.verify();
    localStorage.clear();
  });

  it('defaults to Marathi and sets <html lang>', () => {
    const i18n = create();
    expect(i18n.getLanguage()).toBe('mr');
    expect(document.documentElement.lang).toBe('mr');
  });

  it('restores a language saved on this device', () => {
    localStorage.setItem('language', 'hi');
    expect(create().getLanguage()).toBe('hi');
  });

  it('translates into all three languages, with English fallback and key fallback', () => {
    const i18n = create();
    i18n.setLanguage('en', { persist: false });
    expect(i18n.t('logout')).toBe('Logout');
    i18n.setLanguage('mr', { persist: false });
    expect(i18n.t('logout')).toBe('लॉगआउट');
    i18n.setLanguage('hi', { persist: false });
    expect(i18n.t('logout')).toBe('लॉगआउट');
    expect(i18n.t('navDashboard')).toBe('डैशबोर्ड');
    expect(i18n.t('no.such.key')).toBe('no.such.key');
  });

  it('fills {placeholders}', () => {
    const i18n = create();
    i18n.setLanguage('en', { persist: false });
    expect(i18n.t('grPickRange', { min: 3, max: 4 })).toBe('Pick 3–4');
  });

  it('has a Hindi and Marathi entry for every English key', () => {
    const i18n = create();
    i18n.setLanguage('en', { persist: false });
    const keys = Object.keys(i18n.getTranslations());
    for (const lang of ['mr', 'hi'] as const) {
      i18n.setLanguage(lang, { persist: false });
      const t = i18n.getTranslations();
      const missing = keys.filter((k) => !t[k]);
      expect(missing).withContext(lang).toEqual([]);
    }
  });

  it('ignores unsupported languages', () => {
    const i18n = create();
    i18n.setLanguage('fr');
    expect(i18n.getLanguage()).toBe('mr');
  });

  it('remembers a choice locally but does not call the API when signed out', () => {
    const i18n = create();
    i18n.setLanguage('en');
    expect(localStorage.getItem('language')).toBe('en');
    http.expectNone(`${API_BASE_URL}/me/preferences`);
  });

  it('saves the choice to the account when signed in', () => {
    localStorage.setItem('hsc_auth', JSON.stringify({ accessToken: 'a', refreshToken: 'r', user: {} }));
    const i18n = create();
    i18n.setLanguage('hi');
    const req = http.expectOne(`${API_BASE_URL}/me/preferences`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ language: 'hi' });
    req.flush({ language: 'hi' });
  });

  it('keeps the local choice when saving to the account fails', () => {
    localStorage.setItem('hsc_auth', '{}');
    const i18n = create();
    i18n.setLanguage('en');
    http.expectOne(`${API_BASE_URL}/me/preferences`).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(i18n.getLanguage()).toBe('en');
  });

  describe('applyUserPreference (after login)', () => {
    it('uses the language saved on the account first', () => {
      const i18n = create();
      i18n.applyUserPreference({ preferredLanguage: 'hi', defaultLanguage: 'en' });
      expect(i18n.getLanguage()).toBe('hi');
      expect(localStorage.getItem('language')).toBe('hi');
    });

    it('keeps a choice made before signing in and saves it to the account', () => {
      const i18n = create();
      i18n.setLanguage('en', { persist: false });
      i18n.applyUserPreference({ preferredLanguage: null, defaultLanguage: 'mr' });
      expect(i18n.getLanguage()).toBe('en');
      const req = http.expectOne(`${API_BASE_URL}/me/preferences`);
      expect(req.request.body).toEqual({ language: 'en' });
      req.flush({});
    });

    it('falls back to the role default', () => {
      const i18n = create();
      i18n.applyUserPreference({ preferredLanguage: null, defaultLanguage: 'en' });
      expect(i18n.getLanguage()).toBe('en');
    });

    it('does nothing without a user', () => {
      const i18n = create();
      i18n.applyUserPreference(null);
      expect(i18n.getLanguage()).toBe('mr');
    });
  });

  it('picks the current language from an API { en, mr, hi } object', () => {
    const i18n = create();
    i18n.setLanguage('hi', { persist: false });
    expect(i18n.pick({ en: 'Physics', mr: 'भौतिकशास्त्र', hi: 'भौतिकी' })).toBe('भौतिकी');
    expect(i18n.pick({ en: 'Only English' })).toBe('Only English');
    expect(i18n.pick('plain')).toBe('plain');
    expect(i18n.pick(null)).toBe('');
  });

  it('normalizes language codes', () => {
    expect(normalizeLanguage('EN-in')).toBe('en');
    expect(normalizeLanguage('xx')).toBeNull();
  });
});
