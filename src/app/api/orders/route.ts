import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/db'

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = request.nextUrl
    const tenantId = searchParams.get('tenantId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (tenantId) where.tenantId = tenantId
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
          shipment: true,
          invoice: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
