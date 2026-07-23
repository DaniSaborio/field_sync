import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id_user: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with that email already exists' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        password,
        role: 'user',
      },
      select: {
        id_user: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id_user,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
          fullName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
