import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, generateToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      email, 
      password, 
      phone, 
      shop_name, 
      location, 
      aadhaar_card 
    } = body

    if (!email || !password || !shop_name) {
      return Response.json(
        { error: 'Missing required fields (email, password, shop_name)' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingOwner } = await supabaseAdmin
      .from('owner')
      .select('owner_id')
      .eq('mail', email)
      .single()

    if (existingOwner) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create owner account
    const { data: newOwner, error: ownerError } = await supabaseAdmin
      .from('owner')
      .insert({
        mail: email,
        password: hashedPassword,
        phone: phone || null,
        aadhaar_card: aadhaar_card || null,
        picture: null,
      })
      .select('owner_id, mail')
      .single()

    if (ownerError) {
      console.error('Owner creation error:', ownerError)
      return Response.json(
        { error: 'Failed to create owner account' },
        { status: 500 }
      )
    }

    // Create shop
    const { data: newShop, error: shopError } = await supabaseAdmin
      .from('shop')
      .insert({
        owner_id: newOwner.owner_id,
        name: shop_name,
        slug: shop_name.toLowerCase().replace(/\s+/g, '-'),
        location: location || null,
        location_link: null,
        worker_id_array: [],
        revenue: 0,
        rating: 0,
        picture_array: [],
      })
      .select('shop_id')
      .single()

    if (shopError) {
      console.error('Shop creation error:', shopError)
      return Response.json(
        { error: 'Failed to create shop' },
        { status: 500 }
      )
    }

    // Create holiday calendar for shop
    await supabaseAdmin
      .from('holiday_calendar')
      .insert({
        shop_id: newShop.shop_id,
        event_holiday_dated: [],
        recurring_days_off: [],
      })

    // Generate token
    const token = generateToken({
      userId: newOwner.owner_id,
      email: newOwner.mail,
      role: 'owner',
    })

    return Response.json(
      {
        success: true,
        message: 'Shop registered successfully',
        token,
        user: {
          id: newOwner.owner_id,
          email: newOwner.mail,
          role: 'owner',
          shopId: newShop.shop_id,
        },
        redirectUrl: '/owner/dashboard',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Owner registration error:', error)
    return Response.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}
