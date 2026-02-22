# Shop Registration & Approval Flow - Complete Setup ✅

## Overview
Shop owners now register their shops, which creates a `request` record. Admins review and approve/reject from their dashboard. Upon approval, the shop is created and credentials are sent via SMTP email.

---

## Complete Flow

### 1️⃣ Shop Owner Registers Shop
**Page:** `/register-shop`
- Owner fills form (shop name, email, phone, address, city, etc.)
- Clicks "Submit"

**Backend:** `POST /api/shops/create`
```
Input: owner_id, owner_email, shop details
├─ Create record in request table (status: 'pending')
├─ Send SMTP email to owner: "Application Under Review"
└─ Send SMTP email to admin: "[ACTION REQUIRED] New Shop Pending"
Output: "Application Submitted - Under Review"
```

### 2️⃣ Admin Reviews Requests
**Page:** `localhost:3000/admin/dashboard`
- Admin logs in with credentials: `nofackai@gmail.com` / `0987654321`
- Dashboard loads pending shop requests
- Shows: Shop name, email, phone, address, submitted date
- Buttons: "Approve" or "Reject"

**Get Pending:** `GET /api/admin/shop-requests`
```
Returns: Array of requests with status='pending'
```

### 3️⃣ Admin Approves Shop
**Action:** Admin clicks "Approve" button

**Backend:** `POST /api/admin/shop-requests/{id}`
```
Input: action='approve'
├─ Generate shop password (12 character random)
├─ Create shop record in shop table
│   ├─ Auto-generate shop slug (from name)
│   ├─ Set password
│   └─ status='active'
├─ Update request status to 'approved'
├─ Send SMTP email to owner:
│   ├─ Subject: "✓ Your Shop is Approved!"
│   ├─ Content: Login credentials + dashboard URL
│   └─ Password: Auto-generated
└─ Return: Shop data + credentials
```

### 4️⃣ Owner Receives Email & Logs In
**Email Content:**
```
To: shop_owner@email.com
Subject: ✓ Your Shop is Approved! - Welcome to Moto ServiceHub

Your Login Credentials:
Email: shop_owner@email.com
Password: [GENERATED]

Login: http://localhost:3000/sign-in
```

**Owner Login:**
- Opens login page
- Enters email + password
- Redirected to `/owner/dashboard`

---

## Database Changes

### request Table (Now Used for Approval)
```sql
CREATE TABLE request (
  request_id SERIAL PRIMARY KEY,
  owner_id INT REFERENCES owner(owner_id),
  shop_name VARCHAR,
  shop_email VARCHAR,
  shop_phone_number VARCHAR,
  shop_address VARCHAR,
  shop_city VARCHAR,
  shop_country VARCHAR,
  shop_business_type VARCHAR,
  shop_license_number VARCHAR,
  shop_registration_number VARCHAR,
  status VARCHAR DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW()
);
```

### shop Table (Updated)
- New field: `slug` (auto-generated from name)
- New field: `password` (for direct login)
- New field: `status` (active/inactive)

---

## Email Credentials in .env.local

Currently configured:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply.moksh.project@gmail.com
SMTP_PASS=samx njiy ggnv qsud
NEXT_PUBLIC_ADMIN_MAIL=nofackai@gmail.com
```

✅ **SMTP is ready to send emails!**

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/shops/create` | Owner submits shop registration |
| GET | `/api/admin/shop-requests` | Get all pending requests |
| POST | `/api/admin/shop-requests/{id}` | Approve/reject shop |

---

## Testing Checklist

- [ ] 1. Owner submits shop registration → Request created in DB
- [ ] 2. Owner receives "Under Review" email
- [ ] 3. Admin receives notification email
- [ ] 4. Admin dashboard shows pending request
- [ ] 5. Admin clicks "Approve" → Shop created
- [ ] 6. Owner receives approval email with credentials
- [ ] 7. Owner can login with new credentials
- [ ] 8. Owner dashboard shows shop details

---

## File Changes

**Created:**
- `app/api/admin/shop-requests/route.ts` - Get pending requests
- `app/api/admin/shop-requests/[id]/route.ts` - Approve/reject endpoint

**Updated:**
- `app/api/shops/create/route.ts` - Now creates request, not shop
- `app/admin/dashboard/page.tsx` - Added approval UI
- `lib/supabase-helpers.ts` - Added SMTP email functions

---

## Next Steps (Optional)

1. **Email Templates:** Customize email HTML templates
2. **Rejection Reason:** Add reason field when rejecting
3. **SMS Notifications:** Optional SMS alongside emails
4. **Email Verification:** Verify owner email before approval
5. **Shop Plan Selection:** Add plan selection during registration

---

## Status: ✅ COMPLETE AND READY TO TEST
