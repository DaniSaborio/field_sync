/**
 * /api/tenant/request — POST: public entry point for a user to request
 * becoming a tenant (or adding another court). Thin wrapper around the same
 * submitTenantRequest() used by POST /api/admin/tenant-requests; review and
 * approval happen through the admin route.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authz";
import { submitTenantRequest } from "@/lib/tenant-requests";

export async function POST(req: NextRequest) {
  try {
    const authz = await requireAuth(req);
    if (!authz.ok) {
      return NextResponse.json({ ok: false, error: authz.error }, { status: authz.status });
    }

    const body = await req.json();
    const result = submitTenantRequest({
      userId: authz.userId,
      userEmail: body?.userEmail ?? "",
      complexName: body?.complexName ?? "",
      phone: body?.phone ?? "",
      address: body?.address ?? "",
      mapsUrl: body?.mapsUrl ?? "",
      courtName: body?.courtName ?? "",
      surface: body?.surface ?? "",
      capacity: body?.capacity ?? "",
      price: body?.price ?? "",
      hasLights: body?.hasLights ?? false,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Solicitud enviada correctamente.",
      request: result.request,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo enviar la solicitud.",
      },
      {
        status: 500,
      }
    );
  }
}