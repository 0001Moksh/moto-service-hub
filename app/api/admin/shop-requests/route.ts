import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Prevent static generation - requires database access
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: requests, error } = await supabaseAdmin
      .from('request')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      requests: requests || [],
    })
  } catch (error) {
    console.error('Get requests error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
