/**
 * /api/courts — the core booking API. Public (no admin/tenant role required;
 * ownership is enforced per-action instead).
 * GET:    court availability. Public mode returns active courts with open
 *         slots; `manage=true&tenantId=` returns one tenant's own courts with
 *         all reservations (used by the tenant dashboard).
 * POST:   create a reservation as "pendiente" + its Payment row. Uses
 *         `SELECT ... FOR UPDATE` on the court row to serialize concurrent
 *         attempts and prevent double-booking the same slot.
 * DELETE: the booking player cancels their own reservation (must be the
 *         owner, 24h+ notice, and not already closed/paid).
 * PATCH:  the tenant confirms or rejects the declared payment for a
 *         reservation on one of their own courts (checked via court.id_tenant).
 *
 * All business logic lives in lib/services/courts.ts and
 * lib/services/reservations.ts — this file only parses the request and
 * translates the service result into an HTTP response.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/authz";
import { listCourts } from "@/lib/services/courts";
import { cancelReservation, createReservation, isPaymentMethod, verifyPayment } from "@/lib/services/reservations";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? undefined;
  const timeSlot = url.searchParams.get("timeSlot") ?? undefined;
  const surface = url.searchParams.get("surface") ?? undefined;
  const userId = url.searchParams.get("userId");
  const hasLights = url.searchParams.get("hasLights") === "true" ? true : undefined;
  const manage = url.searchParams.get("manage") === "true";

  // `manage=true` expone todas las reservas (nombre, email, monto) de las
  // canchas de un tenant — solo el propio tenant autenticado puede pedirla,
  // nunca un tenantId que mande el cliente.
  let tenantId: number | undefined;
  if (manage) {
    const authz = await requireRole(request, ["tenant"]);
    if (!authz.ok) {
      return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
    }
    tenantId = authz.userId;
  }

  try {
    const courts = await listCourts({
      date,
      timeSlot,
      surface,
      hasLights,
      manage,
      userId: userId ? Number(userId) : undefined,
      tenantId,
    });

    return NextResponse.json({ courts });
  } catch (dbError) {
    console.error("Courts query failed:", dbError);
    return NextResponse.json(
      { ok: false, error: "No pudimos cargar las canchas. Intenta de nuevo." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authz = await requireAuth(request);
    if (!authz.ok) {
      return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
    }

    const body = await request.json();
    const rawPaymentMethod = body?.paymentMethod;

    const result = await createReservation({
      userId: authz.userId,
      courtId: Number(body?.courtId),
      date: String(body?.date ?? ""),
      timeSlot: String(body?.timeSlot ?? ""),
      paymentMethod: isPaymentMethod(rawPaymentMethod) ? rawPaymentMethod : null,
      teamId: body?.teamId ? Number(body.teamId) : null,
      splitPayment: Boolean(body?.splitPayment),
      rivalTeamId: body?.rivalTeamId ? Number(body.rivalTeamId) : null,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // Antes esto caía en silencio al store en memoria: la reserva "se creaba"
    // ahí pero como el GET siempre lee de Postgres, quedaba invisible para
    // siempre tanto para el jugador como para el dueño de la cancha. Mejor
    // devolver el error real para que la persona pueda reintentar.
    console.error("Reserve court failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos procesar la reserva. Intenta de nuevo." },
      { status: 503 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authz = await requireAuth(request);
    if (!authz.ok) {
      return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
    }

    const body = await request.json();

    const result = await cancelReservation({
      reservationId: Number(body?.reservationId),
      userId: authz.userId,
      now: body?.now ? new Date(String(body.now)) : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cancel reservation failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos cancelar la reserva. Intenta de nuevo." },
      { status: 503 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authz = await requireRole(request, ["tenant"]);
    if (!authz.ok) {
      return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
    }

    const body = await request.json();

    const result = await verifyPayment({
      reservationId: Number(body?.reservationId),
      tenantId: authz.userId,
      action: String(body?.action ?? "") as "confirm" | "reject",
      reason: body?.reason ? String(body.reason) : null,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Verify payment failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos verificar el pago. Intenta de nuevo." },
      { status: 503 },
    );
  }
}
