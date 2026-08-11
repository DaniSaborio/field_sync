export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: false, message: "Auth handler not configured for this app" }, { status: 200 });
}

export async function POST() {
  return Response.json({ ok: false, message: "Auth handler not configured for this app" }, { status: 200 });
}
