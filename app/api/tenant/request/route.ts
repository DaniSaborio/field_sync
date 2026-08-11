import { NextRequest, NextResponse } from "next/server";
import { submitTenantRequest } from "@/lib/tenant-requests";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = submitTenantRequest({
      userId: body?.userId ?? 0,
      userEmail: body?.userEmail ?? "",
      complexName: body?.complexName ?? "",
      phone: body?.phone ?? "",
      address: body?.address ?? "",
      mapsUrl: body?.mapsUrl ?? "",
      courtName: body?.courtName ?? "",
      surface: body?.surface ?? "",
      capacity: body?.capacity ?? "",
      price: body?.price ?? "",
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