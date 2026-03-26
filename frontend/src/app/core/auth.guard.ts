import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  // Check if user is authenticated
  if (auth.isLoggedIn()) {
    return true;
  }
  
  return router.parseUrl('/login');
};

// Guard for forms - requires authentication
export const formGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const isLoggedIn = auth.isLoggedIn();
  if (!isLoggedIn) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
  
  return true;
};

// Student-only guard
export const studentGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const isLoggedIn = auth.isLoggedIn();
  const user = auth.user();
  
  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }
  
  if (user?.role && user.role !== 'STUDENT') {
    router.navigate(['/unauthorized']);
    return false;
  }
  
  return true;
};

