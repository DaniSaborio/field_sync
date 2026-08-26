/**
 * /api/auth/register — POST: public self-service sign-up.
 * Always creates the account with role "jugador" regardless of what the
 * client sends (becoming a tenant goes through /api/tenant/request instead).
 * Hashes the password with bcrypt and creates the PlayerProfile row.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSessionToken, setSessionCookie } from "@/lib/jwt";
import { toSessionUser } from "@/lib/services/users";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
    const nickname = typeof body?.nickname === "string" && body.nickname.trim() ? body.nickname.trim() : null;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese correo" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Public registration always assigns the "jugador" (player) role, regardless of what the client sends.
    // Players don't belong to a fixed tenant: they can book at any court.
    const [jugadorRole, pendienteEstado] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { name: "jugador" } }),
      prisma.estado.findUniqueOrThrow({ where: { name: "pendiente" } }),
    ]);

    const createdUser = await prisma.user.create({
      data: {
        full_name: fullName,
        nickname,
        email,
        password: hashedPassword,
        id_role: jugadorRole.id_role,
        id_estado: pendienteEstado.id_estado,
        notifications_enabled: true,
      },
      include: { role: true, estado: true },
    });

    await prisma.playerProfile.create({
      data: {
        id_user: createdUser.id_user,
        visibility: "public",
        is_available: true,
        goals: 0,
        assists: 0,
        matches_played: 0,
      },
    });

    const token = signSessionToken({ userId: createdUser.id_user, role: createdUser.role.name });

    const response = NextResponse.json(
      {
        message: "User created successfully",
        user: toSessionUser(createdUser),
      },
      { status: 201 }
    );
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
