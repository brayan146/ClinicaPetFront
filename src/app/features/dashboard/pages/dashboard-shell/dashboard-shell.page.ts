import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';

import {
  LucideCalendarDays,
  LucideLayoutGrid,
  LucideLogOut,
  LucidePawPrint,
  LucideRotateCcw,
  LucideSettings,
  LucideUsers,
} from '@lucide/angular';
import { MockBackendService } from '../../../../core/mock/mock-backend.service';
import { ToastService } from '../../../../core/services/toast/toast.service';

interface MenuItem {
  label: string;
  path: string;
}

@Component({
  selector: 'emervet-dashboard-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideCalendarDays,
    LucideLayoutGrid,
    LucideLogOut,
    LucidePawPrint,
    LucideRotateCcw,
    LucideSettings,
    LucideUsers
  ],
  template: `
    <section class="app-shell">
      <aside class="app-sidebar">
        <div class="brand-card">
          <div class="brand-card__logo">
            <img src="assets/images/logo.png" alt="Logo Clinica Pet" />
          </div>
          <div>
            <strong>Clinica Pet</strong>
            <small>Control Interno</small>
          </div>
        </div>

        <nav class="menu">
          <a
            *ngFor="let item of menuItems"
            [routerLink]="item.path"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: item.path === '/app/dashboard' }"
          >
            <span class="menu__icon" aria-hidden="true" [ngSwitch]="item.path">
              <svg *ngSwitchCase="'/app/dashboard'" lucideLayoutGrid></svg>
              <svg *ngSwitchCase="'/app/clients'" lucideUsers></svg>
              <svg *ngSwitchCase="'/app/clinical-history'" lucideCalendarDays></svg>
              <svg *ngSwitchCase="'/app/pets'" lucidePawPrint></svg>
            </span>
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <div class="sidebar-bottom">
          <button type="button" class="btn-reset-demo" (click)="resetDemo()" title="Restablecer datos originales de prueba">
            <svg lucideRotateCcw aria-hidden="true"></svg>
            <span>Reiniciar Datos Demo</span>
          </button>

          <a class="logout" href="#" (click)="logout($event)">
            <svg lucideLogOut aria-hidden="true"></svg>
            <span>Cerrar Sesion</span>
          </a>
        </div>
      </aside>

      <main class="app-content">
        <router-outlet />
      </main>
    </section>
  `,
  styleUrl: './dashboard-shell.page.css',
})
export class DashboardShellPage {
  private readonly authService = inject(AuthService);
  private readonly mockBackend = inject(MockBackendService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly menuItems: MenuItem[] = [
    { label: 'Dashboard', path: '/app/dashboard' },
    { label: 'Clientes', path: '/app/clients' },
    { label: 'Citas', path: '/app/clinical-history' },
    { label: 'Mascotas', path: '/app/pets' },
  ];

  protected resetDemo(): void {
    if (confirm('¿Deseas restaurar los datos de demostración a su estado inicial?')) {
      this.mockBackend.resetToInitial();
      this.toastService.success('Datos demo restablecidos correctamente.');
      setTimeout(() => {
        window.location.reload();
      }, 400);
    }
  }

  protected logout(event: Event): void {
    event.preventDefault();
    this.authService.logout().subscribe({
      next: () => {
        void this.router.navigate(['/auth/login']);
      },
      error: (err: any) => {
        console.error('Logout error', err);
        // Redirect anyways to clean up frontend state
        void this.router.navigate(['/auth/login']);
      }
    });
  }
}