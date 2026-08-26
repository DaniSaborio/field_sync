import { after } from "next/server";
import { prisma } from "./prisma";
import { sendPushToUser } from "./push";

// Dispara una notificación push sin bloquear la respuesta ni la transacción
// que ya creó la fila en la tabla notification. Se registra con after() para
// que el runtime serverless de Vercel mantenga viva la función hasta que el
// envío termine — sin esto, la promesa quedaba colgada y el push nunca salía
// en producción (la respuesta ya se había mandado y la función se congelaba).
export function notifyPush(userId: number, message: string, title = "FieldSync") {
  after(() =>
    sendPushToUser(userId, { title, body: message }).catch((error) => {
      console.warn("No se pudo enviar la notificación push:", error);
    }),
  );
}

// El patrón repetido en todo el backend: si el usuario tiene las
// notificaciones activadas, guardar la fila en la tabla notification y
// mandar el push. No hace nada si están desactivadas.
export async function notifyUser(userId: number, notificationsEnabled: boolean, type: string, message: string) {
  if (!notificationsEnabled) return;
  await prisma.notification.create({ data: { id_user: userId, type, message } });
  notifyPush(userId, message);
}
