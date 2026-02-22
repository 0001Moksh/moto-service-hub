# ⚡ DO THIS NOW - Supabase Setup (Next 30 Minutes)

## What You Have
✅ Database schema ready  
✅ Security policies ready  
✅ API routes ready  
✅ Helper functions ready  
✅ All files created & configured  

## What's Left
You need to run SQL migrations in Supabase dashboard. That's it!

---

## STEP 1: Run First Migration (5 minutes)

1. Go to: https://app.supabase.com
2. Click your project: `brnsimoaoxuhpxzrfpcg`
3. Left sidebar → **SQL Editor**
4. Click **New Query** (blue button)
5. Copy entire file content:
   ```
   lib/migrations/001_initial_schema.sql
   ```
6. Paste into SQL editor
7. Click **RUN** button (blue play icon)
8. Wait for ✓ (green checkmark)

**What this does:** Creates 15 database tables + 19 indexes

---

## STEP 2: Run Second Migration (5 minutes)

Repeat same steps but with:
```
lib/migrations/002_rls_policies.sql
```

Wait for ✓ (green checkmark)

**What this does:** Enables Row Level Security on all tables

---

## STEP 3: Verify Tables Exist (2 minutes)

1. Still in Supabase dashboard
2. Left sidebar → **Database** → **Tables**
3. Check these tables exist:
   - ✓ profiles
   - ✓ shops
   - ✓ services
   - ✓ workers
   - ✓ customers
   - ✓ vehicles
   - ✓ bookings
   - ✓ invoices
   - ✓ payments
   - ✓ reviews
   - ✓ audit_logs
   - (+ 4 more)

---

## STEP 4: Create Storage Buckets (5 minutes)

1. Supabase dashboard → **Storage** (left sidebar)
2. Click **Create bucket** button for each:

### Public Buckets (Make Public)
- [ ] `shop-logos`
- [ ] `worker-profiles`
- [ ] `customer-avatars`
- [ ] `service-images`

### Private Buckets (Keep Private)
- [ ] `documents`
- [ ] `vehicles`

---

## STEP 5: Test It Works (5 minutes)

Run this in your app:

```bash
npm run dev
```

Then visit: http://localhost:3000/auth/sign-up

Try creating an account:
- Email: `test@example.com`
- Password: `Test123!@#`
- Name: `Test User`

Then check Supabase:
1. Go to **Authentication** → **Users**
2. Should see your test user there ✓

---

## STEP 6: Verify Database Entry (2 minutes)

1. Supabase → **SQL Editor** → **New Query**
2. Paste this:
```sql
SELECT * FROM profiles WHERE email = 'test@example.com';
```
3. Click **RUN**
4. Should see your profile data ✓

---

## ✅ YOU'RE DONE!

All set up! Now you can:

1. **Use the helper functions:**
   ```typescript
   import { createBooking, getCustomerBookings } from '@/lib/supabase-helpers'
   ```

2. **Call the API endpoints:**
   ```
   POST /api/auth/register
   POST /api/shops/create
   POST /api/services
   POST /api/bookings
   ```

3. **Read the code examples:**
   - Open: `SUPABASE_QUICK_REFERENCE.md`
   - Copy, paste, modify

---

## 📚 Next: Code Examples

Once setup is complete, see:
- `SUPABASE_QUICK_REFERENCE.md` → 100+ code snippets
- `SUPABASE_SETUP.md` → Detailed explanations
- `SUPABASE_SETUP_CHECKLIST.md` → Full checklist

---

## 🆘 Stuck?

### "Tables not created"
- Check SQL Editor for errors
- Try copying SQL again
- Make sure to click **RUN**

### "RLS policy error"
- That's normal! Means security is working
- Use `SUPABASE_QUICK_REFERENCE.md` to see correct usage

### "Storage bucket won't create"
- Try different bucket name
- Check no special characters
- Refresh page and try again

### Still stuck?
- Check `SUPABASE_SETUP_CHECKLIST.md` → Troubleshooting section
- Visit https://discord.supabase.com (active community!)

---

## ⏱️ Time Estimate

| Step | Time |
|------|------|
| Migration 1 | 5 min |
| Migration 2 | 5 min |
| Verify tables | 2 min |
| Create buckets | 5 min |
| Test signup | 5 min |
| Verify database | 2 min |
| **TOTAL** | **~30 min** |

---

## 🎉 Reality Check

After these 30 minutes:
- ✅ Full database running
- ✅ Authentication working
- ✅ File storage ready
- ✅ Security in place
- ✅ API routes ready
- ✅ 50+ functions ready to use

**You can now build your app!**

---

## 📖 Documentation Files

After setup, refer to:

1. **SUPABASE_QUICK_REFERENCE.md** (Most useful!)
   - Copy-paste code snippets
   - Common operations
   - API examples

2. **SUPABASE_SETUP.md**
   - Deep dive
   - Step-by-step
   - Best practices

3. **SUPABASE_COMPLETE_SETUP.md**
   - Overview
   - Architecture
   - What was created

4. **SUPABASE_SETUP_CHECKLIST.md**
   - Full checklist
   - Verification steps
   - Troubleshooting

---

## 🚀 READY?

**Time to complete setup: ~30 minutes**

### Do this RIGHT NOW:
1. Go to https://app.supabase.com
2. Run `001_initial_schema.sql` migration
3. Run `002_rls_policies.sql` migration
4. Create 6 storage buckets
5. Test with sign-up

### Then:
- Open `SUPABASE_QUICK_REFERENCE.md`
- Start building features!

---

**LET'S GO! 🚀**

*Questions? Check the troubleshooting section in SUPABASE_SETUP_CHECKLIST.md*
