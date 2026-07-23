import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id_user: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No encontramos una cuenta con ese correo. Revisa tus datos o regístrate.' },
        { status: 401 }
      );
    }

    const isPasswordValid = user.password === password;

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'La contraseña es incorrecta. Intenta de nuevo.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id_user,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } 
  
  catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
