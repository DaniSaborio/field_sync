import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRateForSchedule, scheduleTypeLabel, SCHEDULE_TYPES, type RateCandidate, type ScheduleType } from "@/lib/rates";

const SURFACES = ["synthetic", "natural", "indoor"] as const;

function isSurface(value: unknown): value is (typeof SURFACES)[number] {
  return typeof value === "string" && (SURFACES as readonly string[]).includes(value);
}

// El dueño de la cancha (tenant) edita el nombre, ubicación, superficie,
// capacidad, precio base y los precios por franja horaria (mañana/tarde/
// noche) de una de sus propias canchas.
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = Number(body?.tenantId);
    const courtId = Number(body?.courtId);

    if (!tenantId || !courtId) {
      return NextResponse.json({ ok: false, error: "Faltan datos para actualizar la cancha" }, { status: 400 });
    }

    const court = await prisma.court.findUnique({ where: { id_court: courtId } });
    if (!court) {
      return NextResponse.json({ ok: false, error: "No encontramos la cancha" }, { status: 404 });
    }
    if (court.id_tenant !== tenantId) {
      return NextResponse.json({ ok: false, error: "Esta cancha no te pertenece" }, { status: 403 });
    }

    const data: {
      name?: string;
      address?: string | null;
      maps_url?: string | null;
      surface?: string;
      capacity?: string;
      price_per_hour?: number;
    } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ ok: false, error: "El nombre de la cancha es obligatorio" }, { status: 400 });
      }
      data.name = name;
    }
    if (typeof body.address === "string") data.address = body.address.trim() || null;
    if (typeof body.mapsUrl === "string" || body.mapsUrl === null) data.maps_url = body.mapsUrl || null;
    if (body.surface !== undefined) {
      if (!isSurface(body.surface)) {
        return NextResponse.json({ ok: false, error: "Superficie inválida" }, { status: 400 });
      }
      data.surface = body.surface;
    }
    if (typeof body.capacity === "string") {
      const capacity = body.capacity.trim();
      if (!capacity) {
        return NextResponse.json({ ok: false, error: "La capacidad es obligatoria" }, { status: 400 });
      }
      data.capacity = capacity;
    }
    if (body.pricePerHour !== undefined) {
      const price = Number(body.pricePerHour);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ ok: false, error: "El precio base por hora debe ser un número mayor a cero" }, { status: 400 });
      }
      data.price_per_hour = price;
    }

    const rateInput = body?.rates as Partial<Record<ScheduleType, number | null>> | undefined;

    try {
      await prisma.$transaction(async (tx) => {
        if (Object.keys(data).length > 0) {
          await tx.court.update({ where: { id_court: courtId }, data });
        }

        if (rateInput) {
          for (const scheduleType of SCHEDULE_TYPES) {
            if (!(scheduleType in rateInput)) continue;
            const value = rateInput[scheduleType];
            const existing = await tx.rate.findFirst({ where: { id_court: courtId, schedule_type: scheduleType } });

            if (value === null || value === undefined) {
              if (existing) await tx.rate.delete({ where: { id_rate: existing.id_rate } });
              continue;
            }

            const amount = Number(value);
            if (!Number.isFinite(amount) || amount <= 0) {
              throw new Error(`El precio para la franja "${scheduleTypeLabel(scheduleType)}" debe ser mayor a cero`);
            }

            if (existing) {
              await tx.rate.update({ where: { id_rate: existing.id_rate }, data: { amount } });
            } else {
              await tx.rate.create({
                data: {
                  id_tenant: tenantId,
                  id_court: courtId,
                  name: `Tarifa ${scheduleTypeLabel(scheduleType).toLowerCase()}`,
                  schedule_type: scheduleType,
                  amount,
                  priority: 1,
                },
              });
            }
          }
        }
      });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : "No pudimos actualizar la cancha" },
        { status: 400 },
      );
    }

    const updated = await prisma.court.findUnique({ where: { id_court: courtId }, include: { rates: true } });
    if (!updated) {
      return NextResponse.json({ ok: false, error: "No encontramos la cancha" }, { status: 404 });
    }

    const rateCandidates: RateCandidate[] = updated.rates.map((rate) => ({
      id_rate: rate.id_rate,
      id_court: rate.id_court,
      schedule_type: rate.schedule_type,
      amount: Number(rate.amount),
      priority: rate.priority,
    }));
    const rates = Object.fromEntries(
      SCHEDULE_TYPES.map((type) => [type, resolveRateForSchedule(rateCandidates, type)?.amount ?? null]),
    ) as Record<ScheduleType, number | null>;

    return NextResponse.json({
      ok: true,
      court: {
        id: updated.id_court,
        tenantId: updated.id_tenant,
        name: updated.name,
        location: updated.address ?? "Ubicación no disponible",
        mapsUrl: updated.maps_url,
        surface: updated.surface,
        capacity: updated.capacity,
        pricePerHour: updated.price_per_hour !== null ? Number(updated.price_per_hour) : 0,
        rates,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No pudimos actualizar la cancha" },
      { status: 500 },
    );
  }
}
