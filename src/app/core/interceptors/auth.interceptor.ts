import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from '../services/session/session.service';
import { AuthService } from '../services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = sessionService.getToken();

  let reqHeaders: Record<string, string> = {};
  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const clonedReq = req.clone({
    setHeaders: reqHeaders,
    withCredentials: true,
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If error is 401 Unauthorized and not on an auth endpoint (login/refresh/logout)
      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/logout');

      if (error.status === 401 && !isAuthEndpoint) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            const newToken = sessionService.getToken();
            const retryReq = req.clone({
              setHeaders: {
                ...(token || newToken ? { Authorization: `Bearer ${newToken}` } : {}),
              },
              withCredentials: true,
            });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            sessionService.clearSession();
            void router.navigate(['/auth/login']);
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => error);
    })
  );
};


