import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/supabase-helpers'

export const dynamic = 'force-dynamic'

function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    const {
      shopId,
      email,
      name,
      age,
      phoneNumber,
      shopName,
      shopSlug,
    } = await request.json()

    // Validate inputs
    if (!shopId || !email || !name || !age) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const password = generateRandomPassword()

    // Create worker
    const { data: workerData, error: workerError } = await supabaseAdmin
      .from('worker')
      .insert({
        shop_id: shopId,
        mail: email,
        password: password,
        name: name,
        age: age,
        phone_number: phoneNumber || null,
      })
      .select()
      .single()

    if (workerError) {
      console.error('Worker creation error:', workerError)
      return NextResponse.json(
        { error: workerError.message },
        { status: 400 }
      )
    }

    // Send onboarding email via SMTP
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
      <p>Hello ${name},</p>
      
      <p>You have been added as a worker at <strong>${shopName}</strong>. Your login credentials are ready below.</p>
      
      <div class="credentials">
        <h3>Your Login Credentials:</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
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
      await sendEmail(email, `Welcome to ${shopName} as Worker!`, emailHtml)
      console.log(`✓ Worker onboarding email sent to ${email}`)
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      worker: workerData,
      password: password,
      message: `Worker added successfully! Email sent to ${email}`,
    })
  } catch (error: any) {
    console.error('Add worker error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while adding the worker' },
      { status: 500 }
    )
  }
}
