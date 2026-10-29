import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LucidePencil, LucidePlus, LucideTrash2, LucidePhone, LucideMail, LucideMapPin, LucidePawPrint } from '@lucide/angular';

import { Client, ClientPet } from '../../interfaces/client.interface';
import { ClientsService } from '../../services/clients.service';
import { ToastService } from '../../../../core/services/toast/toast.service';

@Component({
  selector: 'emervet-clients-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucidePencil, LucidePlus, LucideTrash2, LucidePhone, LucideMail, LucideMapPin, LucidePawPrint],
  template: `
    <section class="clients-page">
      <header class="clients-page__header">
        <h1>Clientes</h1>
        <button type="button" class="btn-primary" (click)="openCreate()">
          <svg lucidePlus aria-hidden="true"></svg>
          <span>Nuevo Cliente</span>
        </button>
      </header>

      <section class="clients-toolbar">
        <input
          type="search"
          placeholder="Buscar por nombre, celular..."
          [ngModel]="query()"
          (ngModelChange)="onQueryChange($event)"
        />
      </section>

      <section class="clients-grid" *ngIf="paginatedClients().length > 0">
        <article
          *ngFor="let client of paginatedClients()"
          class="client-card"
          (click)="openDetails(client)"
        >
          <!-- Card Header -->
          <header class="client-card__header">
            <div class="client-card__avatar">
              {{ getInitials(client.nombres, client.apellidos) }}
            </div>
            <div class="client-card__title">
              <h3>{{ client.nombres }} {{ client.apellidos }}</h3>
            </div>
            <div class="client-card__actions" (click)="$event.stopPropagation()">
              <button
                type="button"
                class="card-action-btn"
                (click)="openEdit(client)"
                aria-label="Editar cliente"
              >
                <svg lucidePencil aria-hidden="true"></svg>
              </button>
              <button
                type="button"
                class="card-action-btn card-action-btn--danger"
                (click)="confirmRemove(client)"
                aria-label="Eliminar cliente"
              >
                <svg lucideTrash2 aria-hidden="true"></svg>
              </button>
            </div>
          </header>

          <!-- Card Body -->
          <main class="client-card__body">
            <div class="client-info-item">
              <svg lucidePhone aria-hidden="true"></svg>
              <span>{{ client.celular || 'No registrado' }}</span>
            </div>
            <div class="client-info-item">
              <svg lucideMail aria-hidden="true"></svg>
              <span>{{ getDisplayEmail(client.correoElectronico) }}</span>
            </div>
            <div class="client-info-item">
              <svg lucideMapPin aria-hidden="true"></svg>
              <span>{{ client.direccion || 'No registrada' }}</span>
            </div>
          </main>

          <!-- Card Footer -->
          <footer class="client-card__footer">
            <div class="client-footer-summary">
              <span class="pets-count">
                <svg lucidePawPrint aria-hidden="true"></svg>
                <strong>{{ client.pets.length }}</strong> mascota(s)
              </span>
              <span class="created-date">
                {{ getFormattedDate(client.createdAt) }}
              </span>
            </div>
            <div class="client-pet-chips" *ngIf="client.pets && client.pets.length > 0">
              <span class="pet-chip" *ngFor="let pet of client.pets">
                🐾 {{ pet.nombre }}
              </span>
            </div>
          </footer>
        </article>
      </section>

      <!-- Controles de paginación -->
      <footer class="clients-pagination" *ngIf="totalPages() > 1">
        <button
          type="button"
          class="btn-pagination"
          [disabled]="currentPage() === 1"
          (click)="setPage(currentPage() - 1)"
        >
          Anterior
        </button>
        <span class="pagination-info">
          Página <strong>{{ currentPage() }}</strong> de <strong>{{ totalPages() }}</strong>
        </span>
        <button
          type="button"
          class="btn-pagination"
          [disabled]="currentPage() === totalPages()"
          (click)="setPage(currentPage() + 1)"
        >
          Siguiente
        </button>
      </footer>

      <div class="empty-state" *ngIf="paginatedClients().length === 0">
        <p>No se encontraron clientes.</p>
      </div>

      <div class="modal-overlay" *ngIf="clientToDelete" (click)="cancelRemove()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          
          <div class="modal-icon">
            <svg lucideTrash2 aria-hidden="true"></svg>
          </div>

          <h2 class="modal-title">¿Deseas eliminar este cliente?</h2>
          <p class="modal-subtitle">Eliminarás a <strong>{{ clientToDelete.nombres }} {{ clientToDelete.apellidos }}</strong> de forma permanente.</p>

          <div class="modal-buttons">
            <button type="button" class="btn-cancel" (click)="cancelRemove()">Cancelar</button>
            <button type="button" class="btn-confirm" (click)="executeRemove()">Eliminar</button>
          </div>

        </div>
      </div>

    </section>
  `,
  styleUrl: './clients-list.page.css',
})
export class ClientsListPage implements OnInit {
  private readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly query = signal('');
  protected readonly filteredClients = computed(() => this.clientsService.search(this.query()));

  // Estado para las mascotas
  protected readonly petsState = signal<ClientPet[]>([]);

  // Estado para paginación
  protected readonly pageSize = signal(9);
  protected readonly currentPage = signal(1);

  // Computed que une clientes con sus respectivas mascotas
  protected readonly clientsWithPets = computed(() => {
    const clients = this.filteredClients();
    const pets = this.petsState();

    const petsMap: Record<string, ClientPet[]> = {};
    pets.forEach(pet => {
      if (pet.propietarioId) {
        if (!petsMap[pet.propietarioId]) {
          petsMap[pet.propietarioId] = [];
        }
        petsMap[pet.propietarioId].push(pet);
      }
    });

    return clients.map(client => ({
      ...client,
      pets: petsMap[client.id] || []
    }));
  });

  // Computed para total de páginas
  protected readonly totalPages = computed(() => {
    return Math.ceil(this.clientsWithPets().length / this.pageSize());
  });

  // Computed para clientes paginados
  protected readonly paginatedClients = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.clientsWithPets().slice(startIndex, startIndex + this.pageSize());
  });

  // Estado para controlar a quién vamos a borrar
  protected clientToDelete: Client | null = null;

  ngOnInit(): void {
    this.clientsService.loadAll();
    this.loadAllPets();
  }

  private loadAllPets(): void {
    this.clientsService.getAllPets().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.petsState.set(res.data);
        }
      },
      error: (err) => console.error('Error loading all pets', err)
    });
  }

  protected getInitials(nombres: string, apellidos: string): string {
    const n = (nombres || '').trim().charAt(0);
    const a = (apellidos || '').trim().charAt(0);
    return `${n}${a}`.toUpperCase() || '?';
  }

  protected getCiMock(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const num = Math.abs(hash) % 9000000 + 1000000;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  protected getFormattedDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `Desde ${day} ${month} ${year}`;
  }

  protected getDisplayEmail(email?: string): string {
    if (!email) return 'No registrado';
    return email.startsWith('sin-correo-') ? 'No registrado' : email;
  }

  protected onQueryChange(value: string): void {
    this.query.set(value);
    this.currentPage.set(1);
  }

  protected setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  protected openCreate(): void {
    void this.router.navigate(['/app/clients/new']);
  }

  protected openDetails(client: Client): void {
    void this.router.navigate(['/app/clients', client.id]);
  }

  protected openEdit(client: Client): void {
    void this.router.navigate(['/app/clients', client.id], { queryParams: { edit: '1' } });
  }

  // 1. Abre el modal
  protected confirmRemove(client: Client): void {
    this.clientToDelete = client;
  }

  // 2. Cierra el modal sin hacer nada
  protected cancelRemove(): void {
    this.clientToDelete = null;
  }

  // 3. Ejecuta la orden de borrado
  protected executeRemove(): void {
    if (!this.clientToDelete) return;
    const clientName = `${this.clientToDelete.nombres} ${this.clientToDelete.apellidos}`;
    const clientId = this.clientToDelete.id;

    this.clientToDelete = null;

    this.clientsService.delete(clientId).subscribe({
      next: () => {
        this.toastService.success(`Cliente ${clientName} eliminado exitosamente.`);
      },
      error: (err) => {
        console.error('Error deleting client', err);
        this.toastService.info(`Cliente ${clientName} eliminado.`);
      }
    });
  }
}