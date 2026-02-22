import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { comparePassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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

    // Trim and normalize inputs
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.toString().trim()

    console.log(`[Worker Verify] Looking up worker: ${cleanEmail} in shop: ${shopData.shop_id}`)

    // Find worker by email and shop_id
    const { data: workerData, error: workerError } = await supabaseAdmin
      .from('worker')
      .select('worker_id, mail, password, shop_id')
      .eq('mail', cleanEmail)
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
      console.error(`[Worker Verify] No worker found for email: ${cleanEmail}`)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password using bcrypt comparison
    console.log(`[Worker Verify] Stored password preview: ${workerData.password?.substring(0, 20)}...`)
    console.log(`[Worker Verify] Submitted password: ${cleanPassword}`)
    console.log(`[Worker Verify] Is bcrypt hash: ${/^\$2[aby]\$\d{2}\$/.test(workerData.password)}`)
    
    const passwordMatch = await comparePassword(cleanPassword, workerData.password)
    console.log(`[Worker Verify] Password match result: ${passwordMatch}`)
    
    if (!passwordMatch) {
      console.error(`[Worker Verify] Password mismatch for worker: ${cleanEmail}`)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log(`[Worker Verify] Worker authenticated successfully: ${cleanEmail}`)

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
