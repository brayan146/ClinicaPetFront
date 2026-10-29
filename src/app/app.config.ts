import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { mockBackendInterceptor } from './core/interceptors/mock-backend.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(APP_ROUTES),
		provideHttpClient(withInterceptors([mockBackendInterceptor, authInterceptor, errorInterceptor]))
	],
};

