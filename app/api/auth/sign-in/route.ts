import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { comparePassword, generateToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log(`[SIGN-IN] Attempting login for email: ${normalizedEmail}`)

    // Try Admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin')
      .select('admin_id, mail, password')
      .eq('mail', normalizedEmail)
      .maybeSingle()

    if (adminError) {
      console.error('[SIGN-IN] Admin check error:', adminError)
    }

    if (adminData) {
      console.log(`[SIGN-IN] Found admin account for ${normalizedEmail}`)
      try {
        const passwordMatch = await comparePassword(password, adminData.password)
        if (passwordMatch) {
          const token = generateToken({
            userId: adminData.admin_id,
            email: adminData.mail,
            role: 'admin',
          })
          
          return NextResponse.json({
            success: true,
            token,
            user: {
              id: adminData.admin_id,
              email: adminData.mail,
              role: 'admin',
            },
            redirectUrl: '/admin/dashboard',
          })
        }
      } catch (err) {
        console.error('[SIGN-IN] Admin password comparison error:', err)
      }
    }

    // Try Owner
    const { data: ownerData, error: ownerError } = await supabaseAdmin
      .from('owner')
      .select('owner_id, mail, password')
      .eq('mail', normalizedEmail)
      .maybeSingle()

    if (ownerError) {
      console.error('[SIGN-IN] Owner check error:', ownerError)
    }

    if (ownerData) {
      console.log(`[SIGN-IN] Found owner account for ${normalizedEmail}`)
      try {
        const passwordMatch = await comparePassword(password, ownerData.password)
        if (passwordMatch) {
          const token = generateToken({
            userId: ownerData.owner_id,
            email: ownerData.mail,
            role: 'owner',
          })

          return NextResponse.json({
            success: true,
            token,
            user: {
              id: ownerData.owner_id,
              email: ownerData.mail,
              role: 'owner',
            },
            redirectUrl: '/owner/dashboard',
          })
        }
      } catch (err) {
        console.error('[SIGN-IN] Owner password comparison error:', err)
      }
    }

    // Try Customer
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customer')
      .select('customer_id, mail, password')
      .eq('mail', normalizedEmail)
      .maybeSingle()

    if (customerError) {
      console.error('[SIGN-IN] Customer check error:', customerError)
    }

    if (customerData) {
      console.log(`[SIGN-IN] Found customer account for ${normalizedEmail}`)
      console.log(`[SIGN-IN] Customer password hash exists: ${!!customerData.password}`)
      try {
        const passwordMatch = await comparePassword(password, customerData.password)
        console.log(`[SIGN-IN] Customer password match result: ${passwordMatch}`)
        if (passwordMatch) {
          const token = generateToken({
            userId: customerData.customer_id,
            email: customerData.mail,
            role: 'customer',
          })

          return NextResponse.json({
            success: true,
            token,
            user: {
              id: customerData.customer_id,
              email: customerData.mail,
              role: 'customer',
            },
            redirectUrl: '/customer/dashboard',
          })
        }
      } catch (err) {
        console.error('[SIGN-IN] Customer password comparison error:', err)
      }
    }

    // Try Worker
    const { data: workerData, error: workerError } = await supabaseAdmin
      .from('worker')
      .select('worker_id, mail, password, shop_id')
      .eq('mail', normalizedEmail)
      .maybeSingle()

    if (workerError) {
      console.error('[SIGN-IN] Worker check error:', workerError)
    }

    if (workerData) {
      console.log(`[SIGN-IN] Found worker account for ${normalizedEmail}`)
      try {
        const passwordMatch = await comparePassword(password, workerData.password)
        if (passwordMatch) {
          const token = generateToken({
            userId: workerData.worker_id,
            email: workerData.mail,
            role: 'worker',
            shopId: workerData.shop_id,
          })

          return NextResponse.json({
            success: true,
            token,
            user: {
              id: workerData.worker_id,
              email: workerData.mail,
              role: 'worker',
              shopId: workerData.shop_id,
            },
            redirectUrl: '/worker/dashboard',
          })
        }
      } catch (err) {
        console.error('[SIGN-IN] Worker password comparison error:', err)
      }
    }

    console.log(`[SIGN-IN] No matching account found for email: ${normalizedEmail}`)
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Sign-in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
