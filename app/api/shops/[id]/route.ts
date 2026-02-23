import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
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
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { id } = await params
    const shopId = parseInt(id)

    // Fetch shop details
    const { data: shop, error } = await supabaseAdmin
      .from('shop')
      .select(
        `
        *,
        owner:owner_id(owner_id, mail, phone),
        workers:worker(worker_id, mail)
      `
      )
      .eq('shop_id', shopId)
      .single()

    if (error || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    // Fetch working hours/availability
    const { data: availability } = await supabaseAdmin
      .from('worker_availability')
      .select('*')
      .eq('shop_id', shopId)

    return NextResponse.json({
      success: true,
      shop: {
        ...shop,
        availability: availability || [],
      },
    })
  } catch (error) {
    console.error('Error fetching shop details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
