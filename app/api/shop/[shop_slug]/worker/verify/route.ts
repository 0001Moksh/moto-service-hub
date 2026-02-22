import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shop_slug: string }> }
) {
  try {
    const shopSlug = (await params).shop_slug

    console.log(`[Worker Verify] Verifying worker for shop slug: ${shopSlug}`)

    // Get shop by slug
    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('shop')
      .select('shop_id, name, slug')
      .eq('slug', shopSlug)
      .single()

    if (shopError) {
      console.error(`[Worker Verify] Shop lookup error:`, shopError)
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    if (!shopData) {
      console.error(`[Worker Verify] No shop found for slug: ${shopSlug}`)
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log(`[Worker Verify] Looking up worker: ${email} in shop: ${shopData.shop_id}`)

    // Find worker by email and shop_id
    const { data: workerData, error: workerError } = await supabaseAdmin
      .from('worker')
      .select('worker_id, mail, password, shop_id')
      .eq('mail', email)
      .eq('shop_id', shopData.shop_id)
      .single()

    if (workerError) {
      console.error(`[Worker Verify] Worker lookup error:`, workerError)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!workerData) {
      console.error(`[Worker Verify] No worker found for email: ${email}`)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    if (workerData.password !== password) {
      console.error(`[Worker Verify] Password mismatch for worker: ${email}`)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log(`[Worker Verify] Worker authenticated successfully: ${email}`)

    return NextResponse.json({
      success: true,
      workerId: workerData.worker_id,
      email: workerData.mail,
      shopId: shopData.shop_id,
      shopName: shopData.name,
    })
  } catch (error) {
    console.error('[Worker Verify] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
