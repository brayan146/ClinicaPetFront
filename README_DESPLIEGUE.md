# Guía para Subir el Frontend a tu Portafolio 🚀

Este proyecto ha sido adaptado para funcionar como una **aplicación web interactiva standalone (Modo Portafolio)**. No necesita que tengas un backend C# (.NET) hosteado en un servidor: cuenta con un **Mock Backend inteligente sincronizado con `localStorage`**.

---

## ✨ Características del Modo Portafolio

1. **Acceso Demo en 1 Clic**: En la pantalla de inicio de sesión (`/auth/login`), cualquier reclutador o visitante puede presionar el botón **`⚡ Acceso Rápido Demo (1 Clic)`** para ingresar directamente.
2. **Base de Datos Local Persistente**:
   - Todo lo que crees, edites o elimines (clientes, mascotas, atenciones, vacunas, desparasitaciones, recordatorios) se almacena en el navegador del visitante.
   - Si recargas la página o cierras el navegador, los cambios persisten.
3. **Botón de Reinicio**: En la barra lateral izquierda hay un botón **`🔄 Reiniciar Datos Demo`** por si el evaluador desea volver a tener los datos de prueba originales.
4. **Citas y Recordatorios por WhatsApp**: Las citas están listas para probar el botón de WhatsApp directo con mensajes preformateados.
5. **Enrutamiento SPA**: Incluye archivos de configuración (`vercel.json` y `_redirects`) para que nunca dé error 404 al recargar cualquier página en producción.

---

## 🌐 Opción 1: Subir a Vercel (Recomendado - 2 minutos)

Vercel es gratuito, súper rápido y la opción estándar para portafolios.

### Paso A: Subir la carpeta `frontend` a un repositorio de GitHub
1. Abre tu terminal en la carpeta `frontend`:
   ```bash
   git init
   git add .
   git commit -m "feat: portfolio demo mode"
   ```
2. Crea un repositorio en tu cuenta de GitHub (ej. `clinica-pet-frontend`) y sube tu código:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/clinica-pet-frontend.git
   git branch -M main
   git push -u origin main
   ```

### Paso B: Conectar a Vercel
1. Entra a [vercel.com](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Selecciona tu repositorio `clinica-pet-frontend` y haz clic en **"Import"**.
4. En la configuración de Build:
   - **Framework Preset**: Angular
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/emervet/browser`
5. Haz clic en **"Deploy"**. En 60 segundos tendrás tu enlace público `https://tu-proyecto.vercel.app` listo para colocar en tu CV, LinkedIn y portafolio.

---

## 🌐 Opción 2: Subir a Netlify (Arrastrar y Soltar - 1 minuto)

Si no deseas conectar GitHub todavía y prefieres tener un enlace ya mismo:

1. Ejecuta en la terminal de `frontend`:
   ```bash
   npm run build
   ```
2. Ve a la carpeta generada:
   ```
   frontend/dist/emervet/browser
   ```
3. Entra a [app.netlify.com/drop](https://app.netlify.com/drop) (inicia sesión gratis).
4. Arrastra la carpeta **`browser`** al recuadro de Netlify.
5. ¡Listo! Netlify te dará una URL pública al instante.

---

## 🛠️ Cómo volver al Backend Real en el Futuro

Si en el futuro decides desplegar tu API de C# .NET y conectar el frontend a ella:
1. Abre [environment.ts](src/environments/environment.ts):
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://tu-api-en-produccion.com/api',
     demoMode: false // Al ponerlo en false, usa el backend real
   };
   ```
2. ¡Y listo! Todo el código original sigue intacto.
