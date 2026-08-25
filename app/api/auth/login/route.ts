/**
 * /api/auth/login — POST: email + password login. Public.
 * Looks up the user in Postgres and checks the password with bcrypt; if the
 * Prisma query fails, falls back to the in-memory demo store. On success,
 * syncs the user into the in-memory store (teams/tournaments/profile data).
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginUser as loginUserMemory, upsertStoreUser } from "@/lib/fieldsync-store";
import { DEMO_TENANT_ID, mapPrismaRole } from "@/lib/hydrate-user";

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

    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { email },
        include: { role: true, estado: true },
      });
    } catch (dbError) {
      console.warn("Prisma login query failed, falling back to in-memory store:", dbError);
    }

    if (dbUser) {
      const passwordMatch = await bcrypt.compare(password, dbUser.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "No encontramos una cuenta con ese correo o la contraseña es incorrecta." },
          { status: 401 }
        );
      }

      // Teams/tournaments/profile live in the in-memory store, separate from
      // Postgres: we sync the user here so those functions recognize them
      // from the first login, not just the 4 seeded demo users.
      upsertStoreUser({
        id: dbUser.id_user,
        fullName: dbUser.full_name,
        nickname: dbUser.nickname,
        email: dbUser.email,
        role: mapPrismaRole(dbUser.role.name),
        tenantId: dbUser.role.name === "tenant" ? dbUser.id_user : DEMO_TENANT_ID,
        notificationsEnabled: dbUser.notifications_enabled,
      });

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
    }

    const memoryUser = loginUserMemory(email, password);
    if (memoryUser) {
      return NextResponse.json(
        {
          message: "Login successful",
          user: memoryUser,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "No encontramos una cuenta con ese correo o la contraseña es incorrecta." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
