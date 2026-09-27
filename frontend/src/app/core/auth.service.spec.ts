import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { I18nService } from './i18n.service';
import { API_BASE_URL } from './api';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let i18n: I18nService;

  const user = { userId: 5, username: 'student1', role: 'STUDENT' as const, instituteId: 1, preferredLanguage: 'hi' as const, defaultLanguage: 'mr' as const };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    i18n = TestBed.inject(I18nService);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('starts signed out', () => {
    expect(auth.isLoggedIn()).toBeFalse();
    expect(auth.user()).toBeNull();
  });

  it('logs in, stores the session and applies the account language', () => {
    auth.login('student1', 'pw').subscribe();
    const req = http.expectOne(`${API_BASE_URL}/auth/login`);
    expect(req.request.body).toEqual({ username: 'student1', password: 'pw' });
    req.flush({ accessToken: 'a1', refreshToken: 'r1', user });

    expect(auth.isLoggedIn()).toBeTrue();
    expect(auth.accessToken()).toBe('a1');
    expect(auth.user()?.username).toBe('student1');
    expect(JSON.parse(localStorage.getItem('hsc_auth')!).refreshToken).toBe('r1');
    expect(i18n.getLanguage()).toBe('hi');
  });

  it('logs in with Google', () => {
    auth.googleLogin('google-credential').subscribe();
    http.expectOne(`${API_BASE_URL}/auth/google`).flush({ accessToken: 'g1', refreshToken: 'gr', user: { ...user, preferredLanguage: null } });
    expect(auth.accessToken()).toBe('g1');
    expect(i18n.getLanguage()).toBe('mr');
  });

  it('logs out: clears the session and revokes the refresh token', () => {
    auth.login('student1', 'pw').subscribe();
    http.expectOne(`${API_BASE_URL}/auth/login`).flush({ accessToken: 'a1', refreshToken: 'r1', user });
    auth.logout();
    expect(auth.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('hsc_auth')).toBeNull();
    const req = http.expectOne(`${API_BASE_URL}/auth/logout`);
    expect(req.request.body).toEqual({ refreshToken: 'r1' });
    req.flush({ ok: true });
  });

  it('refreshes the access token', async () => {
    auth.login('student1', 'pw').subscribe();
    http.expectOne(`${API_BASE_URL}/auth/login`).flush({ accessToken: 'a1', refreshToken: 'r1', user });
    const pending = auth.refreshAccessToken();
    http.expectOne(`${API_BASE_URL}/auth/refresh`).flush({ accessToken: 'a2', user });
    expect(await pending).toBe('a2');
    expect(auth.accessToken()).toBe('a2');
  });

  it('returns null when refresh fails', async () => {
    auth.login('student1', 'pw').subscribe();
    http.expectOne(`${API_BASE_URL}/auth/login`).flush({ accessToken: 'a1', refreshToken: 'r1', user });
    const pending = auth.refreshAccessToken();
    http.expectOne(`${API_BASE_URL}/auth/refresh`).flush({ error: 'INVALID_REFRESH' }, { status: 401, statusText: 'Unauthorized' });
    expect(await pending).toBeNull();
  });

  it('does not try to refresh when signed out', async () => {
    expect(await auth.refreshAccessToken()).toBeNull();
  });

  it('restores a stored session and survives corrupt storage', () => {
    localStorage.setItem('hsc_auth', JSON.stringify({ accessToken: 'x', refreshToken: 'y', user }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    expect(TestBed.inject(AuthService).user()?.username).toBe('student1');

    localStorage.setItem('hsc_auth', '{not json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    expect(TestBed.inject(AuthService).isLoggedIn()).toBeFalse();
    http = TestBed.inject(HttpTestingController);
  });

  it('updates the access token after institute selection', () => {
    auth.login('student1', 'pw').subscribe();
    http.expectOne(`${API_BASE_URL}/auth/login`).flush({ accessToken: 'a1', refreshToken: 'r1', user });
    auth.updateAccessToken('a3', { ...user, instituteId: 9 });
    expect(auth.accessToken()).toBe('a3');
    expect(auth.user()?.instituteId).toBe(9);
  });
});
