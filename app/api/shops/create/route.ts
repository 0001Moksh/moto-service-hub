import { supabaseAdmin } from '@/lib/supabase'
import { sendShopRegistrationEmail, sendAdminNotificationEmail } from '@/lib/supabase-helpers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { owner_name, email: owner_email, phone_number, name: shop_name, address, city, aadhaar } = body

    // Validate required fields
    if (!shop_name || !owner_email || !phone_number || !address || !city || !owner_name) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create location from address and city
    const location = `${address}, ${city}`

    // Create a request record for admin approval ONLY
    // No owner or shop record created yet - just pending request
    const { data: requestData, error: requestError } = await supabaseAdmin
      .from('request')
      .insert({
        owner_name: owner_name,
        owner_email: owner_email,
        owner_phone: phone_number,
        shop_name: shop_name,
        phone_number: phone_number,
        location: location,
        aadhaar_card_photo: aadhaar || '',
        status: 'pending',
      })
      .select()

    if (requestError) {
      console.error('Request creation error:', requestError)
      throw requestError
    }

    // Send email to owner - "Under Review"
    await sendShopRegistrationEmail(owner_email, shop_name)

    // Send notification email to admin - "New registration pending approval"
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_MAIL || 'nofackai@gmail.com'
    await sendAdminNotificationEmail(adminEmail, {
      name: shop_name,
      phone_number: phone_number,
      address,
      city,
    }, owner_email)

    return Response.json(
      {
        message: 'Shop registration request submitted. Waiting for admin approval.',
        request: requestData?.[0],
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Shop creation error:', error)
    return Response.json(
      { error: error.message || 'Failed to create shop request' },
      { status: 500 }
    )
  }
}
