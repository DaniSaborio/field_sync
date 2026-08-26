/**
 * /api/auth/login — POST: email + password login. Public.
 * Looks up the user in Postgres and checks the password with bcrypt.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email },
      include: { role: true, estado: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "No encontramos una cuenta con ese correo o la contraseña es incorrecta." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, dbUser.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "No encontramos una cuenta con ese correo o la contraseña es incorrecta." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: dbUser.id_user,
          email: dbUser.email,
          fullName: dbUser.full_name,
          nickname: dbUser.nickname,
          role: dbUser.role.name,
          tenantId: dbUser.role.name === "tenant" ? dbUser.id_user : null,
          notificationsEnabled: dbUser.notifications_enabled,
          status: dbUser.estado.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
