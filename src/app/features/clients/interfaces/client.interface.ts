export interface Client {
	id: string;
	nombres: string;
	apellidos: string;
	nombreCompleto?: string;
	celular: string;
	direccion: string;
	correoElectronico?: string;
	activo: boolean;
	pets?: ClientPet[];
	createdAt?: string;
	updatedAt?: string;
}


export interface ClientPet {
	id?: string;
	nombre: string;
	especie: number;
	tamanio: number;
	sexo: number;
	color?: string;
	peso: number;
	unidadPeso?: string;
	detalle?: string;
	fechaNacimiento?: string;
	activo?: boolean;
	propietarioId?: string;
	razaId?: number | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface Raza {
	id: number;
	nombre: string;
	especie: number;
	activo: boolean;
}

export interface CreatePropietarioPayload {
	nombres: string;
	apellidos: string;
	celular: string;
	direccion: string;
	correoElectronico?: string;
}

export interface UpdatePropietarioPayload {
	nombres: string;
	apellidos: string;
	celular: string;
	direccion: string;
	correoElectronico?: string;
	activo: boolean;
}
