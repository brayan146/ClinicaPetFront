import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  LucidePlus, 
  LucideCalendar, 
  LucideUsers, 
  LucidePawPrint, 
  LucideClipboardList, 
  LucideBug, 
  LucideTrendingUp, 
  LucideSyringe 
} from '@lucide/angular';

import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClientsService } from '../../../clients/services/clients.service';

interface DashboardAppointment {
  id: string;
  petName: string;
  clientName: string;
  clientPhone: string;
  productName: string;
  servicioTipo?: string;
  rawDate: string;
  displayDate: string;
  isToday: boolean;
  estado: 'Pendiente' | 'Enviado';
}

@Component({
  selector: 'emervet-dashboard-home-page',
  standalone: true,
  imports: [
    CommonModule, 
    LucidePlus, 
    LucideCalendar, 
    LucideUsers, 
    LucidePawPrint, 
    LucideClipboardList, 
    LucideBug, 
    LucideTrendingUp, 
    LucideSyringe
  ],
  template: `
  <div class="dashboard-wrapper">
      <section class="card header-card">
        <h1>Panel principal</h1>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="navigateToClients()">
            <svg lucidePlus [size]="18" color="#0f172a"></svg> Cliente
          </button>
          <button class="btn btn-outline" (click)="navigateToCitas()">
            <svg lucideCalendar [size]="18" color="#0f172a"></svg> Ver Agenda
          </button>
        </div>
      </section>

      <!-- TARJETAS ESTADISTICAS EN TIEMPO REAL -->
      <section class="stats-grid">
        <div class="card stat-card">
          <div class="icon-box bg-peach">
            <svg lucideUsers [size]="24" color="#1e293b"></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Clientes</span>
            <span class="stat-value">{{ totalClients() }}</span>
          </div>
        </div>
        
        <div class="card stat-card">
          <div class="icon-box bg-mint">
            <svg lucidePawPrint [size]="24" color="#1e293b"></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Mascotas</span>
            <span class="stat-value">{{ totalPets() }}</span>
          </div>
        </div>

        <div class="card stat-card">
          <div class="icon-box bg-yellow">
            <svg lucideClipboardList [size]="24" color="#1e293b"></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Citas Hoy</span>
            <span class="stat-value">{{ todayAppointmentsCount() }}</span>
          </div>
        </div>

        <div class="card stat-card">
          <div class="icon-box bg-rose">
            <svg lucideBug [size]="24" color="#1e293b"></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Citas (1sem)</span>
            <span class="stat-value">{{ weekAppointmentsCount() }}</span>
          </div>
        </div>
      </section>

      <!-- SECCION GRAFICO + PROXIMAS CITAS -->
      <section class="content-grid">
        <div class="card chart-card">
          <div class="card-header">
            <div class="title-group">
              <svg lucideTrendingUp [size]="20" color="#0d9488"></svg>
              <div>
                <h2>Agenda de citas</h2>
                <p class="subtitle">Próximos 14 días</p>
              </div>
            </div>
            <span class="badge badge-light-teal">{{ upcomingAppointments().length }} programadas</span>
          </div>
          
          <div class="chart-mockup">
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" class="mock-svg">
              <path d="M0,130 L40,90 L90,20 L130,140 L170,110 L210,140 L500,140 L500,150 L0,150 Z" fill="#e6f4f1" opacity="0.7"></path>
              <path d="M0,130 L40,90 L90,20 L130,140 L170,110 L210,140 L500,140" fill="none" stroke="#0f766e" stroke-width="2"></path>
            </svg>
          </div>
        </div>

        <!-- TARJETA DE PROXIMAS CITAS CON ACCESO RAPIDO A WHATSAPP -->
        <div class="card list-card">
          <div class="card-header">
            <div class="title-group">
              <svg lucideSyringe [size]="20" color="#0d9488"></svg>
              <h2>Próximas citas</h2>
            </div>
          </div>
          
          <div class="appointments-list">
            <div class="appointment-item" *ngFor="let apt of upcomingAppointments()">
              <div class="app-details">
                <h3>{{ apt.petName }}</h3>
                <p>{{ apt.productName }} · {{ apt.displayDate }}</p>
                <small class="owner-name" *ngIf="apt.clientName">Cliente: {{ apt.clientName }}</small>
              </div>
              
              <div class="app-actions">
                <span class="badge" [class.badge-orange]="apt.isToday" [class.badge-teal]="!apt.isToday">
                  {{ apt.isToday ? 'Hoy' : 'Próxima' }}
                </span>

                <!-- BOTON DE ACCESO RAPIDO WHATSAPP -->
                <a
                  [href]="getWhatsappLink(apt)"
                  target="_blank"
                  class="btn-quick-whatsapp"
                  title="Enviar recordatorio rápido por WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div *ngIf="upcomingAppointments().length === 0" class="empty-msg">
              No hay citas próximas programadas.
            </div>
          </div>
        </div>
      </section>
    </div>`,
  styleUrls: ['./dashboard-home-page.css']
})
export class DashboardHomePage implements OnInit {
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);

  protected readonly totalClients = signal(0);
  protected readonly totalPets = signal(0);
  protected readonly todayAppointmentsCount = signal(0);
  protected readonly weekAppointmentsCount = signal(0);
  protected readonly upcomingAppointments = signal<DashboardAppointment[]>([]);

  ngOnInit(): void {
    this.loadRealTimeData();
  }

  protected navigateToClients(): void {
    void this.router.navigate(['/app/clients']);
  }

  protected navigateToCitas(): void {
    void this.router.navigate(['/app/clinical-history']);
  }

  protected getWhatsappLink(apt: DashboardAppointment): string {
    const cleanNumber = (apt.clientPhone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanNumber.startsWith('591') ? cleanNumber : `591${cleanNumber}`;
    const tipoServicioText = apt.servicioTipo || 'Vacuna';
    const iconoServicio = tipoServicioText === 'Desparasitación' ? '💊' : '💉';

    const message =
      `*RECORDATORIO DE CITA | 💙🐶 CLÍNICA PET*\n\n` +
      `Hola, *${apt.clientName || 'Cliente'}*.\n\n` +
      `Le recordamos que *${apt.petName}* tiene una cita programada.\n\n` +
      `🐶 *Mascota:* ${apt.petName}\n` +
      `📅 *Fecha:* ${apt.displayDate}\n` +
      `${iconoServicio} *Servicio:* ${tipoServicioText}\n\n` +
      `Si necesita reprogramar la cita o tiene alguna consulta, responda este mensaje.\n\n` +
      `*Gracias por confiar en Clínica Pet.* 💙🐾`;

    return `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
  }

  private checkIsDesparasitante(prodName: string, prodId?: string, productsCatalog?: any[]): boolean {
    if (!prodName && !prodId) return false;

    // 1. Comprobar dinámicamente en el catálogo de productos si pertenece a Categoría 2 (Desparasitaciones)
    if (productsCatalog && productsCatalog.length > 0) {
      const found = productsCatalog.find(
        (p) =>
          (prodId && String(p.id).toLowerCase() === String(prodId).toLowerCase()) ||
          (p.nombre && p.nombre.toLowerCase().trim() === (prodName || '').toLowerCase().trim())
      );
      if (found) {
        const catId = Number(found.categoriaProductoId || found.categoriaId);
        if (catId === 2) return true; // Categoría 2 = Desparasitaciones -> Morado
        if (catId === 1) return false; // Categoría 1 = Vacunas -> Azul
        const catName = String(found.categoriaNombre || found.categoria || '').toLowerCase();
        if (catName.includes('desparasit') || catName.includes('parasit')) return true;
      }
    }

    // 2. Reglas de respaldo por palabras clave (marcas, principios activos y errores de ortografía)
    const norm = (prodName || '').toLowerCase().trim();
    const keywords = [
      'desparasit', 'desparacit', 'parasit', 'paracit', 'antiparasit', 'antiparacit',
      'nexgard', 'frontline', 'simparica', 'bravecto', 'albex', 'albendazol',
      'fenbendazol', 'praziquantel', 'endogard', 'drontal', 'total full', 'totalfull',
      'basken', 'caniten', 'credelio', 'revolution', 'milbemax', 'panacur',
      'advocate', 'quantel', 'vermiplex', 'droncit', 'profender', 'ivermectin',
      'moxidectin', 'pyrantel', 'febantel', 'oxantel', 'selamectin', 'sarolaner',
      'afoxolaner', 'fluralaner', 'lotilaner', 'milbemycin', 'helmint', 'tenia'
    ];

    return keywords.some((kw) => norm.includes(kw));
  }

  private loadRealTimeData(): void {
    // 1. Cargar clientes
    this.clientsService.loadAll();
    
    // Suscribirse a cambios en clientes
    setTimeout(() => {
      const clients = this.clientsService.clients();
      this.totalClients.set(clients.length);
    }, 300);

    // 2. Cargar total de mascotas
    this.clientsService.getMascotas().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.totalPets.set(res.data.length);
        }
      },
      error: (err) => console.error('Error loading pets count', err)
    });

    // 3. Cargar citas y calcular estadísticas de Hoy, Semana y Próximas
    forkJoin({
      recordatorios: this.clientsService.getRecordatorios().pipe(catchError(() => of({ success: false, data: [] }))),
      productos: this.clientsService.getProductos().pipe(catchError(() => of({ success: false, data: [] })))
    }).subscribe({
      next: ({ recordatorios, productos }) => {
        const prodCatalog = (productos && productos.success && Array.isArray(productos.data)) ? productos.data : [];

        if (recordatorios && recordatorios.success && recordatorios.data) {
          const clients = this.clientsService.clients();
          const todayObj = new Date();
          const todayStr = this.formatLocalDate(todayObj);

          const in7DaysObj = new Date(todayObj);
          in7DaysObj.setDate(todayObj.getDate() + 7);
          const in7DaysStr = this.formatLocalDate(in7DaysObj);

          let countToday = 0;
          let countWeek = 0;

          const items: DashboardAppointment[] = recordatorios.data.map((rec: any) => {
            const owner = clients.find((c) => c.id === rec.propietarioId);
            const rawDateStr = rec.fechaProgramada ? rec.fechaProgramada.substring(0, 10) : todayStr;
            const isToday = rawDateStr === todayStr;

            const prodName = rec.nombreProducto || 'Servicio';
            const isDesparasitante = this.checkIsDesparasitante(prodName, rec.productoId, prodCatalog);
            const servicioTipo = isDesparasitante ? 'Desparasitación' : 'Vacuna';

            if (isToday) countToday++;
            if (rawDateStr >= todayStr && rawDateStr <= in7DaysStr) countWeek++;

            return {
              id: rec.id,
              petName: this.toTitleCase(rec.nombreMascota || 'Mascota'),
              clientName: owner ? `${owner.nombres} ${owner.apellidos}` : (rec.nombrePropietario || ''),
              clientPhone: owner ? owner.celular : '76543210',
              productName: prodName,
              servicioTipo,
              rawDate: rawDateStr,
              displayDate: this.formatDateSpanish(rawDateStr),
              isToday,
              estado: rec.estado === 1 ? 'Enviado' : 'Pendiente'
            };
          });

          this.todayAppointmentsCount.set(countToday);
          this.weekAppointmentsCount.set(countWeek);

          // Filtrar las próximas citas de hoy en adelante
          const upcoming = items
            .filter((item) => item.rawDate >= todayStr)
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
            .slice(0, 5); // Primeros 5 registros

          this.upcomingAppointments.set(upcoming);
        } else {
          this.todayAppointmentsCount.set(0);
          this.weekAppointmentsCount.set(0);
          this.upcomingAppointments.set([]);
        }
      },
      error: (err) => console.error('Error loading recordatorios', err)
    });
  }

  private toTitleCase(str: string): string {
    if (!str) return '';
    return str
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatLocalDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateSpanish(dateStr: string): string {
    if (!dateStr) return '-';
    const parts = dateStr.substring(0, 10).split('-');
    if (parts.length !== 3) return dateStr;

    const day = parseInt(parts[2], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;

    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    if (monthIndex < 0 || monthIndex >= 12) return dateStr;

    return `${day} ${months[monthIndex]}`;
  }
}
