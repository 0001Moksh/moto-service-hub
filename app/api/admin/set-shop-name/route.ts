import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function generateShopSlug(shopName: string): string {
  return shopName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function POST(request: NextRequest) {
  try {
    const { shopId, name } = await request.json()

    if (!shopId || !name) {
      return NextResponse.json(
        { error: 'shopId and name are required' },
        { status: 400 }
      )
    }

    const slug = generateShopSlug(name)

    console.log(`[Set Shop Name] Updating shop ${shopId}: name="${name}", slug="${slug}"`)

    const { error: updateError } = await supabaseAdmin
      .from('shop')
      .update({ name, slug })
      .eq('shop_id', shopId)

    if (updateError) {
      console.error('[Set Shop Name] Error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    console.log(`[Set Shop Name] ✓ Updated shop ${shopId}`)

    return NextResponse.json({
      success: true,
      message: `Shop name and slug updated successfully`,
      shopId,
      name,
      slug,
    })
  } catch (error: any) {
    console.error('[Set Shop Name] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
