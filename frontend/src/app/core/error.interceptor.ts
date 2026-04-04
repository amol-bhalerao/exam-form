import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './auth.service';

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const snack = inject(MatSnackBar);
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const isAuthRequest = req.url.includes('/api/auth/');

        if (!isAuthRequest && auth.isLoggedIn()) {
          auth.logout();
          router.navigateByUrl('/login');
          snack.open('Session expired. Please login again.', 'Close', { duration: 4000 });
        }
        return throwError(() => err);
      }
      if (err instanceof HttpErrorResponse && err.error?.error) {
        snack.open(err.error.error, 'Close', { duration: 4000 });
      } else if (err instanceof HttpErrorResponse) {
        snack.open(err.message || 'HTTP Error', 'Close', { duration: 4000 });
      }
      return throwError(() => err);
    })
  );
};