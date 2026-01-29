import axios from 'axios'

/**
 * Email Service folosind SendGrid API
 * Documentație: https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */

interface EmailConfig {
  apiKey: string
  fromEmail: string
  fromName: string
}

interface EmailRecipient {
  email: string
  name?: string
}

interface EmailAttachment {
  content: string // Base64 encoded
  filename: string
  type: string // MIME type
  disposition?: 'attachment' | 'inline'
}

interface EmailRequest {
  to: EmailRecipient[]
  subject: string
  html: string
  text?: string
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  attachments?: EmailAttachment[]
  replyTo?: EmailRecipient
}

export class EmailService {
  private apiKey: string
  private fromEmail: string
  private fromName: string

  constructor(config: EmailConfig) {
    this.apiKey = config.apiKey
    this.fromEmail = config.fromEmail
    this.fromName = config.fromName
  }

  /**
   * Trimite un email prin SendGrid
   */
  async sendEmail(request: EmailRequest): Promise<boolean> {
    try {
      const payload = {
        personalizations: [
          {
            to: request.to.map(r => ({ email: r.email, name: r.name })),
            cc: request.cc?.map(r => ({ email: r.email, name: r.name })),
            bcc: request.bcc?.map(r => ({ email: r.email, name: r.name })),
            subject: request.subject,
          },
        ],
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        reply_to: request.replyTo ? {
          email: request.replyTo.email,
          name: request.replyTo.name,
        } : undefined,
        content: [
          {
            type: 'text/html',
            value: request.html,
          },
          request.text ? {
            type: 'text/plain',
            value: request.text,
          } : undefined,
        ].filter(Boolean),
        attachments: request.attachments?.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.type,
          disposition: att.disposition || 'attachment',
        })),
      }

      await axios.post('https://api.sendgrid.com/v3/mail/send', payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      return true
    } catch (error: any) {
      console.error('Failed to send email:', error.response?.data || error)
      throw new Error('Failed to send email via SendGrid')
    }
  }

  /**
   * Trimite email de confirmare comandă
   */
  async sendOrderConfirmation(
    email: string,
    customerName: string,
    orderNumber: string,
    orderTotal: number,
    currency: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Confirmare Comandă</h1>
            </div>
            <div class="content">
              <p>Bună ${customerName},</p>
              <p>Vă mulțumim pentru comandă! Comanda dumneavoastră a fost primită și este în curs de procesare.</p>
              
              <h2>Detalii Comandă</h2>
              <p><strong>Număr comandă:</strong> #${orderNumber}</p>
              <p><strong>Total:</strong> ${orderTotal.toFixed(2)} ${currency}</p>
              
              <p>Veți primi un email de confirmare când comanda va fi expediată.</p>
              
              <p style="margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}" class="button">
                  Vezi Comanda
                </a>
              </p>
            </div>
            <div class="footer">
              <p>Acest email a fost trimis automat. Vă rugăm să nu răspundeți.</p>
              <p>© ${new Date().getFullYear()} WooMate. Toate drepturile rezervate.</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: [{ email, name: customerName }],
      subject: `Confirmare Comandă #${orderNumber}`,
      html,
      text: `Bună ${customerName}, comanda dumneavoastră #${orderNumber} a fost primită. Total: ${orderTotal.toFixed(2)} ${currency}`,
    })
  }

  /**
   * Trimite email cu informații de expediere
   */
  async sendShippingNotification(
    email: string,
    customerName: string,
    orderNumber: string,
    awbNumber: string,
    trackingUrl: string,
    courier: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .tracking-box { background: white; border: 2px solid #10B981; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
            .awb-number { font-size: 24px; font-weight: bold; color: #10B981; margin: 10px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Comanda a Fost Expediată!</h1>
            </div>
            <div class="content">
              <p>Bună ${customerName},</p>
              <p>Vestea bună! Comanda dumneavoastră #${orderNumber} a fost expediată și este în drum către dumneavoastră.</p>
              
              <div class="tracking-box">
                <p><strong>Curier:</strong> ${courier}</p>
                <p><strong>Număr AWB:</strong></p>
                <div class="awb-number">${awbNumber}</div>
              </div>
              
              <p>Puteți urmări coletul dumneavoastră folosind numărul AWB de mai sus sau accesând link-ul de tracking.</p>
              
              <p style="margin-top: 30px; text-align: center;">
                <a href="${trackingUrl}" class="button">
                  Urmărește Coletul
                </a>
              </p>
            </div>
            <div class="footer">
              <p>Acest email a fost trimis automat. Vă rugăm să nu răspundeți.</p>
              <p>© ${new Date().getFullYear()} WooMate. Toate drepturile rezervate.</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: [{ email, name: customerName }],
      subject: `📦 Comanda #${orderNumber} a fost expediată - AWB ${awbNumber}`,
      html,
      text: `Bună ${customerName}, comanda #${orderNumber} a fost expediată. AWB: ${awbNumber}. Tracking: ${trackingUrl}`,
    })
  }

  /**
   * Trimite email cu factura atașată
   */
  async sendInvoice(
    email: string,
    customerName: string,
    invoiceNumber: string,
    pdfBase64: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Factura Dumneavoastră</h1>
            </div>
            <div class="content">
              <p>Bună ${customerName},</p>
              <p>Vă transmitem factura pentru comanda dumneavoastră.</p>
              
              <p><strong>Număr factură:</strong> ${invoiceNumber}</p>
              
              <p>Factura este atașată la acest email în format PDF.</p>
              
              <p>Vă mulțumim pentru încrederea acordată!</p>
            </div>
            <div class="footer">
              <p>Acest email a fost trimis automat. Vă rugăm să nu răspundeți.</p>
              <p>© ${new Date().getFullYear()} WooMate. Toate drepturile rezervate.</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: [{ email, name: customerName }],
      subject: `Factura ${invoiceNumber}`,
      html,
      text: `Bună ${customerName}, vă trimitem factura ${invoiceNumber} atașată la acest email.`,
      attachments: [
        {
          content: pdfBase64,
          filename: `Factura_${invoiceNumber}.pdf`,
          type: 'application/pdf',
        },
      ],
    })
  }

  /**
   * Trimite notificare administratorilor
   */
  async sendAdminNotification(
    subject: string,
    message: string,
    adminEmails: string[]
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Notificare Sistem WooMate</h1>
            </div>
            <div class="content">
              <p><strong>${subject}</strong></p>
              <p>${message}</p>
              <p><small>Timestamp: ${new Date().toISOString()}</small></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} WooMate - Sistem de Automatizare</p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: adminEmails.map(email => ({ email })),
      subject: `[WooMate Alert] ${subject}`,
      html,
      text: `${subject}\n\n${message}`,
    })
  }
}

/**
 * Factory function pentru a crea serviciul de email
 */
export function createEmailService(config?: EmailConfig): EmailService {
  const finalConfig: EmailConfig = config || {
    apiKey: process.env.SENDGRID_API_KEY!,
    fromEmail: process.env.FROM_EMAIL!,
    fromName: process.env.FROM_NAME || 'WooMate',
  }

  if (!finalConfig.apiKey || !finalConfig.fromEmail) {
    throw new Error('Email service is not configured')
  }

  return new EmailService(finalConfig)
}
