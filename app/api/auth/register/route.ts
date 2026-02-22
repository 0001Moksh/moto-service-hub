import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, generateToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, full_name, phone } = body

    if (!email || !password || !full_name) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingCustomer, error: checkError } = await supabaseAdmin
      .from('customer')
      .select('customer_id')
      .eq('mail', email)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Email check error:', checkError)
      return Response.json(
        { error: 'Failed to check email availability' },
        { status: 500 }
      )
    }

    if (existingCustomer) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create customer
    const { data: newCustomer, error: customerError } = await supabaseAdmin
      .from('customer')
      .insert({
        mail: email,
        password: hashedPassword,
        aadhaar_card: null,
        bike_id_array: [],
        rating: 0,
        token: null,
        preferance_score: 0,
        picture: null,
        location: null,
        created_at: new Date().toISOString(),
      })
      .select('customer_id, mail')
      .single()

    if (customerError) {
      console.error('Customer creation error:', customerError)
      return Response.json(
        { error: 'Failed to create customer account' },
        { status: 500 }
      )
    }

    // Generate token
    const token = generateToken({
      userId: newCustomer.customer_id,
      email: newCustomer.mail,
      role: 'customer',
    })

    return Response.json(
      {
        success: true,
        message: 'Customer registered successfully',
        token,
        user: {
          id: newCustomer.customer_id,
          email: newCustomer.mail,
          role: 'customer',
        },
        redirectUrl: '/customer/dashboard',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return Response.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}
