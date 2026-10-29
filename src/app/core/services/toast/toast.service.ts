import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastsState = signal<ToastItem[]>([]);
  readonly toasts = this.toastsState.asReadonly();

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 6000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, message, type, duration };
    
    // Añadimos el nuevo toast
    this.toastsState.update(current => [...current, newToast]);

    // Auto-eliminar después del tiempo de duración
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  remove(id: string): void {
    this.toastsState.update(current => current.filter(t => t.id !== id));
  }
}
