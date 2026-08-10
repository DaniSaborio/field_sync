import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Nueva solicitud de tenant:");
    console.log(body);

    return NextResponse.json({
      success: true,
      message: "Solicitud enviada correctamente.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "No se pudo enviar la solicitud.",
      },
      {
        status: 500,
      }
    );
  }
}