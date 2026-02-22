import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendShopApprovalEmail } from '@/lib/supabase-helpers'

// Prevent static generation - this route requires database access
export const dynamic = 'force-dynamic'

function generateShopSlug(shopName: string): string {
  return shopName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestId = (await params).id
    const { action } = await request.json() // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get request details
    const { data: requestData, error: requestError } = await supabaseAdmin
      .from('request')
      .select('*')
      .eq('request_id', parseInt(requestId))
      .single()

    if (requestError || !requestData) {
      console.error('Request not found:', requestError)
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    if (action === 'reject') {
      // Update request status to rejected
      const { error: updateError } = await supabaseAdmin
        .from('request')
        .update({ status: 'rejected' })
        .eq('request_id', parseInt(requestId))

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'Shop request rejected',
      })
    }

    // ACTION: APPROVE
    console.log('Approving request:', requestData)

    // STEP 1: Create owner record
    const ownerPassword = generatePassword(12)
    const { data: ownerData, error: ownerError } = await supabaseAdmin
      .from('owner')
      .insert({
        mail: requestData.owner_email,
        password: ownerPassword,
        phone: requestData.owner_phone,
      })
      .select()
      .single()

    if (ownerError) {
      console.error('Owner creation error:', ownerError)
      throw ownerError
    }

    const ownerId = ownerData.owner_id

    // STEP 2: Create shop record
    const shopSlug = generateShopSlug(requestData.shop_name)

    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('shop')
      .insert({
        owner_id: ownerId,
        name: requestData.shop_name,
        slug: shopSlug,
        location: requestData.location,
        picture_array: [],
        worker_id_array: [],
      })
      .select()
      .single()

    if (shopError) {
      console.error('Shop creation error:', shopError)
      throw shopError
    }

    // STEP 3: Update request status to approved
    const { error: updateError } = await supabaseAdmin
      .from('request')
      .update({ status: 'approved' })
      .eq('request_id', parseInt(requestId))

    if (updateError) throw updateError

    // STEP 4: Send approval email to owner with credentials
    await sendShopApprovalEmail(
      requestData.owner_email,
      requestData.owner_email,
      ownerPassword,
      requestData.shop_name
    )

    return NextResponse.json({
      success: true,
      message: 'Shop approved! Owner and shop records created.',
      owner: {
        owner_id: ownerId,
        email: requestData.owner_email,
        password: ownerPassword,
      },
      shop: shopData,
      shop_credentials: {
        email: requestData.owner_email,
        password: ownerPassword,
        owner_id: ownerId,
      },
    })
  } catch (error: any) {
    console.error('Shop approval error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred during approval' },
      { status: 500 }
    )
  }
}

// Get pending shop requests
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
