# Supabase Quick Reference Guide

## Common Tasks & Code Snippets

### 1. Authentication

#### Sign Up (Customer)
```typescript
import { supabase } from '@/lib/supabase'
import { signUpUser } from '@/lib/supabase-helpers'

const { user, error } = await signUpUser(
  'customer@email.com',
  'password123',
  'John Doe',
  'customer'
)
```

#### Sign In
```typescript
import { signInUser } from '@/lib/supabase-helpers'

const { user, session, error } = await signInUser(
  'customer@email.com',
  'password123'
)
```

#### Sign Out
```typescript
import { signOutUser } from '@/lib/supabase-helpers'

const { error } = await signOutUser()
```

#### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log(user?.email)
```

---

### 2. Shop Management

#### Create a Shop
```typescript
import { createShop } from '@/lib/supabase-helpers'

const { data: shop, error } = await createShop({
  owner_id: currentUserId,
  name: 'XYZ Garage',
  email: 'garage@email.com',
  phone_number: '9876543210',
  address: '123 Main St',
  city: 'Mumbai',
  state: 'Maharashtra',
  postal_code: '400001',
  business_type: 'both', // 'two_wheeler', 'four_wheeler', 'both'
  license_number: 'LIC123456',
  registration_number: 'REG123456'
})
```

#### Get Shop Details
```typescript
import { getShop } from '@/lib/supabase-helpers'

const { data: shop, error } = await getShop(shopId)
```

#### Update Shop
```typescript
import { updateShop } from '@/lib/supabase-helpers'

const { data: shop, error } = await updateShop(shopId, {
  phone_number: '9876543211',
  address: 'New Address'
})
```

#### Get All Shops by Owner
```typescript
import { getShopsByOwner } from '@/lib/supabase-helpers'

const { data: shops, error } = await getShopsByOwner(ownerId)
```

---

### 3. Workers/Technicians

#### Add Worker to Shop
```typescript
import { createWorker } from '@/lib/supabase-helpers'

const { data: worker, error } = await createWorker({
  user_id: workerUserId,
  shop_id: shopId,
  name: 'Ram Kumar',
  email: 'ram@garage.com',
  phone_number: '9876543210',
  specialization: 'Engine Repair',
  experience_years: 5,
  license_number: 'LIC12345',
  hourly_rate: 500
})
```

#### Get Shop Workers
```typescript
import { getShopWorkers } from '@/lib/supabase-helpers'

const { data: workers, error } = await getShopWorkers(shopId)
```

---

### 4. Customers & Vehicles

#### Create Customer
```typescript
import { createCustomer } from '@/lib/supabase-helpers'

const { data: customer, error } = await createCustomer({
  user_id: customerId,
  name: 'Raj Patel',
  email: 'raj@email.com',
  phone_number: '9876543210',
  address: '456 Park Ave',
  city: 'Mumbai',
  preferred_contact_method: 'whatsapp' // 'email', 'sms', 'phone', 'whatsapp'
})
```

#### Add Vehicle
```typescript
import { addVehicle } from '@/lib/supabase-helpers'

const { data: vehicle, error } = await addVehicle({
  customer_id: customerId,
  registration_number: 'MH07AB1234',
  vehicle_type: 'two_wheeler',
  make: 'Honda',
  model: 'CB200',
  year: 2022,
  color: 'Black',
  fuel_type: 'petrol',
  mileage_km: 5000,
  engine_number: 'EN123456',
  chassis_number: 'CH123456'
})
```

#### Get Customer Vehicles
```typescript
import { getCustomerVehicles } from '@/lib/supabase-helpers'

const { data: vehicles, error } = await getCustomerVehicles(customerId)
```

---

### 5. Services

#### Create Service Category
```typescript
const { data, error } = await supabase
  .from('service_categories')
  .insert({
    shop_id: shopId,
    name: 'Maintenance',
    description: 'Regular maintenance services',
    is_active: true
  })
  .select()
```

#### Create Service
```typescript
const { data, error } = await supabase
  .from('services')
  .insert({
    shop_id: shopId,
    category_id: categoryId,
    name: 'Oil Change',
    description: 'Complete oil and filter change',
    base_price: 500,
    estimated_duration_minutes: 30
  })
  .select()
```

#### Get Shop Services
```typescript
import { getShopServices } from '@/lib/supabase-helpers'

const { data: services, error } = await getShopServices(shopId)
```

---

### 6. Bookings

#### Create Booking
```typescript
import { createBooking } from '@/lib/supabase-helpers'

const { data: booking, error } = await createBooking({
  shop_id: shopId,
  customer_id: customerId,
  vehicle_id: vehicleId,
  booking_date: '2024-03-15',
  booking_time: '10:30',
  status: 'pending',
  description: 'Oil change and filter replacement'
})

// Add services to booking
const { error: serviceError } = await supabase
  .from('booking_services')
  .insert({
    booking_id: booking.data.id,
    service_id: serviceId,
    quantity: 1,
    price_charged: 500
  })
```

#### Get Booking Details
```typescript
import { getBooking } from '@/lib/supabase-helpers'

const { data: booking, error } = await getBooking(bookingId)
// Returns: booking with shop, customer, vehicle, worker, and services
```

#### Get Customer Bookings
```typescript
import { getCustomerBookings } from '@/lib/supabase-helpers'

const { data: bookings, error } = await getCustomerBookings(customerId)
```

#### Get Shop Bookings
```typescript
import { getShopBookings } from '@/lib/supabase-helpers'

// All bookings
const { data: bookings, error } = await getShopBookings(shopId)

// Only pending bookings
const { data: pending, error } = await getShopBookings(shopId, 'pending')
```

#### Update Booking Status
```typescript
import { updateBookingStatus } from '@/lib/supabase-helpers'

const { data: updated, error } = await updateBookingStatus(bookingId, 'completed')
// Status: 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
```

---

### 7. Invoices & Payments

#### Create Invoice
```typescript
import { createInvoice } from '@/lib/supabase-helpers'

const { data: invoice, error } = await createInvoice({
  booking_id: bookingId,
  shop_id: shopId,
  customer_id: customerId,
  invoice_number: 'INV-2024-001',
  invoice_date: new Date().toISOString().split('T')[0],
  subtotal: 1000,
  tax_amount: 180, // e.g., 18% GST
  discount_amount: 0,
  total_amount: 1180,
  payment_status: 'unpaid'
})
```

#### Record Payment
```typescript
import { recordPayment } from '@/lib/supabase-helpers'

const { data: payment, error } = await recordPayment({
  invoice_id: invoiceId,
  booking_id: bookingId,
  shop_id: shopId,
  customer_id: customerId,
  amount: 1180,
  payment_method: 'upi', // 'cash', 'upi', 'card', 'bank_transfer', 'wallet'
  payment_status: 'completed',
  transaction_id: 'TXN123456789',
  reference_number: 'REF123'
})

// Update invoice payment status
await supabase
  .from('invoices')
  .update({ payment_status: 'paid' })
  .eq('id', invoiceId)
```

#### Get Booking Invoice
```typescript
import { getBookingInvoice } from '@/lib/supabase-helpers'

const { data: invoice, error } = await getBookingInvoice(bookingId)
```

---

### 8. Reviews & Ratings

#### Submit Review
```typescript
import { submitReview } from '@/lib/supabase-helpers'

const { data: review, error } = await submitReview({
  shop_id: shopId,
  customer_id: customerId,
  booking_id: bookingId,
  rating: 5, // 1-5
  title: 'Excellent Service',
  review_text: 'Very professional and clean work. Highly recommended!',
  is_verified_purchase: true
})
```

#### Get Shop Reviews
```typescript
import { getShopReviews } from '@/lib/supabase-helpers'

const { data: reviews, error } = await getShopReviews(shopId)
```

---

### 9. File Upload (Storage)

#### Upload Shop Logo
```typescript
const file = // File object from input
const filename = `shop-${shopId}-${Date.now()}.jpg`

const { data, error } = await supabase.storage
  .from('shop-logos')
  .upload(filename, file)

if (!error) {
  const publicUrl = supabase.storage
    .from('shop-logos')
    .getPublicUrl(filename).data.publicUrl
  
  // Update shop with logo URL
  await updateShop(shopId, { logo_url: publicUrl })
}
```

#### Upload Worker Avatar
```typescript
const { data, error } = await supabase.storage
  .from('worker-profiles')
  .upload(`${workerId}/avatar.jpg`, file)

const publicUrl = supabase.storage
  .from('worker-profiles')
  .getPublicUrl(`${workerId}/avatar.jpg`).data.publicUrl
```

#### Upload Document (Private)
```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`invoices/${invoiceId}.pdf`, file)
```

---

### 10. Real-Time Updates

#### Subscribe to Booking Changes
```typescript
const { data: subscription } = supabase
  .channel(`bookings:${bookingId}`)
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'bookings',
      filter: `id=eq.${bookingId}`
    },
    (payload) => {
      console.log('Booking updated:', payload)
      // Update UI
    }
  )
  .subscribe()

// Cleanup
subscription?.unsubscribe()
```

---

### 11. Admin Operations

#### Get Audit Logs
```typescript
const { data: logs, error } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('shop_id', shopId)
  .order('created_at', { ascending: false })
```

#### Create Shop Operating Hours
```typescript
const daysOfWeek = [
  { day_of_week: 0, opening_time: '09:00', closing_time: '18:00' }, // Sunday
  { day_of_week: 1, opening_time: '08:00', closing_time: '20:00' }, // Monday
  // ... etc
]

const { error } = await supabase
  .from('shop_operating_hours')
  .insert(
    daysOfWeek.map(day => ({
      shop_id: shopId,
      ...day,
      is_closed: false
    }))
  )
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Register new user |
| `/api/shops/create` | POST | Create new shop |
| `/api/services` | POST/GET/PUT | Manage services |
| `/api/bookings` | POST/GET | Create and fetch bookings |
| `/api/workers` | POST/GET | Manage workers |
| `/api/customers` | POST/GET | Manage customers |
| `/api/invoices` | POST/GET | Create and fetch invoices |
| `/api/payments` | POST/GET | Record and fetch payments |
| `/api/reviews` | POST/GET | Submit and fetch reviews |

---

## Important Reminders

✅ **DO:**
- Use `supabase` client in React components
- Use `supabaseAdmin` client in API routes (server-side)
- Always check for errors before accessing data
- Use RLS policies to secure data
- Validate input on client and server

❌ **DON'T:**
- Expose `SUPABASE_SERVICE_ROLE_KEY` in browser
- Trust client-side validation alone
- Skip error handling
- Query sensitive data without checking RLS
- Store passwords or tokens in state without protection

---

## Debugging Tips

### Check if RLS is blocking requests
```typescript
// Console will show RLS policy error if blocked
const { data, error, status } = await supabase
  .from('bookings')
  .select('*')

console.log('Status:', status) // 403 = RLS blocked
console.log('Error:', error?.message)
```

### Inspect Current Session
```typescript
const { data: { session } } = await supabase.auth.getSession()
console.log(session?.user)
```

### Test RLS Policies
Use Supabase SQL Editor to run queries as specific user tokens for testing.
