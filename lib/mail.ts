import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Sin RESEND_API_KEY configurada seguimos en modo demo: no hay forma de
// mandar el correo, así que el caller debe mostrar el enlace en pantalla.
export function isEmailConfigured() {
  return resend !== null;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    throw new Error("RESEND_API_KEY no está configurada");
  }

  const from = process.env.RESEND_FROM_EMAIL || "FieldSync <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to,
    subject: "Restablecé tu contraseña de FieldSync",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">Restablecé tu contraseña</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en FieldSync.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background: #00FF41; color: #000; padding: 12px 20px; text-decoration: none; font-weight: bold; border: 1px solid #000;">
            Restablecer contraseña
          </a>
        </p>
        <p>Este enlace vence en 30 minutos. Si no pediste este cambio, podés ignorar este correo.</p>
      </div>
    `,
  });
}
