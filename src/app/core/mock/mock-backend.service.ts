import { Injectable } from '@angular/core';
import { INITIAL_MOCK_DATA, MockDatabaseSchema, getTodayDateStr } from './mock-database';

@Injectable({
  providedIn: 'root'
})
export class MockBackendService {
  private readonly STORAGE_KEY = 'clinica_pet_portfolio_db_v2';
  private db: MockDatabaseSchema;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): MockDatabaseSchema {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.propietarios) && parsed.propietarios.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading mock db from localStorage, resetting to initial', e);
    }
    const initial = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    this.saveDatabase(initial);
    return initial;
  }

  public saveDatabase(data?: MockDatabaseSchema): void {
    if (data) {
      this.db = data;
    }
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.db));
    } catch (e) {
      console.error('Error persisting mock db to localStorage', e);
    }
  }

  public resetToInitial(): void {
    const initial = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
    // Clear custom deleted flags from old manual storage
    localStorage.removeItem('cached_deleted_pet_ids');
    localStorage.removeItem('cached_updated_pets');
    localStorage.removeItem('cached_deleted_client_ids');
    localStorage.removeItem('sent_recordatorios_ids');

    this.saveDatabase(initial);
  }

  // ==========================================
  // AUTH
  // ==========================================
  public createDemoToken(email: string): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const expSeconds = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
    const payload = {
      sub: 'demo-user-id',
      email: email || 'demo@clinicapet.com',
      role: 'Admin',
      personalId: 'b4f35e05-1fec-4525-bcb1-c8fc41b9199e',
      exp: expSeconds
    };

    const b64Header = btoa(JSON.stringify(header));
    const b64Payload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const signature = 'demo_portfolio_signature_secure';

    return `${b64Header}.${b64Payload}.${signature}`;
  }

  // ==========================================
  // PROPIETARIOS (CLIENTES)
  // ==========================================
  public getPropietarios(): any[] {
    return this.db.propietarios.map(prop => {
      const pets = this.db.mascotas.filter(m => m.propietarioId === prop.id && m.activo !== false);
      return { ...prop, pets };
    });
  }

  public getPropietarioById(id: string): any | null {
    const prop = this.db.propietarios.find(p => p.id === id);
    if (!prop) return null;
    const pets = this.db.mascotas.filter(m => m.propietarioId === prop.id && m.activo !== false);
    return { ...prop, pets };
  }

  public createPropietario(payload: any): any {
    const id = 'prop-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newProp = {
      id,
      nombres: payload.nombres || '',
      apellidos: payload.apellidos || '',
      celular: payload.celular || '',
      correoElectronico: payload.correoElectronico || '',
      direccion: payload.direccion || '',
      activo: payload.activo !== false,
      createdAt: now,
      updatedAt: now,
      pets: []
    };
    this.db.propietarios.unshift(newProp);
    this.saveDatabase();
    return newProp;
  }

  public updatePropietario(id: string, payload: any): any | null {
    const idx = this.db.propietarios.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.db.propietarios[idx] = {
      ...this.db.propietarios[idx],
      ...payload,
      id,
      updatedAt: now
    };
    this.saveDatabase();
    return this.getPropietarioById(id);
  }

  public deletePropietario(id: string): boolean {
    this.db.propietarios = this.db.propietarios.filter(p => p.id !== id);
    // Soft or hard delete pets of this owner
    this.db.mascotas = this.db.mascotas.filter(m => m.propietarioId !== id);
    this.saveDatabase();
    return true;
  }

  // ==========================================
  // MASCOTAS
  // ==========================================
  public getMascotas(): any[] {
    return this.db.mascotas.filter(m => m.activo !== false);
  }

  public getMascotasByPropietario(propietarioId: string): any[] {
    return this.db.mascotas.filter(m => m.propietarioId === propietarioId && m.activo !== false);
  }

  public getMascotaById(id: string): any | null {
    return this.db.mascotas.find(m => m.id === id) || null;
  }

  public createMascota(payload: any): any {
    const id = 'pet-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newPet = {
      id,
      propietarioId: payload.propietarioId,
      nombre: payload.nombre,
      especie: Number(payload.especie) || 1,
      razaId: payload.razaId ? Number(payload.razaId) : null,
      sexo: Number(payload.sexo) || 1,
      fechaNacimiento: payload.fechaNacimiento || getTodayDateStr(-365),
      peso: Number(payload.peso) || 5,
      unidadPeso: Number(payload.unidadPeso) || 1,
      color: payload.color || 'Común',
      tamanio: Number(payload.tamanio) || 2,
      detalle: payload.detalle || '',
      activo: true,
      createdAt: now,
      updatedAt: now
    };
    this.db.mascotas.unshift(newPet);
    this.saveDatabase();
    return newPet;
  }

  public updateMascota(id: string, payload: any): any | null {
    const idx = this.db.mascotas.findIndex(m => m.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.db.mascotas[idx] = {
      ...this.db.mascotas[idx],
      ...payload,
      id,
      updatedAt: now
    };
    this.saveDatabase();
    return this.db.mascotas[idx];
  }

  public deleteMascota(id: string): boolean {
    this.db.mascotas = this.db.mascotas.filter(m => m.id !== id);
    this.db.historiales = this.db.historiales.filter(h => h.mascotaId !== id);
    this.db.controlesSanitarios = this.db.controlesSanitarios.filter(c => c.mascotaId !== id);
    this.db.recordatorios = this.db.recordatorios.filter(r => r.mascotaId !== id);
    this.saveDatabase();
    return true;
  }

  // ==========================================
  // RAZAS & PRODUCTOS
  // ==========================================
  public getRazas(): any[] {
    return this.db.razas;
  }

  public getProductos(): any[] {
    return this.db.productos;
  }

  // ==========================================
  // HISTORIALES CLINICOS
  // ==========================================
  public getHistoriales(): any[] {
    return this.db.historiales;
  }

  public createHistorial(payload: any): any {
    const id = 'hist-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newHist = {
      id,
      mascotaId: payload.mascotaId,
      tipoAtencion: payload.tipoAtencion || 1,
      fecha: payload.fecha || now,
      edad: payload.edad || '',
      peso: payload.peso ? Number(payload.peso) : null,
      unidadPeso: payload.unidadPeso || 1,
      temperatura: payload.temperatura ? Number(payload.temperatura) : null,
      costo: payload.costo ? Number(payload.costo) : 0,
      motivoConsulta: payload.motivoConsulta || payload.observaciones || '',
      observaciones: payload.observaciones || payload.motivoConsulta || '',
      diagnostico: payload.diagnostico || '',
      tratamiento: payload.tratamiento || '',
      personalId: payload.personalId || 'b4f35e05-1fec-4525-bcb1-c8fc41b9199e',
      activo: true,
      createdAt: now,
      updatedAt: now
    };
    this.db.historiales.unshift(newHist);
    this.saveDatabase();
    return newHist;
  }

  public updateHistorial(id: string, payload: any): any | null {
    const idx = this.db.historiales.findIndex(h => h.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.db.historiales[idx] = {
      ...this.db.historiales[idx],
      ...payload,
      id,
      updatedAt: now
    };
    this.saveDatabase();
    return this.db.historiales[idx];
  }

  public deleteHistorial(id: string): boolean {
    this.db.historiales = this.db.historiales.filter(h => h.id !== id);
    this.saveDatabase();
    return true;
  }

  // ==========================================
  // CONTROLES SANITARIOS (VACUNAS & DESPARASITANTES)
  // ==========================================
  public getControlesByMascota(mascotaId: string): any {
    const controles = this.db.controlesSanitarios.filter(c => c.mascotaId === mascotaId);
    return {
      id: 'esq-' + mascotaId,
      mascotaId: mascotaId,
      fechaInicio: new Date().toISOString(),
      controles: controles
    };
  }

  public createControlSanitario(payload: any): any {
    const id = 'ctrl-' + Math.random().toString(36).substring(2, 9);
    const prod = this.db.productos.find(p => p.id === payload.productoAplicadoId);
    const prodName = prod ? prod.nombre : 'Servicio Veterinario';

    const fechaApp = payload.fechaAplicada ? payload.fechaAplicada.substring(0, 10) : getTodayDateStr(0);
    const isAplicado = payload.aplicado === true;

    const newControl = {
      id,
      mascotaId: payload.mascotaId,
      productoId: payload.productoAplicadoId,
      producto: prodName,
      fechaAplicacion: isAplicado ? fechaApp : getTodayDateStr(0),
      fechaProgramada: fechaApp,
      aplicacion: 1,
      lote: payload.lote || 'LOTE-GEN',
      observaciones: payload.observaciones || '',
      estado: isAplicado ? 1 : 0
    };

    this.db.controlesSanitarios.unshift(newControl);

    // Si es una dosis pendiente a futuro o hoy, agregar o sincronizar en recordatorios
    const pet = this.db.mascotas.find(m => m.id === payload.mascotaId);
    const owner = pet ? this.db.propietarios.find(p => p.id === pet.propietarioId) : null;

    const recId = 'rec-' + id;
    this.db.recordatorios.unshift({
      id: recId,
      mascotaId: payload.mascotaId,
      nombreMascota: pet ? pet.nombre : 'Mascota',
      propietarioId: pet ? pet.propietarioId : '',
      nombrePropietario: owner ? `${owner.nombres} ${owner.apellidos}` : 'Cliente',
      productoId: payload.productoAplicadoId,
      nombreProducto: prodName,
      fechaProgramada: fechaApp + 'T09:00:00',
      fechaEnvio: null,
      estado: isAplicado ? 1 : 0
    });

    this.saveDatabase();
    return this.getControlesByMascota(payload.mascotaId);
  }

  public updateControlSanitario(id: string, payload: any): any | null {
    const idx = this.db.controlesSanitarios.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const current = this.db.controlesSanitarios[idx];
    const newState = payload.estado !== undefined ? payload.estado : 1;
    this.db.controlesSanitarios[idx] = {
      ...current,
      ...payload,
      estado: newState
    };

    // Actualizar recordatorio correspondiente
    const recIdx = this.db.recordatorios.findIndex(r => r.id === 'rec-' + id || r.productoId === current.productoId && r.mascotaId === current.mascotaId);
    if (recIdx !== -1) {
      this.db.recordatorios[recIdx].estado = newState;
    }

    this.saveDatabase();
    return this.getControlesByMascota(current.mascotaId);
  }

  public deleteControlSanitario(id: string): boolean {
    const current = this.db.controlesSanitarios.find(c => c.id === id);
    this.db.controlesSanitarios = this.db.controlesSanitarios.filter(c => c.id !== id);
    this.db.recordatorios = this.db.recordatorios.filter(r => r.id !== 'rec-' + id);
    this.saveDatabase();
    return true;
  }

  // ==========================================
  // RECORDATORIOS (CITAS & AGENDA)
  // ==========================================
  public getRecordatorios(): any[] {
    return this.db.recordatorios;
  }

  public updateRecordatorio(id: string, payload: any): any | null {
    const idx = this.db.recordatorios.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.db.recordatorios[idx] = {
      ...this.db.recordatorios[idx],
      ...payload
    };
    this.saveDatabase();
    return this.db.recordatorios[idx];
  }
}
