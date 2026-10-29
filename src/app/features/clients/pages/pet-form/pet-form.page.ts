import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { LucideArrowLeft, LucideSend } from '@lucide/angular';

import { Client, ClientPet, Raza } from '../../interfaces/client.interface';
import { ClientsService } from '../../services/clients.service';

import { parseValidationErrors } from '../../../../core/utils/error-parser';
import { ToastService } from '../../../../core/services/toast/toast.service';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';
import { parseEspecieNumber } from '../../../pets/pages/pets-list/pets-list.page';

@Component({
  selector: 'emervet-pet-form-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideArrowLeft, LucideSend, SearchableSelectComponent],
  template: `
    <section class="pet-form-page" *ngIf="client; else loading">
      
      <header class="page-header">
        <h1>{{ isEditing ? 'Editar Mascota' : 'Registrar Nueva Mascota' }}</h1>
      </header>

      <form #petFormRef="ngForm" (ngSubmit)="savePet(petFormRef)">
        
        <div class="form-layout">
          
          <div class="col-client">
            <article class="card">
              <h2>Propietario</h2>
              <div class="readonly-field"><span>Nombres</span><strong>{{ client.nombres }}</strong></div>
              <div class="readonly-field"><span>Apellidos</span><strong>{{ client.apellidos }}</strong></div>
              <div class="readonly-field"><span>Teléfono / Celular</span><strong>{{ client.celular }}</strong></div>
              <div class="readonly-field"><span>Dirección</span><strong>{{ client.direccion }}</strong></div>
            </article>
          </div>

          <div class="col-pet">
            <article class="card">
              <h2>Mascota</h2>
              
              <div class="inputs-grid">
                <label>
                  <span>Nombre *</span>
                  <input type="text" name="nombre" [(ngModel)]="petForm.nombre" (blur)="petForm.nombre = toTitleCase(petForm.nombre)" placeholder="Ej. Toby" required #petNameInput="ngModel" />
                  <span *ngIf="petNameInput.invalid && (petNameInput.dirty || petNameInput.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">
                    El nombre de la mascota es requerido.
                  </span>
                </label>
                
                <label>
                  <span>Especie *</span>
                  <select name="especie" [(ngModel)]="petForm.especie" (change)="onEspecieChange()" required #petSpeciesInput="ngModel">
                    <option value="" disabled selected>Selecciona</option>
                    <option value="1">Canino</option>
                    <option value="2">Felino</option>
                    <option value="3">Exótico</option>
                  </select>
                  <span *ngIf="petSpeciesInput.invalid && (petSpeciesInput.dirty || petSpeciesInput.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">
                    La especie es requerida.
                  </span>
                </label>

                <label>
                  <span>Raza *</span>
                  <emervet-searchable-select
                    name="razaId"
                    [options]="modalRazaOptions()"
                    [ngModel]="petForm.razaId"
                    (ngModelChange)="onModalRazaChange($event)"
                    placeholder="Selecciona una raza"
                    #petBreedInput="ngModel"
                    required
                  ></emervet-searchable-select>
                  <span *ngIf="petBreedInput.invalid && (petBreedInput.dirty || petBreedInput.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">
                    La raza es requerida.
                  </span>
                </label>

                <label>
                  <span>Peso (Kg) *</span>
                  <input type="number" step="0.1" min="0.1" name="peso" [(ngModel)]="petForm.peso" placeholder="Ej. 14.5" required #petWeightInput="ngModel" />
                  <span *ngIf="petWeightInput.invalid && (petWeightInput.dirty || petWeightInput.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">
                    <span *ngIf="petWeightInput.errors?.['required']">El peso es requerido.</span>
                    <span *ngIf="petWeightInput.errors?.['min']">Debe ser mayor a 0.</span>
                  </span>
                </label>
                
                <label><span>Fecha de nacimiento</span><input type="date" name="fechaNacimiento" [(ngModel)]="petForm.fechaNacimiento" /></label>
                
                <label>
                  <span>Sexo *</span>
                  <select name="sexo" [(ngModel)]="petForm.sexo" required #petSexInput="ngModel">
                    <option value="" disabled selected>Selecciona</option>
                    <option value="1">Macho</option>
                    <option value="2">Hembra</option>
                    <option value="3">Macho Castrado</option>
                    <option value="4">Hembra Esterilizada</option>
                  </select>
                  <span *ngIf="petSexInput.invalid && (petSexInput.dirty || petSexInput.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">
                    El sexo es requerido.
                  </span>
                </label>

                <label><span>Pelaje / pelo</span><input type="text" name="color" [(ngModel)]="petForm.color" placeholder="Ej. Corto" /></label>
                
                <label>
                  <span>Tamaño</span>
                  <select name="tamanio" [(ngModel)]="petForm.tamanio">
                    <option value="" disabled selected>Selecciona</option>
                    <option value="1">Pequeño</option>
                    <option value="2">Mediano</option>
                    <option value="3">Grande</option>
                  </select>
                </label>

                <label class="full-width">
                  <span>Detalles</span>
                  <textarea name="detalle" [(ngModel)]="petForm.detalle" placeholder="Notas médicas, vacunas..." rows="3"></textarea>
                </label>
              </div>

            </article>
          </div>

        </div>

        <footer class="page-footer">
          <button type="button" class="btn-secondary" (click)="goBack()">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="petFormRef.invalid">
            <span>Guardar</span>
            <svg lucideSend aria-hidden="true"></svg>
          </button>
        </footer>

      </form>

    </section>

    <ng-template #loading>
      <div class="loading-state">Cargando información...</div>
    </ng-template>
  `,
  styleUrl: './pet-form.page.css'
})
export class PetFormPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientsService = inject(ClientsService);
  private toastService = inject(ToastService);

  protected client: Client | null = null;
  protected isEditing = false;
  protected petId: string | null = null;
  protected clientId: string = '';

  protected petForm = {
    id: undefined as string | undefined,
    nombre: '',
    especie: '',
    razaId: '',
    tamanio: '',
    sexo: '',
    color: '',
    peso: null as number | null,
    detalle: '',
    fechaNacimiento: '',
    propietarioId: ''
  };

  protected allRazas = signal<Raza[]>([]);

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    const petIdParam = this.route.snapshot.paramMap.get('petId');

    // 1. Cargar catálogo de Razas
    this.clientsService.getRazas().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allRazas.set(res.data);
        }
      },
      error: (err) => console.error('Error loading razas', err)
    });

    // 2. Cargar Propietario
    if (this.clientId) {
      this.clientsService.getClientById(this.clientId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.client = res.data;
          }
        },
        error: (err) => console.error('Error loading client', err)
      });
    }

    // 3. Si viene petId, estamos editando mascota
    if (petIdParam) {
      this.isEditing = true;
      this.petId = petIdParam;
      this.clientsService.getPetById(petIdParam).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.petForm = {
              id: res.data.id,
              nombre: res.data.nombre,
              especie: String(res.data.especie),
              razaId: String(res.data.razaId || ''),
              tamanio: String(res.data.tamanio || ''),
              sexo: String(res.data.sexo),
              color: res.data.color || '',
              peso: res.data.peso || null,
              detalle: res.data.detalle || '',
              fechaNacimiento: res.data.fechaNacimiento ? res.data.fechaNacimiento.substring(0, 10) : '',
              propietarioId: res.data.propietarioId || this.clientId
            };
            this.selectedEspecieForm.set(String(res.data.especie));
          }
        },
        error: (err) => console.error('Error loading pet details', err)
      });
    }
  }

  protected readonly selectedEspecieForm = signal('');

  protected readonly modalRazaOptions = computed<SelectOption[]>(() => {
    const selectedEspecie = parseEspecieNumber(this.selectedEspecieForm());
    let razas = this.allRazas();
    if (selectedEspecie > 0) {
      razas = razas.filter((r) => parseEspecieNumber(r.especie) === selectedEspecie);
    }
    return razas.map((r) => ({
      value: String(r.id),
      label: r.nombre
    }));
  });

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

  protected onEspecieChange(): void {
    this.selectedEspecieForm.set(this.petForm.especie);
    this.petForm.razaId = '';
  }

  protected getFilteredRazas(): Raza[] {
    const selectedEspecie = Number(this.petForm.especie);
    if (!selectedEspecie) return this.allRazas();
    return this.allRazas().filter((r) => r.especie === selectedEspecie);
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

  protected savePet(form?: any): void {
    if (form && form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    if (!this.clientId) return;

    const dateStr = this.petForm.fechaNacimiento || new Date().toISOString().substring(0, 10);
    const payload = {
      id: this.petForm.id,
      nombre: this.toTitleCase(this.petForm.nombre),
      especie: Number(this.petForm.especie),
      tamanio: this.petForm.tamanio ? Number(this.petForm.tamanio) : 2,
      sexo: Number(this.petForm.sexo),
      color: this.petForm.color.trim() || 'Desconocido',
      peso: this.petForm.peso ? Number(this.petForm.peso) : null,
      unidadPeso: 1,
      detalle: this.petForm.detalle.trim(),
      fechaNacimiento: dateStr + 'T00:00:00',
      propietarioId: this.clientId,
      razaId: this.petForm.razaId ? Number(this.petForm.razaId) : null,
      createdBy: 'SYSTEM'
    };

    if (this.isEditing && this.petId) {
      this.clientsService.updatePet(this.petId, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Mascota actualizada exitosamente');
            this.goBack();
          }
        },
        error: (err) => {
          console.error('Error updating pet', err);
          const errorMsg = parseValidationErrors(err);
          this.toastService.error(`No se pudo actualizar la mascota:\n${errorMsg}`);
        }
      });
    } else {
      this.clientsService.createPet(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Mascota registrada exitosamente');
            this.goBack();
          }
        },
        error: (err) => {
          console.error('Error creating pet', err);
          const errorMsg = parseValidationErrors(err);
          this.toastService.error(`No se pudo registrar la mascota:\n${errorMsg}`);
        }
      });
    }
  }

  protected goBack(): void {
    if (this.clientId) {
      void this.router.navigate(['/app/clients', this.clientId]);
    } else {
      void this.router.navigate(['/app/clients']);
    }
  }
}