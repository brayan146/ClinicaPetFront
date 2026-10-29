import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../services/session/session.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (!sessionService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/app/dashboard']);
};
