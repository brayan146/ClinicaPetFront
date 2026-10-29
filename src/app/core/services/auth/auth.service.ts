import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SessionService } from '../session/session.service';
import { LoginCredentials } from '../../../features/auth/interfaces/login-credentials.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private refreshTimer: any = null;

  constructor() {
    if (this.sessionService.isLoggedIn()) {
      this.scheduleSilentRefresh();
    }
  }

  login(credentials: LoginCredentials): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap((response) => {
        const token = response?.token || response?.Token || response?.data?.token || response?.data?.Token;
        if (token) {
          this.sessionService.saveToken(token);
          this.scheduleSilentRefresh();
        }
      })
    );
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap((response) => {
        const token = response?.token || response?.Token || response?.data?.token || response?.data?.Token;
        if (token) {
          this.sessionService.saveToken(token);
          this.scheduleSilentRefresh();
        }
      }),
      catchError((err) => {
        this.clearRefreshTimer();
        this.sessionService.clearSession();
        return throwError(() => err);
      })
    );
  }

  logout(): Observable<any> {
    this.clearRefreshTimer();
    return this.http.post<any>(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(null)), // Handle network or auth errors silently on logout
      tap({
        finalize: () => {
          this.clearRefreshTimer();
          this.sessionService.clearSession();
          void this.router.navigate(['/auth/login']);
        }
      })
    );
  }

  private scheduleSilentRefresh(): void {
    this.clearRefreshTimer();
    const expDate = this.sessionService.getTokenExpirationDate();

    // Default to refreshing in 10 minutes if exp is not present
    let delay = 10 * 60 * 1000;

    if (expDate) {
      // Buffer of 5 minutes before expiration (300,000 ms)
      const bufferMs = 5 * 60 * 1000;
      const timeRemainingMs = expDate.getTime() - new Date().getTime();
      delay = timeRemainingMs - bufferMs;

      // If token is about to expire or already past buffer, refresh in 5 seconds
      if (delay <= 0) {
        delay = 5000;
      }
    }

    this.refreshTimer = setTimeout(() => {
      if (this.sessionService.isLoggedIn()) {
        this.refreshToken().subscribe({
          error: (err) => console.warn('Automatic silent token refresh failed:', err)
        });
      }
    }, delay);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

