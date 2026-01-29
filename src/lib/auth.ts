import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

// Verifică dacă JWT_SECRET există
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: string
}

/**
 * Hash-uiește o parolă folosind bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Verifică o parolă față de hash-ul ei
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Creează un JWT token
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

/**
 * Verifică și decodifică un JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Obține sesiunea curentă din cookie
 */
export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    return verifyToken(token)
  } catch (error) {
    console.error('Failed to get session:', error)
    return null
  }
}

/**
 * Setează sesiunea în cookie
 */
export async function setSession(payload: JWTPayload): Promise<void> {
  const token = await createToken(payload)
  const cookieStore = await cookies()

  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    domain: process.env.COOKIE_DOMAIN,
  })
}

/**
 * Șterge sesiunea
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

/**
 * Verifică dacă utilizatorul este autentificat
 */
export async function requireAuth(): Promise<JWTPayload> {
  const session = await getSession()
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  return session
}

/**
 * Verifică dacă utilizatorul are un rol specific
 */
export async function requireRole(allowedRoles: string[]): Promise<JWTPayload> {
  const session = await requireAuth()
  
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden')
  }
  
  return session
}
