import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/db'
import { createCargusClient } from '@/lib/cargus'
import { createSmartBillClient, formatSmartBillDate, calculateDueDate } from '@/lib/smartbill'
import { createEmailService } from '@/lib/email'

export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;

  // exemplu de citire a body-ului
  const data = await req.json();

  // aici poți folosi bcryptjs fără probleme
  const hashed = await bcrypt.hash(data.password, 10);

  return NextResponse.json({ success: true, hashed });
}
