import { NextRequest, NextResponse } from "next/server";
import {
  listTenantRequests,
  submitTenantRequest,
  updateTenantRequestStatus,
} from "@/lib/tenant-requests";

export async function GET() {
  return NextResponse.json({
    requests: listTenantRequests(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = submitTenantRequest({
      userId: body?.userId,
      userEmail: body?.userEmail,
      complexName: body?.complexName,
      phone: body?.phone,
      address: body?.address,
      mapsUrl: body?.mapsUrl,
      courtName: body?.courtName,
      surface: body?.surface,
      capacity: body?.capacity,
      price: body?.price,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Solicitud enviada correctamente.", request: result.request });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo enviar la solicitud.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = updateTenantRequestStatus({
      requestId: body?.requestId,
      status: body?.status,
      reviewerName: body?.reviewerName,
      notes: body?.notes,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, request: result.request });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo actualizar la solicitud.",
      },
      { status: 500 },
    );
  }
}
