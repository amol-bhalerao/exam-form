import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import type { RoleName } from './auth.types';

export function roleGuard(roles: RoleName[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.user()?.role ?? null;
    if (!role) return router.parseUrl('/login');
    if (roles.includes(role)) return true;
    return router.parseUrl('/');
  };
}

