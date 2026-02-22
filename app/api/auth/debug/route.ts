import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * DEBUG ENDPOINT - Check if account exists and debug login issues
 * Usage: POST /api/auth/debug with { email: "test@example.com" }
 * DO NOT use in production!
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log(`[DEBUG] Checking for account: ${normalizedEmail}`)

    const results: any = {
      email: normalizedEmail,
      admin: null,
      owner: null,
      customer: null,
      worker: null,
    }

    // Check Admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin')
      .select('admin_id, mail')
      .eq('mail', normalizedEmail)
      .maybeSingle()

    if (adminData) {
      results.admin = {
        found: true,
        id: adminData.admin_id,
        email: adminData.mail,
      }
    }

    // Check Owner
    const { data: ownerData, error: ownerError } = await supabaseAdmin
      .from('owner')
      .select('owner_id, mail')
      .eq('mail', normalizedEmail)
      .maybeSingle()

    if (ownerData) {
      results.owner = {
        found: true,
        id: ownerData.owner_id,
        email: ownerData.mail,
      }
    }

    // Check Customer
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customer')
      .select('customer_id, mail, password')
      .eq('mail', normalizedEmail)
      .maybeSingle()

    if (customerData) {
      results.customer = {
        found: true,
        id: customerData.customer_id,
        email: customerData.mail,
        hasPassword: !!customerData.password,
        passwordHash: customerData.password ? customerData.password.substring(0, 20) + '...' : 'NO_PASSWORD',
      }
    }

    // Check Worker
    const { data: workerData, error: workerError } = await supabaseAdmin
      .from('worker')
      .select('worker_id, mail, password')
      .eq('mail', normalizedEmail)
      .maybeSingle()

    if (workerData) {
      results.worker = {
        found: true,
        id: workerData.worker_id,
        email: workerData.mail,
        hasPassword: !!workerData.password,
        passwordHash: workerData.password ? workerData.password.substring(0, 20) + '...' : 'NO_PASSWORD',
      }
    }

    // Check if account found in any table
    const accountFound = results.admin || results.owner || results.customer || results.worker
    
    return NextResponse.json({
      success: true,
      message: accountFound ? 'Account found' : 'Account not found',
      results,
      debug: {
        adminError: adminError?.message,
        ownerError: ownerError?.message,
        customerError: customerError?.message,
        workerError: workerError?.message,
      },
    })
  } catch (error: any) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Debug check failed' },
      { status: 500 }
    )
  }
}
