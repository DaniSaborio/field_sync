// Service worker de FieldSync: soporte offline solo para las vistas de
// consulta pedidas — disponibilidad de canchas, historial de reservas,
// perfil/historial del jugador y calendario de torneos. Las escrituras
// (reservar, cancelar, etc.) siguen bloqueadas sin conexión desde la propia
// UI (ver BookingPanel), este service worker no las encola ni reintenta.
const CACHE_VERSION = "v1";
const SHELL_CACHE = `fieldsync-shell-${CACHE_VERSION}`;
const API_CACHE = `fieldsync-api-${CACHE_VERSION}`;

// GET /api/courts    -> disponibilidad de canchas + historial de reservas del cliente
// GET /api/profile   -> perfil e historial deportivo del jugador
// GET /api/tournaments -> calendario de torneos
const OFFLINE_API_PATTERNS = [/^\/api\/courts(\/|$)/, /^\/api\/profile(\/|$)/, /^\/api\/tournaments(\/|$)/];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(["/", "/manifest.json"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE && key !== API_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Red primero: siempre trae el dato más fresco que pueda y actualiza el
// cache al vuelo. Si no hay red, sirve lo último que se guardó — así es como
// se "sincroniza" solo, sin lógica extra, apenas vuelve la conexión.
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Cache primero: los archivos de /_next/static/* llevan hash de contenido en
// el nombre (son inmutables), así que una vez que se guardan durante una
// visita online, sirven para siempre sin volver a pedirlos — esto es lo que
// permite que la app arranque (JS + CSS) sin conexión, no solo el HTML.
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (OFFLINE_API_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, SHELL_CACHE));
  }
});

// Notificaciones push (Web Push API): el payload lo manda lib/push.ts como
// JSON { title, body }. Si el push llega sin datos (algunos push services
// mandan un "tickle" vacío) se muestra un texto genérico en vez de fallar.
self.addEventListener("push", (event) => {
  let payload = { title: "FieldSync", body: "Tenés una notificación nueva." };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/logo-fieldsync.svg",
      badge: "/logo-fieldsync.svg",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow("/");
    }),
  );
});
