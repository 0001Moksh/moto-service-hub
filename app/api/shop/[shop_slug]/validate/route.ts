import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shop_slug: string }> }
) {
  try {
    const shopSlug = (await params).shop_slug

    console.log(`[Shop Validate] Looking for shop with slug: ${shopSlug}`)

    // Find shop by slug
    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('shop')
      .select('shop_id, name, slug')
      .eq('slug', shopSlug)
      .single()

    if (shopError) {
      console.error(`[Shop Validate] Query error:`, shopError)
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    if (!shopData) {
      console.error(`[Shop Validate] No shop data returned for slug: ${shopSlug}`)
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    console.log(`[Shop Validate] Found shop:`, { id: shopData.shop_id, name: shopData.name })

    return NextResponse.json({
      success: true,
      shopId: shopData.shop_id,
      shopName: shopData.name,
    })
  } catch (error) {
    console.error('[Shop Validate] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred during validation' },
      { status: 500 }
    )
  }
}
