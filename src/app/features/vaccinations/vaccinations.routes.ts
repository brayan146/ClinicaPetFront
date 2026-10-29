import { Routes } from '@angular/router';

export const VACCINATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/vaccinations-list/vaccinations-list.page').then((page) => page.VaccinationsListPage),
  },
  {
    path: 'deworming',
    loadComponent: () => import('./pages/deworming-list/deworming-list.page').then((page) => page.DewormingListPage),
  },
];