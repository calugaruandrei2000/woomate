import axios, { AxiosInstance } from 'axios'
import crypto from 'crypto'

/**
 * WooCommerce REST API Client
 * Documentație: https://woocommerce.github.io/woocommerce-rest-api-docs/
 */

interface WooCommerceConfig {
  url: string
  consumerKey: string
  consumerSecret: string
  version?: string
}

export interface WooOrder {
  id: number
  number: string
  status: string
  currency: string
  date_created: string
  date_modified: string
  total: string
  subtotal: string
  shipping_total: string
  total_tax: string
  payment_method: string
  payment_method_title: string
  billing: WooAddress
  shipping: WooAddress
  line_items: WooLineItem[]
  customer_note: string
  meta_data?: Array<{
    key: string
    value: any
  }>
}

export interface WooAddress {
  first_name: string
  last_name: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  state: string
  postcode: string
  country: string
  email?: string
  phone?: string
}

export interface WooLineItem {
  id: number
  name: string
  product_id: number
  variation_id?: number
  quantity: number
  subtotal: string
  total: string
  sku: string
  price: number
  meta_data?: Array<{
    key: string
    value: any
  }>
}

export interface WooOrdersQuery {
  page?: number
  per_page?: number
  status?: string | string[]
  after?: string // ISO 8601 date
  before?: string
  order?: 'asc' | 'desc'
  orderby?: 'date' | 'id' | 'title'
}

export class WooCommerceClient {
  private client: AxiosInstance
  private config: WooCommerceConfig

  constructor(config: WooCommerceConfig) {
    this.config = {
      ...config,
      version: config.version || 'wc/v3',
    }

    // Asigură-te că URL-ul nu are trailing slash
    const baseURL = this.config.url.replace(/\/$/, '')

    this.client = axios.create({
      baseURL: `${baseURL}/wp-json/${this.config.version}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WooMate/1.0',
      },
      auth: {
        username: this.config.consumerKey,
        password: this.config.consumerSecret,
      },
    })
  }

  /**
   * Obține toate comenzile (cu paginare)
   */
  async getOrders(query: WooOrdersQuery = {}): Promise<WooOrder[]> {
    try {
      const params = {
        per_page: query.per_page || 100,
        page: query.page || 1,
        status: query.status,
        after: query.after,
        before: query.before,
        order: query.order || 'desc',
        orderby: query.orderby || 'date',
      }

      const response = await this.client.get('/orders', { params })
      return response.data
    } catch (error: any) {
      console.error('Failed to get orders:', error.response?.data || error)
      throw new Error('Failed to fetch WooCommerce orders')
    }
  }

  /**
   * Obține o comandă specifică după ID
   */
  async getOrder(orderId: number): Promise<WooOrder | null> {
    try {
      const response = await this.client.get(`/orders/${orderId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      console.error('Failed to get order:', error.response?.data || error)
      throw new Error(`Failed to fetch WooCommerce order ${orderId}`)
    }
  }

  /**
   * Actualizează statusul unei comenzi
   */
  async updateOrderStatus(
    orderId: number,
    status: string,
    note?: string
  ): Promise<WooOrder> {
    try {
      const data: any = { status }
      
      if (note) {
        data.customer_note = note
      }

      const response = await this.client.put(`/orders/${orderId}`, data)
      return response.data
    } catch (error: any) {
      console.error('Failed to update order status:', error.response?.data || error)
      throw new Error(`Failed to update WooCommerce order ${orderId}`)
    }
  }

  /**
   * Adaugă o notă la comandă
   */
  async addOrderNote(
    orderId: number,
    note: string,
    isCustomerNote: boolean = false
  ): Promise<any> {
    try {
      const response = await this.client.post(`/orders/${orderId}/notes`, {
        note,
        customer_note: isCustomerNote,
      })
      return response.data
    } catch (error: any) {
      console.error('Failed to add order note:', error.response?.data || error)
      throw new Error(`Failed to add note to WooCommerce order ${orderId}`)
    }
  }

  /**
   * Adaugă meta data la comandă
   */
  async updateOrderMeta(
    orderId: number,
    metaData: Array<{ key: string; value: any }>
  ): Promise<WooOrder> {
    try {
      const response = await this.client.put(`/orders/${orderId}`, {
        meta_data: metaData,
      })
      return response.data
    } catch (error: any) {
      console.error('Failed to update order meta:', error.response?.data || error)
      throw new Error(`Failed to update meta for WooCommerce order ${orderId}`)
    }
  }

  /**
   * Obține comenzile noi (procesate recent)
   */
  async getNewOrders(since?: Date): Promise<WooOrder[]> {
    const afterDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000) // Ultimele 24h

    return this.getOrders({
      status: ['processing', 'pending'],
      after: afterDate.toISOString(),
      per_page: 100,
    })
  }

  /**
   * Marchează comanda ca fiind procesată (completată)
   */
  async completeOrder(
    orderId: number,
    trackingNumber?: string,
    trackingUrl?: string
  ): Promise<WooOrder> {
    const metaData: Array<{ key: string; value: any }> = []
    
    if (trackingNumber) {
      metaData.push({ key: '_woomate_tracking_number', value: trackingNumber })
    }
    
    if (trackingUrl) {
      metaData.push({ key: '_woomate_tracking_url', value: trackingUrl })
    }

    try {
      const response = await this.client.put(`/orders/${orderId}`, {
        status: 'completed',
        meta_data: metaData.length > 0 ? metaData : undefined,
      })

      // Adaugă și o notă pentru client
      if (trackingNumber) {
        await this.addOrderNote(
          orderId,
          `Comanda dumneavoastră a fost expediată. Număr AWB: ${trackingNumber}`,
          true
        )
      }

      return response.data
    } catch (error: any) {
      console.error('Failed to complete order:', error.response?.data || error)
      throw new Error(`Failed to complete WooCommerce order ${orderId}`)
    }
  }

  /**
   * Testează conexiunea la WooCommerce
   */
  async testConnection(): Promise<boolean> {
    try {
      // Încearcă să obții informații despre magazin
      await this.client.get('/system_status')
      return true
    } catch (error) {
      console.error('WooCommerce connection test failed:', error)
      return false
    }
  }
}

/**
 * Verifică semnătura webhook-ului WooCommerce
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return false
  }
}

/**
 * Factory function pentru a crea client WooCommerce
 */
export function createWooCommerceClient(config: WooCommerceConfig): WooCommerceClient {
  if (!config.url || !config.consumerKey || !config.consumerSecret) {
    throw new Error('WooCommerce credentials are incomplete')
  }

  return new WooCommerceClient(config)
}

/**
 * Transformă o comandă WooCommerce în format intern
 */
export function transformWooOrder(wooOrder: WooOrder, tenantId: string) {
  return {
    wooOrderId: String(wooOrder.id),
    wooOrderNumber: wooOrder.number,
    tenantId,
    customerName: `${wooOrder.billing.first_name} ${wooOrder.billing.last_name}`,
    customerEmail: wooOrder.billing.email || '',
    customerPhone: wooOrder.billing.phone || wooOrder.shipping.phone,
    shippingAddress: {
      street: wooOrder.shipping.address_1,
      street2: wooOrder.shipping.address_2,
      city: wooOrder.shipping.city,
      county: wooOrder.shipping.state,
      postalCode: wooOrder.shipping.postcode,
      country: wooOrder.shipping.country,
    },
    billingAddress: {
      street: wooOrder.billing.address_1,
      street2: wooOrder.billing.address_2,
      city: wooOrder.billing.city,
      county: wooOrder.billing.state,
      postalCode: wooOrder.billing.postcode,
      country: wooOrder.billing.country,
    },
    items: wooOrder.line_items.map(item => ({
      id: item.id,
      productId: item.product_id,
      variationId: item.variation_id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: parseFloat(item.price.toString()),
      total: parseFloat(item.total),
    })),
    subtotal: parseFloat(wooOrder.subtotal),
    shipping: parseFloat(wooOrder.shipping_total),
    tax: parseFloat(wooOrder.total_tax),
    total: parseFloat(wooOrder.total),
    currency: wooOrder.currency,
    paymentMethod: wooOrder.payment_method_title,
    notes: wooOrder.customer_note,
    status: mapWooStatus(wooOrder.status),
    paymentStatus: mapPaymentStatus(wooOrder.status),
  }
}

/**
 * Mapează statusul WooCommerce la statusul intern
 */
function mapWooStatus(wooStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'PENDING',
    'processing': 'PROCESSING',
    'on-hold': 'PENDING',
    'completed': 'DELIVERED',
    'cancelled': 'CANCELLED',
    'refunded': 'REFUNDED',
    'failed': 'CANCELLED',
  }

  return statusMap[wooStatus] || 'PENDING'
}

/**
 * Mapează statusul WooCommerce la status plată
 */
function mapPaymentStatus(wooStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'PENDING',
    'processing': 'PAID',
    'on-hold': 'PENDING',
    'completed': 'PAID',
    'cancelled': 'FAILED',
    'refunded': 'REFUNDED',
    'failed': 'FAILED',
  }

  return statusMap[wooStatus] || 'PENDING'
}
