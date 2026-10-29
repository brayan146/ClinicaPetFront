export interface MockDatabaseSchema {
  propietarios: any[];
  mascotas: any[];
  razas: any[];
  productos: any[];
  historiales: any[];
  controlesSanitarios: any[];
  recordatorios: any[];
}

export function getTodayDateStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const INITIAL_MOCK_DATA: MockDatabaseSchema = {
  razas: [
    { id: 1, nombre: 'Golden Retriever', especie: 1 },
    { id: 2, nombre: 'Bulldog Francés', especie: 1 },
    { id: 3, nombre: 'Pastor Alemán', especie: 1 },
    { id: 4, nombre: 'Poodle (Caniche)', especie: 1 },
    { id: 5, nombre: 'Siberian Husky', especie: 1 },
    { id: 6, nombre: 'Mestizo Canino', especie: 1 },
    { id: 7, nombre: 'Chihuahua', especie: 1 },
    { id: 8, nombre: 'Siamés', especie: 2 },
    { id: 9, nombre: 'Persa', especie: 2 },
    { id: 10, nombre: 'Bengala', especie: 2 },
    { id: 11, nombre: 'Común Europeo', especie: 2 },
    { id: 12, nombre: 'Angora', especie: 2 },
    { id: 13, nombre: 'Conejo Belier', especie: 3 },
    { id: 14, nombre: 'Loro Amazonas', especie: 3 },
    { id: 15, nombre: 'Hurón Doméstico', especie: 3 }
  ],

  productos: [
    { id: 'prod-01', categoriaProductoId: 1, nombre: 'Vacuna Séxtuple Canina', descripcion: 'Parvovirus, Moquillo, Hepatitis, Leptospira, Parainfluenza', activo: true, dosisReferencial: 1 },
    { id: 'prod-02', categoriaProductoId: 1, nombre: 'Vacuna Antirrábica', descripcion: 'Inmunización anual contra el virus de la rabia', activo: true, dosisReferencial: 1 },
    { id: 'prod-03', categoriaProductoId: 1, nombre: 'Vacuna Triple Felina', descripcion: 'Panleucopenia, Rinotraqueitis y Calicivirus', activo: true, dosisReferencial: 1 },
    { id: 'prod-04', categoriaProductoId: 1, nombre: 'Vacuna Puppy DP', descripcion: 'Primovacunación en cachorros (Distemper + Parvo)', activo: true, dosisReferencial: 1 },
    { id: 'prod-05', categoriaProductoId: 2, nombre: 'NexGard Spectra', descripcion: 'Antiparasitario oral interno y externo para caninos', activo: true, dosisReferencial: 1 },
    { id: 'prod-06', categoriaProductoId: 2, nombre: 'Simparica Trio', descripcion: 'Comprimido masticable para pulgas, garrapatas y parásitos', activo: true, dosisReferencial: 1 },
    { id: 'prod-07', categoriaProductoId: 2, nombre: 'Bravecto Chewable', descripcion: 'Protección antiparasitaria por 12 semanas', activo: true, dosisReferencial: 1 },
    { id: 'prod-08', categoriaProductoId: 2, nombre: 'Total Full CG', descripcion: 'Antiparasitario interno de amplio espectro en suspensión', activo: true, dosisReferencial: 1 },
    { id: 'prod-09', categoriaProductoId: 2, nombre: 'Revolution Plus Felino', descripcion: 'Pipeta para parásitos internos y externos en gatos', activo: true, dosisReferencial: 1 }
  ],

  propietarios: [
    {
      id: 'prop-001',
      nombres: 'Alejandro',
      apellidos: 'Morales Vaca',
      celular: '77218945',
      correoElectronico: 'alejandro.morales@gmail.com',
      direccion: 'Av. Las Palmeras #420, Barrio Equipetrol',
      activo: true,
      createdAt: '2026-01-15T09:30:00',
      updatedAt: '2026-02-10T11:20:00'
    },
    {
      id: 'prop-002',
      nombres: 'Mariana',
      apellidos: 'Serrano Torrez',
      celular: '76543210',
      correoElectronico: 'mariana.serrano@hotmail.com',
      direccion: 'Calle Sucre #154, Zona Central',
      activo: true,
      createdAt: '2026-02-01T14:10:00',
      updatedAt: '2026-02-18T16:00:00'
    },
    {
      id: 'prop-003',
      nombres: 'Carlos',
      apellidos: 'Gutiérrez Pinto',
      celular: '71098452',
      correoElectronico: 'carlos.gtz@gmail.com',
      direccion: 'Condominio Sevilla Real, Casa 12-B',
      activo: true,
      createdAt: '2026-02-10T10:00:00',
      updatedAt: '2026-03-01T08:30:00'
    },
    {
      id: 'prop-004',
      nombres: 'Valeria',
      apellidos: 'Ríos Mendoza',
      celular: '78451296',
      correoElectronico: 'valeria.rios@outlook.com',
      direccion: 'Calle Beni #890 esq. 3er Anillo',
      activo: true,
      createdAt: '2026-02-20T16:45:00',
      updatedAt: '2026-03-05T12:00:00'
    }
  ],

  mascotas: [
    {
      id: 'pet-001',
      propietarioId: 'prop-001',
      nombre: 'Toby',
      especie: 1, // Canino
      razaId: 1, // Golden Retriever
      sexo: 1, // Macho
      fechaNacimiento: '2022-04-12',
      peso: 28.5,
      unidadPeso: 1, // Kg
      color: 'Dorado Claro',
      tamanio: 3, // Grande
      detalle: 'Paciente dócil, con esquema de vacunas anual al día.',
      activo: true,
      createdAt: '2026-01-15T09:35:00',
      updatedAt: '2026-02-10T11:20:00'
    },
    {
      id: 'pet-002',
      propietarioId: 'prop-001',
      nombre: 'Milo',
      especie: 2, // Felino
      razaId: 8, // Siamés
      sexo: 3, // Macho Castrado
      fechaNacimiento: '2023-08-20',
      peso: 4.2,
      unidadPeso: 1,
      color: 'Seal Point Crema',
      tamanio: 1, // Pequeño
      detalle: 'Tratamiento preventivo para bolas de pelo y desparasitación.',
      activo: true,
      createdAt: '2026-01-15T09:40:00',
      updatedAt: '2026-02-15T10:00:00'
    },
    {
      id: 'pet-003',
      propietarioId: 'prop-002',
      nombre: 'Luna',
      especie: 1,
      razaId: 2, // Bulldog Francés
      sexo: 4, // Hembra Esterilizada
      fechaNacimiento: '2024-01-10',
      peso: 11.2,
      unidadPeso: 1,
      color: 'Blanco con Manchas Negras',
      tamanio: 2, // Mediano
      detalle: 'Sensible a altas temperaturas (braquicéfalo). Piel con dermatitis leve controlada.',
      activo: true,
      createdAt: '2026-02-01T14:15:00',
      updatedAt: '2026-02-18T16:00:00'
    },
    {
      id: 'pet-004',
      propietarioId: 'prop-003',
      nombre: 'Thor',
      especie: 1,
      razaId: 3, // Pastor Alemán
      sexo: 1,
      fechaNacimiento: '2021-11-05',
      peso: 34.0,
      unidadPeso: 1,
      color: 'Negro y Fuego',
      tamanio: 3,
      detalle: 'Excelente condición física. Control periódico de articulaciones.',
      activo: true,
      createdAt: '2026-02-10T10:10:00',
      updatedAt: '2026-03-01T08:30:00'
    },
    {
      id: 'pet-005',
      propietarioId: 'prop-004',
      nombre: 'Kiwi',
      especie: 3, // Exótico
      razaId: 14, // Loro Amazonas
      sexo: 2,
      fechaNacimiento: '2023-03-15',
      peso: 0.45,
      unidadPeso: 1,
      color: 'Verde Brillante con Amarillo',
      tamanio: 1,
      detalle: 'Alimentación balanceada a base de semillas y frutas frescas. Control de pico y plumas.',
      activo: true,
      createdAt: '2026-02-20T16:50:00',
      updatedAt: '2026-03-05T12:00:00'
    }
  ],

  historiales: [
    {
      id: 'hist-001',
      mascotaId: 'pet-001',
      tipoAtencion: 1,
      fecha: getTodayDateStr(-25) + 'T10:00:00',
      edad: '3 años y 10 meses',
      peso: 28.5,
      unidadPeso: 1,
      temperatura: 38.4,
      costo: 120,
      motivoConsulta: 'Chequeo general de rutina y control de peso. Paciente activo y con mucosas normales.',
      observaciones: 'Se sugiere continuar con su dieta balanceada de mantenimiento.',
      personalId: 'b4f35e05-1fec-4525-bcb1-c8fc41b9199e',
      activo: true,
      createdAt: getTodayDateStr(-25) + 'T10:00:00',
      updatedAt: getTodayDateStr(-25) + 'T10:00:00'
    },
    {
      id: 'hist-002',
      mascotaId: 'pet-003',
      tipoAtencion: 1,
      fecha: getTodayDateStr(-10) + 'T15:30:00',
      edad: '2 años y 1 mes',
      peso: 11.2,
      unidadPeso: 1,
      temperatura: 38.6,
      costo: 150,
      motivoConsulta: 'Consulta por prurito leve en pliegues faciales y orejas.',
      observaciones: 'Se limpiaron pliegues con clorhexidina al 2% y se recetó ungüento dérmico cada 12 horas.',
      personalId: 'b4f35e05-1fec-4525-bcb1-c8fc41b9199e',
      activo: true,
      createdAt: getTodayDateStr(-10) + 'T15:30:00',
      updatedAt: getTodayDateStr(-10) + 'T15:30:00'
    }
  ],

  controlesSanitarios: [
    {
      id: 'ctrl-001',
      mascotaId: 'pet-001',
      productoId: 'prod-01',
      producto: 'Vacuna Séxtuple Canina',
      fechaAplicacion: getTodayDateStr(-60),
      fechaProgramada: getTodayDateStr(0), // HOY
      aplicacion: 1,
      lote: 'LT-8849',
      observaciones: 'Registro anual de inmunización preventiva.',
      estado: 0 // Pendiente (Cita Hoy)
    },
    {
      id: 'ctrl-002',
      mascotaId: 'pet-001',
      productoId: 'prod-05',
      producto: 'NexGard Spectra',
      fechaAplicacion: getTodayDateStr(-30),
      fechaProgramada: getTodayDateStr(3), // En 3 días
      aplicacion: 1,
      lote: 'NX-9011',
      observaciones: 'Comprimido masticable para parásitos internos y externos.',
      estado: 0 // Pendiente
    },
    {
      id: 'ctrl-003',
      mascotaId: 'pet-002',
      productoId: 'prod-03',
      producto: 'Vacuna Triple Felina',
      fechaAplicacion: getTodayDateStr(-90),
      fechaProgramada: getTodayDateStr(5), // En 5 días
      aplicacion: 1,
      lote: 'TF-4412',
      observaciones: 'Refuerzo programado contra rinotraqueitis y calicivirus.',
      estado: 0 // Pendiente
    },
    {
      id: 'ctrl-004',
      mascotaId: 'pet-003',
      productoId: 'prod-07',
      producto: 'Bravecto Chewable',
      fechaAplicacion: getTodayDateStr(-85),
      fechaProgramada: getTodayDateStr(1), // Mañana
      aplicacion: 1,
      lote: 'BR-1029',
      observaciones: 'Protección trimestral contra pulgas y garrapatas.',
      estado: 0 // Pendiente
    },
    {
      id: 'ctrl-005',
      mascotaId: 'pet-004',
      productoId: 'prod-02',
      producto: 'Vacuna Antirrábica',
      fechaAplicacion: getTodayDateStr(-15),
      fechaProgramada: getTodayDateStr(-15),
      aplicacion: 1,
      lote: 'RAB-3392',
      observaciones: 'Vacunación antirrábica obligatoria aplicada.',
      estado: 1 // Aplicado
    }
  ],

  recordatorios: [
    {
      id: 'rec-001',
      mascotaId: 'pet-001',
      nombreMascota: 'Toby',
      propietarioId: 'prop-001',
      nombrePropietario: 'Alejandro Morales Vaca',
      productoId: 'prod-01',
      nombreProducto: 'Vacuna Séxtuple Canina',
      fechaProgramada: getTodayDateStr(0) + 'T09:00:00', // Hoy
      fechaEnvio: null,
      estado: 0 // Pendiente
    },
    {
      id: 'rec-002',
      mascotaId: 'pet-003',
      nombreMascota: 'Luna',
      propietarioId: 'prop-002',
      nombrePropietario: 'Mariana Serrano Torrez',
      productoId: 'prod-07',
      nombreProducto: 'Bravecto Chewable',
      fechaProgramada: getTodayDateStr(1) + 'T10:30:00', // Mañana
      fechaEnvio: null,
      estado: 0 // Pendiente
    },
    {
      id: 'rec-003',
      mascotaId: 'pet-001',
      nombreMascota: 'Toby',
      propietarioId: 'prop-001',
      nombrePropietario: 'Alejandro Morales Vaca',
      productoId: 'prod-05',
      nombreProducto: 'NexGard Spectra',
      fechaProgramada: getTodayDateStr(3) + 'T15:00:00', // En 3 días
      fechaEnvio: null,
      estado: 0 // Pendiente
    },
    {
      id: 'rec-004',
      mascotaId: 'pet-002',
      nombreMascota: 'Milo',
      propietarioId: 'prop-001',
      nombrePropietario: 'Alejandro Morales Vaca',
      productoId: 'prod-03',
      nombreProducto: 'Vacuna Triple Felina',
      fechaProgramada: getTodayDateStr(5) + 'T16:30:00', // En 5 días
      fechaEnvio: null,
      estado: 0 // Pendiente
    }
  ]
};
