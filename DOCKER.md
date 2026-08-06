# Cómo correr FieldSync con Docker (guía para principiantes)

Esta guía asume que **no tienes experiencia previa con Docker**. Sigue los pasos en orden.

## 1. Requisitos previos

Solo necesitas instalar **Docker Desktop** (incluye Docker y Docker Compose):

- Windows/Mac: https://www.docker.com/products/docker-desktop
- Linux: `sudo apt install docker.io docker-compose-plugin` (o el gestor de paquetes de tu distro)

Para verificar que quedó instalado, abre una terminal y ejecuta:

```bash
docker --version
docker compose version
```

Si ambos comandos muestran un número de versión, estás listo.

## 2. Verifica que tienes el archivo de variables de entorno

El proyecto ya incluye un archivo `.env.local` en la raíz con la conexión a la base de datos (Neon/Postgres en la nube). **No necesitas instalar Postgres localmente**, la app se conecta directo a esa base en la nube.

Confirma que el archivo existe:

```bash
ls .env.local 
```

Debe contener una línea `DATABASE_URL="postgresql://..."`. Si no existe, pide ese archivo a quien te compartió el proyecto — sin él la app no podrá conectarse a la base de datos.

## 3. Levantar la app en modo desarrollo (recomendado, hot reload)

`docker-compose.yml` está configurado en modo desarrollo por defecto: monta tu carpeta del proyecto dentro del contenedor, así que **los cambios de código se reflejan solos** (hot reload de Next.js) y no hace falta reconstruir la imagen cada vez.

Primera vez (o cuando cambies `package.json`):

```bash
docker compose up --build
```

Las siguientes veces, con que quede corriendo alcanza:

```bash
docker compose up
```

Cuando veas en la terminal algo como:

```
▲ Next.js 16.2.10
- Local:        http://localhost:3000
```

la app ya está corriendo. Abre tu navegador en:

http://localhost:3000

Edita cualquier archivo del proyecto y guarda: verás el cambio reflejado en el navegador sin volver a construir nada.

Para detenerla, presiona `Ctrl + C` en esa misma terminal.

Si prefieres que quede corriendo "en segundo plano" (sin ocupar la terminal):

```bash
docker compose up -d
```

Para ver los logs en segundo plano:

```bash
docker compose logs -f
```

Para apagarla:

```bash
docker compose down
```

### ¿Cuándo sí hace falta reconstruir?

Solo cuando cambias `package.json` (nuevas dependencias) o el propio `Dockerfile`:

```bash
docker compose up --build
```

Cambios de código (`.tsx`, `.ts`, componentes, rutas, etc.) **no** requieren reconstruir — eso es justamente lo que soluciona el volumen montado.

## 4. Modo producción

Para probar la build real de producción (la que se compila con `next build` y corre optimizada) usa el archivo aparte `docker-compose.prod.yml`:

```bash
docker compose -f docker-compose.prod.yml up --build
```

Ahí sí, cada cambio de código requiere volver a construir, porque es una imagen compilada, no un servidor de desarrollo.

## Problemas comunes

- **"port is already allocated"**: ya tienes algo corriendo en el puerto 3000 (por ejemplo, `npm run dev` fuera de Docker). Detén ese proceso o cambia el puerto en `docker-compose.yml`, por ejemplo `"3001:3000"`, y entra por http://localhost:3001.
- **La app no conecta a la base de datos**: revisa que `.env.local` exista y tenga un `DATABASE_URL` válido. En modo dev basta con reiniciar (`docker compose restart`), no hace falta reconstruir.
- **Instalé una dependencia nueva y no aparece dentro del contenedor**: reconstruye con `docker compose up --build` (el `node_modules` vive en un volumen propio del contenedor, separado del de tu máquina).
- **En Windows/Mac los cambios no se reflejan solos**: descomenta el bloque `WATCHPACK_POLLING=true` en `docker-compose.yml` — en algunos sistemas la notificación de cambios de archivos no llega bien al contenedor y hay que revisar por sondeo (polling).
- **Quiero reinstalar todo desde cero**: `docker compose down -v` (el `-v` borra también los volúmenes de `node_modules`/`.next`) y luego `docker compose build --no-cache`.

## ¿Qué hace el Dockerfile? (opcional, para entender)

El `Dockerfile` tiene varias etapas:

1. **deps**: instala las dependencias de `package.json`.
2. **dev**: la que usa `docker-compose.yml` por defecto. Corre `next dev` dentro del contenedor; el código real vive en tu máquina y se monta como volumen, por eso hay hot reload sin reconstruir.
3. **builder**: genera el cliente de Prisma (`prisma generate`) y compila la app con `next build` (solo se usa en modo producción).
4. **runner**: copia solo lo necesario para ejecutar la app en producción (`next start` en modo *standalone*) y la corre con un usuario sin privilegios de root, por seguridad. Se usa vía `docker-compose.prod.yml`.

La base de datos **no** corre dentro de Docker: es una base Postgres en la nube (Neon), a la que el contenedor se conecta usando `DATABASE_URL` desde `.env.local`.
