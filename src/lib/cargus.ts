import axios, { AxiosInstance } from 'axios'

/**
 * Cargus API Client
 * Documentație: https://urgent-cargus.docs.apiary.io/
 */

interface CargusConfig {
  username: string
  password: string
  clientId: string
  apiUrl?: string
}

interface CargusAddress {
  localityId: number // ID-ul orașului din Cargus
  countyId: number // ID-ul județului
  street: string
  streetNo: string
  postalCode?: string
  buildingNo?: string
  entrance?: string
  floor?: string
  flat?: string
}

interface CargusPackage {
  weight: number // kg
  length?: number // cm
  width?: number // cm
  height?: number // cm
  type: 0 | 1 // 0 = colet, 1 = plic
  barcode?: string
}

interface CargusRecipient {
  name: string
  phone: string
  email?: string
  address: CargusAddress
  contactPerson?: string
}

interface CargusShipmentRequest {
  sender: {
    name: string
    phone: string
    address: CargusAddress
  }
  recipient: CargusRecipient
  packages: CargusPackage[]
  service: string // "Standard" sau "Express"
  payment: 0 | 1 | 2 // 0 = expeditor, 1 = destinatar, 2 = terț
  declaredValue?: number
  cashOnDelivery?: number // Ramburs
  saturdayDelivery?: boolean
  openPackage?: boolean // Deschidere la livrare
  observations?: string
}

interface CargusAWBResponse {
  awbNumber: string
  barCode: string
  trackingUrl: string
  cost: number
}

interface CargusTrackingStatus {
  awbNumber: string
  status: string
  statusCode: number
  statusDate: string
  location: string
  history: Array<{
    date: string
    status: string
    location: string
    details?: string
  }>
}

export class CargusClient {
  private client: AxiosInstance
  private config: CargusConfig
  private token: string | null = null
  private tokenExpiry: Date | null = null

  constructor(config: CargusConfig) {
    this.config = {
      ...config,
      apiUrl: config.apiUrl || 'https://urgentcargus.azure-api.net',
    }

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Autentificare și obținere token
   */
  private async authenticate(): Promise<string> {
    // Verifică dacă token-ul existent e încă valid
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token
    }

    try {
      const response = await this.client.post('/api/LoginUser', {
        UserName: this.config.username,
        Password: this.config.password,
      })

      this.token = response.data.Token
      // Token-ul Cargus expiră în 24h
      this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000)

      return this.token
    } catch (error) {
      console.error('Cargus authentication failed:', error)
      throw new Error('Failed to authenticate with Cargus API')
    }
  }

  /**
   * Obține header-ul de autorizare
   */
  private async getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await this.authenticate()
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  /**
   * Caută localitatea după nume și județ
   */
  async searchLocality(
    name: string,
    countyName: string
  ): Promise<Array<{ id: number; name: string; countyId: number }>> {
    try {
      const headers = await this.getAuthHeader()
      const response = await this.client.get('/api/Localities', {
        headers,
        params: {
          name,
          county: countyName,
        },
      })

      return response.data
    } catch (error) {
      console.error('Failed to search locality:', error)
      throw new Error('Failed to search locality in Cargus')
    }
  }

  /**
   * Obține lista județelor
   */
  async getCounties(): Promise<Array<{ id: number; name: string }>> {
    try {
      const headers = await this.getAuthHeader()
      const response = await this.client.get('/api/Counties', { headers })
      return response.data
    } catch (error) {
      console.error('Failed to get counties:', error)
      throw new Error('Failed to get counties from Cargus')
    }
  }

  /**
   * Generează AWB pentru o comandă
   */
  async generateAWB(
    request: CargusShipmentRequest
  ): Promise<CargusAWBResponse> {
    try {
      const headers = await this.getAuthHeader()
      
      const payload = {
        ...request,
        clientId: this.config.clientId,
        shipmentDateTime: new Date().toISOString(),
      }

      const response = await this.client.post('/api/Awbs', payload, { headers })

      return {
        awbNumber: response.data.AwbNumber,
        barCode: response.data.BarCode,
        trackingUrl: `https://www.urgentcargus.ro/tracking-awb?t=${response.data.AwbNumber}`,
        cost: response.data.ShipmentCost || 0,
      }
    } catch (error: any) {
      console.error('Failed to generate AWB:', error.response?.data || error)
      throw new Error(
        error.response?.data?.Message || 'Failed to generate Cargus AWB'
      )
    }
  }

  /**
   * Obține tracking info pentru un AWB
   */
  async getTracking(awbNumber: string): Promise<CargusTrackingStatus> {
    try {
      const headers = await this.getAuthHeader()
      const response = await this.client.get(`/api/Awbs/${awbNumber}/Tracking`, {
        headers,
      })

      const data = response.data

      return {
        awbNumber: data.AwbNumber,
        status: data.CurrentStatus,
        statusCode: data.StatusCode,
        statusDate: data.StatusDate,
        location: data.Location,
        history: data.History?.map((h: any) => ({
          date: h.Date,
          status: h.Status,
          location: h.Location,
          details: h.Details,
        })) || [],
      }
    } catch (error) {
      console.error('Failed to get tracking:', error)
      throw new Error('Failed to get tracking info from Cargus')
    }
  }

  /**
   * Anulează un AWB
   */
  async cancelAWB(awbNumber: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeader()
      await this.client.delete(`/api/Awbs/${awbNumber}`, { headers })
      return true
    } catch (error) {
      console.error('Failed to cancel AWB:', error)
      throw new Error('Failed to cancel Cargus AWB')
    }
  }

  /**
   * Printează AWB (obține PDF-ul)
   */
  async printAWB(
    awbNumbers: string[],
    format: 'A4' | 'A6' = 'A4'
  ): Promise<Buffer> {
    try {
      const headers = await this.getAuthHeader()
      const response = await this.client.post(
        '/api/Awbs/Print',
        {
          AwbNumbers: awbNumbers,
          Format: format,
        },
        {
          headers,
          responseType: 'arraybuffer',
        }
      )

      return Buffer.from(response.data)
    } catch (error) {
      console.error('Failed to print AWB:', error)
      throw new Error('Failed to print Cargus AWB')
    }
  }

  /**
   * Calculează cost transport
   */
  async calculateShippingCost(
    localityId: number,
    packages: CargusPackage[],
    service: string = 'Standard'
  ): Promise<number> {
    try {
      const headers = await this.getAuthHeader()
      const response = await this.client.post(
        '/api/ShippingCost/Calculate',
        {
          ClientId: this.config.clientId,
          LocalityId: localityId,
          Packages: packages,
          Service: service,
        },
        { headers }
      )

      return response.data.Cost || 0
    } catch (error) {
      console.error('Failed to calculate shipping cost:', error)
      return 0
    }
  }

  /**
   * Helper: transformă adresă din format text în format Cargus
   */
  async parseAddress(
    street: string,
    city: string,
    county: string,
    postalCode?: string
  ): Promise<CargusAddress> {
    // Caută localitatea
    const localities = await this.searchLocality(city, county)
    
    if (localities.length === 0) {
      throw new Error(`Localitatea ${city} nu a fost găsită în județul ${county}`)
    }

    const locality = localities[0]

    // Parse numărul străzii din adresă
    const streetMatch = street.match(/^(.+?)\s+(\d+)/)
    const streetName = streetMatch ? streetMatch[1] : street
    const streetNo = streetMatch ? streetMatch[2] : '1'

    return {
      localityId: locality.id,
      countyId: locality.countyId,
      street: streetName,
      streetNo,
      postalCode,
    }
  }
}

/**
 * Factory function pentru a crea client Cargus
 */
export function createCargusClient(config?: CargusConfig): CargusClient {
  const finalConfig: CargusConfig = config || {
    username: process.env.CARGUS_USERNAME!,
    password: process.env.CARGUS_PASSWORD!,
    clientId: process.env.CARGUS_CLIENT_ID!,
    apiUrl: process.env.CARGUS_API_URL,
  }

  if (!finalConfig.username || !finalConfig.password || !finalConfig.clientId) {
    throw new Error('Cargus credentials are not configured')
  }

  return new CargusClient(finalConfig)
}

/**
 * Mapare statusuri Cargus la statusuri interne
 */
export function mapCargusStatus(cargusStatus: string): string {
  const statusMap: Record<string, string> = {
    'Nou': 'PENDING',
    'Preluata': 'PICKED_UP',
    'In tranzit': 'IN_TRANSIT',
    'In livrare': 'OUT_FOR_DELIVERY',
    'Livrata': 'DELIVERED',
    'Returnata': 'RETURNED',
    'Anulata': 'CANCELLED',
  }

  return statusMap[cargusStatus] || 'PENDING'
}
