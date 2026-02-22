# Supabase Setup Checklist

Complete these steps to fully set up Supabase for your Moto Service Hub project.

## ✅ Pre-Setup Verification

- [x] Supabase project URL: `https://brnsimoaoxuhpxzrfpcg.supabase.co`
- [x] Environment variables configured in `.env.local`:
  - [x] `NEXT_PUBLIC_SUPABASE_URL`
  - [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [x] `SUPABASE_SERVICE_ROLE_KEY`

## ✅ Database Setup (CRITICAL - Do These First!)

### Phase 1: Create Tables & Schemas
- [ ] Go to [Supabase Dashboard](https://app.supabase.com)
- [ ] Select your project (brnsimoaoxuhpxzrfpcg)
- [ ] Go to **SQL Editor**
- [ ] Run `lib/migrations/001_initial_schema.sql`
  - This creates all 15 tables
  - Should take ~10 seconds
  - You should see green checkmark
- [ ] Verify all tables exist:
  - Go to **Database** → **Tables**
  - Check for: profiles, shops, workers, customers, services, bookings, invoices, payments, reviews, etc.

### Phase 2: Enable Row Level Security (RLS)
- [ ] Run `lib/migrations/002_rls_policies.sql`
  - This creates 100+ security policies
  - Takes ~20 seconds
- [ ] Verify policies created:
  - Go to **Database** → **Tables** → pick any table
  - Click **RLS Policies** tab
  - Should see multiple policies listed

## ✅ Storage Setup

Go to **Storage** in left sidebar and create these buckets:

### Public Buckets (accessible to all users)
- [ ] **shop-logos**
  - Purpose: Shop/garage logos
  - Click "Make public"
  
- [ ] **worker-profiles**
  - Purpose: Worker profile pictures
  - Click "Make public"
  
- [ ] **customer-avatars**
  - Purpose: Customer profile pictures
  - Click "Make public"
  
- [ ] **service-images**
  - Purpose: Service photos and before/after images
  - Click "Make public"

### Private Buckets (only accessible by owner)
- [ ] **documents**
  - Purpose: Invoices, receipts, licenses
  - Keep as Private
  
- [ ] **vehicles**
  - Purpose: Vehicle photos and documentation
  - Keep as Private

## ✅ Authentication Setup

- [ ] Go to **Authentication** (left sidebar)
- [ ] Go to **Providers** tab
  - [ ] Email should be **Enabled**
  - [ ] SMS (optional) - if you want SMS OTP
  - [ ] Google (optional) - if you want social login

- [ ] Go to **Email Templates**
  - Review templates for confirm signup, reset password, etc.
  - Customize if needed (optional)

- [ ] Go to **URL Configuration**
  - Add your deployment URL (when deploying to production)
  - For now, `http://localhost:3000` is fine for development

## ✅ Code Files Created

Verify these new files exist in your project:

- [x] `lib/supabase.ts` - Supabase client for components
- [x] `lib/supabase-admin.ts` - Admin client for API routes
- [x] `lib/supabase-helpers.ts` - Helper functions for common operations
- [x] `lib/migrations/001_initial_schema.sql` - Database schema
- [x] `lib/migrations/002_rls_policies.sql` - Security policies
- [x] `app/api/auth/register/route.ts` - User registration endpoint
- [x] `app/api/shops/create/route.ts` - Create shop endpoint
- [x] `app/api/services/route.ts` - Services API
- [x] `app/api/bookings/route.ts` - Bookings API
- [x] `SUPABASE_SETUP.md` - Detailed setup guide
- [x] `SUPABASE_QUICK_REFERENCE.md` - Code snippets and examples

## ✅ Testing - Phase 1: Database

- [ ] Install Supabase packages:
  ```bash
  npm install @supabase/supabase-js
  ```

- [ ] Test database connection in browser console:
  ```typescript
  import { supabase } from '@/lib/supabase'
  
  const { data } = await supabase.from('shops').select('count(*)')
  console.log('Tables working:', data)
  ```

- [ ] Test with Supabase SQL Editor:
  ```sql
  SELECT COUNT(*) FROM profiles;
  SELECT COUNT(*) FROM shops;
  SELECT COUNT(*) FROM services;
  ```

## ✅ Testing - Phase 2: Authentication

- [ ] Start your app:
  ```bash
  npm run dev
  ```

- [ ] Go to sign-up page (`/auth/sign-up`)
- [ ] Try creating an account
- [ ] Check Supabase **Authentication** → **Users** to see new user

- [ ] Test profile creation:
  ```typescript
  const { data } = await supabase.from('profiles').select('*')
  console.log('Profiles:', data)
  ```

## ✅ Testing - Phase 3: Shop Creation

- [ ] As a shop owner, create a shop using `/api/shops/create`
- [ ] Verify shop appears in database:
  ```sql
  SELECT * FROM shops LIMIT 1;
  ```

- [ ] Check relationships are correct:
  ```sql
  SELECT s.name, p.full_name 
  FROM shops s 
  JOIN profiles p ON s.owner_id = p.id;
  ```

## ✅ Testing - Phase 4: Services

- [ ] Create a service category
- [ ] Create services under that category
- [ ] Fetch services and verify data structure

## ✅ Testing - Phase 5: Bookings

- [ ] Create a booking with services
- [ ] Verify booking appears with all related data
- [ ] Test status updates

## ✅ Optional: Real-Time Updates

- [ ] Test real-time subscription:
  ```typescript
  supabase
    .channel('bookings')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'bookings' },
      (payload) => console.log('Received:', payload)
    )
    .subscribe()
  ```

## ✅ File Uploads

- [ ] Test uploading a file to storage:
  ```typescript
  const { data, error } = await supabase.storage
    .from('shop-logos')
    .upload('test.jpg', file)
  ```

## ✅ Production Preparation

- [ ] Set up backup schedule in Supabase dashboard
- [ ] Enable authenticator app or backup codes for your Supabase account
- [ ] Configure email domain (if needed)
- [ ] Set up monitoring/alerts
- [ ] Test all user flows once more

## ✅ Documentation

- [ ] Read `SUPABASE_SETUP.md` - Full detailed guide
- [ ] Read `SUPABASE_QUICK_REFERENCE.md` - Common code snippets
- [ ] Bookmark [Supabase Docs](https://supabase.com/docs)
- [ ] Join [Supabase Discord](https://discord.supabase.com) for support

## 🚀 You're Ready When:

✅ All database tables exist  
✅ All RLS policies are in place  
✅ All 6 storage buckets are created  
✅ Can sign up and create profile  
✅ Can create shops, workers, services  
✅ Can create bookings with services  
✅ Can record payments and invoices  
✅ Can submit reviews  

---

## Quick Troubleshooting

**Problem: "No user found" error**
- Solution: Check if RLS policy is correct
- Go to **Authentication** → **Users** to verify user exists

**Problem: "Permission denied" when creating data**
- Solution: Check RLS policies
- Ensure user role matches expectations
- Try disabling specific RLS policy temporarily to debug

**Problem: Storage files not uploading**
- Solution: Check if bucket is public/private as intended
- Verify bucket exists
- Check browser console for CORS errors

**Problem: Tables don't exist**
- Solution: Run migrations again
- Check **SQL Editor** output for errors
- Verify queries completed successfully

**Problem: API returns 500 error**
- Solution: Check API route has correct imports
- Verify Supabase keys in environment variables
- Check browser console and server logs for details

---

## Next Steps After Setup

1. **Connect to UI Components**
   - Update auth pages to use Supabase auth
   - Build shop dashboard with booking data
   - Create customer booking flow

2. **Add Email Notifications**
   - Trigger emails on booking confirmation
   - Payment reminders
   - Booking completion notifications

3. **Implement Payment Gateway**
   - Integrate Razorpay or Stripe
   - Create payment handling in API routes
   - Update invoice workflow

4. **Analytics & Reporting**
   - Build dashboards with real data
   - Create admin reports
   - Set up KPI tracking

5. **Mobile App** (if needed)
   - Consider React Native with same Supabase
   - Use same authentication
   - Share business logic

---

## Important Security Reminders

🔐 **Never commit `.env.local` to git**
- Add to `.gitignore` (already done)

🔐 **Rotate keys regularly**
- Regenerate service role key every 90 days
- Revoke old keys

🔐 **Use RLS on all tables**
- Never expose unauthenticated endpoints

🔐 **Validate input on server**
- Never trust client-side validation

🔐 **Audit logs enabled**
- All changes logged to `audit_logs` table

---

## Support Resources

- 📚 [Supabase Documentation](https://supabase.com/docs)
- 🎥 [Supabase Tutorial Videos](https://supabase.com/docs/guides/getting-started)
- 💬 [Supabase Discord Community](https://discord.supabase.com)
- 🐛 [Open Issues on GitHub](https://github.com/supabase/supabase/issues)
- 📧 [Supabase Support](https://supabase.com/support)

---

## Estimated Time

- Database setup: **10 minutes**
- Storage setup: **5 minutes**
- Auth setup: **5 minutes**
- Testing: **15 minutes**

**Total: ~35 minutes for complete Supabase setup**

Good luck! 🎉
