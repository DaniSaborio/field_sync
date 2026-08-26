/**
 * /api/push/unsubscribe — POST: remove a Web Push subscription by its
 * `endpoint` (e.g. when the browser drops/rotates the subscription).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authz";

export async function POST(request: NextRequest) {
  const authz = await requireAuth(request);
  if (!authz.ok) {
    return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
  }

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;

  if (!endpoint) {
    return NextResponse.json({ ok: false, error: "endpoint es obligatorio" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint, id_user: authz.userId } });

  return NextResponse.json({ ok: true });
}
