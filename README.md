# Frontend — Salón de Estudio Colaborativo

Interfaz web del Mini Proyecto 2 (Proyecto Integrador). Se comunica con el Backend API; nunca consulta Firestore directamente.

**Producción:** [https://frontend-mp2-delta.vercel.app]

## Tecnologías

React, TypeScript, Vite, Tailwind CSS, React Router. Despliegue en Vercel.

## Requisitos

- Node.js 22 o superior y npm
- Docker (opcional, para ejecutar con contenedor)

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del Backend API (Render) |
| `VITE_REALTIME_URL` | URL del Backend Realtime (Render) |
| `VITE_FIREBASE_API_KEY` | API key pública de la aplicación web de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Proyecto Firebase, el mismo que utiliza la API |
| `VITE_FIREBASE_APP_ID` | Identificador de la aplicación web |

No se suben credenciales ni claves privadas al repositorio.

La URL de API es el origen, sin agregar `/api`; por ejemplo `http://localhost:3000`.
Obtén la configuración pública en la configuración de la aplicación web de Firebase.
Habilita correo/contraseña y Google en Authentication y comprueba los dominios autorizados.
Reinicia Vite después de cambiar el entorno. Las variables `VITE_...` son públicas;
nunca incluyas Firebase Admin, cuentas de servicio o claves privadas.
El frontend utiliza solo Firebase App y Auth; todos los perfiles pasan por la API.

## Sprint 1 — US-01 y US-02

- `/registro`: registro manual en dos pasos.
- `/registro/usuario`: completar el perfil de Google con nombres, apellidos,
  nombre de usuario y seis avatares, sin solicitar credenciales.
- `/dashboard`: exige sesión y perfil confirmado; su contenido sigue provisional hasta US-03.
- `/ingresar`: acceso mínimo con Google y logotipo local multicolor.
  El formulario de inicio de sesión por correo/contraseña está pendiente de US-03.
- Inicio y Base técnica conservan sus funcionalidades.

La cuenta se crea en Firebase y el perfil en `POST /api/usuarios`, con ID token.
La contraseña nunca se envía a la API. El SDK administra la persistencia de sesión;
no guardamos tokens ni contraseñas en localStorage.
Si falla el perfil, el reintento reutiliza la cuenta autenticada. Tras recargar,
vuelve a `/registro`: se consulta el perfil y se solicitan los datos pendientes
sin volver a pedir contraseña. Los datos de perfil sin guardar deben escribirse
de nuevo; no se persisten formularios localmente.
Solo 404 significa perfil pendiente; otros fallos permiten reintentar la consulta.
Un 409 provoca una consulta para distinguir perfil existente de nombre ocupado.

| Historia | Rama | PR |
|---|---|---|
| US-01 | `feature/US-01-registro-manual` | Integrada en main, commit 701d61c |
| US-02 | `feature/US-02-google-auth` | Implementación local, sin publicar |
| US-03 | Pendiente | Pendiente |

Pruebas, limitaciones y comparación UX: [registro US-01](docs/US-01.md).
En /ingresar, Google utiliza popup iniciado por el clic; si ya existe perfil, redirige al
Panel. Un 404 dirige a completar perfil; errores de API permiten reintentar sin
repetir el popup. Al recargar, Firebase restaura la sesión. No se divide
displayName en nombres/apellidos ni se vinculan proveedores automáticamente.
Se conserva el cierre mínimo de US-01 en /registro y se permite cambiar de cuenta
desde la finalización. El Panel provisional también ofrece Cerrar sesión y
vuelve a /registro tras confirmar el cierre del contexto.
Inicio/cierre general, navegación autenticada, protección
general de rutas y Panel vacío corresponden a US-03.
Flujo, pruebas y configuración de Google: [US-02](docs/US-02.md).

## Ejecución en desarrollo

```bash
npm install
npm run dev
```

La aplicación abre en `http://localhost:5173`.

## Compilación

```bash
npm run build
npm run lint
```

## Ejecución con Docker

Con el archivo `.env` creado:

```bash
docker compose up --build
```

La aplicación queda en `http://localhost:8080`.

## Estructura

```text
src/
├── components/   # common (reutilizables) y layout
├── pages/        # vistas
├── services/     # api, auth, realtime
├── hooks/  contexts/  types/  utils/
```

## Servicios relacionados

- Backend API: https://backend-api-02pq.onrender.com (Swagger: `/api-docs`)
- Backend Realtime: https://backend-realtime-enj6.onrender.com

## Flujo de trabajo en Git

Una rama por historia (por ejemplo `feature/TS-00-docker-readme`), commits con mensajes claros y un pull request por historia hacia `main`.
