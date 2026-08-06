import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { upsertStoreUser } from "@/lib/fieldsync-store";
import { DEMO_TENANT_ID, mapPrismaRole } from "@/lib/hydrate-user";

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
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          full_name: fullName,
          email,
          password: "",
          provider: "google",
          provider_id: providerId,
          id_role: 3,
          notifications_enabled: true,
        },
        include: {
          role: true,
        },
      });
    }

    // Equipos/torneos/perfil viven en el store en memoria, separado de
    // Postgres: sincronizamos al usuario acá para que esas funciones lo
    // reconozcan desde el primer login con Google, no solo a los 4 de la semilla.
    upsertStoreUser({
      id: user.id_user,
      fullName: user.full_name,
      email: user.email,
      role: mapPrismaRole(user.role.name),
      tenantId: DEMO_TENANT_ID,
      notificationsEnabled: user.notifications_enabled,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id_user,
        fullName: user.full_name,
        email: user.email,
        role: user.role.name,
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