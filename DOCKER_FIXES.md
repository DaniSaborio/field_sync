# Solución de problemas al ejecutar FieldSync con Docker

Durante la configuración inicial del proyecto en Docker se presentaron varios problemas relacionados con dependencias, TypeScript, Prisma y variables de entorno. A continuación se documentan las causas y soluciones aplicadas.

---

# 1. Error durante `npm ci`

## Error

```text
npm error path /app/node_modules/node-base64
npm error command sh -c ./install.sh
npm error ./install.sh: line 3: node-waf: not found
```

## Causa

El proyecto tenía instalada la dependencia:

```json
"jwt": "^0.2.0"
```

Este paquete está obsoleto y utiliza herramientas antiguas (`node-waf`) incompatibles con versiones actuales de Node.js.

## Solución

Se reemplazó por la librería moderna:

```bash
npm uninstall jwt
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

También fue necesario actualizar las importaciones del proyecto.

Ejemplo:

```ts
import jwt from "jsonwebtoken";
```

---

# 2. Error de TypeScript durante `next build`

## Error

```text
Parameter 'court' implicitly has an 'any' type.
```

## Causa

Después de corregir las dependencias y regenerar Prisma, TypeScript pudo reconocer correctamente los tipos.

El problema desapareció tras reinstalar completamente las dependencias.

## Solución

Eliminar dependencias:

```bash
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
```

Instalar nuevamente:

```bash
npm install
```

Generar nuevamente Prisma:

```bash
npx prisma generate
```

Verificar:

```bash
npm run build
```

---

# 3. Error de Google Fonts dentro de Docker

## Error

```text
Failed to fetch Geist from Google Fonts
```

## Causa

Durante el proceso de construcción del contenedor Docker no se pudo descargar la fuente desde Google Fonts.

## Solución

Después de resolver correctamente el resto de dependencias y reconstruir el proyecto, el problema desapareció.

---

# 4. Error de Prisma

## Error

```text
PrismaClient requires a driver adapter to connect to your database, but none was provided.
```

## Causa

Durante el `docker build` el archivo `.env.local` no estaba disponible.

Como consecuencia:

```ts
const connectionString = process.env.DATABASE_URL;
```

era:

```ts
undefined
```

y Prisma no podía crear el adaptador PostgreSQL.

---

# 5. `.env.local` era ignorado por Docker

## Causa

El archivo `.dockerignore` contenía:

```text
.env
.env*.local
```

Esto impedía que Docker copiara el archivo `.env.local` durante la construcción de la imagen.

## Solución

Agregar una excepción:

```text
.env
.env*.local
!.env.local
```

---

# 6. Copiar `.env.local` durante el build

Se modificó el Dockerfile para que el archivo estuviera disponible durante la compilación.

Antes:

```dockerfile
COPY . .
RUN npx prisma generate
RUN npm run build
```

Después:

```dockerfile
COPY . .
COPY .env.local .env.local
RUN npx prisma generate
RUN npm run build
```

---

# 7. Error en `.env.local`

## Error

```text
unexpected character "│" in variable name
```

## Causa

El archivo fue copiado desde una terminal y contenía caracteres como:

```text
│
```

además de dividir el `DATABASE_URL` en varias líneas.

Ejemplo incorrecto:

```env
DATABASE_URL="postgresql://...
│
│
"
```

## Solución

Dejar el `DATABASE_URL` en una única línea:

```env
DATABASE_URL="postgresql://usuario:password@host/base?sslmode=require"
```

Sin caracteres extraños.

---

# 8. Verificación del proyecto

Se comprobó que el proyecto compilaba correctamente fuera de Docker:

```bash
npm run build
```

Resultado esperado:

```text
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages
```

---

# 9. Construcción de Docker

Reconstrucción completa:

```bash
docker compose build --no-cache
```

Resultado esperado:

```text
✔ fieldsync-app Built
```

---

# 10. Ejecución

Iniciar el contenedor:

```bash
docker compose up
```

Resultado esperado:

```text
▲ Next.js 16.x.x

Local:
http://localhost:3000

✓ Ready
```

---

# Resultado final

La aplicación quedó funcionando correctamente dentro de Docker.

Se verificó:

- Construcción de la imagen sin errores.
- Prisma funcionando correctamente.
- Variables de entorno cargadas.
- Conexión con Neon PostgreSQL.
- Next.js ejecutándose en Docker.
- Aplicación accesible desde:

```
http://localhost:3000
```

---

# Archivos modificados

- Dockerfile
- .dockerignore
- .env.local
- package.json
- package-lock.json
- Archivos donde se reemplazó la librería `jwt` por `jsonwebtoken`

---

# Comandos utilizados

```bash
npm install

npx prisma generate

npm run build

docker compose build --no-cache

docker compose up
```