import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideRotateCcw } from '@lucide/angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ClientsService } from '../../../clients/services/clients.service';
import { ToastService } from '../../../../core/services/toast/toast.service';

export interface AppointmentItem {
  id: string;
  clientName: string;
  clientPhone: string;
  petName: string;
  servicioTipo: 'Vacuna' | 'Desparasitación';
  productoNombre: string;
  fechaProximaDisplay: string;
  rawDate: string;
  estado: 'Pendiente' | 'Enviado';
}

function removeAccents(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

@Component({
  selector: 'emervet-clinical-history-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideRotateCcw],
  template: `
    <section class="citas-page">
      <!-- HEADER -->
      <header class="citas-page__header">
        <h1>Citas</h1>
      </header>

      <!-- BARRA DE HERRAMIENTAS Y FILTROS -->
      <div class="citas-toolbar">
        <div class="citas-toolbar__top">
          <div class="citas-search">
            <input
              type="search"
              placeholder="Buscar por cliente, mascota o teléfono..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            />
          </div>

          <!-- Leyenda explicativa de colores -->
          <div class="citas-legend">
            <span class="legend-chip legend-chip--vacuna" title="Servicios de vacunas se muestran en color azul">
              <span class="legend-dot"></span>
              <span>Azul: Vacunas</span>
            </span>
            <span class="legend-chip legend-chip--desparasitacion" title="Servicios de desparasitante se muestran en color morado">
              <span class="legend-dot"></span>
              <span>Morado: Desparasitantes</span>
            </span>
          </div>
        </div>

        <div class="citas-toolbar__filters">
          <!-- Filtro Rango de Fechas -->
          <div class="filter-group filter-group--dates">
            <label class="filter-label">Desde</label>
            <input
              type="date"
              class="filter-date-input"
              [ngModel]="startDate()"
              (ngModelChange)="startDate.set($event)"
            />
            <label class="filter-label">Hasta</label>
            <input
              type="date"
              class="filter-date-input"
              [ngModel]="endDate()"
              (ngModelChange)="endDate.set($event)"
            />
          </div>

          <!-- Filtro Estado (Todos / Pendiente / Enviado) -->
          <div class="filter-group filter-group--status">
            <label class="filter-label">Estado</label>
            <select
              class="filter-select"
              [ngModel]="statusFilter()"
              (ngModelChange)="statusFilter.set($event)"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Enviado">Enviado</option>
            </select>
          </div>

          <div class="citas-filter-future">
            <label class="toggle-future-label">
              <input
                type="checkbox"
                [ngModel]="onlyFuture()"
                (ngModelChange)="onlyFuture.set($event)"
              />
              <span>Sólo citas futuras</span>
            </label>
          </div>

          <button
            type="button"
            class="btn-reset-filters"
            (click)="clearFilters()"
            title="Limpiar todos los filtros"
          >
            <svg lucideRotateCcw aria-hidden="true"></svg>
            <span>Limpiar filtros</span>
          </button>
        </div>
      </div>

      <!-- TABLA DE CITAS -->
      <section class="citas-container">
        <table class="citas-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Tipo de Servicio</th>
              <th>Próxima Fecha</th>
              <th>Estado</th>
              <th class="actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let apt of filteredAppointments()">
              <td>
                <span class="client-name">{{ apt.clientName }}</span>
                <span class="pet-sublabel">Mascota: {{ apt.petName }}</span>
              </td>
              <td>{{(apt.clientPhone) }}</td>
              <td>
                <span
                  class="service-badge"
                  [class.service-badge--vacuna]="apt.servicioTipo === 'Vacuna'"
                  [class.service-badge--desparasitacion]="apt.servicioTipo === 'Desparasitación'"
                >
                  {{ apt.productoNombre }}
                </span>
              </td>
              <td>{{ formatDateSpanish(apt.fechaProximaDisplay) }}</td>
              <td>
                <span
                  class="status-badge"
                  [class.status-badge--pendiente]="apt.estado === 'Pendiente'"
                  [class.status-badge--enviado]="apt.estado === 'Enviado'"
                >
                  <ng-container *ngIf="apt.estado === 'Pendiente'">
                    <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Pendiente</span>
                  </ng-container>
                  <ng-container *ngIf="apt.estado === 'Enviado'">
                    <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span>Enviado</span>
                  </ng-container>
                </span>
              </td>
              <td class="actions-col">
                <a
                  [href]="getWhatsappLink(apt)"
                  target="_blank"
                  class="btn-whatsapp"
                  (click)="markAsSent(apt)"
                  title="Enviar recordatorio rápido por WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>

                </a>
              </td>
            </tr>
            <tr *ngIf="filteredAppointments().length === 0">
              <td colspan="6" class="empty-table-msg">
                No se encontraron citas {{ onlyFuture() ? 'futuras' : 'vigentes' }} registradas.
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  `,
  styleUrl: './clinical-history-list.page.css',
})
export class ClinicalHistoryListPage implements OnInit {
  private readonly clientsService = inject(ClientsService);
  private readonly toastService = inject(ToastService);

  protected readonly searchQuery = signal('');
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly statusFilter = signal('');
  protected readonly onlyFuture = signal(true);
  protected readonly appointments = signal<AppointmentItem[]>([]);

  protected getTodayStr(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.statusFilter.set('');
    this.onlyFuture.set(true);
  }

  protected readonly filteredAppointments = computed(() => {
    let list = this.appointments();
    const todayStr = this.getTodayStr();

    // Filtro por Estado (Pendiente, Enviado o Todos)
    const status = this.statusFilter();
    if (status) {
      list = list.filter((a) => a.estado === status);
    }

    // Filtro por Rango de Fechas (Desde - Hasta)
    const start = this.startDate();
    const end = this.endDate();
    if (start) {
      list = list.filter((a) => a.rawDate >= start);
    }
    if (end) {
      list = list.filter((a) => a.rawDate <= end);
    }

    // Si la opción sólo futuras está activa y no hay un rango explícito
    if (this.onlyFuture() && !start && !end) {
      list = list.filter((a) => a.rawDate >= todayStr);
    }

    const query = removeAccents(this.searchQuery().trim());
    if (query) {
      list = list.filter(
        (a) =>
          removeAccents(a.clientName).includes(query) ||
          removeAccents(a.clientPhone).includes(query) ||
          removeAccents(a.petName).includes(query) ||
          removeAccents(a.productoNombre).includes(query)
      );
    }

    return [...list].sort((a, b) => {
      const timeA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const timeB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return timeA - timeB;
    });
  });

  ngOnInit(): void {
    this.loadAppointments();
  }

  private getSentIdsFromStorage(): Set<string> {
    try {
      const stored = localStorage.getItem('sent_recordatorios_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }

  private saveSentIdToStorage(id: string): void {
    try {
      const ids = this.getSentIdsFromStorage();
      ids.add(id);
      localStorage.setItem('sent_recordatorios_ids', JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.error(e);
    }
  }

  protected toTitleCase(str: string): string {
    if (!str) return '';
    return str
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  protected formatPhone(phone: string): string {
    if (!phone) return '+591 -';
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('591')) {
      return `+591 ${clean.substring(3)}`;
    }
    return `+591 ${clean}`;
  }

  protected formatDateSpanish(dateStr: string): string {
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

    return `${day} de ${months[monthIndex]}`;
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

  private loadAppointments(): void {
    this.clientsService.loadAll();
    const sentIds = this.getSentIdsFromStorage();

    forkJoin({
      recordatorios: this.clientsService.getRecordatorios().pipe(catchError(() => of({ success: false, data: [] }))),
      productos: this.clientsService.getProductos().pipe(catchError(() => of({ success: false, data: [] })))
    }).subscribe(({ recordatorios, productos }) => {
      const prodCatalog = (productos && productos.success && Array.isArray(productos.data)) ? productos.data : [];

      if (recordatorios && recordatorios.success && recordatorios.data) {
        const clients = this.clientsService.clients();
        const items: AppointmentItem[] = recordatorios.data.map((rec: any) => {
          const owner = clients.find((c) => c.id === rec.propietarioId);
          const prodName = rec.nombreProducto || 'Servicio';
          const isDesparasitante = this.checkIsDesparasitante(prodName, rec.productoId, prodCatalog);

          const validDate = (rec.fechaProgramada && !rec.fechaProgramada.startsWith('0001'))
            ? rec.fechaProgramada
            : (rec.fechaAplicacion && !rec.fechaAplicacion.startsWith('0001') ? rec.fechaAplicacion : '');
          const rawDateStr = validDate ? validDate.substring(0, 10) : this.getTodayStr();
          const isEnviado = rec.estado === 1 || rec.estado === 'Enviado' || rec.estado === '1' || sentIds.has(rec.id);

          return {
            id: rec.id,
            clientName: this.toTitleCase(rec.nombrePropietario || (owner ? `${owner.nombres} ${owner.apellidos}` : 'Cliente')),
            clientPhone: owner ? owner.celular : '',
            petName: rec.nombreMascota || 'Mascota',
            servicioTipo: isDesparasitante ? 'Desparasitación' : 'Vacuna',
            productoNombre: prodName,
            fechaProximaDisplay: rawDateStr,
            rawDate: rawDateStr,
            estado: isEnviado ? 'Enviado' : 'Pendiente'
          };
        });
        this.appointments.set(items);
      } else {
        this.appointments.set([]);
      }
    });
  }

  protected getWhatsappLink(apt: AppointmentItem): string {
    const cleanNumber = (apt.clientPhone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanNumber.startsWith('591') ? cleanNumber : `591${cleanNumber}`;
    const dateFormatted = this.formatDateSpanish(apt.fechaProximaDisplay);

    const tipoServicioText = apt.servicioTipo || 'Vacuna';
    const iconoServicio = tipoServicioText === 'Desparasitación' ? '💊' : '💉';

    const message =
      `*RECORDATORIO VETERINARIA CLÍNICA PET 💙🐶*\n\n` +
      `Hola, *${apt.clientName}*.\n\n` +
      `Le recordamos que *${apt.petName}* tiene una cita programada.\n\n` +
      `🐶 *Mascota:* ${apt.petName}\n` +
      `📅 *Fecha:* ${dateFormatted}\n` +
      `${iconoServicio} *Servicio:* ${tipoServicioText}\n\n` +
      `Si necesita reprogramar la cita o tiene alguna consulta, responda este mensaje.\n\n` +
      `*Gracias por confiar en Clínica Pet.* 💙🐾`;

    return `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
  }

  protected markAsSent(apt: AppointmentItem): void {
    this.saveSentIdToStorage(apt.id);
    apt.estado = 'Enviado';

    this.clientsService.updateRecordatorio(apt.id, { estado: 1 }).subscribe({
      next: () => {
        this.toastService.success('Recordatorio guardado como ENVIADO.');
      },
      error: (err) => {
        console.error('Error al actualizar estado', err);
      }
    });
  }
}