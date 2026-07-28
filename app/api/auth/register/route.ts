import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

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

    const tenant = await prisma.tenant.findFirst();
    const tenantId = tenant?.id_tenant ?? 1;

    const createdUser = await prisma.user.create({
      data: {
        full_name: fullName,
        email,
        password: hashedPassword,
        role: "jugador",
        id_tenant: tenantId,
        notifications_enabled: true,
      },
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

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: createdUser.id_user,
          email: createdUser.email,
          fullName: createdUser.full_name,
          role: createdUser.role,
          tenantId: createdUser.id_tenant,
          notificationsEnabled: createdUser.notifications_enabled,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
