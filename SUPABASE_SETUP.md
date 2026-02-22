# Supabase Setup Guide for Moto Service Hub

## Overview
This guide walks you through the complete setup of Supabase for the Moto Service Hub project.

## Prerequisites
- Supabase account (already set up)
- Project URL: `https://brnsimoaoxuhpxzrfpcg.supabase.co`
- Environment variables already configured in `.env.local`

## Step 1: Execute Database Migrations

### Via Supabase Dashboard (Recommended for beginners)
1. Go to [Supabase Dashboard](https://app.supabase.com) → Select your project
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `lib/migrations/001_initial_schema.sql`
5. Click **Run** button
6. Wait for completion (you should see green checkmark)
7. Repeat the same process with `lib/migrations/002_rls_policies.sql`

### Via Supabase CLI (Recommended for development)
```bash
# Install Supabase CLI (if not already installed)
npm install -g @supabase/cli

# Link to your project
supabase link --project-ref brnsimoaoxuhpxzrfpcg

# Run migrations
supabase migration up

# Or manually run SQL files
supabase sql lib/migrations/001_initial_schema.sql
supabase sql lib/migrations/002_rls_policies.sql
```

## Step 2: Set Up Storage Buckets

Go to **Storage** in Supabase dashboard and create these buckets:

1. **shop-logos** (Public)
   - For shop/garage logos and branding images

2. **worker-profiles** (Public)
   - For worker profile pictures

3. **customer-avatars** (Public)
   - For customer profile pictures

4. **service-images** (Public)
   - For service category and before/after photos

5. **documents** (Private)
   - For invoices, receipts, licenses (private - only accessible by owners)

6. **vehicles** (Private)
   - For vehicle photos and documentation

## Step 3: Configure Authentication

### Email Authentication (Already Enabled)
1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Go to **Email Templates** and customize if needed

### Optional: Add Social Authentication
1. Go to **Authentication** → **Providers**
2. Enable "Google" or other providers
3. Add your OAuth credentials

## Step 4: Verify Tables and Schemas

Go to **Database** → **Tables** and verify all tables exist:
- ✓ profiles
- ✓ shops
- ✓ service_categories
- ✓ services
- ✓ workers
- ✓ customers
- ✓ vehicles
- ✓ bookings
- ✓ booking_services
- ✓ invoices
- ✓ payments
- ✓ reviews
- ✓ audit_logs
- ✓ worker_availability
- ✓ shop_operating_hours

## Step 5: Test Database Connection

Run this in your project:
```bash
npm run dev
```

Then verify connection by checking if you can:
1. Log in at the signup page
2. Create a profile
3. Access protected pages

## Step 6: Understanding the Database Structure

### Core Tables

#### `profiles`
- Extends Supabase `auth.users` table
- Stores user roles: admin, shop_owner, worker, customer
- Tracks user status and activity

#### `shops`
- Represents garages/service centers
- Linked to shop_owner (profile)
- Contains location, hours, verifications

#### `workers`
- Technicians/mechanics at shops
- Linked to profiles and shops
- Tracks availability and ratings

#### `customers`
- End-users getting vehicle service
- Can have multiple vehicles
- Tracks loyalty and visit history

#### `services`
- Individual services offered (e.g., "Oil Change", "Tire Rotation")
- Grouped by categories
- Has pricing and duration estimates

#### `bookings`
- Customer appointments/service requests
- Links customer, vehicle, shop, and worker
- Tracks status through workflow

#### `invoices` & `payments`
- Financial records
- Invoices generate from completed bookings
- Payments track all transactions

#### `reviews`
- Customer ratings and feedback
- Only for verified completed bookings

## Step 7: Row Level Security (RLS)

All tables have RLS enabled. Policies ensure:
- **Customers** can only see their own data
- **Workers** can see their shop's data
- **Shop Owners** can see their shop's data
- **Admins** have full access (implement as needed)

## Step 8: Using Supabase in Your App

### In React Components:
```typescript
import { supabase } from '@/lib/supabase'
import { getShopServices, createBooking } from '@/lib/supabase-helpers'

// Sign up
const { user, error } = await signUpUser(email, password, name, 'customer')

// Get shop services
const { data: services } = await getShopServices(shopId)

// Create booking
const { data: booking } = await createBooking({
  shop_id: shopId,
  customer_id: customerId,
  vehicle_id: vehicleId,
  booking_date: '2024-03-15',
  booking_time: '10:00',
  status: 'pending'
})
```

### In API Routes:
```typescript
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  // Use admin client for server-side operations
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .insert({ /* ... */ })
  
  return Response.json({ data, error })
}
```

## Step 9: Important Security Notes

⚠️ **Never expose:** `SUPABASE_SERVICE_ROLE_KEY` (use only in API routes)
✓ **Safe to expose:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The anon key is limited by RLS policies, so users can only access their own data.

## Step 10: Daily Operations

### To Add a New Worker to a Shop:
```typescript
await createWorker({
  user_id: newUserProfile.id,
  shop_id: shopId,
  name: 'Worker Name',
  email: 'worker@email.com',
  phone_number: '9876543210',
  specialization: 'Engine Repair',
  experience_years: 5
})
```

### To Create a Booking:
```typescript
const booking = await createBooking({
  shop_id: shopId,
  customer_id: customerId,
  vehicle_id: vehicleId,
  booking_date: '2024-03-15',
  booking_time: '14:30',
  status: 'pending',
  description: 'Regular maintenance check'
})

// Add services to booking
await supabase
  .from('booking_services')
  .insert({
    booking_id: booking.data.id,
    service_id: serviceId,
    quantity: 1,
    price_charged: 500
  })
```

## Step 11: Real-Time Features

To enable real-time updates (optional):
```typescript
// Listen for booking updates
supabase
  .channel(`bookings:${bookingId}`)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
    (payload) => console.log('Booking updated:', payload)
  )
  .subscribe()
```

## Troubleshooting

### RLS Policy Errors
- Ensure you're logged in as the correct user
- Check that RLS policies match your user's role
- Use Supabase dashboard **Auth** tab to view current tokens

### Data Not Showing Up
- Check **SQL Editor** to verify data exists
- Ensure RLS policies allow viewing
- Check browser console for error messages

### Connection Refused
- Verify `.env.local` has correct credentials
- Ensure Supabase project is running
- Check internet connection

## Next Steps

1. ✅ Set up authentication in your app (register/login pages mostly done)
2. ✅ Create dashboard pages for each user role
3. ✅ Implement booking flow
4. ✅ Add payment integration
5. ✅ Set up email notifications
6. ✅ Add real-time updates for live bookings

## Documentation Links
- [Supabase Docs](https://supabase.com/docs)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
