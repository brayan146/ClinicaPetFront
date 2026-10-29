# 🐾 Clínica Pet - Sistema de Control y Gestión Veterinaria

<div align="center">

![Angular](https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-7.8-B7178C?style=for-the-badge&logo=reactivex&logoColor=white)
![Vercel Ready](https://img.shields.io/badge/Vercel-Ready-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Status](https://img.shields.io/badge/Status-Completado-success?style=for-the-badge)

<p align="center">
  <b>Plataforma web moderna para la administración clínica veterinaria: historias clínicas, pacientes, propietarios, calendario de citas y recordatorios automatizados por WhatsApp.</b>
</p>

[✨ Ver Demostración en Vivo](#-demostración-en-vivo) • [🚀 Características](#-funcionalidades-principales) • [🛠️ Tecnologías](#%EF%B8%8F-tecnologías-utilizadas) • [💻 Instalación](#-instalación-local)

</div>

---

## 📖 Descripción del Proyecto

**Clínica Pet** es una aplicación web SPA (*Single Page Application*) desarrollada con **Angular 18**, diseñada para simplificar y optimizar la gestión diaria de una clínica veterinaria.

Esta versión ha sido adaptada especialmente para **Portafolio Profesional**:
- Incorpora un **Mock Backend inteligente** con persistencia en `localStorage`.
- No requiere levantar ni configurar un servidor externo para probar la experiencia completa.
- Todas las operaciones CRUD (clientes, mascotas, citas, historias clínicas y controles sanitarios) son **100% funcionales y reactivas**.
- Incluye integración de mensajería directa con **WhatsApp Web** para el envío de recordatorios de citas.

---

## ⚡ Demostración en Vivo

> **Acceso Inmediato**: En la pantalla de inicio de sesión dispones del botón **`⚡ Acceso Rápido Demo (1 Clic)`**, que completa las credenciales e inicia sesión instantáneamente.

- **Usuario de prueba:** `demo@clinicapet.com`
- **Contraseña de prueba:** `demo_password123`

---

## 🌟 Funcionalidades Principales

### 📊 1. Panel de Control (Dashboard)
- Indicadores métricos en tiempo real: total de clientes, mascotas registradas, citas para hoy y citas de la semana.
- Gráfica interactiva de la agenda de los próximos 14 días.
- Lista rápida de próximas citas con acceso en 1 clic a recordatorio de WhatsApp.

### 👥 2. Gestión de Clientes (Propietarios)
- Directorio de clientes con búsqueda inteligente en tiempo real por nombre, teléfono o dirección.
- Alta, edición y baja de propietarios.
- Vista de perfil detallada con listado interactivo de sus mascotas asociadas.

### 🐕 3. Gestión Integral de Mascotas
- Ficha clínica individual por paciente: nombre, especie (Canino, Felino, Exótico), raza, sexo, peso, tamaño, pelaje y fecha de nacimiento.
- Cálculo dinámico y automático de la edad cronológica en años, meses y días.
- Filtrado automático de razas según la especie seleccionada.
- Acceso directo al historial clínico y controles sanitarios.

### 💉 4. Control Sanitario (Vacunas y Desparasitaciones)
- Registro y programación de dosis tanto aplicadas como pendientes a futuro.
- Catálogo de productos veterinarios (Séxtuple, Antirrábica, Triple Felina, NexGard, Bravecto, etc.).
- Clasificación visual por código de color (Azul para Vacunas, Morado para Desparasitantes).
- Marcado de dosis como aplicadas con actualización automática de la agenda.

### 📅 5. Agenda de Citas & Recordatorios por WhatsApp
- Vista cronológica de citas veterinarias.
- Filtros por estado (*Pendiente* / *Enviado*), rango de fechas y filtro exclusivo de "Sólo citas futuras".
- **Botón WhatsApp:** Genera un mensaje profesional con formato Markdown, emoticones, datos del paciente, tipo de servicio y fecha de atención listo para enviar al celular del propietario.

### 📋 6. Historial Clínico
- Registro de atenciones y consultas médicas con fecha, peso, temperatura corporal y costo.
- Registro de motivos de consulta, observaciones y evolución médica.
- Historial ordenado cronológicamente con opción de edición y eliminación.

### 🔄 7. Modo Demo & Reinicio de Datos
- Almacenamiento local aislado para cada visitante.
- Botón **`Reiniciar Datos Demo`** en la barra lateral para restaurar los datos iniciales de prueba en cualquier momento.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** [Angular 18](https://angular.dev/) (Standalone Components, Signals & Router Standalone)
- **Lenguaje:** [TypeScript 5.5](https://www.typescriptlang.org/)
- **Gestión Reactiva:** [RxJS](https://rxjs.dev/)
- **Estilos:** CSS3 Moderno con variables CSS, Flexbox, CSS Grid y diseño Glassmorphism
- **Iconografía:** [Lucide Icons Angular](https://lucide.dev/)
- **Simulación Backend:** `HttpInterceptorFn` personalizado con JWT simulado y persistencia en `localStorage`
- **Despliegue:** Optimizado para [Vercel](https://vercel.com/) (`vercel.json`) y [Netlify](https://www.netlify.com/) (`_redirects`)

---

## 📂 Estructura del Proyecto

```text
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/          # Auth & Guest Guards
│   │   │   ├── interceptors/    # Auth, Error & Mock Backend Interceptors
│   │   │   ├── mock/            # Mock Database & Data Service (LocalStorage)
│   │   │   ├── models/          # Interfaces y contratos de respuesta API
│   │   │   └── services/        # Auth, Session, Toast y API Services
│   │   ├── features/
│   │   │   ├── auth/            # Módulo de Autenticación & Login
│   │   │   ├── clients/         # Módulo de Propietarios y Mascotas
│   │   │   ├── clinical-history/# Módulo de Citas e Historial Clínico
│   │   │   ├── dashboard/       # Shell principal y Dashboard
│   │   │   ├── pets/            # Módulo dedicado a Mascotas
│   │   │   └── vaccinations/    # Esquemas Sanitarios y Vacunaciones
│   │   └── shared/              # Componentes UI reutilizables (Select, Toast, etc.)
│   ├── assets/                  # Imágenes, logos e ilustraciones
│   └── environments/            # Configuraciones de entorno (Demo / Producción)
├── angular.json                 # Configuración del build de Angular
├── vercel.json                  # Reglas de reescritura para rutas SPA en Vercel
└── package.json                 # Dependencias y scripts de ejecución
```

---

## 💻 Instalación Local

Si deseas ejecutar el proyecto en tu máquina local:

### 1. Clonar el repositorio
```bash
git clone https://github.com/brayan146/ClinicaPetFront.git
cd ClinicaPetFront
```

### 2. Instalar dependencias
```bash
npm install
# o con pnpm
pnpm install
```

### 3. Iniciar el servidor de desarrollo
```bash
npm start
```

Abre tu navegador en [http://localhost:4200/](http://localhost:4200/) para explorar la aplicación.

### 4. Generar el Build de Producción
```bash
npm run build
```
El bundle de producción optimizado se generará en la carpeta `dist/emervet/browser`.

---

## ☁️ Despliegue en la Nube

### En Vercel
1. Conecta tu repositorio de GitHub en [vercel.com](https://vercel.com/).
2. Vercel detectará el proyecto Angular automáticamente.
3. Asegúrate de configurar:
   - **Framework Preset**: `Angular`
   - **Output Directory**: `dist/emervet/browser`
4. Presiona **Deploy**.

### En Netlify
- Sube el repositorio conectando con GitHub, o simplemente arrastra la carpeta `dist/emervet/browser` a [app.netlify.com/drop](https://app.netlify.com/drop). El archivo `_redirects` incluido se encargará de resolver todas las rutas SPA.

---

## 👨‍💻 Autor

Desarrollado con dedicación por **Brayan**  
- **GitHub:** [@brayan146](https://github.com/brayan146)
- **Proyecto:** Clínica Pet Frontend

---

<div align="center">
  <sub>⭐ Si este proyecto te resulta útil o interesante para tu aprendizaje, no olvides dejar una estrella en el repositorio.</sub>
</div>
