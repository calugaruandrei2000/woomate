import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { verifyPassword, setSession } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Parola prea scurtă'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validare input
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Date invalide', details: result.error.errors },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // Caută user-ul
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Credențiale invalide' },
        { status: 401 }
      )
    }

    // Verifică parola
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credențiale invalide' },
        { status: 401 }
      )
    }

    // Creează sesiune
    await setSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Eroare la autentificare' },
      { status: 500 }
    )
  }
}
