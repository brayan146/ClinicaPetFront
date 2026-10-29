import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { LucideArrowLeft, LucidePlus, LucideSend } from '@lucide/angular';

import { parseValidationErrors } from '../../../../core/utils/error-parser';
import { Raza } from '../../interfaces/client.interface';
import { ClientsService } from '../../services/clients.service';

import { ToastService } from '../../../../core/services/toast/toast.service';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';
import { parseEspecieNumber } from '../../../pets/pages/pets-list/pets-list.page';

@Component({
  selector: 'emervet-client-form-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideArrowLeft, LucidePlus, LucideSend, SearchableSelectComponent],
  template: `
    <section class="client-create-page">
      <header class="client-create-page__header">
        <a routerLink="/app/clients" class="client-create-page__back">
          <svg lucideArrowLeft aria-hidden="true"></svg>
          <span>Volver a Clientes</span>
        </a>
      </header>

      <form class="client-create-page__form" #clientForm="ngForm" (ngSubmit)="save(clientForm)">
        
        <!-- Tarjeta de Cliente (Izquierda) -->
        <article class="form-card">
          <h2>Nuevo cliente</h2>
          <div class="form-grid form-grid--client">
            <label class="field">
              <span>Nombre Completo *</span>
              <input type="text" name="clientName" [(ngModel)]="client.nombreCompleto" (blur)="client.nombreCompleto = toTitleCase(client.nombreCompleto)" placeholder="Ej. Carlos Ramirez" required minlength="3" #clientName="ngModel" />
              <span *ngIf="clientName.invalid && (clientName.dirty || clientName.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px;">
                <span *ngIf="clientName.errors?.['required']">El nombre completo es requerido.</span>
                <span *ngIf="clientName.errors?.['minlength']">Debe tener al menos 3 caracteres.</span>
              </span>
            </label>

            <label class="field">
              <span>Teléfono *</span>
              <input type="text" name="clientPhone" [(ngModel)]="client.celular" placeholder="Ej. 75369852" required pattern="^[0-9+ ]{7,15}$" #clientPhone="ngModel" />
              <span *ngIf="clientPhone.invalid && (clientPhone.dirty || clientPhone.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px;">
                <span *ngIf="clientPhone.errors?.['required']">El teléfono es requerido.</span>
                <span *ngIf="clientPhone.errors?.['pattern']">Ingrese un número válido (mínimo 7 números).</span>
              </span>
            </label>

            <label class="field">
              <span>Gmail</span>
              <input type="email" name="clientEmail" [(ngModel)]="client.correoElectronico" placeholder="correo@ejemplo.com" email #clientEmail="ngModel" />
              <span *ngIf="clientEmail.invalid && (clientEmail.dirty || clientEmail.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px;">
                Ingrese un correo electrónico válido.
              </span>
            </label>

            <label class="field">
              <span>Dirección *</span>
              <textarea name="clientAddress" [(ngModel)]="client.direccion" placeholder="Ej. Calvo #50" required minlength="5" #clientAddress="ngModel" rows="2"></textarea>
              <span *ngIf="clientAddress.invalid && (clientAddress.dirty || clientAddress.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px;">
                <span *ngIf="clientAddress.errors?.['required']">La dirección es requerida.</span>
                <span *ngIf="clientAddress.errors?.['minlength']">Debe detallar mejor la dirección (mínimo 5 caracteres).</span>
              </span>
            </label>
          </div>

          <!-- Botones de Acción dentro de la tarjeta de cliente (según el mockup) -->
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
            <button type="button" class="btn-secondary" (click)="cancel()">
              <span>Cancelar</span>
            </button>
            <button type="submit" class="btn-primary" style="background: #0f2c30; color: #ffffff;" [disabled]="clientForm.invalid">
              <span>Guardar</span>
            </button>
          </div>
        </article>

        <!-- Tarjeta de Mascota (Derecha) -->
        <article class="pet-card">
          <div class="pet-card__header" style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 12px;">
            <h2 style="margin: 0; font-size: 1.04rem; font-weight: 700; color: #162f34;">Mascota (Opcional)</h2>
          </div>

          <div class="form-grid form-grid--pet">
            <label class="field">
              <span>Nombre *</span>
              <input type="text" name="petName" [(ngModel)]="pet.nombre" (blur)="pet.nombre = toTitleCase(pet.nombre)" placeholder="Ej. Toby" [required]="!!pet.especie || !!pet.peso || !!pet.sexo || !!pet.razaId" #petName="ngModel" />
              <span *ngIf="petName.invalid && (petName.dirty || petName.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px;">
                El nombre de la mascota es requerido si se va a registrar.
              </span>
            </label>

            <label class="field">
              <span>Especie *</span>
              <select name="petSpecies" [(ngModel)]="pet.especie" (change)="onEspecieChange()" [required]="!!pet.nombre || !!pet.peso || !!pet.sexo || !!pet.razaId" #petSpecies="ngModel">
                <option value="" disabled selected>Selecciona</option>
                <option value="1">Canino</option>
                <option value="2">Felino</option>
                <option value="3">Exótico</option>
              </select>
              <span *ngIf="petSpecies.invalid && (petSpecies.dirty || petSpecies.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px;">
                La especie es requerida.
              </span>
            </label>

            <label class="field">
              <span>Raza *</span>
              <emervet-searchable-select
                name="petBreed"
                [options]="modalRazaOptions()"
                [ngModel]="pet.razaId"
                (ngModelChange)="onModalRazaChange($event)"
                placeholder="Selecciona una raza"
                #petBreed="ngModel"
                [required]="!!pet.nombre || !!pet.especie"
              ></emervet-searchable-select>
              <span *ngIf="petBreed.invalid && (petBreed.dirty || petBreed.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px;">
                La raza es requerida.
              </span>
            </label>

            <label class="field">
              <span>Peso (Kg) *</span>
              <input type="number" step="0.1" min="0.1" name="petWeight" [(ngModel)]="pet.peso" placeholder="Ej. 4.5" [required]="!!pet.nombre || !!pet.especie" #petWeight="ngModel" />
              <span *ngIf="petWeight.invalid && (petWeight.dirty || petWeight.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px;">
                <span *ngIf="petWeight.errors?.['required']">El peso es requerido.</span>
                <span *ngIf="petWeight.errors?.['min']">Debe ser mayor a 0.</span>
              </span>
            </label>

            <label class="field">
              <span>Fecha de nacimiento</span>
              <input type="date" name="petBirthDate" [(ngModel)]="pet.fechaNacimiento" />
            </label>

            <label class="field">
              <span>Sexo *</span>
              <select name="petSex" [(ngModel)]="pet.sexo" [required]="!!pet.nombre || !!pet.especie" #petSex="ngModel">
                <option value="" disabled selected>Selecciona</option>
                <option value="1">Macho</option>
                <option value="2">Hembra</option>
              </select>
              <span *ngIf="petSex.invalid && (petSex.dirty || petSex.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px;">
                El sexo es requerido.
              </span>
            </label>

            <label class="field">
              <span>Pelaje / pelo</span>
              <input type="text" name="petColor" [(ngModel)]="pet.color" placeholder="Ej. Corto" />
            </label>

            <label class="field">
              <span>Tamaño</span>
              <select name="petSize" [(ngModel)]="pet.tamanio">
                <option value="" disabled selected>Selecciona</option>
                <option value="1">Pequeño</option>
                <option value="2">Mediano</option>
                <option value="3">Grande</option>
              </select>
            </label>

            <label class="field field--full">
              <span>Detalles</span>
              <textarea name="petDetails" [(ngModel)]="pet.detalle" placeholder="Notas sobre vacunas, alergias..." rows="3"></textarea>
            </label>
          </div>
        </article>

      </form>
    </section>
  `,
  styleUrl: './client-form.page.css',
})
export class ClientFormPage implements OnInit {
  private readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected client = {
    nombreCompleto: '',
    celular: '',
    correoElectronico: '',
    direccion: '',
  };

  protected pet = {
    nombre: '',
    especie: '',
    razaId: '',
    peso: null as number | null,
    fechaNacimiento: '',
    sexo: '',
    color: '',
    tamanio: '',
    detalle: '',
  };

  protected allRazas = signal<Raza[]>([]);

  ngOnInit(): void {
    this.clientsService.getRazas().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allRazas.set(res.data);
        }
      },
      error: (err) => console.error('Error loading razas', err),
    });
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
    this.pet.razaId = razaId || '';
    if (razaId) {
      const selectedRaza = this.allRazas().find((r) => String(r.id) === String(razaId));
      if (selectedRaza && !this.pet.especie) {
        this.pet.especie = String(selectedRaza.especie);
        this.selectedEspecieForm.set(String(selectedRaza.especie));
      }
    }
  }

  protected onEspecieChange(): void {
    this.selectedEspecieForm.set(this.pet.especie);
    this.pet.razaId = '';
  }

  protected getFilteredRazas(): Raza[] {
    const selectedEspecie = Number(this.pet.especie);
    if (!selectedEspecie) return [];
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

  protected save(form?: any): void {
    if (form && form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const formattedName = this.toTitleCase(this.client.nombreCompleto);
    const parts = formattedName.split(' ');
    const nombres = parts[0] || '';
    const apellidos = parts.slice(1).join(' ') || 'Sin Apellido';

    const gmailValue = this.client.correoElectronico.trim();
    const finalEmail = gmailValue ? gmailValue : `sin-correo-${Date.now()}-${Math.floor(Math.random() * 1000)}@clinica.pet`;

    const ownerPayload = {
      nombres: nombres,
      apellidos: apellidos,
      celular: this.client.celular.trim(),
      direccion: this.client.direccion.trim(),
      correoElectronico: finalEmail
    };

    if (!ownerPayload.nombres || !ownerPayload.celular || !ownerPayload.direccion) {
      return;
    }

    // 1. Create client first
    this.clientsService.create(ownerPayload).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const ownerId = res.data.id;

          // 2. If pet name is provided, create the pet!
          if (this.pet.nombre.trim() && this.pet.especie) {
            const dateStr = this.pet.fechaNacimiento || new Date().toISOString().substring(0, 10);
            const petPayload = {
              nombre: this.toTitleCase(this.pet.nombre),
              especie: Number(this.pet.especie),
              razaId: this.pet.razaId ? Number(this.pet.razaId) : null,
              peso: this.pet.peso ? Number(this.pet.peso) : null,
              unidadPeso: 1,
              fechaNacimiento: dateStr + 'T00:00:00',
              sexo: this.pet.sexo ? Number(this.pet.sexo) : 1,
              color: this.pet.color.trim() || 'Desconocido',
              tamanio: this.pet.tamanio ? Number(this.pet.tamanio) : 2,
              detalle: this.pet.detalle.trim() || '',
              propietarioId: ownerId,
              createdBy: 'SYSTEM'
            };

            this.clientsService.createPet(petPayload).subscribe({
              next: () => {
                void this.router.navigate(['/app/clients']);
              },
              error: (err) => {
                console.error('Error creating initial pet', err);
                const errorMsg = parseValidationErrors(err);
                this.toastService.error(`Cliente creado, pero error al registrar mascota:\n${errorMsg}`);
                void this.router.navigate(['/app/clients']);
              },
            });
          } else {
            this.toastService.success('Cliente registrado exitosamente');
            void this.router.navigate(['/app/clients']);
          }
        }
      },
      error: (err) => {
        console.error('Error creating client', err);
        const errorMsg = parseValidationErrors(err);
        this.toastService.error(`No se pudo registrar el cliente:\n${errorMsg}`);
      },
    });
  }

  protected cancel(): void {
    void this.router.navigate(['/app/clients']);
  }
}