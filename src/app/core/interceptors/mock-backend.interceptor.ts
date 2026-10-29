import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MockBackendService } from '../mock/mock-backend.service';
import { environment } from '../../../environments/environment';

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  // If demo mode is not enabled, pass request to real backend
  if (!environment.demoMode) {
    return next(req);
  }

  const mockDb = inject(MockBackendService);
  const url = req.url;
  const method = req.method;

  // Helper response wrapper matching Backend ApiResponse structure
  const ok = (data: any, message = 'Operación exitosa') => {
    return of(
      new HttpResponse({
        status: 200,
        body: {
          status: 0, // In backend 0 == Success
          success: true,
          message,
          data
        }
      })
    ).pipe(delay(60));
  };

  // 1. AUTH ENDPOINTS
  if (url.includes('/auth/login') && method === 'POST') {
    const body = req.body as any;
    const token = mockDb.createDemoToken(body?.email);
    return ok({
      token,
      refreshToken: 'demo_refresh_token_123',
      expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }, 'Inicio de sesión demo exitoso');
  }

  if (url.includes('/auth/refresh') && method === 'POST') {
    const token = mockDb.createDemoToken('demo@clinicapet.com');
    return ok({
      token,
      refreshToken: 'demo_refresh_token_renewed',
      expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }, 'Token refrescado correctamente');
  }

  if (url.includes('/auth/logout') && method === 'POST') {
    return ok(null, 'Sesión cerrada correctamente');
  }

  // 2. SYSTEM HEARTBEAT & SHUTDOWN
  if (url.includes('/system/heartbeat') || url.includes('/system/shutdown')) {
    return ok({ alive: true });
  }

  // 3. RAZAS & PRODUCTOS
  if (url.includes('/Razas') && method === 'GET') {
    return ok(mockDb.getRazas(), 'Razas recuperadas exitosamente');
  }

  if (url.includes('/Productos') && method === 'GET') {
    return ok(mockDb.getProductos(), 'Productos recuperados exitosamente');
  }

  // 4. PROPIETARIOS (CLIENTES)
  // GET /Propietarios/:id
  const propIdMatch = url.match(/\/Propietarios\/([^\/?]+)/);
  if (propIdMatch && method === 'GET') {
    const id = propIdMatch[1];
    const item = mockDb.getPropietarioById(id);
    return ok(item, 'Cliente encontrado');
  }

  // PUT /Propietarios/:id
  if (propIdMatch && method === 'PUT') {
    const id = propIdMatch[1];
    const updated = mockDb.updatePropietario(id, req.body);
    return ok(updated, 'Cliente actualizado');
  }

  // DELETE /Propietarios/:id
  if (propIdMatch && method === 'DELETE') {
    const id = propIdMatch[1];
    mockDb.deletePropietario(id);
    return ok(true, 'Cliente eliminado');
  }

  // GET /Propietarios
  if (url.endsWith('/Propietarios') && method === 'GET') {
    return ok(mockDb.getPropietarios(), 'Clientes recuperados');
  }

  // POST /Propietarios
  if (url.endsWith('/Propietarios') && method === 'POST') {
    const created = mockDb.createPropietario(req.body);
    return ok(created, 'Cliente registrado exitosamente');
  }

  // 5. MASCOTAS
  // GET /Mascotas/propietario/:id
  const petPropMatch = url.match(/\/Mascotas\/propietario\/([^\/?]+)/);
  if (petPropMatch && method === 'GET') {
    const propId = petPropMatch[1];
    return ok(mockDb.getMascotasByPropietario(propId), 'Mascotas del propietario recuperadas');
  }

  // GET /Mascotas/:id, PUT /Mascotas/:id, DELETE /Mascotas/:id
  const petIdMatch = url.match(/\/Mascotas\/([^\/?]+)/);
  if (petIdMatch && !url.includes('/propietario/')) {
    const id = petIdMatch[1];
    if (method === 'GET') {
      return ok(mockDb.getMascotaById(id), 'Mascota recuperada');
    }
    if (method === 'PUT') {
      const updated = mockDb.updateMascota(id, req.body);
      return ok(updated, 'Mascota actualizada');
    }
    if (method === 'DELETE') {
      mockDb.deleteMascota(id);
      return ok(true, 'Mascota eliminada');
    }
  }

  // GET /Mascotas
  if (url.endsWith('/Mascotas') && method === 'GET') {
    return ok(mockDb.getMascotas(), 'Mascotas recuperadas');
  }

  // POST /Mascotas
  if (url.endsWith('/Mascotas') && method === 'POST') {
    const created = mockDb.createMascota(req.body);
    return ok(created, 'Mascota creada');
  }

  // 6. HISTORIALES CLINICOS
  const histIdMatch = url.match(/\/Historiales\/([^\/?]+)/);
  if (histIdMatch) {
    const id = histIdMatch[1];
    if (method === 'PUT') {
      const updated = mockDb.updateHistorial(id, req.body);
      return ok(updated, 'Historial actualizado');
    }
    if (method === 'DELETE') {
      mockDb.deleteHistorial(id);
      return ok(true, 'Historial eliminado');
    }
  }

  if (url.endsWith('/Historiales') && method === 'GET') {
    return ok(mockDb.getHistoriales(), 'Historiales recuperados');
  }

  if (url.endsWith('/Historiales') && method === 'POST') {
    const created = mockDb.createHistorial(req.body);
    return ok(created, 'Historial creado exitosamente');
  }

  // 7. CONTROLES SANITARIOS
  const ctrlMascotaMatch = url.match(/\/ControlesSanitarios\/mascota\/([^\/?]+)/);
  if (ctrlMascotaMatch && method === 'GET') {
    const mascotaId = ctrlMascotaMatch[1];
    return ok(mockDb.getControlesByMascota(mascotaId), 'Controles sanitarios recuperados');
  }

  const ctrlIdMatch = url.match(/\/ControlesSanitarios\/([^\/?]+)/);
  if (ctrlIdMatch && !url.includes('/mascota/')) {
    const id = ctrlIdMatch[1];
    if (method === 'PUT') {
      const updated = mockDb.updateControlSanitario(id, req.body);
      return ok(updated, 'Control sanitario actualizado');
    }
    if (method === 'DELETE') {
      mockDb.deleteControlSanitario(id);
      return ok(true, 'Control sanitario eliminado');
    }
  }

  if (url.endsWith('/ControlesSanitarios') && method === 'POST') {
    const result = mockDb.createControlSanitario(req.body);
    return ok(result, 'Control sanitario registrado exitosamente');
  }

  // 8. RECORDATORIOS CONTROL SANITARIO (CITAS / AGENDA)
  const recIdMatch = url.match(/\/RecordatoriosControlSanitario\/([^\/?]+)/);
  if (recIdMatch && method === 'PUT') {
    const id = recIdMatch[1];
    const updated = mockDb.updateRecordatorio(id, req.body);
    return ok(updated, 'Recordatorio actualizado');
  }

  if (url.includes('/RecordatoriosControlSanitario') && method === 'GET') {
    return ok(mockDb.getRecordatorios(), 'Recordatorios recuperados');
  }

  // Fallback to real request if not matched
  return next(req);
};
