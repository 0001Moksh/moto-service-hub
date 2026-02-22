import { supabase, supabaseAdmin } from './supabase'
import { hashPassword } from './auth'
import nodemailer from 'nodemailer'

// SMTP Email Setup
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}

const transporter = nodemailer.createTransport(smtpConfig)

// Email Helper Functions
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    })
    console.log('Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId, error: null }
  } catch (error: any) {
    console.error('Email send error:', error)
    return { success: false, messageId: null, error: error.message }
  }
}

export async function sendShopRegistrationEmail(ownerEmail: string, shopName: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0066ff;">Moto ServiceHub - Application Submitted</h2>
      <p>Dear Shop Owner,</p>
      <p>Thank you for registering your shop <strong>${shopName}</strong> with Moto ServiceHub.</p>
      <p style="background-color: #f0f0f0; padding: 15px; border-radius: 5px;">
        <strong>Status:</strong> Under Review ⏳<br>
        Your shop registration request is now under review by our admin team. 
        We will verify your details and send you an approval email with your login credentials 
        within 24-48 hours.
      </p>
      <p>If you have any questions, please contact us at support@motoservicehub.com</p>
      <br>
      <p>Best regards,<br><strong>Moto ServiceHub Team</strong></p>
    </div>
  `
  return sendEmail(ownerEmail, 'Shop Registration - Under Review', html)
}

export async function sendAdminNotificationEmail(
  adminEmail: string,
  shopData: any,
  ownerEmail: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0066ff;">New Shop Registration - Pending Approval</h2>
      <p>A new shop has been registered and is awaiting your approval:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Shop Name:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${shopData.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Owner Email:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${ownerEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${shopData.phone_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Address:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${shopData.address}, ${shopData.city}</td>
        </tr>
      </table>
      <p>Please review and approve/reject this registration in your admin dashboard.</p>
      <br>
      <p>Regards,<br><strong>Moto ServiceHub System</strong></p>
    </div>
  `
  return sendEmail(adminEmail, '[ACTION REQUIRED] New Shop Registration Pending Approval', html)
}

export async function sendShopApprovalEmail(
  ownerEmail: string,
  email: string,
  password: string,
  shopName: string
) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-in`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0066ff; text-align: center;">🎉 Your Shop is Approved!</h2>
      <p>Dear Shop Owner,</p>
      <p>Great news! Your shop <strong>${shopName}</strong> has been approved and is now live on Moto ServiceHub.</p>
      <p style="background-color: #e8f5e9; padding: 15px; border-radius: 5px;">
        <strong>✓ Approved</strong><br>
        Your shop is now active and customers can book services with you.
      </p>
      <h3 style="color: #0066ff;">Your Login Credentials:</h3>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #0066ff;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
      <p>
        <a href="${loginUrl}" style="display: inline-block; background-color: #0066ff; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">
          Login to Your Dashboard
        </a>
      </p>
      <p style="color: #666; font-size: 12px;">
        <strong>Important:</strong> Please change your password after your first login.
      </p>
      <p>If you have any questions, contact us at support@motoservicehub.com</p>
      <br>
      <p>Best regards,<br><strong>Moto ServiceHub Team</strong></p>
    </div>
  `
  return sendEmail(ownerEmail, '✓ Your Shop is Approved! - Welcome to Moto ServiceHub', html)
}

// Auth Functions
export async function signUpUser(email: string, password: string, fullName: string, role: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    })

    if (error) throw error

    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
      })
    }

    return { user: data.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

export async function signInUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return { user: data.user, session: data.session, error: null }
  } catch (error: any) {
    return { user: null, session: null, error: error.message }
  }
}

export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Shop Functions
export async function createShop(shopData: any) {
  try {
    const { data, error } = await supabase
      .from('shops')
      .insert([shopData])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getShop(shopId: string) {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateShop(shopId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('shops')
      .update(updates)
      .eq('id', shopId)
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getShopsByOwner(ownerId: string) {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', ownerId)

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

// Customer Functions
export async function createCustomer(customerData: any) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getCustomer(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Vehicle Functions
export async function addVehicle(vehicleData: any) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getCustomerVehicles(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true)

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

// Service Functions
export async function getShopServices(shopId: string) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_categories(name)
      `)
      .eq('shop_id', shopId)
      .eq('is_available', true)

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

// Booking Functions
export async function createBooking(bookingData: any) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getBooking(bookingId: string) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        shops(name, address),
        customers(name, phone_number),
        vehicles(registration_number, make, model),
        workers(name),
        booking_services(
          *,
          services(name, base_price)
        )
      `)
      .eq('id', bookingId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getCustomerBookings(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        shops(name),
        vehicles(registration_number)
      `)
      .eq('customer_id', customerId)
      .order('booking_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

export async function getShopBookings(shopId: string, status?: string) {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        customers(name, phone_number),
        vehicles(registration_number, make, model),
        workers(name)
      `)
      .eq('shop_id', shopId)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('booking_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Invoice Functions
export async function createInvoice(invoiceData: any) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getBookingInvoice(bookingId: string) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Payment Functions
export async function recordPayment(paymentData: any) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getPayments(invoiceId: string) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

// Review Functions
export async function submitReview(reviewData: any) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getShopReviews(shopId: string) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        customers(name)
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

// Audit Log Functions
export async function logAuditEvent(
  entityType: string,
  entityId: string,
  shopId: string,
  action: string,
  oldValues: any,
  newValues: any
) {
  try {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        shop_id: shopId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action,
        old_values: oldValues,
        new_values: newValues,
      })

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Profile Functions
export async function getUserProfile() {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('No user logged in')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateUserProfile(updates: any) {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('No user logged in')

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userData.user.id)
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Worker Functions
export function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function createWorker(
  shopId: number,
  email: string,
  name: string,
  age: number,
  phoneNumber?: string
) {
  try {
    const password = generateRandomPassword()

    const { data, error } = await supabaseAdmin
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

    if (error) throw error

    return {
      success: true,
      worker: data,
      password: password,
      error: null,
    }
  } catch (error: any) {
    return {
      success: false,
      worker: null,
      password: null,
      error: error.message,
    }
  }
}

export async function getWorkersByShop(shopId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from('worker')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateWorker(workerId: number, updates: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from('worker')
      .update(updates)
      .eq('worker_id', workerId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function deleteWorker(workerId: number) {
  try {
    const { error } = await supabaseAdmin
      .from('worker')
      .delete()
      .eq('worker_id', workerId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function sendWorkerOnboardingEmail(
  workerEmail: string,
  workerName: string,
  shopName: string,
  shopSlug: string,
  password: string,
  domain: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
) {
  try {
    const loginUrl = `${domain}/shop/${shopSlug}/worker/login`

    const emailContent = `
Hello ${workerName},

Welcome to ${shopName}!

You have been added as a worker. Here are your login credentials:

Email: ${workerEmail}
Password: ${password}

Login URL: ${loginUrl}

Please use the above credentials to access your worker dashboard.

Important: 
- Keep your credentials secure
- Change your password after your first login
- Contact your shop manager if you have any issues

Best regards,
Moto ServiceHub Team
    `

    // Mock email function - replace with actual SMTP implementation
    console.log('Worker Onboarding Email:')
    console.log('To:', workerEmail)
    console.log('Subject: Welcome to', shopName)
    console.log('Body:', emailContent)

    // In production, integrate with SendGrid, AWS SES, Resend, etc.
    // Example with fetch to email service:
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     to: workerEmail,
    //     subject: `Welcome to ${shopName}`,
    //     html: emailContent,
    //   }),
    // })

    return {
      success: true,
      message: 'Email sent successfully (mock)',
      error: null,
    }
  } catch (error: any) {
    return {
      success: false,
      message: null,
      error: error.message,
    }
  }
}

// ============================================
// SHOP REGISTRATION REQUEST MANAGEMENT
// ============================================

/**
 * Submit a new shop registration request
 * Data is stored in the request table awaiting admin approval
 */
export async function submitShopRegistrationRequest(data: {
  owner_name: string
  owner_email: string
  owner_phone: string
  shop_name: string
  location: string
  aadhaar_card?: string
}) {
  try {
    const { data: result, error } = await supabaseAdmin
      .from('request')
      .insert({
        owner_name: data.owner_name,
        owner_email: data.owner_email,
        owner_phone: data.owner_phone,
        shop_name: data.shop_name,
        location: data.location,
        aadhaar_card_photo: data.aadhaar_card,
        phone_number: data.owner_phone,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Send confirmation email to registrant
    await sendShopRegistrationEmail(data.owner_email, data.shop_name)

    // TODO: Send admin notification email
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@motoservicehub.com'
    await sendAdminNotificationEmail(
      adminEmail,
      {
        name: data.shop_name,
        phone_number: data.owner_phone,
        address: data.location,
      },
      data.owner_email
    )

    return {
      success: true,
      request_id: result.request_id,
      message: 'Registration request submitted successfully',
      error: null,
    }
  } catch (error: any) {
    console.error('Error submitting shop registration request:', error)
    return {
      success: false,
      request_id: null,
      message: null,
      error: error.message,
    }
  }
}

/**
 * Get all pending shop registration requests
 * Used by admin dashboard
 */
export async function getPendingShopRequests() {
  try {
    const { data, error } = await supabaseAdmin
      .from('request')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data || [],
      error: null,
    }
  } catch (error: any) {
    console.error('Error fetching pending requests:', error)
    return {
      success: false,
      data: [],
      error: error.message,
    }
  }
}

/**
 * Get all shop registration requests (all statuses)
 * Used by admin dashboard with filtering
 */
export async function getAllShopRequests(status?: string) {
  try {
    let query = supabaseAdmin.from('request').select('*')

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data || [],
      error: null,
    }
  } catch (error: any) {
    console.error('Error fetching shop requests:', error)
    return {
      success: false,
      data: [],
      error: error.message,
    }
  }
}

/**
 * Generate a temporary password for approved shop owner
 */
function generateTemporaryPassword(): string {
  const length = 12
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Approve a shop registration request
 * Creates owner and shop records
 */
export async function approveShopRequest(requestId: number, adminNotes?: string) {
  try {
    // Get the request
    const { data: requestData, error: fetchError } = await supabaseAdmin
      .from('request')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (fetchError) throw fetchError
    if (!requestData) throw new Error('Request not found')

    // Generate temporary password
    const tempPassword = generateTemporaryPassword()

    // Hash password using bcrypt
    const hashedPassword = await hashPassword(tempPassword)

    // Create owner record
    const { data: ownerData, error: ownerError } = await supabaseAdmin
      .from('owner')
      .insert({
        mail: requestData.owner_email,
        password: hashedPassword,
        phone: requestData.owner_phone,
        aadhaar_card: requestData.aadhaar_card_photo,
      })
      .select()
      .single()

    if (ownerError) throw new Error(`Failed to create owner: ${ownerError.message}`)

    // Create shop record
    const shopSlug = requestData.shop_name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')

    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('shop')
      .insert({
        owner_id: ownerData.owner_id,
        name: requestData.shop_name,
        slug: shopSlug,
        location: requestData.location,
      })
      .select()
      .single()

    if (shopError) throw new Error(`Failed to create shop: ${shopError.message}`)

    // Update request status
    const { error: updateError } = await supabaseAdmin
      .from('request')
      .update({
        status: 'approved',
      })
      .eq('request_id', requestId)

    if (updateError) throw updateError

    // Send approval email with credentials
    await sendShopApprovalEmail(
      requestData.owner_email,
      requestData.owner_email,
      tempPassword,
      requestData.shop_name
    )

    return {
      success: true,
      owner_id: ownerData.owner_id,
      shop_id: shopData.shop_id,
      message: 'Shop request approved and owner/shop records created',
      error: null,
    }
  } catch (error: any) {
    console.error('Error approving shop request:', error)
    return {
      success: false,
      owner_id: null,
      shop_id: null,
      message: null,
      error: error.message,
    }
  }
}

/**
 * Reject a shop registration request
 */
export async function rejectShopRequest(requestId: number, reason?: string) {
  try {
    // Get the request first to get email
    const { data: requestData, error: fetchError } = await supabaseAdmin
      .from('request')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (fetchError) throw fetchError
    if (!requestData) throw new Error('Request not found')

    // Update request status
    const { error: updateError } = await supabaseAdmin
      .from('request')
      .update({
        status: 'rejected',
      })
      .eq('request_id', requestId)

    if (updateError) throw updateError

    // Send rejection email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Shop Registration - Not Approved</h2>
        <p>Dear ${requestData.owner_name},</p>
        <p>Thank you for applying to register your shop on Moto ServiceHub.</p>
        <p>Unfortunately, your application for <strong>${requestData.shop_name}</strong> has not been approved at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>You can submit a new application after addressing the concerns. For more information, please contact us at support@motoservicehub.com</p>
        <br>
        <p>Best regards,<br><strong>Moto ServiceHub Team</strong></p>
      </div>
    `

    await sendEmail(
      requestData.owner_email,
      'Shop Registration - Application Status',
      html
    )

    return {
      success: true,
      message: 'Shop request rejected',
      error: null,
    }
  } catch (error: any) {
    console.error('Error rejecting shop request:', error)
    return {
      success: false,
      message: null,
      error: error.message,
    }
  }
}
