import { Routes } from '@angular/router';

export const CLINICAL_HISTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/clinical-history-list/clinical-history-list.page').then((page) => page.ClinicalHistoryListPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/clinical-history-detail/clinical-history-detail.page').then((page) => page.ClinicalHistoryDetailPage),
  },
];