import { Routes } from '@angular/router';

export const CLIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/clients-list/clients-list.page').then((page) => page.ClientsListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/client-form/client-form.page').then((page) => page.ClientFormPage),
  },
  
  // =================================================================
  // NUEVAS RUTAS DE MASCOTAS (¡Van exactamente aquí, antes de ':id'!)
  // =================================================================
  {
    path: ':id/pets/new',
    loadComponent: () => import('./pages/pet-form/pet-form.page').then((page) => page.PetFormPage),
  },
  {
    path: ':id/pets/:petId/edit',
    loadComponent: () => import('./pages/pet-form/pet-form.page').then((page) => page.PetFormPage),
  },

  // =================================================================
  // RUTA DINÁMICA GENERAL (Siempre al final)
  // =================================================================
  {
    path: ':id',
    loadComponent: () => import('./pages/client-detail/client-detail.page').then((page) => page.ClientDetailPage),
  },
];