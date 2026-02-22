import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/supabase-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    if (!payload || payload.role !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const shopId = searchParams.get('shopId')

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      )
    }

    const { data: workers, error } = await supabaseAdmin
      .from('worker')
      .select('*')
      .eq('shop_id', parseInt(shopId))

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      workers: workers || [],
    })
  } catch (error) {
    console.error('Get workers error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    if (!payload || payload.role !== 'owner') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { shop_id, mail, age, password } = body

    if (!shop_id || !mail || !age || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Clean and validate inputs
    const cleanEmail = mail.trim().toLowerCase()
    const cleanPassword = password.toString().trim()

    // Check if email already exists
    const { data: existingWorker } = await supabaseAdmin
      .from('worker')
      .select('worker_id')
      .eq('mail', cleanEmail)
      .single()

    if (existingWorker) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(cleanPassword)

    // Create worker
    const { data: newWorker, error } = await supabaseAdmin
      .from('worker')
      .insert({
        shop_id,
        mail: cleanEmail,
        password: hashedPassword,
        age: parseInt(age),
        aadhaar_card: null,
        rating: 0,
        total: 0,
        service: 0,
        booking: 0,
        revenue: 0,
        performance_score: 0,
        picture: null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Worker creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create worker' },
        { status: 500 }
      )
    }

    // Fetch shop details for email
    const { data: shopData } = await supabaseAdmin
      .from('shop')
      .select('name, slug')
      .eq('shop_id', shop_id)
      .single()

    const shopName = shopData?.name || 'Your Shop'
    const shopSlug = shopData?.slug || 'shop'

    // Send welcome email to worker
    const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const loginUrl = `${domain}/shop/${shopSlug}/worker/login`

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { padding: 20px; background-color: #f5f5f5; margin-top: 20px; border-radius: 5px; }
    .credentials { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f97316; }
    .button { display: inline-block; background-color: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
    .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ${shopName}!</h1>
    </div>
    
    <div class="content">
      <p>Hello,</p>
      
      <p>You have been added as a worker at <strong>${shopName}</strong>. Your login credentials are ready below.</p>
      
      <div class="credentials">
        <h3>Your Login Credentials:</h3>
        <p><strong>Email:</strong> ${cleanEmail}</p>
        <p><strong>Password:</strong> ${cleanPassword}</p>
        <p style="color: #d97706; margin-top: 10px;"><strong>⚠️ Important:</strong> Keep your credentials secure! Change your password after your first login.</p>
      </div>
      
      <p><a href="${loginUrl}" class="button">Login to Your Dashboard</a></p>
      
      <p style="margin-top: 20px; color: #666;">
        Or copy this URL: <br>
        <code style="background: white; padding: 5px; border-radius: 3px;">${loginUrl}</code>
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">
          <strong>What's Next?</strong><br>
          1. Click the login button above<br>
          2. Enter your credentials<br>
          3. Change your password to something you can remember<br>
          4. Start managing jobs and tasks
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p>If you have any questions, contact your shop manager.</p>
      <p>© 2024 Moto ServiceHub. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `

    try {
      await sendEmail(cleanEmail, `Welcome to ${shopName} as Worker!`, emailHtml)
      console.log(`✓ Worker onboarding email sent to ${cleanEmail}`)
    } catch (emailError) {
      console.error('Error sending worker email:', emailError)
      // Continue even if email fails - worker is created successfully
    }

    return NextResponse.json(
      {
        success: true,
        worker: newWorker,
        message: 'Worker created successfully! Welcome email sent to ' + cleanEmail,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create worker error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
