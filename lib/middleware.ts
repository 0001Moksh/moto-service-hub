import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, UserRole, hasPermission } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: number | string
    email: string
    role: UserRole
    shopId?: number
  }
}

/**
 * Middleware to check authentication
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const authReq = req as AuthenticatedRequest
    authReq.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      shopId: payload.shopId,
    }

    return handler(authReq)
  }
}

/**
 * Middleware to check role-based access
 */
export function withRoleAuth(
  allowedRoles: UserRole[],
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!hasPermission(payload.role, allowedRoles)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const authReq = req as AuthenticatedRequest
    authReq.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      shopId: payload.shopId,
    }

    return handler(authReq)
  }
}
