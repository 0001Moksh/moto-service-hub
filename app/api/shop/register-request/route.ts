import { NextRequest, NextResponse } from 'next/server'
import { submitShopRegistrationRequest } from '@/lib/supabase-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { owner_name, owner_email, owner_phone, shop_name, location, aadhaar_card } = body

    if (!owner_name || !owner_email || !owner_phone || !shop_name || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(owner_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^\d{10,15}$/
    const cleanPhone = owner_phone.replace(/\D/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    // Submit shop registration request
    const result = await submitShopRegistrationRequest({
      owner_name,
      owner_email,
      owner_phone,
      shop_name,
      location,
      aadhaar_card,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit registration request' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        request_id: result.request_id,
        message: result.message,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in shop registration request:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
