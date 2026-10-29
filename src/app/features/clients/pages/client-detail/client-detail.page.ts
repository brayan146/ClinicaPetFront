import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LucideArrowLeft, LucideFileSearch, LucidePencil, LucidePlus, LucideTrash2, LucideSend, LucideHistory, LucideUser, LucideFileText } from '@lucide/angular';

import { Client, ClientPet, Raza } from '../../interfaces/client.interface';
import { ClientsService } from '../../services/clients.service';

import { parseValidationErrors } from '../../../../core/utils/error-parser';
import { ToastService } from '../../../../core/services/toast/toast.service';

@Component({
  selector: 'emervet-client-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideArrowLeft, LucideFileSearch, LucidePencil, LucidePlus, LucideTrash2, LucideSend, LucideHistory, LucideUser, LucideFileText],
  template: `
    <section class="client-create-page" *ngIf="client; else notFound">
      <header class="client-create-page__header">
        <a routerLink="/app/clients" class="client-create-page__back">
          <svg lucideArrowLeft aria-hidden="true"></svg>
          <span>Volver a Clientes</span>
        </a>
        <button type="button" class="btn-primary" (click)="openNewPet()">
          <svg lucidePlus aria-hidden="true"></svg>
          <span>Nueva Mascota</span>
        </button>
      </header>

      <div class="client-create-page__form client-detail-page__shell">
        
        <div class="client-column">
          <ng-container *ngIf="!isEditing; else editClient">
            <article class="form-card">
              <h2>Cliente</h2>
              <div class="detail-field"><span>Nombre Completo</span><strong>{{ client.nombres }} {{ client.apellidos }}</strong></div>
              <div class="detail-field"><span>Teléfono / Celular</span><strong>{{ client.celular }}</strong></div>
              <div class="detail-field"><span>Gmail</span><strong>{{ getDisplayEmail(client.correoElectronico) }}</strong></div>
              <div class="detail-field"><span>Dirección</span><strong>{{ client.direccion }}</strong></div>
              <div class="detail-field">
                <span>Estado</span>
                <span class="status-badge" [ngClass]="{'status-badge--success': client.activo, 'status-badge--warning': !client.activo}">
                  {{ client.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              <div class="detail-field">
                <span>Fecha de creación</span>
                <strong>{{ client.createdAt ? (client.createdAt | date:'dd/MM/yyyy HH:mm') : '-' }}</strong>
              </div>
              <div class="detail-field">
                <span>Fecha de actualización</span>
                <strong>{{ client.updatedAt ? (client.updatedAt | date:'dd/MM/yyyy HH:mm') : 'Sin modificaciones' }}</strong>
              </div>
              <div style="margin-top: 1.5rem;">
                <button type="button" class="btn-primary" (click)="enableEdit()">
                  <svg lucidePencil aria-hidden="true"></svg>
                  <span>Editar Cliente</span>
                </button>
              </div>
            </article>
          </ng-container>

          <ng-template #editClient>
            <form #editClientForm="ngForm" (ngSubmit)="save(editClientForm)">
              <article class="form-card">
                <h2>Editar Cliente</h2>
                <div class="detail-form">
                  <label>
                    <span>Nombre Completo *</span>
                    <input type="text" name="nombreCompleto" [(ngModel)]="form.nombreCompleto" (blur)="form.nombreCompleto = toTitleCase(form.nombreCompleto)" required minlength="3" #editName="ngModel" />
                    <span *ngIf="editName.invalid && (editName.dirty || editName.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">
                      <span *ngIf="editName.errors?.['required']">El nombre es requerido.</span>
                      <span *ngIf="editName.errors?.['minlength']">Mínimo 3 caracteres.</span>
                    </span>
                  </label>
                  
                  <label>
                    <span>Teléfono *</span>
                    <input type="text" name="celular" [(ngModel)]="form.celular" required pattern="^[0-9+ ]{7,15}$" #editPhone="ngModel" />
                    <span *ngIf="editPhone.invalid && (editPhone.dirty || editPhone.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">
                      <span *ngIf="editPhone.errors?.['required']">El teléfono es requerido.</span>
                      <span *ngIf="editPhone.errors?.['pattern']">Ingrese un teléfono válido (mínimo 7 números).</span>
                    </span>
                  </label>
                  
                  <label>
                    <span>Gmail</span>
                    <input type="email" name="correoElectronico" [(ngModel)]="form.correoElectronico" email #editEmail="ngModel" />
                    <span *ngIf="editEmail.invalid && (editEmail.dirty || editEmail.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">
                      Ingrese un correo válido.
                    </span>
                  </label>
                  
                  <label>
                    <span>Dirección *</span>
                    <input type="text" name="direccion" [(ngModel)]="form.direccion" required minlength="5" #editAddress="ngModel" />
                    <span *ngIf="editAddress.invalid && (editAddress.dirty || editAddress.touched)" style="color: #ef4444; font-size: 11px; margin-top: 2px; display: block;">
                      <span *ngIf="editAddress.errors?.['required']">La dirección es requerida.</span>
                      <span *ngIf="editAddress.errors?.['minlength']">Mínimo 5 caracteres.</span>
                    </span>
                  </label>
                  
                  <label style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                    <input type="checkbox" name="activo" [(ngModel)]="form.activo" />
                    <span>Cliente Activo</span>
                  </label>
                </div>
              </article>
              
              <div class="form-actions form-actions--detail">
                <button type="button" class="btn-secondary" (click)="cancelEdit()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="editClientForm.invalid">
                  <span>Guardar</span>
                  <svg lucideSend aria-hidden="true"></svg>
                </button>
              </div>
            </form>
          </ng-template>
        </div>

        <div class="pets-column">
          <ng-container *ngIf="!selectedPetForDetail; else petDetailFormBlock">
            <div class="pets-column__header">
              <h2>Mascota(s)</h2>
            </div>
            
            <div class="pets-scroll-container">
              <div class="pets-grid-detail" *ngIf="petsList.length > 0">
                <article
                  class="pet-card-fancy"
                  *ngFor="let pet of petsList; let i = index"
                  (click)="openPetDetail(pet)"
                >
                  <!-- Banner con emoji/imagen y sexo -->
                  <div class="pet-card-fancy__banner">
                    <img
                      [src]="getPetImagePath(pet.especie)"
                      [alt]="getEspecieLabel(pet.especie)"
                      class="pet-card-fancy__image"
                    />
                    <span class="pet-card-fancy__gender">
                      {{ getSexoLabelShort(pet.sexo) }}
                    </span>
                  </div>

                  <!-- Contenido principal -->
                  <div class="pet-card-fancy__content">
                    <div class="pet-card-fancy__header">
                      <div class="pet-card-fancy__title">
                        <h3>{{ pet.nombre || '-' }}</h3>
                        <span class="pet-card-fancy__breed">
                          {{ razasMap[pet.razaId || 0] || 'Desconocida' }}
                        </span>
                      </div>
                      <div class="pet-action-btns" (click)="$event.stopPropagation()">
                        <button
                          type="button"
                          class="pet-action-btn pet-action-btn--edit"
                          (click)="openEditPet(pet, i)"
                          aria-label="Editar"
                        >
                          <svg lucidePencil aria-hidden="true"></svg>
                        </button>
                        <button
                          type="button"
                          class="pet-action-btn pet-action-btn--delete"
                          (click)="confirmDeletePet(pet, i)"
                          aria-label="Eliminar"
                        >
                          <svg lucideTrash2 aria-hidden="true"></svg>
                        </button>
                      </div>
                    </div>

                    <!-- Chips de info rápida -->
                    <div class="pet-card-fancy__chips">
                      <span class="pet-chip-info">{{ getPetAge(pet.fechaNacimiento) }}</span>
                      <span class="pet-chip-info">{{ pet.peso }} {{ getUnidadPesoLabel(pet.unidadPeso) }}</span>
                      <span class="pet-chip-info">{{ getTamanioLabel(pet.tamanio) }}</span>
                    </div>

                    <!-- Footer de la tarjeta de mascota -->
                    <footer class="pet-card-fancy__footer">
                      <div class="pet-card-fancy__owner">
                        <svg lucideUser aria-hidden="true"></svg>
                        <span>{{ client.nombres }} {{ client.apellidos }}</span>
                      </div>
                      <button
                        type="button"
                        class="pet-history-btn"
                        (click)="openPetHistory(pet); $event.stopPropagation()"
                        aria-label="Historial Clínico"
                      >
                        <svg lucideFileText aria-hidden="true"></svg>
                      </button>
                    </footer>
                  </div>
                </article>
              </div>

              <div *ngIf="petsList.length === 0" style="padding: 2rem; text-align: center; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1; color: #64748b;">
                No hay mascotas registradas para este propietario.
              </div>
            </div>
          </ng-container>

          <ng-template #petDetailFormBlock>
            <article class="form-card" style="margin-top: 0;">
              <h2>Mascota</h2>
              
              <div class="pet-detail-grid">
                <div class="detail-field">
                  <span>Nombre</span>
                  <strong>{{ selectedPetForDetail!.nombre || '-' }}</strong>
                </div>
                <div class="detail-field">
                  <span>Especie</span>
                  <strong>{{ getEspecieLabel(selectedPetForDetail!.especie) }}</strong>
                </div>

                <div class="detail-field">
                  <span>Raza</span>
                  <strong>{{ razasMap[selectedPetForDetail!.razaId || 0] || 'Desconocida' }}</strong>
                </div>
                <div class="detail-field">
                  <span>Edad</span>
                  <strong>{{ getPetAge(selectedPetForDetail!.fechaNacimiento) }}</strong>
                </div>

                <div class="detail-field">
                  <span>Fecha de nacimiento</span>
                  <strong>{{ selectedPetForDetail!.fechaNacimiento ? (selectedPetForDetail!.fechaNacimiento | date:'dd/MM/yyyy') : '-' }}</strong>
                </div>
                <div class="detail-field">
                  <span>Sexo</span>
                  <strong>{{ getSexoLabel(selectedPetForDetail!.sexo) }}</strong>
                </div>

                <div class="detail-field">
                  <span>Peso</span>
                  <strong>{{ selectedPetForDetail!.peso }} {{ getUnidadPesoLabel(selectedPetForDetail!.unidadPeso) }}</strong>
                </div>
                <div class="detail-field">
                  <span>Pelaje / pelo</span>
                  <strong>{{ selectedPetForDetail!.color || '-' }}</strong>
                </div>

                <div class="detail-field">
                  <span>Tamaño</span>
                  <strong>{{ getTamanioLabel(selectedPetForDetail!.tamanio) }}</strong>
                </div>
                <div class="detail-field">
                  <span>Fecha de creación</span>
                  <strong>{{ selectedPetForDetail!.createdAt ? (selectedPetForDetail!.createdAt | date:'dd/MM/yyyy HH:mm') : '-' }}</strong>
                </div>

                <div class="detail-field full-width">
                  <span>Fecha de actualización</span>
                  <strong>{{ selectedPetForDetail!.updatedAt ? (selectedPetForDetail!.updatedAt | date:'dd/MM/yyyy HH:mm') : 'Sin modificaciones' }}</strong>
                </div>

                <div class="detail-field full-width" style="flex-direction: column; align-items: flex-start; gap: 4px; border-bottom: 0;">
                  <span>Detalles</span>
                  <strong style="text-align: left; white-space: pre-wrap; font-weight: normal; margin-top: 4px;">{{ selectedPetForDetail!.detalle || '-' }}</strong>
                </div>
              </div>

              <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
                <button type="button" class="btn-cancel" (click)="closePetDetail()">
                  Cerrar
                </button>
              </div>
            </article>
          </ng-template>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="petToDelete" (click)="cancelDeletePet()">
        <div class="modal-container modal-container--confirm" (click)="$event.stopPropagation()">
          
          <div class="modal-icon">
            <svg lucideTrash2 aria-hidden="true"></svg>
          </div>

          <h2 class="modal-title">¿Deseas eliminar esta mascota?</h2>
          <p class="modal-subtitle">Eliminarás a <strong>{{ petToDelete.pet.nombre }}</strong> de forma permanente.</p>

          <div class="modal-buttons">
            <button type="button" class="btn-cancel" (click)="cancelDeletePet()">Cancelar</button>
            <button type="button" class="btn-confirm" (click)="executeDeletePet()">Eliminar</button>
          </div>

        </div>
      </div>

    </section>

    <ng-template #notFound>
      <section class="client-create-page client-detail-page--empty">
        <p>Cliente no encontrado.</p>
        <a routerLink="/app/clients" class="client-create-page__back">
          <svg lucideArrowLeft aria-hidden="true"></svg>
          <span>Volver a Clientes</span>
        </a>
      </section>
    </ng-template>
  `,
  styleUrl: './client-detail.page.css',
})
export class ClientDetailPage implements OnInit {
  private readonly clientsService = inject(ClientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected client: Client | null = null;
  protected isEditing = false;
  protected clientId: string = '';

  protected petsList: ClientPet[] = [];
  protected petToDelete: { index: number; pet: ClientPet } | null = null;

  // Estado para la mascota seleccionada para el detalle
  protected selectedPetForDetail: ClientPet | null = null;

  protected allRazas: Raza[] = [];

  protected form = { nombreCompleto: '', celular: '', correoElectronico: '', direccion: '', activo: true };
  protected razasMap: Record<number, string> = {};

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditing = this.route.snapshot.queryParamMap.get('edit') === '1';
    this.loadRazas();
    this.loadClientData();
  }

  private loadClientData(): void {
    if (!this.clientId) return;

    this.clientsService.getClientById(this.clientId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.client = res.data;
          this.form = {
            nombreCompleto: `${this.client.nombres} ${this.client.apellidos}`.trim(),
            celular: this.client.celular,
            correoElectronico: this.client.correoElectronico?.startsWith('sin-correo-') ? '' : (this.client.correoElectronico || ''),
            direccion: this.client.direccion,
            activo: this.client.activo
          };
          this.loadPets();
        }
      },
      error: (err) => {
        console.error('Error loading client details', err);
      }
    });
  }

  private loadPets(): void {
    if (!this.clientId) return;
    this.clientsService.getPetsByPropietario(this.clientId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.petsList = res.data;
        }
      },
      error: (err) => console.error('Error loading pets', err)
    });
  }

  private loadRazas(): void {
    this.clientsService.getRazas().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allRazas = res.data;
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

  protected getSexoLabelShort(val: number): string {
    switch (Number(val)) {
      case 1: return '♂ Macho';
      case 2: return '♀ Hembra';
      case 3: return '♂ Macho Castrado';
      case 4: return '♀ Hembra Esterilizada';
      default: return '-';
    }
  }

  protected getUnidadPesoLabel(val: any): string {
    const map: Record<string, string> = {
      '1': 'Kg',
      '2': 'g',
      '3': 'lb',
      'Kilogramo': 'Kg',
      'Gramo': 'g',
      'Libra': 'lb',
      'Kg': 'Kg'
    };
    return map[String(val)] || 'Kg';
  }

  protected enableEdit(): void { this.isEditing = true; }

  protected cancelEdit(): void {
    if (!this.client) return;
    this.form = {
      nombreCompleto: `${this.client.nombres} ${this.client.apellidos}`.trim(),
      celular: this.client.celular,
      correoElectronico: this.client.correoElectronico?.startsWith('sin-correo-') ? '' : (this.client.correoElectronico || ''),
      direccion: this.client.direccion,
      activo: this.client.activo
    };
    this.isEditing = false;
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
    if (!this.client) return;
    const formattedName = this.toTitleCase(this.form.nombreCompleto);
    const parts = formattedName.split(' ');
    const nombres = parts[0] || '';
    const apellidos = parts.slice(1).join(' ') || 'Sin Apellido';

    const gmailValue = this.form.correoElectronico.trim();
    const finalEmail = gmailValue ? gmailValue : `sin-correo-${Date.now()}-${Math.floor(Math.random() * 1000)}@clinica.pet`;

    const payload = {
      id: this.client.id,
      nombres: nombres,
      apellidos: apellidos,
      celular: this.form.celular.trim(),
      direccion: this.form.direccion.trim(),
      correoElectronico: finalEmail,
      activo: this.form.activo
    };
    if (!payload.nombres || !payload.celular || !payload.direccion) return;

    this.clientsService.update(this.client.id, payload).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.client = res.data;
          this.isEditing = false;
          this.toastService.success('Cliente actualizado exitosamente');
          this.clientsService.loadAll(); // Reload global list
        }
      },
      error: (err) => {
        console.error('Error updating client', err);
        const errorMsg = parseValidationErrors(err);
        this.toastService.error(`No se pudo actualizar el cliente:\n${errorMsg}`);
      }
    });
  }

  protected openNewPet(): void {
    if (!this.client) return;
    void this.router.navigate(['/app/clients', this.client.id, 'pets', 'new']);
  }

  protected openPetHistory(pet: ClientPet): void {
    if (!pet.id) return;
    void this.router.navigate(['/app/clinical-history', pet.id]);
  }

  protected openEditPet(pet: ClientPet, index: number): void {
    if (!this.client || !pet.id) return;
    void this.router.navigate(['/app/clients', this.client.id, 'pets', pet.id, 'edit']);
  }

  protected confirmDeletePet(pet: ClientPet, index: number): void {
    this.petToDelete = { index, pet };
  }

  protected cancelDeletePet(): void {
    this.petToDelete = null;
  }

  protected executeDeletePet(): void {
    if (!this.petToDelete || !this.petToDelete.pet.id) return;

    const petId = this.petToDelete.pet.id;
    const petName = this.petToDelete.pet.nombre;

    this.petsList = this.petsList.filter((p) => p.id !== petId);
    this.petToDelete = null;

    this.clientsService.deletePet(petId).subscribe({
      next: () => {
        this.toastService.success(`Mascota ${petName} eliminada exitosamente.`);
      },
      error: (err) => {
        console.error('Error deleting pet', err);
        this.toastService.info(`Mascota ${petName} eliminada.`);
      }
    });
  }

  protected getDisplayEmail(email?: string): string {
    if (!email || email.startsWith('sin-correo-')) return '-';
    return email;
  }

  protected goBack(): void { void this.router.navigate(['/app/clients']); }

  // Métodos de detalle de mascotas
  protected openPetDetail(pet: ClientPet): void {
    this.selectedPetForDetail = { ...pet };
  }

  protected closePetDetail(): void {
    this.selectedPetForDetail = null;
  }

  protected savePetDetail(form?: any): void {
    if (form && form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    if (!this.selectedPetForDetail || !this.selectedPetForDetail.id) return;

    const payload = {
      ...this.selectedPetForDetail,
      especie: Number(this.selectedPetForDetail.especie),
      sexo: Number(this.selectedPetForDetail.sexo),
      tamanio: Number(this.selectedPetForDetail.tamanio),
      peso: Number(this.selectedPetForDetail.peso),
      razaId: this.selectedPetForDetail.razaId ? Number(this.selectedPetForDetail.razaId) : null
    };

    this.clientsService.updatePet(payload.id!, payload).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.petsList = this.petsList.map(p => p.id === payload.id! ? res.data : p);
          this.selectedPetForDetail = null;
          this.toastService.success('Mascota actualizada exitosamente');
        }
      },
      error: (err) => {
        console.error('Error updating pet', err);
        this.toastService.error('Error al actualizar mascota');
      }
    });
  }

  protected getPetAge(birthDateStr?: string): string {
    if (!birthDateStr) return 'Edad desc.';
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return 'Edad desc.';
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += prevMonthDays;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) return '0 días';

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} año${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mes${months > 1 ? 'es' : ''}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} día${days !== 1 ? 's' : ''}`);

    return parts.join(', ');
  }

  protected getPetImagePath(especie: number): string {
    const map: Record<number, string> = {
      1: 'assets/images/dog_illustration.png', // Canino
      2: 'assets/images/cat_illustration.png', // Felino
      3: 'assets/images/exotic_illustration.png' // Exótico
    };
    return map[especie] || 'assets/images/exotic_illustration.png';
  }

  protected getFilteredRazas(): Raza[] {
    if (!this.selectedPetForDetail) return [];
    const selectedEspecie = Number(this.selectedPetForDetail.especie);
    if (!selectedEspecie) return this.allRazas;
    return this.allRazas.filter((r) => r.especie === selectedEspecie);
  }

  protected onEspecieChange(): void {
    if (this.selectedPetForDetail) {
      this.selectedPetForDetail.razaId = null;
    }
  }

  protected getTamanioLabel(val: number): string {
    const map: Record<number, string> = {
      1: 'Pequeño',
      2: 'Mediano',
      3: 'Grande'
    };
    return map[val] || '-';
  }
}