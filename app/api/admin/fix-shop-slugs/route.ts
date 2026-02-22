import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function generateShopSlug(shopName: string | null): string {
  if (!shopName || typeof shopName !== 'string') {
    // Fallback: generate a generic slug based on timestamp
    return `shop-${Date.now()}`
  }
  
  return shopName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function POST(request: NextRequest) {
  try {
    // Get all shops
    const { data: shops, error: fetchError } = await supabaseAdmin
      .from('shop')
      .select('shop_id, name, slug, owner_id')

    if (fetchError) {
      console.error('[Fix Slugs] Error fetching shops:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch shops', details: fetchError },
        { status: 500 }
      )
    }

    if (!shops || shops.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No shops found',
        updated: 0,
      })
    }

    console.log(`[Fix Slugs] Found ${shops.length} total shops`)

    // For each shop without a name, try to get it from the request table
    const shopsWithNames = await Promise.all(
      shops.map(async (shop) => {
        if (shop.name) {
          return shop
        }

        // Try to find the request that created this shop
        const { data: requestData } = await supabaseAdmin
          .from('request')
          .select('shop_name')
          .eq('status', 'approved')
          .limit(1)
          .single()
          .catch(() => ({ data: null }))

        return {
          ...shop,
          name: requestData?.shop_name || `Shop ${shop.shop_id}`,
        }
      })
    )

    // Filter shops that need slug updates
    const shopsNeedingUpdate = shopsWithNames.filter(shop => !shop.slug || shop.slug.trim() === '')
    
    if (shopsNeedingUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All shops already have valid slugs',
        updated: 0,
      })
    }

    console.log(`[Fix Slugs] Found ${shopsNeedingUpdate.length} shops needing slug updates`)

    const updates = []
    for (const shop of shopsNeedingUpdate) {
      const slug = generateShopSlug(shop.name)
      console.log(`[Fix Slugs] Updating shop ${shop.shop_id}: "${shop.name}" → "${slug}"`)

      const { error: updateError } = await supabaseAdmin
        .from('shop')
        .update({ slug })
        .eq('shop_id', shop.shop_id)

      if (updateError) {
        console.error(`Error updating shop ${shop.shop_id}:`, updateError)
        updates.push({
          shop_id: shop.shop_id,
          name: shop.name,
          slug: slug,
          success: false,
          error: updateError.message,
        })
      } else {
        console.log(`[Fix Slugs] ✓ Updated shop ${shop.shop_id}`)
        updates.push({
          shop_id: shop.shop_id,
          name: shop.name,
          slug: slug,
          success: true,
        })
      }
    }

    const successCount = updates.filter(u => u.success).length
    console.log(`[Fix Slugs] Completed: ${successCount}/${updates.length} shops updated`)

    return NextResponse.json({
      success: successCount === updates.length,
      message: `Updated ${successCount}/${updates.length} shops with slugs`,
      updated: successCount,
      details: updates,
    })
  } catch (error) {
    console.error('[Fix Slugs] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fixing shop slugs' },
      { status: 500 }
    )
  }
}
