import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyWebhookSignature, transformWooOrder } from '@/lib/woocommerce'
import { createEmailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      )
    }

    // Găsește tenant-ul
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant || !tenant.isActive) {
      return NextResponse.json(
        { error: 'Tenant not found or inactive' },
        { status: 404 }
      )
    }

    // Obține payload-ul
    const rawBody = await request.text()
    const signature = request.headers.get('x-wc-webhook-signature')

    // Verifică semnătura (dacă e configurată)
    if (tenant.webhookSecret && signature) {
      const isValid = verifyWebhookSignature(
        rawBody,
        signature,
        tenant.webhookSecret
      )

      if (!isValid) {
        console.warn(`[Webhook] Invalid signature for tenant ${tenant.name}`)
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const payload = JSON.parse(rawBody)
    const topic = request.headers.get('x-wc-webhook-topic')

    console.log(`[Webhook] Received ${topic} for tenant ${tenant.name}`)

    // Procesează webhook-ul
    if (topic === 'order.created' || topic === 'order.updated') {
      // Transformă comanda
      const orderData = transformWooOrder(payload, tenant.id)

      // Verifică dacă comanda există
      const existingOrder = await prisma.order.findFirst({
        where: {
          tenantId: tenant.id,
          wooOrderId: orderData.wooOrderId,
        },
      })

      if (existingOrder) {
        // Update comandă existentă
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            status: orderData.status,
            paymentStatus: orderData.paymentStatus,
            updatedAt: new Date(),
          },
        })

        console.log(`[Webhook] Updated order ${existingOrder.id}`)
      } else {
        // Creează comandă nouă
        const newOrder = await prisma.order.create({
          data: orderData,
        })

        console.log(`[Webhook] Created order ${newOrder.id}`)

        // Trimite email de confirmare
        if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
          try {
            const emailService = createEmailService()
            await emailService.sendOrderConfirmation(
              orderData.customerEmail,
              orderData.customerName,
              orderData.wooOrderNumber || orderData.wooOrderId,
              parseFloat(orderData.total.toString()),
              orderData.currency
            )
          } catch (emailError) {
            console.error('[Webhook] Email error:', emailError)
            // Nu aruncăm eroare, webhook-ul rămâne valid
          }
        }

        // Log activitate
        await prisma.activityLog.create({
          data: {
            tenantId: tenant.id,
            orderId: newOrder.id,
            action: 'order.created',
            details: {
              source: 'webhook',
              wooOrderId: orderData.wooOrderId,
            },
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Order processed',
      })
    }

    // Alt tip de webhook
    return NextResponse.json({
      success: true,
      message: 'Webhook received',
    })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
