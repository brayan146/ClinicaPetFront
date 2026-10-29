import { Component } from '@angular/core';

@Component({
	selector: 'emervet-settings-page',
	standalone: true,
	template: `
		<section class="settings-card">
			<h1>Settings</h1>
			<p>Configura parametros generales del sistema.</p>
		</section>
	`,
	styles: `
		.settings-card {
			background: #f8fbfb;
			border: 1px solid #cfd9db;
			border-radius: 14px;
			padding: 24px;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
		}

		h1 {
			margin: 0 0 8px;
			color: #123b42;
		}

		p {
			margin: 0;
			color: #456066;
		}
	`,
})
export class SettingsPage {}
