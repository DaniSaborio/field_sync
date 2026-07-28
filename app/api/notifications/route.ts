import { NextRequest, NextResponse } from "next/server";
import { listNotifications } from "@/lib/fieldsync-store";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = Number(url.searchParams.get("userId") ?? 0);

  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId es obligatorio" }, { status: 400 });
  }

  return NextResponse.json({ notifications: listNotifications(userId) });
}