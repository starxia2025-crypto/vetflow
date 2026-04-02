# VetFlow en Easypanel

## Arquitectura recomendada

- Servicio `vetflow-api`: FastAPI en `backend`
- Servicio `vetflow-web`: React compilado y servido con Nginx en `frontend`
- Servicio `vetflow-db`: Postgres gestionado por Easypanel o Postgres externo

## Dominios recomendados

- `erp.tudominio.com` -> servicio `vetflow-web`
- `api.erp.tudominio.com` -> servicio `vetflow-api`

## Google OAuth

En Google Cloud debes configurar:

- `Authorized JavaScript origins`
  - `https://erp.tudominio.com`
  - `https://api.erp.tudominio.com`
- `Authorized redirect URIs`
  - `https://api.erp.tudominio.com/api/auth/google/callback`

## Servicio API

- Tipo: `App`
- Source: repositorio Git
- Working directory: `backend`
- Dockerfile path: `backend/Dockerfile`
- Port: `8000`

### Variables del API

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/vetflow
APP_BASE_URL=https://erp.tudominio.com
API_BASE_URL=https://api.erp.tudominio.com
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
COOKIE_DOMAIN=
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
ACCESS_TOKEN_EXPIRE_DAYS=30
CORS_ORIGINS=https://erp.tudominio.com,https://api.erp.tudominio.com
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=VetFlow CRM
SSO_SHARED_SECRET=el-mismo-secreto-compartido-que-usa-starxia
```

### Notas del API

- Si web y api van en subdominios distintos, deja `COOKIE_SAMESITE=lax`.
- Si más adelante quieres compartir cookie entre subdominios, usa `COOKIE_DOMAIN=.tudominio.com`.
- El backend crea tablas automáticamente al arrancar.
- La primera cuenta por email o por Google crea también la clínica inicial.

## Servicio Web

- Tipo: `App`
- Source: repositorio Git
- Working directory: `frontend`
- Dockerfile path: `frontend/Dockerfile`
- Port: `80`

### Build arg del Web

```env
REACT_APP_BACKEND_URL=https://api.erp.tudominio.com
REACT_APP_PORTAL_URL=https://www.starxia.com
```

### Notas del Web

- El frontend no necesita proxy interno si usa `REACT_APP_BACKEND_URL`.
- Si cambias el dominio de la API, debes reconstruir el servicio web.

## Orden recomendado de despliegue

1. Crear o conectar Postgres.
2. Desplegar `vetflow-api` con sus variables.
3. Confirmar que responde `GET /api/`.
4. Configurar Google OAuth con el redirect del API.
5. Desplegar `vetflow-web` con `REACT_APP_BACKEND_URL`.
6. Abrir `erp.tudominio.com` y probar:
   - registro por email
   - login por email
   - login con Google
   - dashboard

## Endpoints útiles para prueba

- `GET https://api.erp.tudominio.com/api/`
- `GET https://api.erp.tudominio.com/api/auth/me`

## Estado actual

Esta base ya incluye:

- auth por email y contraseña
- login con Google
- sesión por cookie
- dashboard
- clientes
- mascotas
- doctores
- gabinetes
- especies y razas
- inventario
- facturas

Pendiente de endurecer en una siguiente fase:

- migraciones Alembic
- envío SMTP real
- asistente IA conectado al modelo final
- limpieza del código legado de `backend/server.py`
