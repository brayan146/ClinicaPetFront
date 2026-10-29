import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BaseResponse } from '../../../core/models/base-response.interface';
import { Pet } from '../interfaces/pet.interface';

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatPet(p: Pet): Pet {
  return {
    ...p,
    nombre: toTitleCase(p.nombre),
    color: p.color ? toTitleCase(p.color) : p.color
  };
}

function removeAccents(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

@Injectable({
  providedIn: 'root',
})
export class PetsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Mascotas`;

  private readonly petsState = signal<Pet[]>([]);
  readonly pets = computed(() => this.petsState());

  constructor() {
    this.loadAll();
  }

  private getUpdatedPetsFromStorage(): Map<string, Pet> {
    try {
      const stored = localStorage.getItem('cached_updated_pets');
      if (!stored) return new Map();
      const list: Pet[] = JSON.parse(stored);
      const map = new Map<string, Pet>();
      list.forEach((p) => map.set(p.id, formatPet(p)));
      return map;
    } catch {
      return new Map();
    }
  }

  private saveUpdatedPetToStorage(pet: Pet): void {
    try {
      const map = this.getUpdatedPetsFromStorage();
      map.set(pet.id, pet);
      localStorage.setItem('cached_updated_pets', JSON.stringify(Array.from(map.values())));
    } catch (e) {
      console.error('Error saving updated pet cache', e);
    }
  }

  private removeUpdatedPetFromStorage(petId: string): void {
    try {
      const map = this.getUpdatedPetsFromStorage();
      map.delete(petId);
      localStorage.setItem('cached_updated_pets', JSON.stringify(Array.from(map.values())));
    } catch (e) {
      console.error('Error removing updated pet cache', e);
    }
  }

  private getDeletedPetIdsFromStorage(): Set<string> {
    try {
      const stored = localStorage.getItem('cached_deleted_pet_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }

  private addDeletedPetToStorage(petId: string): void {
    try {
      const ids = this.getDeletedPetIdsFromStorage();
      ids.add(petId);
      localStorage.setItem('cached_deleted_pet_ids', JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.error('Error adding deleted pet to storage', e);
    }
  }

  loadAll(): void {
    const deletedIds = this.getDeletedPetIdsFromStorage();

    this.http.get<BaseResponse<Pet[]>>(this.apiUrl).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const apiPets = res.data.map(formatPet).filter((p) => !deletedIds.has(p.id));
          const cachedMap = this.getUpdatedPetsFromStorage();

          const mergedMap = new Map<string, Pet>();
          apiPets.forEach((p) => mergedMap.set(p.id, p));
          cachedMap.forEach((p, id) => {
            if (!deletedIds.has(id)) {
              mergedMap.set(id, p);
            }
          });

          this.petsState.set(Array.from(mergedMap.values()));
        }
      },
      error: (err) => console.error('Error loading pets', err)
    });
  }

  public search(query: string): Pet[] {
    const cleanQuery = removeAccents(query.trim());

    if (!cleanQuery) {
      return this.pets();
    }

    return this.pets().filter(
      (pet) => removeAccents(pet.nombre).includes(cleanQuery)
    );
  }

  public create(payload: Omit<Pet, 'id'>): Observable<BaseResponse<any>> {
    return this.http.post<BaseResponse<any>>(this.apiUrl, payload).pipe(
      tap((res) => {
        if (res.success) {
          this.loadAll();
        }
      })
    );
  }

  public update(petId: string, payload: any): Observable<BaseResponse<any>> {
    const updatedPet: Pet = formatPet({
      ...payload,
      id: petId,
      activo: true
    });

    this.saveUpdatedPetToStorage(updatedPet);
    this.petsState.update((current) => {
      const index = current.findIndex((p) => p.id === petId);
      if (index !== -1) {
        const next = [...current];
        next[index] = { ...next[index], ...updatedPet };
        return next;
      }
      return [updatedPet, ...current];
    });

    return this.http.put<BaseResponse<any>>(`${this.apiUrl}/${petId}`, payload).pipe(
      tap(() => {
        this.saveUpdatedPetToStorage(updatedPet);
      })
    );
  }

  public delete(petId: string): Observable<BaseResponse<any>> {
    this.removeUpdatedPetFromStorage(petId);
    this.addDeletedPetToStorage(petId);

    this.petsState.update((currentPets) => 
      currentPets.filter((pet) => pet.id !== petId)
    );

    return this.http.delete<BaseResponse<any>>(`${this.apiUrl}/${petId}`).pipe(
      tap({
        next: () => {
          this.removeUpdatedPetFromStorage(petId);
          this.addDeletedPetToStorage(petId);
          this.petsState.update((currentPets) => 
            currentPets.filter((pet) => pet.id !== petId)
          );
        },
        error: (err) => {
          console.error('Error in delete API call', err);
        }
      })
    );
  }
}