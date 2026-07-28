# FieldSync - README

## 📋 Información General

**FieldSync** es una plataforma SaaS multi-tenant basada en la nube, accesible como Progressive Web App (PWA), orientada a la gestión integral de canchas deportivas de fútbol y al seguimiento competitivo de jugadores, equipos y torneos.

**Integrantes:**
- Vanessa Amador Jiménez
- Daniel Saborío Rodríguez

**Proyecto:** ITI-823 — Proyecto Integrador III: Desarrollo de Software II

---

## 🎯 Visión del Proyecto

Para administradores de canchas deportivos, organizadores de equipo y jugadores de fútbol amateur que sufren porque las reservas se coordinan por WhatsApp, los torneos se organizan en hojas de cálculo y los jugadores no tienen acceso a su historial ni estadísticas propias, **FieldSync** es una plataforma SaaS accesible como PWA desde cualquier dispositivo que unifica en un solo ecosistema la reserva de canchas en tiempo real, la gestión completa de torneos y ligas, la administración de plantillas y el perfil deportivo portable de cada jugador.

---

## 📊 Historias de Usuario

### HU-01 · Sprint 1 · 5 Story Points

**Como** cliente registrado, **quiero** visualizar la disponibilidad de canchas en tiempo real, **para** seleccionar y confirmar una reserva sin necesidad de llamar a la cancha.

**Criterios de aceptación:**
- **DADO** que soy un cliente autenticado, **CUANDO** ingreso al módulo de reservas, **ENTONCES** el sistema muestra todas las canchas con su disponibilidad actualizada por franja horaria.
- **DADO** que selecciono una cancha disponible, **CUANDO** confirmo la reserva, **ENTONCES** el sistema la registra, bloquea el horario de forma instantánea y envía una notificación push de confirmación.
- **DADO** que dos clientes intentan reservar simultáneamente la misma franja, **CUANDO** el primero confirma, **ENTONCES** el segundo recibe un mensaje de "franja no disponible" y el sistema sugiere la próxima franja libre.

---

### HU-02 · Sprint 1 · 8 Story Points

**Como** cliente registrado, **quiero** cancelar una reserva existente, **para** liberar el horario cuando no pueda asistir y recuperar mi crédito conforme a la política de cancelación.

**Criterios de aceptación:**
- **DADO** que tengo una reserva activa con más de 24 horas de anticipación, **CUANDO** selecciono "Cancelar reserva", **ENTONCES** el sistema elimina la reserva, libera la franja y notifica la cancelación al cliente.
- **DADO** que intento cancelar con menos de 24 horas de anticipación, **CUANDO** confirmo la cancelación, **ENTONCES** el sistema rechaza la operación y muestra el mensaje "No es posible cancelar con menos de 24 horas de anticipación".

---

### HU-03 · Sprint 1 · 5 Story Points

**Como** administrador, **quiero** gestionar el registro de usuarios y sus roles, **para** garantizar que cada actor acceda exclusivamente a las funciones correspondientes a su perfil.

**Criterios de aceptación:**
- **DADO** que soy administrador, **CUANDO** creo un usuario nuevo, **ENTONCES** puedo asignarle uno de los roles: administrador, recepcionista, organizador o jugador.
- **DADO** que un usuario tiene rol "Recepcionista", **CUANDO** intenta acceder al módulo financiero, **ENTONCES** el sistema deniega el acceso y muestra "Acceso no autorizado".

---

### HU-04 · Sprint 2 · 8 Story Points

**Como** administrador, **quiero** crear y configurar torneos, **para** organizar competiciones sin necesidad de herramientas externas.

**Criterios de aceptación:**
- **DADO** que soy administrador, **CUANDO** creo un torneo con nombre, formato (eliminatorio o todos contra todos), número de equipos y fechas, **ENTONCES** el sistema almacena la configuración y habilita la inscripción de equipos.
- **DADO** que el número mínimo de equipos para el formato seleccionado está completo, **CUANDO** inicio el torneo, **ENTONCES** el sistema genera el fixture automáticamente y notifica a los organizadores.

---

### HU-05 · Sprint 2 · 5 Story Points

**Como** administrador, **quiero** ingresar los resultados de los partidos, **para** que la tabla de posiciones se actualice de forma automática e inmediata.

**Criterios de aceptación:**
- **DADO** que ingreso el resultado de un partido finalizado, **CUANDO** confirmo el ingreso, **ENTONCES** la tabla de posiciones se actualiza en tiempo real con puntos, diferencia de goles y posición.
- **DADO** que intento modificar un resultado ya confirmado, **CUANDO** realizo el cambio, **ENTONCES** el sistema solicita una segunda autorización y registra el evento en el historial de auditoría.

---

### HU-06 · Sprint 2 · 8 Story Points

**Como** jugador, **quiero** mantener un Perfil Global que registre mis estadísticas y historial, **para** llevar un seguimiento de mi progreso competitivo independientemente del cancha en que juegue.

**Criterios de aceptación:**
- **DADO** que soy un jugador autenticado, **CUANDO** accedo a mi perfil, **ENTONCES** visualizo mis estadísticas acumuladas (goles, asistencias, partidos jugados), los torneos disputados y los canchas a los que estoy vinculado.
- **DADO** que me vinculo a un nueva cancha, **CUANDO** participo en un partido allí, **ENTONCES** las estadísticas obtenidas se agregan automáticamente a mi Perfil Global.
- **DADO** que ajusto mi configuración de privacidad, **CUANDO** establezco un dato como privado, **ENTONCES** solo yo puedo visualizarlo; otros usuarios ven únicamente la información marcada como pública.

---

### HU-07 · Sprint 2 · 5 Story Points

**Como** organizador, **quiero** gestionar la plantilla y enviar convocatorias, **para** organizar la participación de los jugadores en los partidos programados.

**Criterios de aceptación:**
- **DADO** que soy capitán de un equipo inscrito en un torneo, **CUANDO** agrego o elimino un jugador de la plantilla, **ENTONCES** el cambio se refleja de inmediato en la vista del equipo.
- **DADO** que hay un partido programado, **CUANDO** envío una convocatoria, **ENTONCES** todos los jugadores de la plantilla reciben una notificación push con la fecha, hora y cancha del partido.

---

### HU-08 · Sprint 3 · 8 Story Points

**Como** administrador, **quiero** registrar pagos y generar reportes de ocupación, **para** controlar los ingresos de la cancha y tomar decisiones basadas en datos.

**Criterios de aceptación:**
- **DADO** que registro un pago asociado a una reserva, **CUANDO** confirmo el ingreso, **ENTONCES** el sistema lo vincula a la reserva correspondiente y actualiza el saldo del período.
- **DADO** que solicito un reporte de ocupación, **CUANDO** selecciono el período y la cancha, **ENTONCES** el sistema genera el informe con los datos de ocupación y lo ofrece para descarga en PDF o CSV.

---

### HU-09 · Sprint 3 · 5 Story Points

**Como** administrador, **quiero** gestionar tarifas diferenciadas por horario o tipo de evento, **para** optimizar los ingresos de la cancha según la demanda.

**Criterios de aceptación:**
- **DADO** que creo una tarifa especial para horario nocturno, **CUANDO** un cliente realiza una reserva en esa franja, **ENTONCES** el sistema aplica automáticamente la tarifa correspondiente.
- **DADO** que existen dos tarifas activas para la misma franja, **CUANDO** se genera una reserva, **ENTONCES** el sistema aplica la tarifa de mayor prioridad definida por el administrador.

---

### HU-10 · Sprint 1 · 5 Story Points

**Como** cualquier usuario autenticado, **quiero** recibir notificaciones push relevantes, **para** estar informado sobre confirmaciones de reserva, resultados de partidos y convocatorias sin necesidad de ingresar a la aplicación.

**Criterios de aceptación:**
- **DADO** que confirmó una reserva, **CUANDO** el sistema la registra, **ENTONCES** recibo una notificación push en menos de 5 segundos con los detalles de la reserva.
- **DADO** que hay un partido programado en las próximas 24 horas, **CUANDO** el sistema ejecuta el proceso de recordatorio, **ENTONCES** todos los jugadores convocados reciben la notificación.
- **DADO** que desactivo las notificaciones desde mi perfil, **CUANDO** ocurre cualquier evento, **ENTONCES** el sistema no envía notificaciones push a mi dispositivo hasta que las reactive.

---

### HU-11 · Sprint 1 · 5 Story Points

**Como** administrador de la plataforma, **quiero** registrar una nueva cancha deportiva como tenant independiente, **para** que pueda operar de forma aislada sin interrumpir el servicio de las canchas ya activas.

**Criterios de aceptación:**
- **DADO** que soy administrador de la plataforma, **CUANDO** registro un nuevo tenant con nombre, datos de la cancha y plan de suscripción, **ENTONCES** el sistema crea el espacio aislado para ese tenant y lo habilita sin generar tiempo de inactividad en los demás tenant activos.
- **DADO** que el nuevo tenant ha sido creado, **CUANDO** el administrador de la cancha inicia sesión por primera vez, **ENTONCES** accede únicamente a los datos y configuraciones de su propio tenant, sin visibilidad sobre otros datos.

---

### HU-12 · Sprint 1 · 5 Story Points

**Como** usuario autenticado, **quiero** acceder a las consultas principales de la aplicación sin conexión a internet, **para** poder revisar información relevante, aunque no tenga señal disponible.

**Criterios de aceptación:**
- **DADO** que perdí la conexión a internet, **CUANDO** ingreso al módulo de disponibilidad de canchas, historial de reservas o perfil deportivo, **ENTONCES** el sistema muestra la última información sincronizada sin mostrar errores de conexión.
- **DADO** que recupero la conexión a internet, **CUANDO** el sistema detecta conectividad, **ENTONCES** sincroniza automáticamente los datos locales con el servidor y actualiza la información mostrada.
- **DADO** que intento realizar una acción de escritura (reservar, cancelar, ingresar resultado) sin conexión, **CUANDO** ejecuto la acción, **ENTONCES** el sistema informa que esa operación requiere conexión y no permite continuar.

---

## 📅 Product Backlog y Planificación de Sprints

### Product Backlog Priorizado

| ID | Historia de Usuario | SP | Sprint | Prioridad | Estado | Módulo |
|----|---------------------|----|--------|-----------|--------|--------|
| HU-01 | Visualizar disponibilidad de canchas en tiempo real | 5 | S1 | Must | ✅ Completada | Reservas |
| HU-02 | Cancelar reserva con anticipación mínima de 24 h | 8 | S1 | Must | ✅ Completada | Reservas |
| HU-03 | Gestionar registro de usuario y roles | 5 | S1 | Must | ✅ Completada | Autenticación |
| HU-04 | Crear y configurar torneos | 8 | S2 | Must | ✅ Completada | Torneos |
| HU-05 | Ingresar resultados y actualizar tabla | 5 | S2 | Must | ✅ Completada | Torneos |
| HU-06 | Perfil global de jugador | 8 | S2 | Must | ✅ Completada | Torneos |
| HU-07 | Gestionar la plantilla y convocatorias | 8 | S2 | Must | ✅ Completada | Torneos |
| HU-08 | Registrar pagos y generar reportes | 5 | S3 | Must | Pendiente | Financiero |
| HU-09 | Gestionar tarifas diferenciadas | 8 | S3 | Must | Pendiente | Financiero |
| HU-10 | Notificaciones push | 5 | S1 | Should | ✅ Completada | Notificaciones |
| HU-11 | Onboarding de nueva cancha sin inactividad | 5 | S3 | Could | Pendiente | Multi-tenant |
| HU-12 | Funcionamiento offline de consultas principales | 8 | S4 | Could | Pendiente | PWA/Offline |

---

## 🗓️ Cronograma de Sprints

| Sprint | Inicio | Fin | Historias incluidas | Meta del Sprint |
|--------|--------|-----|---------------------|-----------------|
| **Sprint 1** | 19/05/26 | 08/06/26 | HU-01, HU-02, HU-03, HU-04, HU-05 | Módulo de autenticación, reservas en tiempo real y notificaciones push funcionales |
| **Sprint 2** | 09/06/26 | 29/06/26 | HU-06, HU-07, HU-08, HU-09, HU-10 | Motor de torneos con fixture automático, tabla de posiciones y Perfil Global de Jugador Operativos |
| **Sprint 3** | 30/06/26 | 20/07/26 | HU-11, HU-12 | Módulo financiero con registro de pagos, reportes exportables y onboarding multi-tenant |
| **Sprint 4** | 21/07/26 | 07/08/26 | HU-12 | Soporte offline PWA, pruebas de carga, correcciones y presentación final |

---

## ✅ Definición de Done (DoD)

Una historia de usuario se considera **completamente terminada** cuando cumple con todos los siguientes criterios:

1. ✅ Código desarrollado conforme a los criterios de aceptación definidos
2. ✅ Pruebas unitarias implementadas con cobertura mínima del 80%
3. ✅ Pull Request revisado y aprobado por al menos un integrante del equipo
4. ✅ Sin errores en el pipeline de integración continua
5. ✅ Funcionalidad desplegada en ambiente de pruebas y validada
6. ✅ Interfaz validada en navegadores y dispositivos objetivo
7. ✅ Endpoints documentados con Swagger/OpenAPI
8. ✅ Historia aceptada formalmente por el Product Owner durante la Sprint Review

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 14+ con TypeScript
- **Estilos:** Tailwind CSS + shadcn/ui
- **Estado:** Zustand + React Query
- **PWA:** next-pwa con Service Workers

### Backend
- **Runtime:** Node.js (Next.js API Routes)
- **Autenticación:** NextAuth.js + JWT + bcrypt
- **Validación:** Zod
- **Documentación:** Swagger/OpenAPI
- **Notificaciones:** Firebase Cloud Messaging (FCM)

### Base de Datos
- **Motor:** PostgreSQL v16+
- **ORM:** Prisma

### Infraestructura
- **Plataforma:** Vercel
- **Base de Datos:** Neon / Supabase / AWS RDS
- **CI/CD:** GitHub Actions
- **Monitoreo:** Sentry + Vercel Analytics

---

## 📚 Referencias

- Documentación oficial de Next.js: https://nextjs.org/docs
- Documentación oficial de Prisma: https://www.prisma.io/docs
- Documentación oficial de PostgreSQL: https://www.postgresql.org/docs
- Documentación de PWA: https://web.dev/progressive-web-apps/

---

## 🚀 Implementación Técnica — Sprints 1 y 2

### Stack de persistencia
- **ORM**: Prisma 7 con adaptador `@prisma/adapter-pg` para PostgreSQL
- **Motor BD**: PostgreSQL v16+ (Neon Serverless)
- **Hashing de contraseñas**: bcrypt (rondas de costo = 10)

### Decisiones de seguridad
- **Registro de usuarios (HU-03)**: El formulario de registro **no permite seleccionar el rol**. Todas las cuentas nuevas reciben el rol `jugador` por defecto en el endpoint `/api/auth/register` (resuelto contra la tabla `Role`), independientemente de cualquier dato que envíe el cliente. Los roles `tenant` y `admin_plataforma` solo pueden asignarse desde la BD o por un admin.
- Las contraseñas nunca se almacenan en texto plano; siempre se les aplica hash antes de persistir.
- El endpoint de login aplica `bcrypt.compare()` para verificar credenciales contra la BD.

### Canchas deportivas (HU-01 · HU-02)
- Modelo `Court` extendido con campos de visualización: `surface`, `capacity`, `price_per_hour`, `rating`, `address`.
- El endpoint `/api/courts` (GET / POST / DELETE) consulta y escribe directamente en PostgreSQL mediante Prisma.
- Se define un conjunto de franjas horarias canónicas (08:00 a 21:00). Las franjas ocupadas se excluyen dinámicamente según `Reservation.status = confirmed` para la fecha consultada.
- **Reserva simultánea**: Antes de crear una reserva, el endpoint verifica si ya existe una reserva confirmada para el mismo `courtId + date + start_time`. Si existe, responde con error `409 Franja no disponible` y sugiere la próxima franja libre de ser posible.
- **Cancelación con política 24 h**: DELETE calcula la diferencia horaria entre `now()` y `reservation.start_time`. Si es menor a 24 horas, responde `409 No es posible cancelar con menos de 24 horas de anticipación`.
- Cada reserva/cancelación genera una notificación push persistida en la tabla `Notification`.

### Módulo de torneos y plantilla (HU-04 · HU-05 · HU-06 · HU-07)
- El `DashboardScreen` integra pestañas de Reservas, Torneos, Perfil Global y Plantilla. Todas consumen sus endpoints homólogos (`/api/tournaments`, `/api/teams`, `/api/profile`, `/api/notifications`).
- **Fixture automático (HU-04)**: Se genera round-robin para formato `todos-contra-todos` y bracket de eliminación directa para `eliminatorio`.
- **Actualización de tabla (HU-05)**: Los resultados confirmados recalculan puntos (3 victoria / 1 empate / 0 derrota), diferencia de goles y goles a favor, y persisten la tabla ordenada en `Standing`. Modificar un resultado bloqueado requiere el flag `confirmedByAdmin = true`; todas las acciones se registran en `audit_trail`.
- **Perfil Global del Jugador (HU-06)**: Estadísticas acumuladas, torneos disputados y canchas vinculadas, más setting de privacidad `public / private`.
- **Gestión de plantilla y convocatorias (HU-07)**: Agregar/remover jugadores se refleja en `TeamPlayer`; enviar convocatoria dispara notificaciones a toda la plantilla.

### Seed y datos iniciales
Script: `prisma/seed.ts`
- 1 tenant verificado (`FieldSync Demo`)
- 4 canchas con ubicación, superficie, capacidad y rating realistas
- 4 usuarios con roles diferenciados y contraseñas hasheadas
- 3 equipos + plantilla (TeamPlayer)
- 1 torneo activo con 3 equipos inscritos
- 3 partidos (1 jugado con resultado, 2 programados) + tabla de posiciones inicial
- 3 notificaciones pre-cargadas

Comandos útiles:
```bash
npm run db:generate   # Genera Prisma Client
npm run db:push       # Aplica schema a BD (--force-reset para reiniciar)
npm run db:seed       # Puebla la BD con datos demo
npm run db:setup      # generate + push + seed (todo en uno)
```

### Modelo de roles y tenants (actualizado)
- Se eliminó el modelo `Tenant` como tabla independiente. Un "tenant" (dueño de cancha) ahora **es** un `User` con `role.name = "tenant"`; sus canchas, tarifas, equipos y torneos referencian `id_tenant` apuntando directamente a `User.id_user`.
- `User.role` dejó de ser un `String` libre: ahora es una relación (`id_role`) hacia la tabla `Role`, con exactamente 3 valores posibles: `admin_plataforma`, `tenant`, `jugador`.
- `User` ya no tiene `id_tenant`: los jugadores y el administrador de plataforma no están atados a una única cancha (pueden reservar en cualquier tenant). La verificación de onboarding (HU-11: `status`, `id_verifier`, `verified_at`) vive ahora en `User`, aplicable solo a cuentas con rol `tenant`.
- Los torneos (`Tournament`) incluyen `status` (`pendiente` / `aprobado` / `rechazado`), `id_approved_by`, `approved_at` y `rejection_reason`: quedan como solicitud hasta que el tenant dueño de la cancha los aprueba.

### Credenciales de prueba
| Email                        | Contraseña       | Rol                                |
|------------------------------|------------------|-------------------------------------|
| plataforma@fieldsync.test    | Plataforma1234!  | admin_plataforma                    |
| tenant@fieldsync.test        | Tenant1234!      | tenant (dueño de cancha)             |
| capitan@fieldsync.test       | Capitan1234!     | jugador (capitán de equipo)          |
| jugador@fieldsync.test       | Jugador1234!     | jugador                             |

### Notas adicionales
- Todos los endpoints cuentan con un fallback `in-memory store` (`lib/fieldsync-store.ts`) para mantener compatibilidad si la BD temporalmente no está disponible. Esto preserva tests unitarios y modo offline básico.
- El cliente Prisma singleton se exporta desde `lib/prisma.ts` y reutiliza la instancia global en desarrollo para evitar conexiones excesivas durante HMR.

---

## 🧭 Cambios Propuestos — Refinamiento post Sprint 2

Los siguientes 4 cambios fueron solicitados tras la demo del Sprint 2. Aquí se documenta el estado actual, el problema detectado y el cambio técnico propuesto para cada uno.

> **Actualización:** la capa de base de datos de los cambios #2 y #3 ya se implementó (ver "Modelo de roles y tenants (actualizado)" más arriba): existe la tabla `Role` con los 3 roles definidos, `Tournament.status` con el flujo pendiente/aprobado/rechazado, y además se eliminó por completo la tabla `Tenant` (un tenant ahora es un `User` con rol `tenant`). Lo que **falta** de cada cambio se detalla en su propia sección: para #2 falta la UI de aprobar/rechazar y las acciones `approve`/`reject` en el endpoint; para #3 falta actualizar `lib/fieldsync-store.ts` (el fallback en memoria sigue usando el modelo de 4 roles viejo). Los cambios #1 y #4 siguen sin implementar.

### 1. Botón "Crear torneo" debe verse deshabilitado/apagado

**Estado actual:**
En [dashboard.tsx:549](components/screens/dashboard.tsx#L549), el botón "Crear torneo" usa `bg-emerald-400` (el mismo verde de acento de acciones primarias habilitadas), lo que comunica visualmente que la creación es una acción directa e inmediata.

**Problema:**
Con el cambio #2 (torneos como solicitudes), crear un torneo ya no es una acción que se ejecuta al instante — queda sujeta a aprobación del tenant. Mantener el botón con el estilo de "acción primaria disponible" confunde al usuario, que espera que el torneo quede activo de inmediato.

**Cambio propuesto:**
- Cambiar la clase del botón de `bg-emerald-400 text-slate-950` a un tono apagado, por ejemplo `bg-slate-700 text-slate-300 cursor-not-allowed` (o mantener habilitado el click pero con estética "secundaria" en vez de acento).
- Es una señal visual, no un bloqueo funcional: el botón sigue siendo clickeable (el usuario sí puede *solicitar* un torneo), pero su apariencia ya no debe leerse como "esto se activa al instante".
- Añadir un texto de ayuda debajo del formulario, ej. *"El torneo quedará pendiente de aprobación de horarios por parte de la cancha."*
- Opcional: cambiar el label del botón de "Crear torneo" a "Solicitar torneo" para reforzar la semántica del cambio #2.

**Archivos afectados:** `components/screens/dashboard.tsx` (sección `TournamentsPanel`).

---

### 2. Los torneos deben ser solicitudes sujetas a aprobación del tenant

**Estado actual:**
`POST /api/tournaments` con `action: "create"` ([route.ts:19-34](app/api/tournaments/route.ts#L19-L34)) crea el torneo de forma inmediata y lo deja disponible para inscripción de equipos. No existe ningún estado intermedio ni actor que apruebe fechas/horarios.

**Problema:**
Un torneo reserva horarios y canchas del tenant (dueño de la cancha). Si cualquier organizador puede crear un torneo y que quede activo al instante, se pueden generar conflictos de horario con reservas existentes o con la disponibilidad real de la cancha, sin que el tenant tenga oportunidad de validarlo.

**Cambio propuesto:**
- **Modelo de datos:** agregar un campo de estado al modelo `Tournament` en `prisma/schema.prisma`, por ejemplo:
  ```prisma
  enum TournamentStatus {
    pendiente
    aprobado
    rechazado
  }

  model Tournament {
    ...
    status          TournamentStatus @default(pendiente)
    id_approved_by  Int?
    approved_by     User?      @relation("TournamentApprover", fields: [id_approved_by], references: [id_user], onDelete: SetNull)
    approved_at     DateTime?  @db.Timestamp()
    rejection_reason String?  @db.VarChar(255)
  }
  ```
- **Flujo:**
  1. Un organizador/jugador con permisos "solicita" un torneo (nombre, formato, equipos requeridos, fechas y horario deseado). Se crea con `status = pendiente`.
  2. El tenant (dueño de la cancha) recibe una notificación de "nueva solicitud de torneo" y ve la solicitud en un panel nuevo (ej. pestaña "Solicitudes" dentro del dashboard del tenant).
  3. El tenant puede **aprobar** (verifica que el horario/fechas no chocan con reservas o tarifas existentes) o **rechazar** (con motivo) la solicitud.
  4. Solo cuando `status = aprobado` se habilita la inscripción de equipos (`action: "enroll"`) y el inicio del torneo (`action: "start"`). Si está `pendiente` o `rechazado`, esas acciones deben responder `409`.
- **API:** agregar dos nuevas acciones a `POST /api/tournaments`: `"approve"` y `"reject"` (solo accesibles por el rol tenant del tenant dueño del torneo), y filtrar `GET /api/tournaments` para que el listado muestre el estado de cada torneo.
- **UI:** en `TournamentsPanel` ([dashboard.tsx](components/screens/dashboard.tsx)), mostrar el estado (`pendiente` / `aprobado` / `rechazado`) como badge en cada tarjeta de torneo, y añadir botones de "Aprobar" / "Rechazar" visibles solo para el rol tenant.
- **Notificaciones:** al crear la solicitud, notificar al tenant; al aprobar/rechazar, notificar al organizador que la solicitó (reutiliza el cambio #4).

**Archivos afectados:** `prisma/schema.prisma`, `lib/fieldsync-store.ts` (`createTournament`, `enrollTeamToTournament`, `startTournament`), `app/api/tournaments/route.ts`, `components/screens/dashboard.tsx`.

---

### 3. La tabla de roles debe normalizarse en base de datos

**Estado actual:**
En `prisma/schema.prisma`, `User.role` es un campo de texto libre (`String @db.VarChar(50)`), sin restricción a nivel de BD. Los valores usados hoy en el seed y en el código (`humanRole` en [dashboard.tsx:155](components/screens/dashboard.tsx#L155)) son: `administrador`, `recepcionista`, `organizador`, `jugador`.

**Problema:**
- No hay integridad referencial: cualquier string puede guardarse como rol (typos, valores inconsistentes entre entornos).
- El modelo de roles actual (4 roles ligados al tenant) no refleja la jerarquía real del negocio multi-tenant: se necesita distinguir entre quien administra **toda la plataforma** (super-admin, ve todos los tenants) y quien administra **una cancha específica** (tenant/dueño de cancha).
- El negocio pidió reducir/consolidar a 3 roles: **Administrador de plataforma**, **Tenant (Dueño de cancha)** y **Jugador**.

**Cambio propuesto:**
- **Nueva tabla `Role`:**
  ```prisma
  model Role {
    id_role   Int    @id @default(autoincrement())
    name      String @unique @db.VarChar(50) // admin_plataforma | tenant | jugador
    label     String @db.VarChar(80)         // "Administrador de plataforma", etc.

    users     User[]

    @@map("role")
  }
  ```
- **Modificar `User`:** reemplazar `role String` por una relación:
  ```prisma
  model User {
    ...
    id_role   Int
    role      Role   @relation(fields: [id_role], references: [id_role], onDelete: Restrict, onUpdate: Cascade)
  }
  ```
- **Semántica de los 3 roles:**
  - `admin_plataforma`: no pertenece a ningún tenant específico (`id_tenant = null`), gestiona el alta/verificación de tenants (HU-11) y tiene visibilidad global.
  - `tenant`: dueño/administrador de una cancha (`id_tenant` obligatorio), gestiona torneos (aprobación, cambio #2), tarifas, reservas y reportes de su propio tenant.
  - `jugador`: usuario final, reserva canchas, se inscribe en equipos/torneos y mantiene su Perfil Global (HU-06).
- **Migración de datos:** los roles actuales `recepcionista` y `organizador` deben remapearse. Recomendación: `administrador` → `tenant` (es quien opera la cancha), `recepcionista` → `tenant` o un permiso secundario dentro del mismo tenant (a definir con negocio), `organizador`/capitán de equipo → sigue siendo `jugador` con el atributo de "capitán" a nivel de `Team.id_user`, no a nivel de rol global.
- **Impacto en código:** actualizar `prisma/seed.ts` (crear las 3 filas de `Role` primero, referenciarlas por `id_role`), `humanRole()` en `dashboard.tsx`, el endpoint `/api/auth/register` (que asigna `jugador` por defecto) y cualquier verificación de permisos (`role === "..."`) para comparar contra el `name` de la tabla `Role` o usar el `id_role`.
- **Nota:** esto es un cambio de esquema con migración de datos (no solo agregar columnas), por lo que conviene escribir un script de migración explícito en vez de `db:push --force-reset` para no perder datos ya cargados en ambientes compartidos.

**Archivos afectados:** `prisma/schema.prisma`, `prisma/seed.ts`, `lib/fieldsync-store.ts`, `app/api/auth/register/route.ts`, `app/api/auth/login/route.ts`, `components/screens/dashboard.tsx`.

---

### 4. Notificaciones push funcionales

**Estado actual:**
El modelo `Notification` y el endpoint `GET /api/notifications` ([route.ts](app/api/notifications/route.ts)) solo **persisten y listan** notificaciones en base de datos; el usuario las ve al consultar la pestaña correspondiente dentro de la app (polling manual, no push real). No existe Service Worker, no hay registro de `PushSubscription`, y aunque el stack tecnológico documentado menciona Firebase Cloud Messaging (FCM), no está integrado en el código — es una notificación "in-app", no una notificación push del sistema operativo/navegador.

**Problema:**
Las historias HU-01, HU-07 y HU-10 prometen notificaciones push reales (confirmaciones de reserva, convocatorias, resultados) que lleguen "sin necesidad de ingresar a la aplicación". Hoy eso no ocurre: si el usuario no tiene la app abierta, no se entera del evento.

**Cambio propuesto:**
- **PWA base:** registrar un Service Worker (`public/sw.js`) desde `app/layout.tsx`, requisito para poder recibir push en background.
- **Suscripción del navegador:** al iniciar sesión (o desde el perfil), solicitar permiso de notificaciones (`Notification.requestPermission()`) y generar una `PushSubscription` vía `pushManager.subscribe()` con la clave pública VAPID.
- **Nueva tabla `PushSubscription`:**
  ```prisma
  model PushSubscription {
    id_subscription Int      @id @default(autoincrement())
    id_user         Int
    user            User     @relation(fields: [id_user], references: [id_user], onDelete: Cascade, onUpdate: Cascade)
    endpoint        String   @db.VarChar(500)
    p256dh          String   @db.VarChar(255)
    auth            String   @db.VarChar(255)
    created_at      DateTime @default(now()) @db.Timestamp()

    @@unique([endpoint])
    @@map("push_subscription")
  }
  ```
- **Envío real de push:** usar `web-push` (VAPID, sin costo, no requiere cuenta de Firebase) o Firebase Cloud Messaging como indica el stack. En el servidor, cada vez que hoy se llama a `createNotification(...)` en `lib/fieldsync-store.ts` (reservas, cancelaciones, convocatorias, resultados de partido, aprobación/rechazo de torneo del cambio #2), además de insertar la fila en `Notification`, disparar el envío push a todas las `PushSubscription` del usuario destino.
- **Respeto a la preferencia del usuario:** ya existe `User.notifications_enabled` — el envío push debe verificar ese flag antes de despachar (cumple el criterio de aceptación de HU-10 sobre desactivar notificaciones).
- **Manejo de fallos:** si el `endpoint` de una suscripción responde `410 Gone` (navegador desinstaló/expiró la suscripción), eliminar esa fila de `PushSubscription` automáticamente.
- **Frontend:** manejar el evento `push` en el Service Worker para mostrar la notificación del sistema (`self.registration.showNotification(...)`) y el evento `notificationclick` para enfocar/abrir la app en la sección relevante.

**Archivos afectados:** `app/layout.tsx`, nuevo `public/sw.js`, `prisma/schema.prisma`, `lib/fieldsync-store.ts` (función central `createNotification`), nuevo helper (ej. `lib/push.ts`) para el envío VAPID/FCM, variables de entorno nuevas (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).

---

### Resumen de impacto

| # | Cambio | Tipo | Requiere migración de BD | Estado |
|---|--------|------|---------------------------|--------|
| 1 | Botón "Crear torneo" apagado | UI | No | Pendiente |
| 2 | Torneos como solicitudes aprobables | Producto + Backend | Sí (`Tournament.status`) | ✅ Schema listo · falta UI y acciones `approve`/`reject` |
| 3 | Tabla de roles normalizada | Backend + BD | Sí (tabla `Role`, `Tenant` eliminada) | ✅ Schema, seed y rutas de auth listos · falta actualizar `fieldsync-store.ts` |
| 4 | Notificaciones push funcionales | Backend + Frontend + Infra | Sí (tabla `PushSubscription`) | Pendiente (requiere Service Worker + VAPID/FCM) |

El cambio #3 era prerrequisito conceptual del #2 (la aprobación de torneos la hace el rol `tenant`), por eso se implementó primero a nivel de base de datos.
