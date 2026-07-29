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

## 3. Construir la imagen

Desde la raíz del proyecto (donde está el archivo `Dockerfile`), ejecuta:

```bash
docker compose build
```

Esto puede tardar unos minutos la primera vez (descarga la imagen base de Node e instala dependencias). Verás mucho texto en pantalla, es normal.

## 4. Levantar la aplicación

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

Para detenerla, presiona `Ctrl + C` en esa misma terminal.

Si prefieres que quede corriendo "en segundo plano" (sin ocupar la terminal):

```bash
docker compose up -d
```

Para verla en segundo plano:

```bash
docker compose logs -f
```

Para apagarla:

```bash
docker compose down
```

## 5. Volver a construir tras cambios en el código

Cada vez que cambies código y quieras probarlo dentro de Docker, vuelve a construir la imagen:

```bash
docker compose up --build
```

## Problemas comunes

- **"port is already allocated"**: ya tienes algo corriendo en el puerto 3000 (por ejemplo, `npm run dev`). Detén ese proceso o cambia el puerto en `docker-compose.yml`, por ejemplo `"3001:3000"`, y entra por http://localhost:3001.
- **La app no conecta a la base de datos**: revisa que `.env.local` exista y tenga un `DATABASE_URL` válido. Si lo modificas, debes reiniciar el contenedor (`docker compose up --build`).
- **Quiero reinstalar todo desde cero**: `docker compose down` y luego `docker compose build --no-cache`.

## ¿Qué hace el Dockerfile? (opcional, para entender)

El `Dockerfile` usa una construcción en 3 etapas para mantener la imagen final pequeña:

1. **deps**: instala las dependencias de `package.json`.
2. **builder**: genera el cliente de Prisma (`prisma generate`) y compila la app con `next build`.
3. **runner**: copia solo lo necesario para ejecutar la app en producción (`next start` en modo *standalone*) y la corre con un usuario sin privilegios de root, por seguridad.

La base de datos **no** corre dentro de Docker: es una base Postgres en la nube (Neon), a la que el contenedor se conecta usando `DATABASE_URL` desde `.env.local`.
