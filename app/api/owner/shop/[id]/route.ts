import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    if (!payload || payload.role !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const shopId = parseInt(params.id)
    const body = await request.json()

    // Verify ownership
    const { data: shop } = await supabaseAdmin
      .from('shop')
      .select('*')
      .eq('shop_id', shopId)
      .single()

    if (!shop || shop.owner_id !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update shop
    const { data: updatedShop, error } = await supabaseAdmin
      .from('shop')
      .update(body)
      .eq('shop_id', shopId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update shop' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shop: updatedShop,
    })
  } catch (error) {
    console.error('Error updating shop:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
