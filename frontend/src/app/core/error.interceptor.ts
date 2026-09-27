import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './auth.service';
import { I18nService } from './i18n.service';

/**
 * Turn an HTTP error into a message a student or clerk can act on, in the
 * current UI language. The API's own `message` wins when it is short and
 * human-readable; bare error codes (e.g. DOCUMENT_NOT_FOUND) are never shown.
 */
export function friendlyHttpError(err: HttpErrorResponse, t: (key: string) => string): string {
  const body = err.error && typeof err.error === 'object' ? err.error : {};
  const code = String(body.error || '');
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (err.status === 0) return t('errNetwork');
  if (code === 'INVALID_CREDENTIALS') return t('errInvalidCredentials');
  if (message && message.length <= 200 && !/^[A-Z0-9_]+$/.test(message) && !message.includes('\n')) return message;
  if (err.status === 429 || code.startsWith('TOO_MANY')) return t('errTooMany');
  if (err.status === 403 || code === 'FORBIDDEN') return t('errForbidden');
  if (err.status === 404 || code.endsWith('NOT_FOUND')) return t('errNotFound');
  if (err.status === 400 || err.status === 422 || code === 'VALIDATION_ERROR') return t('errValidation');
  if (err.status >= 500) return t('errServer');
  return t('errServer');
}

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const snack = inject(MatSnackBar);
  const router = inject(Router);
  const auth = inject(AuthService);
  const i18n = inject(I18nService);
  const t = (key: string) => i18n.t(key);

  return next(req).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const isAuthRequest = req.url.includes('/api/auth/');

        if (!isAuthRequest && auth.isLoggedIn()) {
          auth.logout();
          router.navigateByUrl('/login');
          snack.open(t('errSessionExpired'), t('close'), { duration: 4000 });
        }
        return throwError(() => err);
      }
      if (err instanceof HttpErrorResponse) {
        snack.open(friendlyHttpError(err, t), t('close'), { duration: 5000 });
      }
      return throwError(() => err);
    })
  );
};
