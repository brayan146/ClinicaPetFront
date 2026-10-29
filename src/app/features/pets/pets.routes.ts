import { Routes } from '@angular/router';

export const PETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/pets-list/pets-list.page').then((page) => page.PetsListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/pet-form/pet-form.page').then((page) => page.PetFormPage),
  },
];