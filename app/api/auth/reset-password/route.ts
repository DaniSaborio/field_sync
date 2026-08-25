/**
 * /api/auth/reset-password — POST: consume a reset token from
 * /api/auth/forgot-password. Public. Hashes the submitted token and compares
 * it to the stored hash; rejects if missing, already used, or expired. On
 * success, updates the password and deletes all reset tokens for that user.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token y nueva contraseña son obligatorios" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token_hash: tokenHash } });

    if (!resetToken || resetToken.used_at || resetToken.expires_at < new Date()) {
      return NextResponse.json({ error: "El enlace de recuperación es inválido o expiró" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id_user: resetToken.id_user },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.deleteMany({ where: { id_user: resetToken.id_user } }),
    ]);

    return NextResponse.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
