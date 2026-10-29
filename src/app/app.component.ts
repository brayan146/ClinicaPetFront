import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastComponent } from './shared/components/toast/toast.component';
import { environment } from '../environments/environment';

@Component({
	selector: 'emervet-root',
	standalone: true,
	imports: [RouterOutlet, ToastComponent],
	template: `
		<router-outlet />
		<emervet-toast />
	`,
})
export class AppComponent implements OnInit, OnDestroy {
	private http = inject(HttpClient);
	private heartbeatInterval: any;

	ngOnInit() {
		if (!environment.demoMode) {
			this.sendHeartbeat();
			this.heartbeatInterval = setInterval(() => {
				this.sendHeartbeat();
			}, 3000);
		}
	}

	ngOnDestroy() {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
		}
	}

	private sendHeartbeat() {
		this.http.post(`${environment.apiUrl}/system/heartbeat`, {}).subscribe({
			error: () => {}
		});
	}

	@HostListener('window:beforeunload')
	onBeforeUnload() {
		if (navigator.sendBeacon) {
			navigator.sendBeacon(`${environment.apiUrl}/system/shutdown`);
		}
	}
}
