import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/mail";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "El correo es obligatorio" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Por seguridad, la respuesta es la misma exista o no la cuenta: nunca
    // confirmamos si un correo está registrado.
    if (!user) {
      return NextResponse.json({ message: "Si la cuenta existe, se generó un enlace de recuperación" });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.deleteMany({ where: { id_user: user.id_user } });
    await prisma.passwordResetToken.create({
      data: {
        id_user: user.id_user,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = new URL(`/reset-password?token=${rawToken}`, req.nextUrl.origin).toString();

    if (!isEmailConfigured()) {
      // Sin RESEND_API_KEY configurada seguimos en modo demo: devolvemos el
      // enlace en la respuesta en vez de mandarlo por correo.
      console.log(`[forgot-password] Enlace de recuperación para ${email}: ${resetUrl}`);
      return NextResponse.json({
        message: "Si la cuenta existe, se generó un enlace de recuperación",
        devResetUrl: resetUrl,
      });
    }

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
    }

    return NextResponse.json({ message: "Si la cuenta existe, se generó un enlace de recuperación" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
