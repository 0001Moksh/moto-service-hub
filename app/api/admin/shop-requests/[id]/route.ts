import { NextRequest, NextResponse } from 'next/server'
import { approveShopRequest, rejectShopRequest } from '@/lib/supabase-helpers'
import { verifyToken } from '@/lib/auth'

// Prevent static generation - this route requires database access
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const requestId = parseInt((await params).id)
    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action, reason } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      const result = await approveShopRequest(requestId)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to approve request' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        owner_id: result.owner_id,
        shop_id: result.shop_id,
      })
    } else if (action === 'reject') {
      const result = await rejectShopRequest(requestId, reason)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to reject request' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: result.message,
      })
    }
  } catch (error: any) {
    console.error('Error processing shop request:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
