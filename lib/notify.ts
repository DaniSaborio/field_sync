import { after } from "next/server";
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
