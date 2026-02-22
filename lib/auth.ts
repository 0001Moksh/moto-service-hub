import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRY = '7d'

export type UserRole = 'admin' | 'owner' | 'customer' | 'worker'

export interface JWTPayload {
  userId: number | string
  email: string
  role: UserRole
  shopId?: number
}

/**
 * Hash password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Compare password with hashed password (supports both bcrypt hashes and plain text)
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // Check if stored password looks like a bcrypt hash
    const isBcryptHash = hashedPassword.match(/^\$2[aby]\$\d{2}\$/);
    console.log(`[Auth] Comparing password - Is bcrypt: ${!!isBcryptHash}, Hash: ${hashedPassword?.substring(0, 20)}...`)
    
    if (isBcryptHash) {
      // It's a bcrypt hash, use bcrypt comparison
      const result = await bcrypt.compare(password, hashedPassword)
      console.log(`[Auth] Bcrypt comparison result: ${result}`)
      return result
    } else {
      // It's plain text (for backward compatibility), do direct comparison
      const result = password === hashedPassword
      console.log(`[Auth] Plain text comparison result: ${result}`)
      return result
    }
  } catch (error) {
    console.error(`[Auth] Password comparison error:`, error)
    return false
  }
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Extract token from request headers or cookies
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}

/**
 * Role-based permission check
 */
export function hasPermission(
  userRole: UserRole,
  requiredRoles: UserRole[]
): boolean {
  return requiredRoles.includes(userRole)
}
