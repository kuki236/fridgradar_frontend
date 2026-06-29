# FridgeRadar — Frontend

UI en **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4**, con TanStack Query para fetching, React Hook Form + Zod para formularios, y Zustand para estado local.

- App: <http://localhost:3000>
- Por defecto consume la API en `http://localhost:8000`.

## Requisitos

- Node.js 20+
- npm 10+ (o pnpm/yarn/bun)
- Backend de FridgeRadar corriendo en local (ver [../fridgeradar_backend/README.md](../fridgeradar_backend/README.md))

## Setup

```powershell
cd fridgradar_frontend
npm install
```

## Variables de entorno (opcional)

Por defecto el frontend habla contra `http://localhost:8000`. Si tu backend esta en otra URL o puerto, crea `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> Solo hace falta esa variable. Tras el login, el `access_token` y `refresh_token` se guardan en `localStorage`.

## Scripts

| Comando | Descripcion |
|---|---|
| `npm run dev` | Servidor de desarrollo en <http://localhost:3000> |
| `npm run build` | Build de produccion |
| `npm start` | Sirve el build de produccion |
| `npm run lint` | Pasa ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Corre los tests de `tests/` (productos locales e iconos de categoria) |

## Estructura

```
fridgradar_frontend/
├── src/
│   ├── app/                  # App Router de Next.js
│   │   ├── (auth)/           # /login, /register
│   │   └── (main)/           # dashboard, inventory, expiry, alerts, recipes, shopping, ...
│   ├── components/           # layout + ui (shadcn-style)
│   ├── features/             # auth, household, inventory, expiry, alerts, recipes, shopping, ai, activity
│   ├── i18n/                 # cadenas en/es
│   └── lib/                  # api, i18n, nav, theme, utils
├── tests/                    # tests de utilidades
├── next.config.ts
├── tailwind (PostCSS)
└── package.json
```

## Login de prueba

Tras correr `python scripts/reset_db.py` en el backend, podes entrar con:

- `alice@example.com` / `pass1234`
- `bob@example.com` / `pass1234`
- `lbizarro@gmail.com` / `pass1234`

O registrar uno nuevo en `/register`.

## Notas sobre Next.js 16

Este proyecto usa **Next.js 16.2**, que trae cambios incompatibles con versiones anteriores (App Router, convenciones de archivos, comportamiento de `next dev`/`next build`, etc.). Antes de tocar codigo del framework, consulta `node_modules/next/dist/docs/`.
