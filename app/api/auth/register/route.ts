import { supabase, supabaseAdmin } from '@/lib/supabase'
import { createCustomer, logAuditEvent } from '@/lib/supabase-helpers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, full_name } = body

    if (!email || !password || !full_name) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role: 'customer',
        },
      },
    })

    if (authError) throw authError

    if (!authData.user) {
      throw new Error('Failed to create user')
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role: 'customer',
        status: 'active',
      })

    if (profileError) throw profileError

    // Create customer record
    const { error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        user_id: authData.user.id,
        name: full_name,
        email,
        phone_number: body.phone_number || '',
      })

    if (customerError) throw customerError

    // Log audit event
    await logAuditEvent(
      'user',
      authData.user.id,
      '',
      'CREATE_USER',
      null,
      { email, role: 'customer' }
    )

    return Response.json(
      {
        message: 'User registered successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
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
