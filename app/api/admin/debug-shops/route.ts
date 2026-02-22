import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get all shops with all their data
    const { data: shops, error } = await supabaseAdmin
      .from('shop')
      .select('*')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('[Debug] All shops:', JSON.stringify(shops, null, 2))

    return NextResponse.json({
      success: true,
      totalShops: shops?.length || 0,
      shops: shops || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
