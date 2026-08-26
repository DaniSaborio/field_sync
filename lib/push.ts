import webpush from "web-push";
import { prisma } from "./prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:sacortech@gmail.com",
    vapidPublicKey,
    vapidPrivateKey,
  );
}

export type PushPayload = {
  title: string;
  body: string;
};

// Manda una notificación push a todos los dispositivos suscritos de un
// usuario. Si una suscripción quedó muerta (el navegador la borró, el usuario
// desinstaló la PWA, etc.) el push service responde 404/410 y la limpiamos.
export async function sendPushToUser(userId: number, payload: PushPayload) {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { id_user: userId } });
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription
            .delete({ where: { id_push_subscription: subscription.id_push_subscription } })
            .catch(() => {});
        } else {
          console.warn("No se pudo enviar la notificación push:", error);
        }
      }
    }),
  );
}
