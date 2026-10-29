import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { LucidePencil, LucidePlus, LucideTrash2, LucideArrowLeft, LucideSend, LucideFilter, LucideRotateCcw } from '@lucide/angular';

import { Pet } from '../../interfaces/pet.interface';
import { Raza } from '../../../clients/interfaces/client.interface';
import { PetsService } from '../../services/pets.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { parseValidationErrors } from '../../../../core/utils/error-parser';
import { ToastService } from '../../../../core/services/toast/toast.service';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';

export function parseEspecieNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const num = Number(val);
  if (!isNaN(num) && num > 0) return num;
  const str = String(val).toLowerCase().trim();
  if (str.includes('canin') || str.includes('perr') || str.includes('dog')) return 1;
  if (str.includes('felin') || str.includes('gat') || str.includes('cat')) return 2;
  if (str.includes('exotic') || str.includes('exótic')) return 3;
  return 0;
}

@Component({
  selector: 'emervet-pets-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucidePencil,
    LucidePlus,
    LucideTrash2,
    LucideArrowLeft,
    LucideSend,
    LucideFilter,
    LucideRotateCcw,
    SearchableSelectComponent
  ],
  template: `
    <section class="pets-page">
      <header class="pets-page__header">
        <h1>Mascotas</h1>
        <button type="button" class="btn-primary" (click)="openNewPetModal()">
          <svg lucidePlus aria-hidden="true"></svg>
          <span>Nueva Mascota</span>
        </button>
      </header>

      <!-- BARRA DE FILTROS AVANZADOS -->
      <section class="pets-toolbar">
        <div class="pets-toolbar__search">
          <input
            type="search"
            placeholder="Buscar por nombre..."
            [ngModel]="query()"
            (ngModelChange)="onQueryChange($event)"
          />
        </div>

        <div class="pets-toolbar__filters">
          <select [ngModel]="filterEspecie()" (ngModelChange)="onEspecieFilterChange($event)">
            <option value="">Todas las especies</option>
            <option value="1">Canino</option>
            <option value="2">Felino</option>
            <option value="3">Exótico</option>
          </select>

          <select [ngModel]="filterSexo()" (ngModelChange)="onSexoFilterChange($event)">
            <option value="">Todos los sexos</option>
            <option value="1">Macho</option>
            <option value="2">Hembra</option>
            <option value="3">Macho Castrado</option>
            <option value="4">Hembra Esterilizada</option>
          </select>

          <div class="pets-toolbar__filter-raza">
            <emervet-searchable-select
              [options]="filterRazaOptions()"
              [ngModel]="filterRazaId()"
              (ngModelChange)="onRazaFilterChange($event)"
              placeholder="Todas las razas"
            ></emervet-searchable-select>
          </div>

          <button
            type="button"
            class="btn-reset-filters"
            (click)="resetFilters()"
            title="Limpiar todos los filtros y ordenamiento"
          >
            <svg lucideRotateCcw aria-hidden="true"></svg>
            <span>Limpiar filtros</span>
          </button>
        </div>
      </section>

      <section class="pets-table">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th
                class="th-sortable"
                [class.th-sortable--active]="sortField() === 'especie'"
                (click)="setSort('especie')"
              >
                Especie
                <span class="sort-icon">{{ sortField() === 'especie' ? (sortDir() === 'asc' ? '▲' : '▼') : '⇅' }}</span>
              </th>
              <th
                class="th-sortable"
                [class.th-sortable--active]="sortField() === 'raza'"
                (click)="setSort('raza')"
              >
                Raza
                <span class="sort-icon">{{ sortField() === 'raza' ? (sortDir() === 'asc' ? '▲' : '▼') : '⇅' }}</span>
              </th>
              <th>Sexo</th>
              <th>Tamaño</th>
              <th>Propietario</th>
              <th class="actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pet of paginatedPets()" class="pet-row">
              <td>
                <span class="pet-name-link" (click)="openHistory(pet)" title="Ver historial clínico de {{ pet.nombre }}">
                  {{ pet.nombre }}
                </span>
              </td>
              <td>{{ getEspecieLabel(pet.especie) }}</td>
              <td>{{ razasMap[pet.razaId || 0] || 'Desconocida' }}</td>
              <td>{{ getSexoLabel(pet.sexo) }}</td>
              <td>{{ getTamanioLabel(pet.tamanio) }}</td>
              <td>{{ getPropietarioName(pet.propietarioId) }}</td>
              <td class="actions">
                <button type="button" class="icon-btn" (click)="openEditPetModal(pet)" title="Editar mascota" aria-label="Editar mascota">
                  <svg lucidePencil aria-hidden="true"></svg>
                </button>
                
                <button type="button" class="icon-btn icon-btn--danger" (click)="confirmRemove(pet)" title="Eliminar mascota" aria-label="Eliminar mascota">
                  <svg lucideTrash2 aria-hidden="true"></svg>
                </button>
              </td>
            </tr>
            <tr *ngIf="paginatedPets().length === 0">
              <td class="empty" colspan="7">No se encontraron mascotas con los filtros seleccionados.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Controles de paginación para mascotas -->
      <footer class="pets-pagination" *ngIf="totalPages() > 1">
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

      <!-- MODAL PARA REGISTRAR / EDITAR MASCOTA -->
      <div class="modal-overlay" *ngIf="showPetForm" (click)="closePetModal()">
        <div class="modal-container modal-container--form" (click)="$event.stopPropagation()">
          
          <div class="modal-header">
            <h2 class="modal-title">
              {{ editingPetId !== null ? 'Editar Mascota' : 'Registrar Nueva Mascota' }}
            </h2>
            <button type="button" class="modal-close-btn" (click)="closePetModal()">×</button>
          </div>

          <form class="pet-create-form" #modalForm="ngForm" (ngSubmit)="savePetModal(modalForm)">
            <div class="pet-create-form__grid">
              
              <label>
                <span>Nombre *</span>
                <input type="text" name="petName" [(ngModel)]="petForm.nombre" (blur)="petForm.nombre = toTitleCase(petForm.nombre)" placeholder="Ej. Toby" required #modalName="ngModel" />
                <span *ngIf="modalName.invalid && (modalName.dirty || modalName.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">El nombre es requerido.</span>
              </label>
              
              <label>
                <span>Propietario *</span>
                <emervet-searchable-select
                  name="propietarioId"
                  [options]="propietarioOptions()"
                  [(ngModel)]="petForm.propietarioId"
                  placeholder="Seleccione propietario"
                  #modalOwner="ngModel"
                  required
                ></emervet-searchable-select>
                <span *ngIf="modalOwner.invalid && (modalOwner.dirty || modalOwner.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">El propietario es requerido.</span>
              </label>

              <label>
                <span>Especie *</span>
                <select name="petSpecies" [(ngModel)]="petForm.especie" (change)="onEspecieChange()" required #modalSpecies="ngModel">
                  <option value="" disabled selected>Selecciona una especie</option>
                  <option value="1">Canino</option>
                  <option value="2">Felino</option>
                  <option value="3">Exótico</option>
                </select>
                <span *ngIf="modalSpecies.invalid && (modalSpecies.dirty || modalSpecies.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">La especie es requerida.</span>
              </label>

              <label>
                <span>Raza *</span>
                <emervet-searchable-select
                  name="petBreed"
                  [options]="modalRazaOptions()"
                  [ngModel]="petForm.razaId"
                  (ngModelChange)="onModalRazaChange($event)"
                  placeholder="Selecciona una raza"
                  #modalBreed="ngModel"
                  required
                ></emervet-searchable-select>
                <span *ngIf="modalBreed.invalid && (modalBreed.dirty || modalBreed.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">La raza es requerida.</span>
              </label>
              
              <label>
                <span>Tamaño *</span>
                <select name="petSize" [(ngModel)]="petForm.tamanio" required #modalSize="ngModel">
                  <option value="" disabled selected>Seleccione</option>
                  <option value="1">Pequeño</option>
                  <option value="2">Mediano</option>
                  <option value="3">Grande</option>
                </select>
                <span *ngIf="modalSize.invalid && (modalSize.dirty || modalSize.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">El tamaño es requerido.</span>
              </label>
              
              <label>
                <span>Sexo *</span>
                <select name="petSex" [(ngModel)]="petForm.sexo" required #modalSex="ngModel">
                  <option value="" disabled selected>Seleccione el sexo</option>
                  <option value="1">Macho</option>
                  <option value="2">Hembra</option>
                  <option value="3">Macho Castrado</option>
                  <option value="4">Hembra Esterilizada</option>
                </select>
                <span *ngIf="modalSex.invalid && (modalSex.dirty || modalSex.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">El sexo es requerido.</span>
              </label>

              <label>
                <span>Color / Pelaje *</span>
                <input type="text" name="petColor" [(ngModel)]="petForm.color" placeholder="Ej. Marrón" required #modalColor="ngModel" />
                <span *ngIf="modalColor.invalid && (modalColor.dirty || modalColor.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">El color es requerido.</span>
              </label>

              <label>
                <span>Fecha de nacimiento *</span>
                <input type="date" name="petBirthDate" [(ngModel)]="petForm.fechaNacimiento" required #modalDate="ngModel" />
                <span *ngIf="modalDate.invalid && (modalDate.dirty || modalDate.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">La fecha es requerida.</span>
              </label>

              <label>
                <span>Peso (Kg) *</span>
                <input type="number" step="0.1" min="0.1" name="petWeight" [(ngModel)]="petForm.peso" placeholder="Ej. 14.5" required #modalWeight="ngModel" />
                <span *ngIf="modalWeight.invalid && (modalWeight.dirty || modalWeight.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">
                  <span *ngIf="modalWeight.errors?.['required']">El peso es requerido.</span>
                  <span *ngIf="modalWeight.errors?.['min']">Debe ser mayor a 0.</span>
                </span>
              </label>

              <label style="grid-column: 1 / -1;">
                <span>Detalles</span>
                <textarea name="petDetails" [(ngModel)]="petForm.detalle" placeholder="Alergias, vacunas faltantes..." rows="2"></textarea>
              </label>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="closePetModal()">
                <svg lucideArrowLeft aria-hidden="true"></svg>
                <span>Cancelar</span>
              </button>

              <button type="submit" class="btn-primary" [disabled]="modalForm.invalid">
                <span>{{ editingPetId !== null ? 'Actualizar mascota' : 'Guardar mascota' }}</span>
                <svg lucideSend aria-hidden="true"></svg>
              </button>
            </div>
          </form>

        </div>
      </div>

      <!-- MODAL CONFIRMAR ELIMINACIÓN -->
      <div class="modal-overlay" *ngIf="petToDelete" (click)="cancelRemove()">
        <div class="modal-container modal-container--confirm" (click)="$event.stopPropagation()">
          
          <div class="modal-icon">
            <svg lucideTrash2 aria-hidden="true"></svg>
          </div>

          <h2 class="modal-title">¿Deseas eliminar esta mascota?</h2>
          <p class="modal-subtitle">Eliminarás a <strong>{{ petToDelete.nombre }}</strong> de forma permanente.</p>

          <div class="modal-buttons">
            <button type="button" class="btn-cancel" (click)="cancelRemove()">Cancelar</button>
            <button type="button" class="btn-confirm" (click)="executeRemove()">Eliminar</button>
          </div>

        </div>
      </div>

    </section>
  `,
  styleUrl: './pets-list.page.css',
})
export class PetsListPage implements OnInit {
  private readonly petsService = inject(PetsService);
  private readonly clientsService = inject(ClientsService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly query = signal('');
  protected readonly filterEspecie = signal('');
  protected readonly filterSexo = signal('');
  protected readonly filterRazaId = signal('');
  protected readonly selectedEspecieForm = signal('');

  protected readonly sortField = signal<'especie' | 'raza' | null>(null);
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected readonly filteredPets = computed(() => {
    let base = this.petsService.search(this.query());

    const especie = this.filterEspecie();
    if (especie) {
      base = base.filter((p) => String(p.especie) === especie);
    }

    const sexo = this.filterSexo();
    if (sexo) {
      base = base.filter((p) => String(p.sexo) === sexo);
    }

    const razaId = this.filterRazaId();
    if (razaId) {
      base = base.filter((p) => String(p.razaId) === razaId);
    }

    const field = this.sortField();
    if (!field) return base;

    const dir = this.sortDir() === 'asc' ? 1 : -1;

    return [...base].sort((a, b) => {
      let valA: string;
      let valB: string;

      if (field === 'especie') {
        valA = this.getEspecieLabel(a.especie);
        valB = this.getEspecieLabel(b.especie);
      } else {
        valA = this.razasMap[a.razaId ?? 0] || 'Desconocida';
        valB = this.razasMap[b.razaId ?? 0] || 'Desconocida';
      }

      return valA.localeCompare(valB, 'es') * dir;
    });
  });

  protected readonly clients = computed(() => this.clientsService.clients());
  protected readonly allRazas = signal<Raza[]>([]);

  // Opción formateada para searchable select de Propietario
  protected readonly propietarioOptions = computed<SelectOption[]>(() => {
    return this.clients().map((c) => ({
      value: c.id,
      label: `${c.nombres} ${c.apellidos}`,
      sublabel: c.celular ? `Tel: ${c.celular}` : undefined
    }));
  });

  // Opción formateada para searchable select de Raza en Modal
  protected readonly modalRazaOptions = computed<SelectOption[]>(() => {
    const selectedEspecie = parseEspecieNumber(this.selectedEspecieForm());
    let razas = this.allRazas();
    if (selectedEspecie > 0) {
      razas = razas.filter((r) => parseEspecieNumber(r.especie) === selectedEspecie);
    }
    return razas.map((r) => ({
      value: String(r.id),
      label: r.nombre,
      sublabel: this.getEspecieLabel(parseEspecieNumber(r.especie))
    }));
  });

  // Opción formateada para searchable select de Filtro de Raza
  protected readonly filterRazaOptions = computed<SelectOption[]>(() => {
    const selectedEspecie = parseEspecieNumber(this.filterEspecie());
    let razas = this.allRazas();
    if (selectedEspecie > 0) {
      razas = razas.filter((r) => parseEspecieNumber(r.especie) === selectedEspecie);
    }
    return razas.map((r) => ({
      value: String(r.id),
      label: r.nombre,
      sublabel: this.getEspecieLabel(parseEspecieNumber(r.especie))
    }));
  });

  // Estado para paginación
  protected readonly pageSize = signal(8);
  protected readonly currentPage = signal(1);

  // Computed para total de páginas
  protected readonly totalPages = computed(() => {
    return Math.ceil(this.filteredPets().length / this.pageSize());
  });

  // Computed para mascotas paginadas
  protected readonly paginatedPets = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.filteredPets().slice(startIndex, startIndex + this.pageSize());
  });

  // --- ESTADOS PARA MODALES ---
  protected petToDelete: Pet | null = null;
  protected showPetForm = false;
  protected editingPetId: string | null = null;
  protected petForm = {
    id: undefined as string | undefined,
    nombre: '',
    propietarioId: '',
    especie: '',
    razaId: '',
    tamanio: '',
    sexo: '',
    color: '',
    peso: null as number | null,
    detalle: '',
    fechaNacimiento: ''
  };

  protected razasMap: Record<number, string> = {};

  ngOnInit(): void {
    this.petsService.loadAll();
    this.clientsService.loadAll();
    this.loadRazas();
  }

  protected openHistory(pet: Pet): void {
    void this.router.navigate(['/app/clinical-history', pet.id]);
  }

  private loadRazas(): void {
    this.clientsService.getRazas().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allRazas.set(res.data);
          const map: Record<number, string> = {};
          res.data.forEach((r) => {
            map[r.id] = r.nombre;
          });
          this.razasMap = map;
        }
      },
      error: (err) => console.error('Error loading razas', err)
    });
  }

  protected onQueryChange(value: string): void {
    this.query.set(value);
    this.currentPage.set(1);
  }

  protected onEspecieFilterChange(value: string): void {
    this.filterEspecie.set(value);
    this.filterRazaId.set(''); // reset raza filter if specie changes
    this.currentPage.set(1);
  }

  protected onSexoFilterChange(value: string): void {
    this.filterSexo.set(value);
    this.currentPage.set(1);
  }

  protected onRazaFilterChange(value: string): void {
    this.filterRazaId.set(value);
    this.currentPage.set(1);
  }

  protected resetFilters(): void {
    this.query.set('');
    this.filterEspecie.set('');
    this.filterSexo.set('');
    this.filterRazaId.set('');
    this.sortField.set(null);
    this.sortDir.set('asc');
    this.currentPage.set(1);
    this.toastService.info('Filtros y ordenamiento restablecidos.');
  }

  protected hasActiveFilters(): boolean {
    return !!(this.query() || this.filterEspecie() || this.filterSexo() || this.filterRazaId() || this.sortField());
  }

  protected setSort(field: 'especie' | 'raza'): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.currentPage.set(1);
  }

  protected setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  protected getEspecieLabel(val: number): string {
    if (val === 1) return 'Canino';
    if (val === 2) return 'Felino';
    return 'Exótico';
  }

  protected getSexoLabel(val: number): string {
    const map: Record<number, string> = {
      1: 'Macho',
      2: 'Hembra',
      3: 'Macho Castrado',
      4: 'Hembra Esterilizada'
    };
    return map[val] || '-';
  }

  protected getTamanioLabel(val: number): string {
    const map: Record<number, string> = {
      1: 'Pequeño',
      2: 'Mediano',
      3: 'Grande'
    };
    return map[val] || '-';
  }

  protected getPropietarioName(id: string): string {
    const owner = this.clients().find(c => c.id === id);
    return owner ? `${owner.nombres} ${owner.apellidos}` : 'Cargando...';
  }

  protected onEspecieChange(): void {
    this.selectedEspecieForm.set(this.petForm.especie);
    this.petForm.razaId = '';
  }

  protected onModalRazaChange(razaId: string): void {
    this.petForm.razaId = razaId || '';
    if (razaId) {
      const selectedRaza = this.allRazas().find((r) => String(r.id) === String(razaId));
      if (selectedRaza && !this.petForm.especie) {
        this.petForm.especie = String(selectedRaza.especie);
        this.selectedEspecieForm.set(String(selectedRaza.especie));
      }
    }
  }

  // ==========================================
  // LÓGICA MODAL: CREAR / EDITAR
  // ==========================================

  protected openNewPetModal(): void {
    this.editingPetId = null;
    this.petForm = {
      id: undefined,
      nombre: '',
      propietarioId: '',
      especie: '',
      razaId: '',
      tamanio: '',
      sexo: '',
      color: '',
      peso: null,
      detalle: '',
      fechaNacimiento: ''
    };
    this.selectedEspecieForm.set('');
    this.showPetForm = true;
  }

  protected openEditPetModal(pet: Pet): void {
    this.editingPetId = pet.id;
    this.petForm = {
      id: pet.id,
      nombre: pet.nombre,
      propietarioId: pet.propietarioId,
      especie: String(pet.especie),
      razaId: String(pet.razaId || ''),
      tamanio: String(pet.tamanio),
      sexo: String(pet.sexo),
      color: pet.color || '',
      peso: (pet as any).peso || null,
      detalle: (pet as any).detalle || '',
      fechaNacimiento: pet.fechaNacimiento ? pet.fechaNacimiento.substring(0, 10) : ''
    };
    this.selectedEspecieForm.set(String(pet.especie));
    this.showPetForm = true;
  }

  protected closePetModal(): void {
    this.showPetForm = false;
    this.editingPetId = null;
  }

  protected toTitleCase(str: string): string {
    if (!str) return '';
    return str
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  protected savePetModal(form?: any): void {
    if (form && form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    const dateStr = this.petForm.fechaNacimiento || new Date().toISOString().substring(0, 10);
    const payload = {
      id: this.editingPetId || undefined,
      nombre: this.toTitleCase(this.petForm.nombre),
      especie: Number(this.petForm.especie),
      tamanio: Number(this.petForm.tamanio),
      sexo: Number(this.petForm.sexo),
      color: this.petForm.color.trim(),
      peso: this.petForm.peso ? Number(this.petForm.peso) : null,
      unidadPeso: 1,
      detalle: this.petForm.detalle.trim(),
      fechaNacimiento: dateStr + 'T00:00:00',
      propietarioId: this.petForm.propietarioId,
      razaId: this.petForm.razaId ? Number(this.petForm.razaId) : null,
      createdBy: 'SYSTEM'
    };

    if (!payload.nombre || !payload.especie || !payload.razaId || !payload.tamanio || !payload.sexo || !payload.color || !payload.fechaNacimiento || !payload.propietarioId) {
      this.toastService.error('Por favor completa todos los campos requeridos, incluida la raza.');
      return;
    }

    if (this.editingPetId !== null) {
      this.petsService.update(this.editingPetId, payload as any).subscribe({
        next: () => {
          this.toastService.success('Mascota actualizada exitosamente');
          this.closePetModal();
        },
        error: (err) => {
          console.error('Error updating pet', err);
          const errorMsg = parseValidationErrors(err);
          this.toastService.error(`No se pudo actualizar la mascota:\n${errorMsg}`);
        }
      });
    } else {
      this.petsService.create(payload as any).subscribe({
        next: () => {
          this.toastService.success('Mascota registrada exitosamente');
          this.closePetModal();
        },
        error: (err) => {
          console.error('Error creating pet', err);
          const errorMsg = parseValidationErrors(err);
          this.toastService.error(`No se pudo registrar la mascota:\n${errorMsg}`);
        }
      });
    }
  }

  // ==========================================
  // LÓGICA MODAL: ELIMINAR
  // ==========================================

  protected confirmRemove(pet: Pet): void {
    this.petToDelete = pet;
  }

  protected cancelRemove(): void {
    this.petToDelete = null;
  }

  protected executeRemove(): void {
    if (!this.petToDelete) return;
    const petName = this.petToDelete.nombre;
    const petId = this.petToDelete.id;

    this.petsService.delete(petId).subscribe({
      next: () => {
        this.toastService.success(`Mascota ${petName} eliminada exitosamente.`);
        this.petToDelete = null;
      },
      error: (err) => {
        console.error('Error deleting pet', err);
        this.toastService.error(`No se pudo eliminar la mascota ${petName}.`);
        this.petToDelete = null;
      }
    });
  }
}
