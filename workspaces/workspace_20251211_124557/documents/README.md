# Gestión Verde — Plataforma operativa para Apical y Don Rolo

Plataforma web **mobile first** que centraliza los ingresos, egresos, costos fijos, sueldos y reportes de los locales Apical y Don Rolo. El proyecto reúne backend, frontend y la integración con el bot de WhatsApp que consumen los equipos administrativos y cajeros.

## Tabla de contenidos
- [Razón de ser del producto](#razón-de-ser-del-producto)
- [Casos de uso principales](#casos-de-uso-principales)
- [Arquitectura general](#arquitectura-general)
- [Pila tecnológica](#pila-tecnológica)
- [Módulos funcionales](#módulos-funcionales)
- [Roles y permisos](#roles-y-permisos)
- [Modelo de datos](#modelo-de-datos)
- [Integraciones externas](#integraciones-externas)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Configuración y puesta en marcha](#configuración-y-puesta-en-marcha)
- [Scripts y automatizaciones](#scripts-y-automatizaciones)
- [Flujo operativo recomendado](#flujo-operativo-recomendado)
- [Seguridad y observabilidad](#seguridad-y-observabilidad)
- [Roadmap sugerido](#roadmap-sugerido)

## Razón de ser del producto
- Unifica los procesos financieros diarios de dos locales con operaciones similares, evitando planillas dispersas y mensajes de chat como única fuente de verdad.
- Permite tomar decisiones rápidas sobre ventas, gastos y disponibilidad de caja en tiempo real, incluso cuando la administración está fuera del local.
- Ofrece una base extensible para sumar futuros canales (nuevos locales, bot conversacional, automatizaciones de pago) sin reescribir el core.

## Casos de uso principales
- **Registro de caja por turno**: los cajeros documentan ingresos y egresos por método de pago y turno, con auditoría automática.
- **Gestión de proveedores y costos fijos**: admins cargan proveedores, tipos de gasto recurrente y pagos asociados.
- **Control de sueldos**: los cajeros autodeclaran cobros de sueldo y el rol `system` puede liquidar sueldos de terceros.
- **Reportes diarios y cierre de caja**: paneles para admins y cajeros con métricas agregadas, y endpoint `/reportes` para generar informes descargables.
- **Alertas vía WhatsApp**: Evolution API + n8n consultan `/bot/daily-report` para enviar resúmenes en formato amigable.
- **Expansión multi-store**: un mismo usuario puede operar varios locales; admins/`system` acceden a todos.

## Arquitectura general
```
[Usuarios (cajeros/admin/system)]
        │  React + Vite (frontend)
        ▼
 [HTTP/JSON via Axios + JWT]
        ▼
 [API Express (Node 18)]
        │    ├─ Autenticación JWT
        │    ├─ Ingresos / egresos / sueldos / costos fijos / reportes
        │    └─ Endpoints Bot (X-Bot-Token)
        ▼
  [Prisma ORM] → [MySQL 8]

Bots WhatsApp → Evolution API → n8n → /bot/* endpoints → respuestas formateadas
```

## Pila tecnológica
### Backend
- Node.js 18+, Express 4, CORS y middlewares propios.
- Prisma Client 5 + MySQL 8 (migraciones y seeding incluido).
- Autenticación JWT (HS256) con expiración configurable y scopes por rol.
- Scripts de utilidad (`generate-bot-token`, `db:seed`, `prisma:generate`).

### Frontend
- React 18 + Vite + TypeScript.
- Tailwind CSS + PostCSS para estilos mobile-first.
- Zustand (estado global persistido en `localStorage`) y React Router 6.
- Axios con interceptores para inyectar el token y forzar logout en 401.

### Tooling y automatizaciones
- n8n + Evolution API para el bot de WhatsApp.
- Nodemon para DX en backend, scripts bash para probar el bot.
- Archivo `.env.example` en backend y frontend para guiar la configuración.

## Módulos funcionales
### Backend API
- **`/auth`**: login por email/password y emisión de JWT.
- **`/ingresos`**: CRUD con pagos múltiples, auditoría (`IncomeAuditLog`) y filtros por fechas/turnos; incluye `/ingresos/bulk` y `/ingresos/bot` para integraciones.
- **`/egresos`**: registro de gastos de proveedores y sueldos, soporte multi-método de pago y validaciones de rol (solo admin/system pueden eliminar).
- **`/sueldos`**: flujo especial para cajeros (auto registro) y para `system` (liquidar sueldos ajenos).
- **`/costos-fijos` y `/fixed-expense-types`**: catálogo por local y registro de costos recurrentes.
- **`/reportes`**: endpoints para reportes diarios, detalle de ingresos/egresos y cierre de caja, usados por el frontend y el bot.
- **`/providers`, `/stores`, `/users`, `/shifts`**: administración de catálogos, turnos y relaciones usuario-local.
- **`/bot`**: `GET /bot/daily-report` y helpers para generar mensajes listos para WhatsApp usando `X-Bot-Token`.
- **`/health`**: chequeo simple para monitoreo.

### Frontend web
- **Autenticación y layout** (`MainLayout`): switch de locales, shortcuts a las páginas principales y guardas de ruta por rol.
- **Ingresos y egresos** (`IngresosPage`, `EgresosPage`): formularios dinámicos con múltiples métodos de pago, selección automática de turno y modales de auditoría.
- **Costos fijos** (`CostosFijosPage`): listado, filtros por tipo y creación con validaciones.
- **Sueldos** (`CobrarSueldoPage`, `CargarSueldosCajerosPage`): flujos separados para cajeros y `system`.
- **Reportes** (`ReportesPage` + subrutas): paneles de resumen general, ventas, detalle de movimientos y cierre de caja (los cajeros solo ven el cierre).
- **Configuración** (`ConfiguracionPage`): catálogo de proveedores, turnos y tipos de costos accesible a admins/system.
- **UI Kit** (`components/ui`): botones, tarjetas, inputs, selects, modales, toasts, etc., diseñados para operar desde el teléfono.

## Roles y permisos
| Rol     | Alcance |
|---------|---------|
| `cajero` | Registra ingresos/egresos propios, cobra sueldos individuales, ve cierre de caja y reportes limitados. |
| `admin`  | Acceso completo a todos los locales: crear/editar usuarios, costos, reportes avanzados, eliminar egresos. |
| `system` | Superusuario técnico: puede operar en nombre de cajeros (sueldos), administrar tiendas y exponer endpoints especiales/bot. |

La relación usuario-local se controla vía tabla `UserStore`; admins/system obtienen acceso automático a todos los locales.

## Modelo de datos
Los modelos Prisma (ver `backend/prisma/schema.prisma`) cubren:
- **Store** y **User**: relación muchos-a-muchos mediante `UserStore`.
- **Income** y **IncomePayment**: montos por método, turno y usuario; `IncomeAuditLog` guarda snapshots `before/after`.
- **Expense** / **ExpensePayment**: incluye categorías (`PROVEEDOR`, `SUELDO`) y vinculación opcional a `Provider`.
- **Shift**: rangos horarios para turnos diurnos/nocturnos.
- **FixedExpenseType** y **FixedExpense**: costos recurrentes por local con pagos asociados.
- **Provider**: datos de contacto y estado activo.

Indices y claves foráneas están configurados para facilitar reporting por fechas, store y turno.

## Integraciones externas
- **Bot de WhatsApp** (`backend/BOT_INTEGRATION.md` y `QUICKSTART_BOT.md`): describe la arquitectura Evolution API → n8n → backend. Requiere `X-Bot-Token` que debe coincidir con `BOT_API_TOKEN` en el backend.
- **Endpoints bot**:
  - `GET /bot/daily-report`: resumen diario con payload estructurado + campo `formatted` listo para enviar por WhatsApp.
  - `POST /ingresos/bot` y `POST /egresos/bot`: permiten registrar movimientos desde el workflow.
- **Scripts relacionados**:
  - `npm run generate-bot-token`: genera tokens aleatorios seguros.
  - `test-bot-endpoint.sh`: prueba rápida del endpoint con `curl`.
- **Buenas prácticas**: token largo y aleatorio, whitelist de números en n8n, HTTPS en producción y logs para trazabilidad.

## Estructura del repositorio
```
.
├── backend
│   ├── package.json / package-lock.json
│   ├── BOT_INTEGRATION.md / QUICKSTART_BOT.md
│   ├── prisma
│   │   ├── schema.prisma
│   │   ├── migrations/**
│   │   └── seed.js
│   ├── src
│   │   ├── server.js
│   │   ├── config/prismaClient.js
│   │   ├── middleware/auth.js
│   │   ├── routes/*.js (auth, ingresos, egresos, reportes, etc.)
│   │   └── utils/**
│   └── .env.example
├── frontend
│   ├── package.json / package-lock.json
│   ├── src
│   │   ├── App.tsx / main.tsx / index.css
│   │   ├── api/client.ts
│   │   ├── layouts/MainLayout.tsx
│   │   ├── pages/**
│   │   ├── components/**
│   │   └── store/auth.ts
│   └── .env.example
└── README.md
```

## Configuración y puesta en marcha
### Requisitos
- Node.js 18+
- npm 9+
- MySQL 8 (o compatible con Prisma)

### Variables de entorno
1. Backend:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Actualiza:
   - `DATABASE_URL` con tus credenciales MySQL.
   - `JWT_SECRET` y `JWT_EXPIRES_IN`.
   - `SEED_DEFAULT_PASSWORD` para los usuarios seed.
   - `BOT_API_TOKEN` para la integración con WhatsApp/n8n.
2. Frontend:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   Ajusta `VITE_API_URL` según la URL del backend.

### Instalación de dependencias
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Base de datos
```bash
cd backend
npx prisma generate
npx prisma migrate deploy   # o migrate dev en entornos locales
npm run db:seed             # crea stores, usuarios y turnos iniciales
```

Usuarios seed (contraseña en `SEED_DEFAULT_PASSWORD`):
- Admin: `admin@gestionverde.com`
- Cajero Apical: `cajero.apical@gestionverde.com`
- Cajero Don Rolo: `cajero.donrolo@gestionverde.com`

### Levantar servidores
```bash
# Backend
cd backend
npm run dev

# Frontend (nueva terminal)
cd frontend
npm run dev
```
- API: `http://localhost:4000`
- Frontend: `http://localhost:5173`

## Scripts y automatizaciones
### Backend
- `npm run dev`: nodemon + hot reload.
- `npm start`: servidor Express productivo.
- `npm run prisma:generate`: regenera Prisma Client.
- `npm run db:migrate` / `npm run db:migrate:dev`: aplica migraciones.
- `npm run db:seed`: siembra datos iniciales.
- `npm run generate-bot-token`: imprime un nuevo token seguro.

### Frontend
- `npm run dev`: arranca Vite con HMR.
- `npm run build`: compila assets para producción.
- `npm run preview`: sirve el build final para QA.

## Flujo operativo recomendado
1. **Inicio de turno**: el cajero inicia sesión desde el móvil, selecciona su local y valida el turno sugerido automáticamente.
2. **Registro de ingresos**: cada venta se carga con método de pago y descripción corta. El total consolidado se actualiza en tiempo real y queda logueado en `IncomeAuditLog`.
3. **Registro de egresos/costos**: se documentan compras a proveedores o retiros de caja indicando categoría y justificativo.
4. **Sueldos**: el cajero puede registrar cobros propios; el rol `system` puede cargar sueldos para otros cajeros y diferentes locales.
5. **Reportes/Cierre**: admins/system generan reportes generales; cajeros validan el cierre de caja diariamente.
6. **Bot**: el administrador envía “reporte” por WhatsApp; n8n consulta `/bot/daily-report` y responde con el mensaje formateado.

## Seguridad y observabilidad
- Autenticación JWT en todas las rutas internas (`Authorization: Bearer ...`), con logout automático en frontend ante 401.
- `IncomeAuditLog` registra cada creación/edición/eliminación para admins/system.
- Restricciones por rol en backend (`requireRoles`) y protección de rutas en frontend (`RequireRoles`).
- `X-Bot-Token` obligatorio en endpoints de bot; utilidades en `backend/BOT_INTEGRATION.md` explican cómo rotarlo.
- CORS configurado para dominios productivos y localhost.
- Endpoints sensibles (eliminar egresos) limitados a `admin`.

## Roadmap sugerido
- Automatizar validaciones avanzadas en formularios (múltiples comprobantes, adjuntos).
- Exportar reportes a CSV/PDF y exponerlos vía correo o bot.
- Añadir pruebas automatizadas (unitarias y de integración) para ingresos/egresos y componentes críticos del frontend.
- Incluir dashboards avanzados orientados a escritorio y KPIs históricos.
- Agregar rate limiting y logging estructurado (Pino/Winston) para los endpoints del bot y de autenticación.

Con esta base puedes extender tanto las capacidades operativas como las integraciones conversacionales sin perder trazabilidad ni control sobre los datos financieros diarios.
