import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly TOKEN_KEY = 'auth_token';

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired();
  }

  decodeTokenPayload(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding session token', e);
      return null;
    }
  }

  getTokenExpirationDate(): Date | null {
    const payload = this.decodeTokenPayload();
    if (!payload || !payload.exp) return null;
    const date = new Date(0);
    date.setUTCSeconds(payload.exp);
    return date;
  }

  isTokenExpired(offsetSeconds: number = 0): boolean {
    const expDate = this.getTokenExpirationDate();
    if (!expDate) return false; // If no exp in token, consider valid
    return expDate.getTime() - offsetSeconds * 1000 <= new Date().getTime();
  }

  getPersonalId(): string | null {
    const payload = this.decodeTokenPayload();
    return payload?.personalId || null;
  }
}

