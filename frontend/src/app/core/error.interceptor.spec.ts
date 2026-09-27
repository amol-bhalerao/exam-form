import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { errorInterceptor, friendlyHttpError } from './error.interceptor';
import { AuthService } from './auth.service';

describe('friendlyHttpError', () => {
  const t = (k: string) => `<${k}>`;
  const err = (status: number, error: any = {}) => new HttpErrorResponse({ status, error });

  it('never shows raw error codes', () => {
    expect(friendlyHttpError(err(404, { error: 'DOCUMENT_NOT_FOUND' }), t)).toBe('<errNotFound>');
    expect(friendlyHttpError(err(422, { error: 'VALIDATION_ERROR', issues: [] }), t)).toBe('<errValidation>');
    expect(friendlyHttpError(err(403, { error: 'FORBIDDEN' }), t)).toBe('<errForbidden>');
    expect(friendlyHttpError(err(429, { error: 'TOO_MANY_PAYMENT_REQUESTS' }), t)).toBe('<errTooMany>');
    expect(friendlyHttpError(err(500, { error: 'INTERNAL_ERROR', message: 'Invalid `prisma.x()` invocation:\nfoo' }), t)).toBe('<errServer>');
  });

  it('uses a short human message from the API', () => {
    expect(friendlyHttpError(err(400, { error: 'X', message: 'Exam application window is closed.' }), t)).toBe('Exam application window is closed.');
  });

  it('explains network failures and bad credentials', () => {
    expect(friendlyHttpError(err(0), t)).toBe('<errNetwork>');
    expect(friendlyHttpError(err(401, { error: 'INVALID_CREDENTIALS' }), t)).toBe('<errInvalidCredentials>');
  });
});

describe('errorInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let snack: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;
  let auth: { isLoggedIn: jasmine.Spy; logout: jasmine.Spy };

  beforeEach(() => {
    localStorage.clear();
    snack = jasmine.createSpyObj('MatSnackBar', ['open']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    auth = { isLoggedIn: jasmine.createSpy().and.returnValue(true), logout: jasmine.createSpy() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snack },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth }
      ]
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  it('logs out and returns to login when the session has expired', () => {
    http.get('/api/me').subscribe({ error: () => {} });
    ctrl.expectOne('/api/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    // default UI language is Marathi
    expect(snack.open.calls.mostRecent().args[0]).toBe('तुमचे सत्र संपले आहे. कृपया पुन्हा लॉगिन करा.');
  });

  it('does not log out for a failed login attempt', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    ctrl.expectOne('/api/auth/login').flush({ error: 'INVALID_CREDENTIALS' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('shows a friendly message instead of the error code', () => {
    http.get('/api/public/verify-document/X').subscribe({ error: () => {} });
    ctrl.expectOne('/api/public/verify-document/X').flush({ error: 'DOCUMENT_NOT_FOUND' }, { status: 404, statusText: 'Not Found' });
    const shown = snack.open.calls.mostRecent().args[0];
    expect(shown).not.toContain('DOCUMENT_NOT_FOUND');
    expect(shown.length).toBeGreaterThan(5);
  });
});
