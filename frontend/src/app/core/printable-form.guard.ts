import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { API_BASE_URL } from './api';

export const printableFormGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);

  const user = auth.user();
  if (!user) {
    return router.parseUrl('/login');
  }

  // Non-student roles retain existing access behavior.
  if (user.role !== 'STUDENT') {
    return true;
  }

  const applicationId = Number(route.paramMap.get('id'));
  if (!Number.isFinite(applicationId) || applicationId <= 0) {
    return router.createUrlTree(['/app/student/applications']);
  }

  try {
    const response = await firstValueFrom(
      http.get<{ application: any }>(`${API_BASE_URL}/applications/${applicationId}`)
    );

    const app = response?.application;
    const latestPayment = app?.fees?.[0] || null;
    const paymentCompleted = !!latestPayment
      && !!latestPayment.receivedAt
      && new Date(latestPayment.receivedAt).getTime() > 1000
      && !String(latestPayment.method || '').toUpperCase().includes('PENDING');

    if (String(app?.status || '').toUpperCase() === 'SUBMITTED' && paymentCompleted) {
      return true;
    }

    return router.createUrlTree(['/app/student/applications']);
  } catch {
    return router.createUrlTree(['/app/student/applications']);
  }
};
