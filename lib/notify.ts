import { sendPushToUser } from "./push";

// Dispara una notificación push sin bloquear la respuesta ni la transacción
// que ya creó la fila en la tabla notification — si el envío falla (usuario
// sin suscripción, push service caído, etc.) solo se registra el warning.
export function notifyPush(userId: number, message: string, title = "FieldSync") {
  sendPushToUser(userId, { title, body: message }).catch((error) => {
    console.warn("No se pudo enviar la notificación push:", error);
  });
}
