import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap, throwError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseResponse } from '../../../core/models/base-response.interface';
import { Client, ClientPet, Raza, CreatePropietarioPayload, UpdatePropietarioPayload } from '../interfaces/client.interface';

function toTitleCase(str: string): string {
	if (!str) return '';
	return str
		.trim()
		.toLowerCase()
		.split(/\s+/)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

function formatPet(p: ClientPet): ClientPet {
	return {
		...p,
		nombre: toTitleCase(p.nombre),
		color: p.color ? toTitleCase(p.color) : p.color,
		detalle: p.detalle ? toTitleCase(p.detalle) : p.detalle
	};
}

function formatClient(c: Client): Client {
	const deletedIds = getDeletedPetIdsFromStorage();
	return {
		...c,
		nombres: toTitleCase(c.nombres),
		apellidos: toTitleCase(c.apellidos),
		direccion: toTitleCase(c.direccion),
		pets: c.pets ? c.pets.map(formatPet).filter((p) => !deletedIds.has(p.id!)) : undefined
	};
}

function removeAccents(str: string): string {
	if (!str) return '';
	return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getDeletedPetIdsFromStorage(): Set<string> {
	try {
		const stored = localStorage.getItem('cached_deleted_pet_ids');
		return stored ? new Set(JSON.parse(stored)) : new Set<string>();
	} catch {
		return new Set<string>();
	}
}

function addDeletedPetToStorage(petId: string): void {
	try {
		const ids = getDeletedPetIdsFromStorage();
		ids.add(petId);
		localStorage.setItem('cached_deleted_pet_ids', JSON.stringify(Array.from(ids)));
	} catch (e) {
		console.error(e);
	}
}

function getUpdatedPetsFromStorage(): Map<string, ClientPet> {
	try {
		const stored = localStorage.getItem('cached_updated_pets');
		if (!stored) return new Map();
		const list: ClientPet[] = JSON.parse(stored);
		const map = new Map<string, ClientPet>();
		list.forEach((p) => map.set(p.id!, formatPet(p)));
		return map;
	} catch {
		return new Map();
	}
}

function saveUpdatedPetToStorage(pet: ClientPet): void {
	try {
		const map = getUpdatedPetsFromStorage();
		if (pet.id) {
			map.set(pet.id, pet);
			localStorage.setItem('cached_updated_pets', JSON.stringify(Array.from(map.values())));
		}
	} catch (e) {
		console.error(e);
	}
}

function removeUpdatedPetFromStorage(petId: string): void {
	try {
		const map = getUpdatedPetsFromStorage();
		map.delete(petId);
		localStorage.setItem('cached_updated_pets', JSON.stringify(Array.from(map.values())));
	} catch (e) {
		console.error(e);
	}
}

function getDeletedClientIdsFromStorage(): Set<string> {
	try {
		const stored = localStorage.getItem('cached_deleted_client_ids');
		return stored ? new Set(JSON.parse(stored)) : new Set<string>();
	} catch {
		return new Set<string>();
	}
}

function addDeletedClientToStorage(clientId: string): void {
	try {
		const ids = getDeletedClientIdsFromStorage();
		ids.add(clientId);
		localStorage.setItem('cached_deleted_client_ids', JSON.stringify(Array.from(ids)));
	} catch (e) {
		console.error(e);
	}
}

@Injectable({ providedIn: 'root' })
export class ClientsService {
	private readonly http = inject(HttpClient);

	private readonly apiUrlPropietarios = `${environment.apiUrl}/Propietarios`;
	private readonly apiUrlMascotas = `${environment.apiUrl}/Mascotas`;
	private readonly apiUrlRazas = `${environment.apiUrl}/Razas`;

	private readonly clientsState = signal<Client[]>([]);
	readonly clients = computed(() => this.clientsState());

	constructor() {
		this.loadAll();
	}

	loadAll(): void {
		const deletedClientIds = getDeletedClientIdsFromStorage();
		this.http.get<BaseResponse<Client[]>>(this.apiUrlPropietarios).subscribe({
			next: (res) => {
				if (res.success && res.data) {
					this.clientsState.set(
						res.data.map(formatClient).filter((c) => !deletedClientIds.has(c.id))
					);
				}
			},
			error: (err) => console.error('Error loading clients', err)
		});
	}

	search(query: string): Client[] {
		const normalized = removeAccents(query.trim());
		if (!normalized) {
			return this.clients();
		}

		return this.clients().filter((client) => {
			const fullName = removeAccents(`${client.nombres} ${client.apellidos}`);
			const nombres = removeAccents(client.nombres);
			const apellidos = removeAccents(client.apellidos);
			const celular = removeAccents(client.celular);
			const direccion = removeAccents(client.direccion);

			return (
				nombres.includes(normalized) ||
				apellidos.includes(normalized) ||
				fullName.includes(normalized) ||
				celular.includes(normalized) ||
				direccion.includes(normalized)
			);
		});
	}

	getClientById(id: string): Observable<BaseResponse<Client>> {
		return this.http.get<BaseResponse<Client>>(`${this.apiUrlPropietarios}/${id}`).pipe(
			map(res => {
				if (res.success && res.data) {
					return {
						...res,
						data: formatClient(res.data)
					};
				}
				return res;
			})
		);
	}

	create(payload: CreatePropietarioPayload): Observable<BaseResponse<Client>> {
		return this.http.post<BaseResponse<Client>>(this.apiUrlPropietarios, payload).pipe(
			map(res => {
				if (res.success && res.data) {
					const formatted = formatClient(res.data);
					this.clientsState.update(clients => [formatted, ...clients]);
					return { ...res, data: formatted };
				}
				return res;
			}),
			catchError(err => {
				console.error('Error creating client', err);
				return throwError(() => err);
			})
		);
	}

	update(id: string, payload: UpdatePropietarioPayload): Observable<BaseResponse<Client>> {
		return this.http.put<BaseResponse<Client>>(`${this.apiUrlPropietarios}/${id}`, payload).pipe(
			map((res) => {
				if (res.success && res.data) {
					const formatted = formatClient(res.data);
					this.clientsState.update((clients) =>
						clients.map((c) => (c.id === id ? { ...c, ...formatted } : c))
					);
					return { ...res, data: formatted };
				}
				return res;
			})
		);
	}

	delete(id: string): Observable<BaseResponse<any>> {
		addDeletedClientToStorage(id);
		this.clientsState.update((clients) => clients.filter((c) => c.id !== id));

		return this.http.delete<BaseResponse<any>>(`${this.apiUrlPropietarios}/${id}`).pipe(
			tap({
				next: () => {
					addDeletedClientToStorage(id);
					this.clientsState.update((clients) => clients.filter((c) => c.id !== id));
				},
				error: (err) => {
					console.error('Error in delete client API call', err);
				}
			})
		);
	}

	// ==========================================
	// Mascotas de Clientes
	// ==========================================
	getAllPets(): Observable<BaseResponse<ClientPet[]>> {
		const deletedIds = getDeletedPetIdsFromStorage();
		const cachedMap = getUpdatedPetsFromStorage();

		return this.http.get<BaseResponse<ClientPet[]>>(this.apiUrlMascotas).pipe(
			map(res => {
				if (res.success && res.data) {
					const apiPets = res.data.map(formatPet).filter((p) => !deletedIds.has(p.id!));
					const mergedMap = new Map<string, ClientPet>();
					apiPets.forEach((p) => mergedMap.set(p.id!, p));
					cachedMap.forEach((p, id) => {
						if (!deletedIds.has(id)) {
							mergedMap.set(id, p);
						}
					});
					return { ...res, data: Array.from(mergedMap.values()) };
				}
				return res;
			})
		);
	}

	getPetsByPropietario(propietarioId: string): Observable<BaseResponse<ClientPet[]>> {
		const deletedIds = getDeletedPetIdsFromStorage();
		const cachedMap = getUpdatedPetsFromStorage();

		return this.http.get<BaseResponse<ClientPet[]>>(`${this.apiUrlMascotas}/propietario/${propietarioId}`).pipe(
			map(res => {
				if (res.success && res.data) {
					const apiPets = res.data.map(formatPet).filter((p) => !deletedIds.has(p.id!));
					const mergedMap = new Map<string, ClientPet>();
					apiPets.forEach((p) => mergedMap.set(p.id!, p));
					cachedMap.forEach((p, id) => {
						if (p.propietarioId === propietarioId && !deletedIds.has(id)) {
							mergedMap.set(id, p);
						}
					});
					return { ...res, data: Array.from(mergedMap.values()) };
				}
				return res;
			})
		);
	}

	getPetById(id: string): Observable<BaseResponse<ClientPet>> {
		return this.http.get<BaseResponse<ClientPet>>(`${this.apiUrlMascotas}/${id}`).pipe(
			map(res => {
				if (res.success && res.data) {
					return { ...res, data: formatPet(res.data) };
				}
				return res;
			})
		);
	}

	getMascotas(): Observable<BaseResponse<ClientPet[]>> {
		return this.getAllPets();
	}

	createPet(payload: any): Observable<BaseResponse<ClientPet>> {
		return this.http.post<BaseResponse<ClientPet>>(this.apiUrlMascotas, payload).pipe(
			map(res => {
				if (res.success && res.data) {
					return { ...res, data: formatPet(res.data) };
				}
				return res;
			})
		);
	}

	updatePet(id: string, payload: any): Observable<BaseResponse<ClientPet>> {
		const updatedPet: ClientPet = formatPet({ ...payload, id });
		saveUpdatedPetToStorage(updatedPet);

		return this.http.put<BaseResponse<ClientPet>>(`${this.apiUrlMascotas}/${id}`, payload).pipe(
			map(res => {
				saveUpdatedPetToStorage(updatedPet);
				if (res.success && res.data) {
					return { ...res, data: formatPet(res.data) };
				}
				return { ...res, data: updatedPet };
			})
		);
	}

	deletePet(id: string): Observable<BaseResponse<any>> {
		removeUpdatedPetFromStorage(id);
		addDeletedPetToStorage(id);

		return this.http.delete<BaseResponse<any>>(`${this.apiUrlMascotas}/${id}`).pipe(
			tap({
				next: () => {
					removeUpdatedPetFromStorage(id);
					addDeletedPetToStorage(id);
				},
				error: (err) => {
					console.error('Error in deletePet API call', err);
				}
			})
		);
	}

	// ==========================================
	// Razas
	// ==========================================
	getRazas(): Observable<BaseResponse<Raza[]>> {
		return this.http.get<BaseResponse<Raza[]>>(this.apiUrlRazas);
	}

	// ==========================================
	// Historiales
	// ==========================================
	private readonly apiUrlHistoriales = `${environment.apiUrl}/Historiales`;

	getHistoriales(): Observable<BaseResponse<any[]>> {
		return this.http.get<BaseResponse<any[]>>(this.apiUrlHistoriales);
	}

	createHistorial(payload: any): Observable<BaseResponse<any>> {
		return this.http.post<BaseResponse<any>>(this.apiUrlHistoriales, payload);
	}

	updateHistorial(id: string, payload: any): Observable<BaseResponse<any>> {
		return this.http.put<BaseResponse<any>>(`${this.apiUrlHistoriales}/${id}`, payload);
	}

	deleteHistorial(id: string): Observable<BaseResponse<any>> {
		return this.http.delete<BaseResponse<any>>(`${this.apiUrlHistoriales}/${id}`);
	}

	// ==========================================
	// Controles Sanitarios
	// ==========================================
	private readonly apiUrlControlesSanitarios = `${environment.apiUrl}/ControlesSanitarios`;

	getControlesSanitariosByMascota(mascotaId: string): Observable<BaseResponse<any>> {
		return this.http.get<BaseResponse<any>>(`${this.apiUrlControlesSanitarios}/mascota/${mascotaId}`);
	}

	createControlSanitario(payload: any): Observable<BaseResponse<any>> {
		return this.http.post<BaseResponse<any>>(this.apiUrlControlesSanitarios, payload);
	}

	updateControlSanitario(id: string, payload: any): Observable<BaseResponse<any>> {
		return this.http.put<BaseResponse<any>>(`${this.apiUrlControlesSanitarios}/${id}`, payload);
	}

	deleteControlSanitario(id: string): Observable<BaseResponse<any>> {
		return this.http.delete<BaseResponse<any>>(`${this.apiUrlControlesSanitarios}/${id}`);
	}

	// ==========================================
	// Recordatorios Control Sanitario (Citas)
	// ==========================================
	private readonly apiUrlRecordatorios = `${environment.apiUrl}/RecordatoriosControlSanitario`;

	getRecordatorios(): Observable<BaseResponse<any[]>> {
		return this.http.get<BaseResponse<any[]>>(this.apiUrlRecordatorios);
	}

	updateRecordatorio(id: string, payload: any): Observable<BaseResponse<any>> {
		return this.http.put<BaseResponse<any>>(`${this.apiUrlRecordatorios}/${id}`, payload);
	}

	// ==========================================
	// Productos
	// ==========================================
	private readonly apiUrlProductos = `${environment.apiUrl}/Productos`;

	getProductos(): Observable<BaseResponse<any[]>> {
		return this.http.get<BaseResponse<any[]>>(this.apiUrlProductos);
	}
}
