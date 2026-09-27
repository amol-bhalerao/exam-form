import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let token: string | null;
  let refreshResult: string | null;

  beforeEach(() => {
    token = 'access-1';
    refreshResult = 'access-2';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { accessToken: () => token, refreshAccessToken: () => Promise.resolve(refreshResult) } }
      ]
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  it('adds the bearer token', () => {
    http.get('/api/me').subscribe();
    expect(ctrl.expectOne('/api/me').request.headers.get('Authorization')).toBe('Bearer access-1');
  });

  it('sends no Authorization header when signed out', () => {
    token = null;
    http.get('/api/public/exams').subscribe();
    expect(ctrl.expectOne('/api/public/exams').request.headers.has('Authorization')).toBeFalse();
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    let body: any;
    http.get('/api/me').subscribe((b) => (body = b));
    ctrl.expectOne('/api/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    await Promise.resolve();
    await Promise.resolve();
    const retry = ctrl.expectOne('/api/me');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer access-2');
    retry.flush({ ok: true });
    expect(body).toEqual({ ok: true });
  });

  it('passes the 401 through when refresh fails', async () => {
    refreshResult = null;
    let status = 0;
    http.get('/api/me').subscribe({ error: (e) => (status = e.status) });
    ctrl.expectOne('/api/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    await Promise.resolve();
    await Promise.resolve();
    expect(status).toBe(401);
  });

  it('never refreshes for auth endpoints', () => {
    let status = 0;
    http.post('/api/auth/login', {}).subscribe({ error: (e) => (status = e.status) });
    ctrl.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
  });
});
