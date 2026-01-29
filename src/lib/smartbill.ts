import axios, { AxiosInstance } from 'axios'

/**
 * SmartBill API Client
 * Documentație: https://www.smartbill.ro/api/docs/
 */

interface SmartBillConfig {
  token: string
  email: string
  apiUrl?: string
  companyInfo: {
    cif: string
    companyName: string
    regCom: string
    address: string
    iban: string
    bank: string
  }
}

interface SmartBillClient {
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  county?: string
  country?: string
  postalCode?: string
  saveToDb?: boolean
}

interface SmartBillProduct {
  name: string
  code?: string
  isService: boolean
  measuringUnit: string // "buc", "kg", "m", etc.
  currency: string
  quantity: number
  price: number
  isTaxIncluded: boolean
  taxPercentage: number
  taxName?: string
  saveToDb?: boolean
}

interface SmartBillInvoiceRequest {
  companyVatCode: string
  client: SmartBillClient
  issueDate: string
  seriesName: string
  dueDate?: string
  isDraft?: boolean
  products: SmartBillProduct[]
  currency: string
  language?: 'RO' | 'EN' | 'FR' | 'DE' | 'ES' | 'IT'
  precision?: number
  mentions?: string
  observations?: string
  paymentType?: string
}

interface SmartBillInvoiceResponse {
  number: string
  series: string
  url: string
  pdfUrl?: string
}

interface SmartBillPaymentRequest {
  seriesName: string
  number: string
  date: string
  amount: number
  type: string // "Numerar", "Card", "OP", "CEC", etc.
  isCash?: boolean
}

export class SmartBillClient {
  private client: AxiosInstance
  private config: SmartBillConfig

  constructor(config: SmartBillConfig) {
    this.config = {
      ...config,
      apiUrl: config.apiUrl || 'https://ws.smartbill.ro/SBORO/api',
    }

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      auth: {
        username: this.config.email,
        password: this.config.token,
      },
    })
  }

  /**
   * Creează o factură nouă
   */
  async createInvoice(
    request: SmartBillInvoiceRequest
  ): Promise<SmartBillInvoiceResponse> {
    try {
      const response = await this.client.post('/invoice', request)

      return {
        number: response.data.number,
        series: response.data.series,
        url: response.data.url,
        pdfUrl: response.data.url ? `${response.data.url}?format=pdf` : undefined,
      }
    } catch (error: any) {
      console.error('Failed to create invoice:', error.response?.data || error)
      throw new Error(
        error.response?.data?.errorText || 'Failed to create SmartBill invoice'
      )
    }
  }

  /**
   * Șterge o factură (doar dacă e draft sau nu e raportată la ANAF)
   */
  async deleteInvoice(seriesName: string, number: string): Promise<boolean> {
    try {
      await this.client.delete(`/invoice?seriesname=${seriesName}&number=${number}`)
      return true
    } catch (error) {
      console.error('Failed to delete invoice:', error)
      throw new Error('Failed to delete SmartBill invoice')
    }
  }

  /**
   * Anulează o factură (creează o factură de stornare)
   */
  async cancelInvoice(seriesName: string, number: string): Promise<SmartBillInvoiceResponse> {
    try {
      const response = await this.client.post('/invoice/cancel', {
        seriesName,
        number,
      })

      return {
        number: response.data.number,
        series: response.data.series,
        url: response.data.url,
      }
    } catch (error) {
      console.error('Failed to cancel invoice:', error)
      throw new Error('Failed to cancel SmartBill invoice')
    }
  }

  /**
   * Obține PDF-ul unei facturi
   */
  async getInvoicePDF(seriesName: string, number: string): Promise<Buffer> {
    try {
      const response = await this.client.get('/invoice/pdf', {
        params: {
          cif: this.config.companyInfo.cif,
          seriesname: seriesName,
          number,
        },
        responseType: 'arraybuffer',
      })

      return Buffer.from(response.data)
    } catch (error) {
      console.error('Failed to get invoice PDF:', error)
      throw new Error('Failed to get SmartBill invoice PDF')
    }
  }

  /**
   * Trimite factura prin email
   */
  async sendInvoiceEmail(
    seriesName: string,
    number: string,
    email: string,
    cc?: string[]
  ): Promise<boolean> {
    try {
      await this.client.post('/invoice/email', {
        companyVatCode: this.config.companyInfo.cif,
        seriesName,
        number,
        to: email,
        cc: cc?.join(','),
      })
      return true
    } catch (error) {
      console.error('Failed to send invoice email:', error)
      throw new Error('Failed to send SmartBill invoice email')
    }
  }

  /**
   * Adaugă o plată pentru o factură
   */
  async addPayment(payment: SmartBillPaymentRequest): Promise<boolean> {
    try {
      await this.client.post('/payment', {
        companyVatCode: this.config.companyInfo.cif,
        ...payment,
      })
      return true
    } catch (error) {
      console.error('Failed to add payment:', error)
      throw new Error('Failed to add payment to SmartBill invoice')
    }
  }

  /**
   * Obține lista facturilor
   */
  async getInvoices(params: {
    cif: string
    startDate?: string
    endDate?: string
    seriesName?: string
    status?: 'all' | 'paid' | 'unpaid' | 'draft'
    pageIndex?: number
    pageSize?: number
  }): Promise<any[]> {
    try {
      const response = await this.client.get('/invoice/list', { params })
      return response.data.list || []
    } catch (error) {
      console.error('Failed to get invoices:', error)
      throw new Error('Failed to get SmartBill invoices')
    }
  }

  /**
   * Verifică starea unei facturi
   */
  async getInvoiceStatus(seriesName: string, number: string): Promise<{
    isPaid: boolean
    isDraft: boolean
    isCancelled: boolean
    totalAmount: number
    paidAmount: number
  }> {
    try {
      const response = await this.client.get('/invoice', {
        params: {
          cif: this.config.companyInfo.cif,
          seriesname: seriesName,
          number,
        },
      })

      const data = response.data

      return {
        isPaid: data.status === 'paid',
        isDraft: data.isDraft === true,
        isCancelled: data.isCancelled === true,
        totalAmount: parseFloat(data.total) || 0,
        paidAmount: parseFloat(data.paidAmount) || 0,
      }
    } catch (error) {
      console.error('Failed to get invoice status:', error)
      throw new Error('Failed to get SmartBill invoice status')
    }
  }

  /**
   * Creează un client nou în SmartBill
   */
  async createClient(client: SmartBillClient): Promise<boolean> {
    try {
      await this.client.post('/client', {
        companyVatCode: this.config.companyInfo.cif,
        ...client,
      })
      return true
    } catch (error) {
      console.error('Failed to create client:', error)
      // Nu aruncăm eroare, clientul poate exista deja
      return false
    }
  }

  /**
   * Helper: Generează număr de factură (seria + număr)
   */
  async getNextInvoiceNumber(seriesName: string): Promise<string> {
    try {
      const response = await this.client.get('/invoice/nextinvoicenumber', {
        params: {
          cif: this.config.companyInfo.cif,
          seriesname: seriesName,
        },
      })

      return response.data.number || '1'
    } catch (error) {
      console.error('Failed to get next invoice number:', error)
      return '1'
    }
  }
}

/**
 * Factory function pentru a crea client SmartBill
 */
export function createSmartBillClient(config?: Partial<SmartBillConfig>): SmartBillClient {
  const finalConfig: SmartBillConfig = {
    token: config?.token || process.env.SMARTBILL_TOKEN!,
    email: config?.email || process.env.SMARTBILL_EMAIL!,
    apiUrl: config?.apiUrl || process.env.SMARTBILL_API_URL,
    companyInfo: config?.companyInfo || {
      cif: process.env.SMARTBILL_CIF!,
      companyName: process.env.SMARTBILL_COMPANY_NAME!,
      regCom: process.env.SMARTBILL_REG_COM!,
      address: process.env.SMARTBILL_ADDRESS!,
      iban: process.env.SMARTBILL_IBAN!,
      bank: process.env.SMARTBILL_BANK!,
    },
  }

  if (!finalConfig.token || !finalConfig.email) {
    throw new Error('SmartBill credentials are not configured')
  }

  if (!finalConfig.companyInfo.cif) {
    throw new Error('SmartBill company info is not configured')
  }

  return new SmartBillClient(finalConfig)
}

/**
 * Helper: Format date pentru SmartBill (YYYY-MM-DD)
 */
export function formatSmartBillDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Helper: Calculează data scadentă (15 zile de la emitere)
 */
export function calculateDueDate(issueDate: Date, days: number = 15): string {
  const dueDate = new Date(issueDate)
  dueDate.setDate(dueDate.getDate() + days)
  return formatSmartBillDate(dueDate)
}
