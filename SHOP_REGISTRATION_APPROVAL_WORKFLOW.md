# Shop Registration Approval Workflow

## Overview
This document describes the complete shop registration workflow for Moto ServiceHub where shop owners apply to list their businesses without creating an immediate account. Admin can then approve/reject applications.

## Workflow Steps

### 1. User Registration Request (No Password Required)
**Page:** `/register-shop`
**What happens:**
- User fills out shop registration form with:
  - Owner Name
  - Owner Email
  - Owner Phone
  - Shop Name
  - Shop Address
  - City
  - Aadhaar Card (optional)
  - Owner Selfie (optional)
- **NO password is required** - application is submitted as-is
- Data is sent to API endpoint

### 2. Registration Request Submitted
**API Endpoint:** `POST /api/shop/register-request`
**What happens:**
- Form data is validated (required fields, email format, phone format)
- Request is stored in Supabase `request` table with status: `pending`
- Confirmation email is sent to shop owner
- Admin notification email is sent to admin (ADMIN_EMAIL from env)
- User is redirected to home page with "Under Review" message

**Request Table Schema:**
```typescript
{
  request_id: number (auto)
  owner_name: string
  owner_email: string
  owner_phone: string
  shop_name: string
  phone_number: string
  location: string
  aadhaar_card_photo: string (optional)
  status: 'pending' | 'approved' | 'rejected'
  created_at: timestamp
}
```

### 3. Admin Reviews Application
**API Endpoint:** `GET /api/admin/shop-requests`
**What happens:**
- Admin dashboard fetches all pending shop requests
- Admin can view pending applications with:
  - Owner details
  - Shop details
  - Location
  - Submission date
  - Status

### 4. Admin Approves Application
**API Endpoint:** `POST /api/admin/shop-requests/:id`
**Body:** `{ "action": "approve" }`

**What happens:**
1. **Creates Owner Record** in `owner` table:
   - email: from request
   - password: auto-generated temporary password
   - phone: from request
   - aadhaar_card: from request

2. **Creates Shop Record** in `shop` table:
   - owner_id: newly created owner
   - name: shop name from request
   - slug: auto-generated from shop name
   - location: from request

3. **Updates Request** status to "approved"

4. **Sends Approval Email** to owner with login credentials:
   - Email address
   - Temporary password
   - Instructions to change password after first login

5. **Response:**
   ```json
   {
     "success": true,
     "message": "Shop approved and records created",
     "owner_id": 123,
     "shop_id": 456
   }
   ```

### 5. Admin Rejects Application (Optional)
**API Endpoint:** `POST /api/admin/shop-requests/:id`
**Body:** `{ "action": "reject", "reason": "..." }`

**What happens:**
1. Updates request status to "rejected"
2. Sends rejection email to shop owner with optional reason
3. Owner can submit a new application later

## Helper Functions Added to supabase-helpers.ts

### `submitShopRegistrationRequest(data)`
- Submits a new shop registration request
- Stores in `request` table
- Sends confirmation and admin notification emails
- Returns: `{ success, request_id, message, error }`

### `getPendingShopRequests()`
- Gets all pending shop registration requests
- Used by admin dashboard
- Returns: `{ success, data: Request[], error }`

### `getAllShopRequests(status?)`
- Gets all shop requests filtered by optional status
- Returns: `{ success, data: Request[], error }`

### `approveShopRequest(requestId, adminNotes?)`
- Approves a single request
- Creates owner and shop records
- Sends approval email
- Returns: `{ success, owner_id, shop_id, message, error }`

### `rejectShopRequest(requestId, reason?)`
- Rejects a single request
- Sends rejection email with optional reason
- Returns: `{ success, message, error }`

## API Endpoints Summary

| Endpoint | Method | Body | Purpose |
|----------|--------|------|---------|
| `/api/shop/register-request` | POST | `{ owner_name, owner_email, owner_phone, shop_name, location, aadhaar_card }` | Submit shop registration request |
| `/api/admin/shop-requests` | GET | - | Get all pending requests |
| `/api/admin/shop-requests/:id` | POST | `{ action: "approve" \| "reject", reason? }` | Approve or reject request |

## Email Templates

1. **Shop Registration Confirmation** - Sent to shop owner when application submitted
2. **Admin Notification** - Sent to admin when new application is received
3. **Shop Approval** - Sent to owner when application is approved (with login credentials)
4. **Shop Rejection** - Sent to owner when application is rejected (with optional reason)

## Environment Variables Needed

```env
# Email configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Admin email for notifications
ADMIN_EMAIL=admin@motoservicehub.com

# App URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Features

✅ **No Password Required for Application** - Simplifies initial registration
✅ **Admin Approval Workflow** - Control over which shops can list
✅ **Auto-Generated Credentials** - Temporary password sent via email
✅ **Email Notifications** - Both applicant and admin are notified
✅ **Rejection Workflow** - Admin can reject with reason
✅ **Complete Audit Trail** - All requests stored in database

## Next Steps

1. Update admin dashboard to display pending requests UI
2. Add user interface for admin to approve/reject requests
3. Add approval history/analytics to admin dashboard
4. Add email notification for shop status updates
5. Implement shop owner password change on first login
