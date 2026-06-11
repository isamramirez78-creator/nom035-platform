# 🚀 Guía de Despliegue en Railway

## Requisitos previos
- Cuenta en [Railway](https://railway.app)
- Repositorio en GitHub con este código

---

## Paso 1 — Crear proyecto en Railway

1. Entra a railway.app → **New Project**
2. Selecciona **Deploy from GitHub repo**
3. Conecta tu repo de GitHub

---

## Paso 2 — Agregar base de datos PostgreSQL

1. En tu proyecto Railway → **+ New Service** → **Database** → **PostgreSQL**
2. Railway automáticamente crea `DATABASE_URL` y la inyecta en tu app

---

## Paso 3 — Configurar variables de entorno

En tu servicio → **Variables**, agrega:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Cadena aleatoria larga (mínimo 32 chars) |
| `STRIPE_SECRET_KEY` | `sk_live_...` (de tu dashboard Stripe) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (de Stripe webhooks) |
| `VITE_STRIPE_PUBLIC_KEY` | `pk_live_...` |
| `SENDGRID_API_KEY` | `SG...` (de tu cuenta SendGrid) |
| `FROM_EMAIL` | `no-reply@tudominio.com` |
| `FROM_NAME` | `NOM-035 Platform` |
| `BASE_URL` | `https://tu-app.up.railway.app` |

> **Nota:** `DATABASE_URL` se agrega automáticamente al conectar la BD.

---

## Paso 4 — Deploy

Railway detecta automáticamente el `railway.json` y ejecuta:
1. `npm ci` — instala dependencias
2. `npm run build` — compila frontend + backend
3. `npm run db:push` — crea/actualiza tablas en PostgreSQL
4. `npm start` — arranca el servidor

---

## Paso 5 — Verificar

- Abre la URL de Railway (ej. `https://nom035.up.railway.app`)
- Verifica el health check: `/api/health` → debe responder `{"status":"ok"}`
- Registra tu primera empresa y prueba el flujo completo

---

## Comandos útiles en local

```bash
# Instalar dependencias
npm install

# Desarrollo local (necesitas DATABASE_URL en .env)
npm run dev

# Build de producción
npm run build

# Aplicar migraciones a la BD
npm run db:push
```

---

## Estructura de costos estimada en Railway

| Servicio | Costo aprox. |
|---|---|
| App (Hobby plan) | ~$5 USD/mes |
| PostgreSQL | ~$5 USD/mes |
| **Total** | **~$10 USD/mes** |

