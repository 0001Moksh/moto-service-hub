import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Fetch shop by owner_id
    const { data: shop, error } = await supabaseAdmin
      .from('shop')
      .select('*')
      .eq('owner_id', payload.userId)
      .single()

    if (error || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      shop,
    })
  } catch (error) {
    console.error('Error fetching shop:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { name, location } = body

    // Get shop first
    const { data: shop } = await supabaseAdmin
      .from('shop')
      .select('*')
      .eq('owner_id', payload.userId)
      .single()

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    // Update shop
    const { data: updatedShop, error } = await supabaseAdmin
      .from('shop')
      .update({
        name: name || shop.name,
        location: location || shop.location,
      })
      .eq('shop_id', shop.shop_id)
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
