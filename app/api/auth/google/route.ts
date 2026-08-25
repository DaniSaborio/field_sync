/**
 * /api/auth/google — POST: sign in / sign up with a Google ID token. Public.
 * Verifies the credential server-side with google-auth-library before trusting
 * it. Creates a new user (role "jugador", status "pendiente") on first login.
 */
import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json(
        { error: "No se recibió la credencial de Google." },
        { status: 400 }
      );
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: "Token de Google inválido." },
        { status: 401 }
      );
    }

    const email = payload.email;
    const fullName = payload.name ?? "Usuario";
    const providerId = payload.sub;

    let user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        role: true,
        estado: true,
      },
    });

    if (!user) {
      const pendienteEstado = await prisma.estado.findUniqueOrThrow({ where: { name: "pendiente" } });

      user = await prisma.user.create({
        data: {
          full_name: fullName,
          email,
          password: "",
          provider: "google",
          provider_id: providerId,
          id_role: 3,
          id_estado: pendienteEstado.id_estado,
          notifications_enabled: true,
        },
        include: {
          role: true,
          estado: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id_user,
        fullName: user.full_name,
        nickname: user.nickname,
        email: user.email,
        role: user.role.name,
        tenantId: user.role.name === "tenant" ? user.id_user : null,
        notificationsEnabled: user.notifications_enabled,
        status: user.estado.name,
      },
    });
  } catch (error) {
    console.error("Google Login:", error);

    return NextResponse.json(
      {
        error: "Error al iniciar sesión con Google.",
      },
      {
        status: 500,
      }
    );
  }
}