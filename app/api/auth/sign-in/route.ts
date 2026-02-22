import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check admin table first
    const { data: adminData, error: adminError } = await supabase
      .from('admin')
      .select('admin_id, mail, password')
      .eq('mail', email)
      .single()

    if (!adminError && adminData) {
      // Check password match
      if (adminData.password === password) {
        return NextResponse.json({
          success: true,
          role: 'admin',
          userId: adminData.admin_id,
          email: adminData.mail,
          redirectUrl: '/admin/dashboard',
        })
      }
    }

    // Check owner table
    const { data: ownerData, error: ownerError } = await supabase
      .from('owner')
      .select('owner_id, mail, password')
      .eq('mail', email)
      .single()

    if (!ownerError && ownerData) {
      // Check password match
      if (ownerData.password === password) {
        return NextResponse.json({
          success: true,
          role: 'owner',
          userId: ownerData.owner_id,
          email: ownerData.mail,
          redirectUrl: '/owner/dashboard',
        })
      }
    }

    // Check customer table
    const { data: customerData, error: customerError } = await supabase
      .from('customer')
      .select('customer_id, mail, password')
      .eq('mail', email)
      .single()

    if (!customerError && customerData) {
      // Check password match
      if (customerData.password === password) {
        return NextResponse.json({
          success: true,
          role: 'customer',
          userId: customerData.customer_id,
          email: customerData.mail,
          redirectUrl: '/customer/dashboard',
        })
      }
    }

    // No match found
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Sign-in error:', error)
    return NextResponse.json(
      { error: 'An error occurred during sign-in' },
      { status: 500 }
    )
  }
}
