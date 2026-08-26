/**
 * /api/auth/nextauth — disabled stub. This app does not use NextAuth for
 * session handling (see /api/auth/login and /api/auth/google instead); both
 * GET and POST always return { ok: false } without touching the database.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: false, message: "Auth handler not configured for this app" }, { status: 200 });
}

export async function POST() {
  return Response.json({ ok: false, message: "Auth handler not configured for this app" }, { status: 200 });
}
