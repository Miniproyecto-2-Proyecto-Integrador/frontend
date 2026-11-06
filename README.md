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

No se suben credenciales ni claves privadas al repositorio.

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