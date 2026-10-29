import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const APP_ROUTES: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'auth/login',
	},
	{
		path: 'auth',
		canActivate: [guestGuard],
		loadChildren: () => import('./features/auth/auth.routes').then((routes) => routes.AUTH_ROUTES),
	},
	{
		path: 'app',
		canActivate: [authGuard],
		loadChildren: () => import('./features/dashboard/dashboard.routes').then((routes) => routes.DASHBOARD_ROUTES),
	},
	{
		path: '**',
		redirectTo: 'auth/login',
	},
];
