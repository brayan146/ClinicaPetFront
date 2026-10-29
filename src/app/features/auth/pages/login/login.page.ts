import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ToastService } from '../../../../core/services/toast/toast.service';

import { LucideEye, LucideEyeOff, LucideLockKeyhole, LucideSend, LucideUser } from '@lucide/angular';

/** Custom validator: requires a full email with a TLD of at least 2 chars (rejects juan@gmail). */
function strictEmail(control: AbstractControl): ValidationErrors | null {
	const value: string = control.value ?? '';
	// Must match: something@something.tld where tld >= 2 chars
	const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
	return value && !pattern.test(value) ? { email: true } : null;
}

@Component({
	selector: 'emervet-login-page',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, LucideEye, LucideEyeOff, LucideLockKeyhole, LucideSend, LucideUser],
	template: `
		<section class="login-shell">
			<div class="login-shell__glow login-shell__glow--top"></div>
			<div class="login-shell__glow login-shell__glow--bottom"></div>

			<div class="login-layout">
				<aside class="login-visual" aria-hidden="true">
					<div class="login-visual__panel">
						<img src="assets/images/baseLogin.png" alt="Ilustración visual" />
					</div>
				</aside>

				<div class="login-content">
					<header class="login-brand">
						<div class="login-brand__mark" aria-hidden="true">
							<img src="assets/images/logo.png" alt="Logo" />
						</div>
						<h1>Clínica Pet</h1>
						<p>Control Interno</p>
					</header>

					<div class="login-card">

						<form class="login-form" [formGroup]="loginForm" (ngSubmit)="login()">
							<div class="field">
								<label for="email">Usuario (Email)</label>
								<div class="field__control">
									<span class="field__icon" aria-hidden="true">
										<svg lucideUser aria-hidden="true"></svg>
									</span>
									<input id="email" formControlName="email" type="email" placeholder="correo@ejemplo.com" autocomplete="email" />
								</div>
								<div *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.invalid" style="color: #ef4444; font-size: 12px; margin-top: 4px; padding-left: 4px;">
									<span *ngIf="loginForm.get('email')?.errors?.['required']">El correo es requerido.</span>
									<span *ngIf="loginForm.get('email')?.errors?.['email']">Ingrese un correo válido (ej. usuario&#64;dominio.com).</span>
								</div>
							</div>

							<div class="field">
								<label for="password">Contraseña</label>
								<div class="field__control">
									<span class="field__icon" aria-hidden="true">
										<svg lucideLockKeyhole aria-hidden="true"></svg>
									</span>
									<input id="password" formControlName="password" [type]="showPassword ? 'text' : 'password'" placeholder="•••••••••" autocomplete="current-password" />
									<button
										class="field__action"
										type="button"
										(click)="togglePasswordVisibility()"
										[attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
									>
										<svg *ngIf="showPassword; else showPasswordIcon" lucideEyeOff aria-hidden="true"></svg>
										<ng-template #showPasswordIcon>
											<svg lucideEye aria-hidden="true"></svg>
										</ng-template>
									</button>
								</div>
								<div *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid" style="color: #ef4444; font-size: 12px; margin-top: 4px; padding-left: 4px;">
									<span *ngIf="loginForm.get('password')?.errors?.['required']">La contraseña es requerida.</span>
								</div>
							</div>

							<div *ngIf="errorMessage" style="color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 12px; border-radius: 8px; font-size: 14px; margin-bottom: 16px; text-align: center;">
								{{ errorMessage }}
							</div>

							<div class="demo-callout">
								<div class="demo-callout__title">
									<span class="demo-callout__badge">Demo Portafolio</span>
									<span class="demo-callout__hint">Frontend 100% Funcional</span>
								</div>
								<p class="demo-callout__text">
									Explora la gestión de clientes, mascotas, agenda de citas con WhatsApp e historial clínico interactivo con persistencia local.
								</p>
								<button type="button" class="btn-demo-quick" (click)="loginDemo()" [disabled]="isLoading">
									<span>⚡ Acceso Rápido Demo (1 Clic)</span>
								</button>
							</div>

							<button class="login-form__submit" type="submit" [disabled]="loginForm.invalid || isLoading">
								<span>{{ isLoading ? 'Iniciando sesión...' : 'Iniciar sesión' }}</span>
								<svg lucideSend aria-hidden="true"></svg>
							</button>
						</form>
					</div>

					<footer class="login-footer">SOFT LINK</footer>
				</div>

			</div>
		</section>
	`,
	styleUrl: './login.page.css',
})
export class LoginPage {
	private readonly router = inject(Router);
	private readonly fb = inject(FormBuilder);
	private readonly authService = inject(AuthService);
	private readonly toastService = inject(ToastService);

	protected showPassword = false;
	protected isLoading = false;
	protected errorMessage = '';

	protected readonly loginForm = this.fb.group({
		email: ['', [Validators.required, strictEmail]],
		password: ['', [Validators.required]],
	});

	protected togglePasswordVisibility(): void {
		this.showPassword = !this.showPassword;
	}

	protected loginDemo(): void {
		this.loginForm.setValue({
			email: 'demo@clinicapet.com',
			password: 'demo_password123'
		});
		this.login();
	}

	protected login(): void {
		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}

		this.isLoading = true;
		this.errorMessage = '';

		const credentials = {
			email: this.loginForm.value.email ?? '',
			password: this.loginForm.value.password ?? '',
		};

		this.authService.login(credentials).subscribe({
			next: () => {
				this.isLoading = false;
				this.toastService.success('Inicio de sesión exitoso.');
				void this.router.navigate(['/app/dashboard']);
			},
			error: (err: any) => {
				this.isLoading = false;
				console.error('Login error', err);
				if (err?.status === 0) {
					this.errorMessage = 'No se pudo conectar con el servidor. Verifique si la API está iniciada.';
				} else if (err?.status === 400 || err?.status === 401) {
					this.errorMessage = 'Credenciales incorrectas. Verifica que tu correo o contraseña sean correctos.';
				} else {
					this.errorMessage = 'Ocurrió un error inesperado en el servidor. Por favor, intente más tarde.';
				}
			}
		});
	}
}
