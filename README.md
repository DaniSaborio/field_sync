# FieldSync

App de gestión de reservas y torneos de canchas, construida con [Next.js](https://nextjs.org).

## Requisitos previos

- Node.js 20+ y npm
- Una base de datos Postgres (el proyecto usa [Neon](https://neon.tech) en la nube, no hace falta instalar Postgres localmente)
- Docker Desktop, si prefieres levantar todo en contenedor (ver [DOCKER.md](DOCKER.md))

## Levantar el proyecto en local

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea el archivo `.env.local` en la raíz con las siguientes variables (pide los valores a quien te compartió el proyecto si no los tienes):

   ```bash
   DATABASE_URL=
   JWT_SECRET=
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   NEXTAUTH_SECRET=
   NEXTAUTH_URL=
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=
   ```

   `JWT_SECRET` firma la cookie de sesión (ver [lib/jwt.ts](lib/jwt.ts)) — es obligatoria, cualquier valor random alcanza en local:

   ```bash
   openssl rand -hex 32
   ```

3. Genera el cliente de Prisma y sincroniza el esquema con la base de datos:

   ```bash
   npm run db:generate
   npm run db:push
   ```

   Si además quieres poblar la base con datos de prueba:

   ```bash
   npm run db:seed
   ```

   O ambos pasos juntos:

   ```bash
   npm run db:setup
   ```

   El seed crea un usuario de prueba por cada rol (ver [prisma/seed.ts](prisma/seed.ts)):

   | Rol                 | Email                        | Contraseña       |
   | -------------------- | ----------------------------- | ----------------- |
   | Admin de plataforma  | `plataforma@fieldsync.test`   | `Plataforma1234!` |
   | Tenant (dueño de cancha) | `tenant@fieldsync.test`   | `Tenant1234!`      |
   | Jugador (capitán)    | `capitan@fieldsync.test`      | `Capitan1234!`     |
   | Jugador              | `jugador@fieldsync.test`      | `Jugador1234!`     |

   Son credenciales solo para entornos de desarrollo/demo — no las reutilices en producción.

4. Levanta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Levantar el proyecto con Docker

Si prefieres no instalar Node localmente, puedes levantar todo con Docker (hot reload incluido). Ver la guía completa en [DOCKER.md](DOCKER.md).

Resumen rápido:

```bash
docker compose up --build
```

Y abre [http://localhost:3000](http://localhost:3000).

## Otros comandos útiles

```bash
npm run lint        # linter
npm run test         # correr tests (vitest)
npm run test:watch   # tests en modo watch
npm run build        # build de producción
npm run start        # levantar build de producción
```

## Aprender más

- [Next.js Documentation](https://nextjs.org/docs) - features y API de Next.js.
- [Prisma Documentation](https://www.prisma.io/docs) - ORM usado para la base de datos.
