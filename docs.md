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
- **Registro de usuarios (HU-03)**: El formulario de registro **no permite seleccionar el rol**. Todas las cuentas nuevas reciben el rol `jugador` por defecto en el endpoint `/api/auth/register`, independientemente de cualquier dato que envíe el cliente. Roles superiores (`administrador`, `recepcionista`, `organizador`) solo pueden asignarse desde la BD o por un admin.
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

### Credenciales de prueba
| Email                        | Contraseña       | Rol            |
|------------------------------|------------------|----------------|
| admin@fieldsync.test         | Admin1234!       | administrador  |
| recepcion@fieldsync.test     | Recepcion1234!   | recepcionista  |
| capitan@fieldsync.test       | Capitan1234!     | organizador    |
| jugador@fieldsync.test       | Jugador1234!     | jugador        |

### Notas adicionales
- Todos los endpoints cuentan con un fallback `in-memory store` (`lib/fieldsync-store.ts`) para mantener compatibilidad si la BD temporalmente no está disponible. Esto preserva tests unitarios y modo offline básico.
- El cliente Prisma singleton se exporta desde `lib/prisma.ts` y reutiliza la instancia global en desarrollo para evitar conexiones excesivas durante HMR.
