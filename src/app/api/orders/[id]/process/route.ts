import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/db'
import { createCargusClient } from '@/lib/cargus'
import { createSmartBillClient, formatSmartBillDate, calculateDueDate } from '@/lib/smartbill'
import { createEmailService } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const orderId = params.id

    // Găsește comanda
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: true,
        shipment: true,
        invoice: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.status !== 'PENDING' && order.status !== 'PROCESSING') {
      return NextResponse.json(
        { error: 'Order already processed' },
        { status: 400 }
      )
    }

    // Update status la PROCESSING
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    })

    // 1. GENEREAZĂ AWB CARGUS
    let shipment = null
    if (!order.shipment && order.tenant.cargusUsername) {
      try {
        const cargusClient = createCargusClient({
          username: order.tenant.cargusUsername,
          password: order.tenant.cargusPassword!,
          clientId: order.tenant.cargusClientId!,
        })

        const shippingAddr = order.shippingAddress as any

        // Parse adresa
        const address = await cargusClient.parseAddress(
          shippingAddr.street,
          shippingAddr.city,
          shippingAddr.county,
          shippingAddr.postalCode
        )

        // Generează AWB
        const awbResult = await cargusClient.generateAWB({
          sender: {
            name: order.tenant.name,
            phone: '0722000000', // Din configurare tenant
            address: {
              localityId: 22193, // București - exemplu
              countyId: 10,
              street: 'Str. Exemplu',
              streetNo: '1',
            },
          },
          recipient: {
            name: order.customerName,
            phone: order.customerPhone || '0700000000',
            email: order.customerEmail,
            address,
          },
          packages: [
            {
              weight: 1, // kg - poate fi calculat din produse
              type: 0, // colet
            },
          ],
          service: 'Standard',
          payment: 0, // expeditor plătește
          declaredValue: parseFloat(order.total.toString()),
        })

        // Salvează shipment-ul
        shipment = await prisma.shipment.create({
          data: {
            orderId: order.id,
            tenantId: order.tenantId,
            awbNumber: awbResult.awbNumber,
            courier: 'Cargus',
            status: 'GENERATED',
            shippingCost: awbResult.cost,
            trackingHistory: [
              {
                date: new Date().toISOString(),
                status: 'AWB generat',
                location: 'Depozit',
              },
            ],
          },
        })

        console.log(`[Process] AWB generated: ${awbResult.awbNumber}`)
      } catch (error) {
        console.error('[Process] Cargus error:', error)
        // Continuăm, nu oprim procesarea
      }
    }

    // 2. GENEREAZĂ FACTURĂ SMARTBILL
    let invoice = null
    if (!order.invoice && order.tenant.smartbillToken) {
      try {
        const smartbillClient = createSmartBillClient({
          token: order.tenant.smartbillToken,
          email: order.tenant.smartbillEmail!,
          companyInfo: {
            cif: process.env.SMARTBILL_CIF!,
            companyName: process.env.SMARTBILL_COMPANY_NAME!,
            regCom: process.env.SMARTBILL_REG_COM!,
            address: process.env.SMARTBILL_ADDRESS!,
            iban: process.env.SMARTBILL_IBAN!,
            bank: process.env.SMARTBILL_BANK!,
          },
        })

        const billingAddr = order.billingAddress as any
        const items = order.items as any[]

        const invoiceResult = await smartbillClient.createInvoice({
          companyVatCode: process.env.SMARTBILL_CIF!,
          client: {
            name: order.customerName,
            email: order.customerEmail,
            phone: order.customerPhone || undefined,
            address: billingAddr.street,
            city: billingAddr.city,
            county: billingAddr.county,
            country: billingAddr.country || 'Romania',
            postalCode: billingAddr.postalCode,
            saveToDb: true,
          },
          issueDate: formatSmartBillDate(new Date()),
          seriesName: 'WM',
          dueDate: calculateDueDate(new Date(), 15),
          products: items.map((item: any) => ({
            name: item.name,
            code: item.sku || `PROD-${item.productId}`,
            isService: false,
            measuringUnit: 'buc',
            currency: order.currency,
            quantity: item.quantity,
            price: item.price,
            isTaxIncluded: true,
            taxPercentage: 19,
            taxName: 'TVA',
          })),
          currency: order.currency,
          language: 'RO',
        })

        // Salvează factura
        invoice = await prisma.invoice.create({
          data: {
            orderId: order.id,
            tenantId: order.tenantId,
            invoiceNumber: invoiceResult.number,
            invoiceSeries: invoiceResult.series,
            provider: 'SmartBill',
            amount: order.subtotal,
            tax: order.tax,
            total: order.total,
            currency: order.currency,
            status: 'ISSUED',
            issuedAt: new Date(),
            pdfUrl: invoiceResult.pdfUrl,
          },
        })

        console.log(`[Process] Invoice created: ${invoiceResult.number}`)
      } catch (error) {
        console.error('[Process] SmartBill error:', error)
        // Continuăm
      }
    }

    // 3. TRIMITE EMAIL-URI
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      try {
        const emailService = createEmailService()

        // Email cu AWB
        if (shipment) {
          await emailService.sendShippingNotification(
            order.customerEmail,
            order.customerName,
            order.wooOrderNumber || order.wooOrderId,
            shipment.awbNumber!,
            `https://www.urgentcargus.ro/tracking-awb?t=${shipment.awbNumber}`,
            'Cargus'
          )
        }

        // Email cu factură
        if (invoice && invoice.pdfUrl) {
          // TODO: Download PDF and send as attachment
          console.log('[Process] Invoice email skipped (PDF download needed)')
        }
      } catch (error) {
        console.error('[Process] Email error:', error)
      }
    }

    // Update comandă
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: shipment ? 'SHIPPED' : 'PROCESSING',
        processedAt: new Date(),
      },
    })

    // Log activitate
    await prisma.activityLog.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        action: 'order.processed',
        userId: session.userId,
        details: {
          awbGenerated: !!shipment,
          invoiceGenerated: !!invoice,
        },
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: shipment ? 'SHIPPED' : 'PROCESSING',
      },
      shipment: shipment ? {
        id: shipment.id,
        awbNumber: shipment.awbNumber,
      } : null,
      invoice: invoice ? {
        id: invoice.id,
        number: invoice.invoiceNumber,
      } : null,
    })
  } catch (error) {
    console.error('[Process] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    )
  }
}
