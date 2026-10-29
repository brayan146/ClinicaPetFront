export interface Pet {
  id: string;
  nombre: string;
  especie: number;
  tamanio: number;
  sexo: number;
  color?: string;
  fechaNacimiento: string;
  activo?: boolean;
  propietarioId: string;
  razaId?: number | null;
}