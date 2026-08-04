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