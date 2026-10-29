import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LucideArrowLeft, LucidePlus, LucidePencil, LucideTrash2, LucideX, LucideSave, LucideHistory, LucideCheckCircle2 } from '@lucide/angular';

import { Client, ClientPet } from '../../../clients/interfaces/client.interface';
import { ClientsService } from '../../../clients/services/clients.service';
import { ToastService } from '../../../../core/services/toast/toast.service';
import { SessionService } from '../../../../core/services/session/session.service';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';

interface HistoryRecord {
  id: string;
  petId: string;
  peso: number;
  temperatura: number;
  edad: string;
  fecha: string;
  detalles: string;
  costo: number;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'emervet-clinical-history-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideArrowLeft,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideX,
    LucideSave,
    LucideHistory,
    LucideCheckCircle2,
    SearchableSelectComponent
  ],
  templateUrl: './clinical-history-detail.page.html',
  styleUrl: './clinical-history-detail.page.css',
})
export class ClinicalHistoryDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly toastService = inject(ToastService);
  private readonly sessionService = inject(SessionService);

  protected petId: string = '';
  protected pet: ClientPet | null = null;
  protected client: Client | null = null;
  protected razasMap: Record<number, string> = {};

  protected showHistory = true;
  protected historyEntries: HistoryRecord[] = [];

  // Filtro de rango de fechas
  protected startDate: string = '';
  protected endDate: string = '';

  // Estado de los Modales de Historial
  protected showAddModal = false;
  protected showEditModal = false;
  protected showDeleteModal = false;
  protected recordToDelete: HistoryRecord | null = null;

  // Modales de Confirmación para Servicios
  protected showConfirmApplyModal = false;
  protected serviceToApply: any = null;

  protected showConfirmDeleteServiceModal = false;
  protected serviceToDelete: any = null;

  // Formulario de registro de historial
  protected recordForm = {
    id: '',
    peso: 0,
    temperatura: 0,
    fecha: '',
    detalles: '',
    costo: 0,
    edad: ''
  };

  // Estado de los Servicios (Vacunas / Desparasitaciones)
  protected servicesList: any[] = [];
  protected selectedCategory: 'Vacunas' | 'Desparasitaciones' = 'Vacunas';
  protected deletedServiceIds = new Set<string>();

  protected serviceForm = {
    productoAplicado: '',
    fechaAplicacion: '',
    dias: null as number | null,
    estado: 'Aplicado' as 'Aplicado' | 'Pendiente'
  };

  protected availableProducts: any[] = [];

  ngOnInit(): void {
    this.petId = this.route.snapshot.paramMap.get('id') || '';
    this.loadRazas();
    this.loadPetAndOwnerData();
    this.loadProducts();
    this.loadServiceRecords();
    this.resetServiceForm();
  }

  private loadRazas(): void {
    this.clientsService.getRazas().subscribe({
      next: (res) => {
        if (res.success && res.data) {
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

  private loadPetAndOwnerData(): void {
    if (!this.petId) return;

    this.clientsService.getPetById(this.petId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pet = res.data;
          this.loadHistoryRecords();
          
          if (this.pet.propietarioId) {
            this.clientsService.getClientById(this.pet.propietarioId).subscribe({
              next: (clientRes) => {
                if (clientRes.success && clientRes.data) {
                  this.client = clientRes.data;
                }
              },
              error: (err) => console.error('Error loading client', err)
            });
          }
        }
      },
      error: (err) => {
        console.error('Error loading pet details', err);
        this.toastService.error('No se pudo cargar la información de la mascota');
      }
    });
  }

  protected toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  protected get filteredHistoryEntries(): HistoryRecord[] {
    let list = this.historyEntries;

    if (this.startDate || this.endDate) {
      list = list.filter((entry) => {
        if (!entry.fecha) return false;
        const entryDate = entry.fecha.substring(0, 10);
        if (this.startDate && entryDate < this.startDate) return false;
        if (this.endDate && entryDate > this.endDate) return false;
        return true;
      });
    }

    return [...list].sort((a: HistoryRecord, b: HistoryRecord) => {
      const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
  }

  protected clearDateFilter(): void {
    this.startDate = '';
    this.endDate = '';
  }

  // ==========================================
  // FILTRADO Y AGRUPACION DE SERVICIOS
  // ==========================================

  protected get filteredServicesList(): any[] {
    const selectedCat = (this.selectedCategory || '').toLowerCase().trim();
    return this.servicesList.filter((item: any) => {
      const itemCat = (item.category || '').toLowerCase().trim();
      if (selectedCat.includes('vacuna')) {
        return itemCat.includes('vacuna');
      } else {
        return itemCat.includes('desparasit') || !itemCat.includes('vacuna');
      }
    });
  }

  protected get appliedServicesList(): any[] {
    return this.filteredServicesList.filter((item: any) => item.estado === 'Aplicado');
  }

  protected get pendingServicesList(): any[] {
    return this.filteredServicesList.filter((item: any) => item.estado === 'Pendiente');
  }

  // ==========================================
  // LOGICA CRUD DE HISTORIALES
  // ==========================================

  private loadHistoryRecords(): void {
    this.clientsService.getHistoriales().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const petRecords = res.data.filter((r: any) => r.mascotaId === this.petId);
          this.historyEntries = petRecords
            .map((entry: any) => ({
              id: entry.id,
              petId: entry.mascotaId,
              peso: entry.peso,
              temperatura: entry.temperatura,
              edad: entry.edad || (this.pet ? this.calculateAge(this.pet.fechaNacimiento, entry.fecha) : 'Desconocida'),
              fecha: entry.fecha ? entry.fecha.substring(0, 10) : '',
              detalles: entry.motivoConsulta || entry.observaciones || entry.diagnostico || '',
              costo: entry.costo,
              createdAt: entry.createdAt || entry.fecha || '',
              updatedAt: entry.updatedAt || entry.createdAt || entry.fecha || ''
            }))
            .sort((a: HistoryRecord, b: HistoryRecord) => {
              const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
              const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
              if (dateA !== dateB) {
                return dateB - dateA;
              }
              const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
              const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
              return timeB - timeA;
            });
        }
      },
      error: (err) => {
        console.error('Error loading history records', err);
        this.toastService.error('No se pudo cargar el historial clínico');
      }
    });
  }

  protected openAddHistoryModal(): void {
    const today = this.getTodayStr();
    const defaultAge = this.pet ? this.calculateAge(this.pet.fechaNacimiento, today) : '';
    const defaultWeight = this.pet ? this.pet.peso : 0;

    this.recordForm = {
      id: '',
      peso: defaultWeight,
      temperatura: 38.5,
      fecha: today,
      detalles: '',
      costo: 100,
      edad: defaultAge
    };

    this.showAddModal = true;
  }

  protected closeAddModal(): void {
    this.showAddModal = false;
  }

  protected executeAddRecord(): void {
    if (!this.recordForm.fecha || !this.recordForm.detalles) {
      this.toastService.warning('Por favor completa los campos requeridos.');
      return;
    }

    const calculatedAge = this.pet ? this.calculateAge(this.pet.fechaNacimiento, this.recordForm.fecha) : '';

    const payload = {
      tipoAtencion: 1, // Consulta
      fecha: this.recordForm.fecha ? this.recordForm.fecha + 'T00:00:00' : this.getTodayStr() + 'T00:00:00',
      edad: calculatedAge,
      peso: this.recordForm.peso ? Number(this.recordForm.peso) : null,
      unidadPeso: 1, // Kg
      temperatura: this.recordForm.temperatura ? Number(this.recordForm.temperatura) : null,
      costo: this.recordForm.costo ? Number(this.recordForm.costo) : 0,
      motivoConsulta: this.recordForm.detalles.trim(),
      observaciones: this.recordForm.detalles.trim(),
      mascotaId: this.petId,
      personalId: this.sessionService.getPersonalId() || 'b4f35e05-1fec-4525-bcb1-c8fc41b9199e'
    };

    this.clientsService.createHistorial(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('Historial clínico agregado correctamente.');
          this.loadHistoryRecords();
          this.closeAddModal();
        }
      },
      error: (err) => {
        console.error('Error creating history record', err);
        this.toastService.error('No se pudo guardar el registro en el servidor.');
      }
    });
  }

  protected openEditHistoryModal(entry: HistoryRecord): void {
    this.recordForm = {
      id: entry.id,
      peso: entry.peso,
      temperatura: entry.temperatura,
      fecha: entry.fecha,
      detalles: entry.detalles,
      costo: entry.costo,
      edad: entry.edad
    };

    this.showEditModal = true;
  }

  protected closeEditModal(): void {
    this.showEditModal = false;
  }

  protected executeEditRecord(): void {
    if (!this.recordForm.id || !this.recordForm.fecha || !this.recordForm.detalles) {
      this.toastService.warning('Por favor completa los campos requeridos.');
      return;
    }

    const calculatedAge = this.pet ? this.calculateAge(this.pet.fechaNacimiento, this.recordForm.fecha) : this.recordForm.edad;

    const payload = {
      tipoAtencion: 1, // Consulta
      fecha: this.recordForm.fecha ? this.recordForm.fecha + 'T00:00:00' : this.getTodayStr() + 'T00:00:00',
      edad: calculatedAge,
      peso: this.recordForm.peso ? Number(this.recordForm.peso) : null,
      unidadPeso: 1, // Kg
      temperatura: this.recordForm.temperatura ? Number(this.recordForm.temperatura) : null,
      costo: this.recordForm.costo ? Number(this.recordForm.costo) : 0,
      motivoConsulta: this.recordForm.detalles.trim(),
      observaciones: this.recordForm.detalles.trim(),
      mascotaId: this.petId,
      personalId: this.sessionService.getPersonalId() || 'b4f35e05-1fec-4525-bcb1-c8fc41b9199e',
      activo: true
    };

    this.clientsService.updateHistorial(this.recordForm.id, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('Historial clínico actualizado correctamente.');
          this.loadHistoryRecords();
          this.closeEditModal();
        }
      },
      error: (err) => {
        console.error('Error updating history record', err);
        this.toastService.error('No se pudo actualizar el registro en el servidor.');
      }
    });
  }

  protected confirmDeleteRecord(entry: HistoryRecord): void {
    this.recordToDelete = entry;
    this.showDeleteModal = true;
  }

  protected closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.recordToDelete = null;
  }

  protected executeDeleteRecord(): void {
    if (!this.recordToDelete) return;

    this.clientsService.deleteHistorial(this.recordToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('Registro eliminado correctamente.');
          this.loadHistoryRecords();
          this.closeDeleteModal();
        }
      },
      error: (err) => {
        console.error('Error deleting history record', err);
        this.toastService.error('No se pudo eliminar el registro en el servidor.');
      }
    });
  }

  // ==========================================
  // LOGICA DE VACUNAS Y DESPARASITACIONES
  // ==========================================

  protected get productOptions(): SelectOption[] {
    let prods = this.availableProducts;

    if (this.selectedCategory === 'Vacunas') {
      prods = prods.filter((p) => {
        const catId = Number(p.categoriaProductoId);
        if (catId === 1) return true;
        if (catId === 2) return false;
        const name = (p.nombre || '').toLowerCase();
        const desc = (p.descripcion || '').toLowerCase();
        return name.includes('vacun') || desc.includes('vacun');
      });
    } else {
      prods = prods.filter((p) => {
        const catId = Number(p.categoriaProductoId);
        if (catId === 2) return true;
        if (catId === 1) return false;
        const name = (p.nombre || '').toLowerCase();
        const desc = (p.descripcion || '').toLowerCase();
        return (
          name.includes('desparasit') ||
          name.includes('antiparasit') ||
          desc.includes('desparasit') ||
          desc.includes('antiparasit')
        );
      });
    }

    return prods.map((p) => ({
      value: p.nombre,
      label: p.nombre,
      sublabel: p.descripcion || undefined
    }));
  }

  protected formatLocalDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  protected getTodayStr(): string {
    return this.formatLocalDate(new Date());
  }

  protected getTomorrowStr(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return this.formatLocalDate(d);
  }

  protected onCategoryChange(): void {
    this.resetServiceForm();
  }

  protected onEstadoChange(nuevoEstado: 'Aplicado' | 'Pendiente'): void {
    this.serviceForm.estado = nuevoEstado;

    if (nuevoEstado === 'Aplicado') {
      this.serviceForm.dias = null;
    } else {
      if (!this.serviceForm.dias) {
        this.serviceForm.dias = 1;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        this.serviceForm.fechaAplicacion = this.formatLocalDate(futureDate);
      }
    }
  }

  protected onDiasChange(val: any): void {
    if (this.serviceForm.estado === 'Aplicado') {
      this.serviceForm.dias = null;
      return;
    }

    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      this.serviceForm.dias = null;
      return;
    }

    this.serviceForm.dias = num;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + num);
    this.serviceForm.fechaAplicacion = this.formatLocalDate(futureDate);
  }

  protected onFechaServiceChange(val: string): void {
    this.serviceForm.fechaAplicacion = val;

    if (this.serviceForm.estado === 'Pendiente' && val) {
      const todayStr = this.getTodayStr();
      const selectedDate = new Date(val + 'T00:00:00');
      const todayDate = new Date(todayStr + 'T00:00:00');
      const diffTime = selectedDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.serviceForm.dias = diffDays > 0 ? diffDays : null;
    }
  }

  protected resetServiceForm(): void {
    const options = this.productOptions;
    const firstOption = options[0] ? options[0].value : '';
    const today = this.getTodayStr();

    this.serviceForm = {
      productoAplicado: firstOption,
      fechaAplicacion: today,
      dias: null,
      estado: 'Aplicado'
    };
  }

  protected saveServiceRecord(): void {
    const todayStr = this.getTodayStr();
    const isAplicado = this.serviceForm.estado === 'Aplicado';
    const fechaApp = this.serviceForm.fechaAplicacion || todayStr;

    // Buscar producto o usar fallback
    let prod = this.availableProducts.find(
      (p) => p.nombre.toLowerCase().trim() === (this.serviceForm.productoAplicado || '').toLowerCase().trim()
    );

    if (!prod && this.availableProducts.length > 0) {
      prod = this.availableProducts[0];
    }

    if (!prod) {
      this.toastService.error('Cargando catálogo de productos... Por favor reintenta.');
      return;
    }

    const payload = {
      mascotaId: this.petId,
      productoAplicadoId: prod.id,
      fechaAplicada: fechaApp + 'T00:00:00',
      aplicado: isAplicado,
      lote: 'LOTE-GENERICO',
      observaciones: `Registro de ${this.selectedCategory} (${this.serviceForm.estado})`
    };

    this.clientsService.createControlSanitario(payload).subscribe({
      next: () => {
        this.toastService.success(`Registro de ${this.selectedCategory} (${this.serviceForm.estado}) guardado con éxito.`);
        this.resetServiceForm();
        this.loadServiceRecords();
      },
      error: (err) => {
        console.error('Error al guardar control sanitario', err);
        const msg = this.extractApiErrorMsg(err, 'No se pudo guardar el servicio.');
        this.toastService.error(msg);
      }
    });
  }

  // --- MODAL CONFIRMAR CAMBIO DE ESTADO A APLICADO ---
  protected openApplyModal(item: any): void {
    this.serviceToApply = item;
    this.showConfirmApplyModal = true;
  }

  protected closeApplyModal(): void {
    this.showConfirmApplyModal = false;
    this.serviceToApply = null;
  }

  protected confirmApplyService(): void {
    if (!this.serviceToApply) return;

    this.clientsService.updateControlSanitario(this.serviceToApply.id, { estado: 1 }).subscribe({
      next: () => {
        this.toastService.success('Dosis marcada como APLICADA correctamente.');
        this.closeApplyModal();
        this.loadServiceRecords();
      },
      error: (err) => {
        console.error('Error al actualizar estado del servicio', err);
        const msg = this.extractApiErrorMsg(err, 'No se pudo actualizar el estado de la dosis.');
        this.toastService.error(msg);
      }
    });
  }

  // --- MODAL CONFIRMAR ELIMINAR REGISTRO ---
  protected openDeleteServiceModal(item: any): void {
    this.serviceToDelete = item;
    this.showConfirmDeleteServiceModal = true;
  }

  protected closeDeleteServiceModal(): void {
    this.showConfirmDeleteServiceModal = false;
    this.serviceToDelete = null;
  }

  protected confirmDeleteService(): void {
    if (!this.serviceToDelete) return;

    this.clientsService.deleteControlSanitario(this.serviceToDelete.id).subscribe({
      next: () => {
        this.deletedServiceIds.add(this.serviceToDelete.id);
        this.toastService.success('Registro de dosis eliminado.');
        this.closeDeleteServiceModal();
        this.loadServiceRecords();
      },
      error: (err) => {
        console.error('Error al eliminar control sanitario', err);
        const msg = this.extractApiErrorMsg(err, 'No se pudo eliminar el registro.');
        this.toastService.error(msg);
      }
    });
  }

  private extractApiErrorMsg(err: any, fallback: string): string {
    if (!err) return fallback;
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }
    if (err.error?.message) {
      return err.error.message;
    }
    if (err.error?.Message) {
      return err.error.Message;
    }
    if (err.error?.errors && typeof err.error.errors === 'object') {
      const firstKey = Object.keys(err.error.errors)[0];
      if (firstKey && err.error.errors[firstKey]?.[0]) {
        return err.error.errors[firstKey][0];
      }
    }
    if (err.message) {
      return err.message;
    }
    return fallback;
  }

  // ==========================================
  // HELPERS
  // ==========================================

  protected calculateAge(birthDateStr?: string, targetDateStr?: string): string {
    if (!birthDateStr) return 'Desconocida';
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return 'Desconocida';

    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    if (isNaN(targetDate.getTime())) return 'Desconocida';

    let years = targetDate.getFullYear() - birthDate.getFullYear();
    let months = targetDate.getMonth() - birthDate.getMonth();
    let days = targetDate.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) return '0 días';

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);

    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} y ${parts[1]}`;
    return `${parts[0]}, ${parts[1]} y ${parts[2]}`;
  }

  protected getDisplayEmail(email?: string): string {
    if (!email || email.startsWith('sin-correo-')) return '-';
    return email;
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

  private loadProducts(): void {
    this.clientsService.getProductos().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.availableProducts = res.data;
          this.resetServiceForm();
          if (this.servicesList.length > 0) {
            this.loadServiceRecords();
          }
        }
      },
      error: (err) => console.error('Error loading products', err)
    });
  }

  protected loadServiceRecords(): void {
    if (!this.petId) return;

    this.clientsService.getControlesSanitariosByMascota(this.petId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const controles = res.data.controles || [];
          this.servicesList = controles
            .filter((c: any) => !this.deletedServiceIds.has(c.id))
            .map((c: any) => {
              const hasValidAppDate = c.fechaAplicacion && !c.fechaAplicacion.startsWith('0001');
              const hasValidProgDate = c.fechaProgramada && !c.fechaProgramada.startsWith('0001');
              const hasValidNextDate = c.fechaSiguiente && !c.fechaSiguiente.startsWith('0001');
              const hasValidProxDate = c.fechaProxima && !c.fechaProxima.startsWith('0001');

              const rawDate = hasValidAppDate 
                ? c.fechaAplicacion 
                : (hasValidProgDate ? c.fechaProgramada : (hasValidNextDate ? c.fechaSiguiente : (hasValidProxDate ? c.fechaProxima : '')));

              const finalDate = (rawDate && !rawDate.startsWith('0001')) 
                ? rawDate.substring(0, 10) 
                : this.getTodayStr();

              return {
                id: c.id,
                petId: this.petId,
                category: this.getCategoryByProduct(c.producto),
                dosis: `aplicado${c.aplicacion || 1}`,
                producto: c.producto,
                productoId: c.productoId,
                fecha: finalDate,
                estado: c.estado === 1 ? 'Aplicado' : 'Pendiente',
                createdAt: c.createdAt || c.fechaAplicacion || c.fechaProgramada || '',
                updatedAt: c.updatedAt || c.createdAt || ''
              };
            })
            .sort((a: any, b: any) => {
              const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
              const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
              if (dateA !== dateB) {
                return dateB - dateA;
              }
              const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
              const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
              return timeB - timeA;
            });
        }
      },
      error: (err) => {
        console.warn('Esquema sanitario no encontrado o vacío', err);
        this.servicesList = [];
      }
    });
  }

  private getCategoryByProduct(productName: string): string {
    if (!productName) return 'Vacunas';
    const norm = productName.toLowerCase().trim();

    const foundProd = this.availableProducts.find(
      (p) => (p.nombre || '').toLowerCase().trim() === norm
    );
    if (foundProd && foundProd.categoriaProductoId) {
      const catId = Number(foundProd.categoriaProductoId);
      if (catId === 2) return 'Desparasitaciones';
      if (catId === 1) return 'Vacunas';
    }

    if (norm.includes('desparasit') || norm.includes('antiparasit')) {
      return 'Desparasitaciones';
    }

    return 'Vacunas';
  }

  protected goBackToClient(): void {
    if (this.pet && this.pet.propietarioId) {
      void this.router.navigate(['/app/clients', this.pet.propietarioId]);
    } else {
      void this.router.navigate(['/app/clients']);
    }
  }
}