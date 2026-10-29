import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard-shell/dashboard-shell.page').then((page) => page.DashboardShellPage),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard-home/dashboard-home.page').then((page) => page.DashboardHomePage),
      },
      {
        path: 'clients',
        loadChildren: () => import('../clients/clients.routes').then((routes) => routes.CLIENTS_ROUTES),
      },
      {
        path: 'pets',
        loadChildren: () => import('../pets/pets.routes').then((routes) => routes.PETS_ROUTES),
      },
      {
        path: 'clinical-history',
        loadChildren: () => import('../clinical-history/clinical-history.routes').then((routes) => routes.CLINICAL_HISTORY_ROUTES),
      },
      {
        path: 'vaccinations',
        loadChildren: () => import('../vaccinations/vaccinations.routes').then((routes) => routes.VACCINATIONS_ROUTES),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then((page) => page.SettingsPage),
      },
    ],
  },
];