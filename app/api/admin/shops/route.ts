import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('Authorization') || ''
    const token = authHeader.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Missing authentication token' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    // Fetch all shops
    const { data: shops, error: shopsError } = await supabaseAdmin
      .from('shop')
      .select('*')
      .order('shop_id', { ascending: false })

    if (shopsError) {
      console.error('Database error:', shopsError)
      return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 })
    }

    // Get owner details for each shop
    const enrichedShops = await Promise.all(
      (shops || []).map(async (shop: any) => {
        // Get owner info
        const { data: owner } = await supabaseAdmin
          .from('owner')
          .select('mail, phone')
          .eq('owner_id', shop.owner_id)
          .single()

        return {
          shop_id: shop.shop_id,
          shop_name: shop.name,
          location: shop.location,
          owner_email: owner?.mail || 'N/A',
          status: 'active',
          rating: shop.rating || 0,
          revenue: shop.revenue || 0,
          created_at: shop.created_at,
        }
      })
    )

    return NextResponse.json({
      success: true,
      shops: enrichedShops,
      total: enrichedShops.length,
    })
  } catch (error: any) {
    console.error('Shops fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
