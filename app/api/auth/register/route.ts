import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { upsertStoreUser } from "@/lib/fieldsync-store";
import { DEMO_TENANT_ID, mapPrismaRole } from "@/lib/hydrate-user";

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

    // El registro público siempre asigna el rol "jugador", sin importar lo que envíe el cliente.
    // Los jugadores no pertenecen a un tenant fijo: pueden reservar en cualquier cancha.
    const jugadorRole = await prisma.role.findUniqueOrThrow({ where: { name: "jugador" } });

    const createdUser = await prisma.user.create({
      data: {
        full_name: fullName,
        email,
        password: hashedPassword,
        id_role: jugadorRole.id_role,
        notifications_enabled: true,
      },
      include: { role: true },
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

    // Equipos/torneos/perfil viven en el store en memoria, separado de
    // Postgres: sincronizamos al usuario acá para que esas funciones lo
    // reconozcan desde el registro, no solo a los 4 de la semilla.
    upsertStoreUser({
      id: createdUser.id_user,
      fullName: createdUser.full_name,
      email: createdUser.email,
      role: mapPrismaRole(createdUser.role.name),
      tenantId: DEMO_TENANT_ID,
      notificationsEnabled: createdUser.notifications_enabled,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: createdUser.id_user,
          email: createdUser.email,
          fullName: createdUser.full_name,
          role: createdUser.role.name,
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
