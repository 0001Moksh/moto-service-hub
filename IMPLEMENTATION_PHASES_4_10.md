# Moto ServiceHub - Remaining Implementation Phases (4-10)

## Phase 4: Worker Dashboard & Features

### Components to Create:
1. **Worker Dashboard (`app/worker/dashboard/page.tsx`)**
   - Available jobs display
   - Real-time notifications
   - Performance metrics
   - Earnings summary

2. **API Endpoints**:
   - `GET /api/worker/jobs` - Get available jobs
   - `POST /api/worker/jobs/{id}/accept` - Accept a job
   - `PUT /api/worker/jobs/{id}/status` - Update job status
   - `GET /api/worker/performance` - Get worker metrics

3. **Features**:
   - Job queue system
   - Real-time availability slots
   - Performance tracking (rating, completion time)
   - Earnings dashboard

---

## Phase 5: Admin Governance Dashboard

### Components to Create:
1. **Admin Dashboard (`app/admin/dashboard/page.tsx`)**
   - Monitor all shops (abuse trends)
   - Performance metrics
   - Revenue analytics
   - Shop pause/resume controls

2. **API Endpoints**:
   - `GET /api/admin/shops` - List all shops with metrics
   - `PUT /api/admin/shops/{id}/status` - Pause/Resume shop
   - `GET /api/admin/analytics/abuse-trends` - Abuse monitoring
   - `GET /api/admin/analytics/revenue` - Revenue reports

3. **Features**:
   - Real-time shop monitoring
   - Automated abuse detection
   - Revenue split calculations
   - Manual suspension capabilities

---

## Phase 6: Smart Booking Flow

### Components to Create:
1. **Booking Flow Pages**:
   - `app/booking/create/page.tsx` - Booking initiation
   - `app/booking/confirm/page.tsx` - Booking confirmation
   - `app/booking/track/page.tsx` - Real-time tracking

2. **API Endpoints**:
   - `POST /api/bookings/create` - Create booking
   - `GET /api/bookings/{id}` - Get booking details
   - `PUT /api/bookings/{id}/confirm` - Confirm booking
   - `POST /api/bookings/{id}/auto-assign` - Auto-assign workers

3. **Features**:
   - Vehicle verification (Aadhaar, RC verification)
   - Real-time worker availability check
   - Automated worker assignment logic
   - Automated SMS/Email notifications

### Key Logic:
```
Booking Flow:
1. Customer selects shop and vehicle
2. System fetches real-time worker availability
3. Slot selection based on worker availability
4. Customer approval workflow
5. Auto-assignment to available worker
6. Status updates via notifications
```

---

## Phase 7: Service Execution & Billing System

### Components to Create:
1. **Service Tracking Pages**:
   - `app/service/live/page.tsx` - Live service tracking
   - `app/service/invoice/page.tsx` - Invoice generation

2. **API Endpoints**:
   - `POST /api/services/start` - Start service
   - `PUT /api/services/{id}/status` - Update service status
   - `POST /api/services/{id}/extra-repair` - Add extra repairs
   - `POST /api/services/{id}/complete` - Mark service complete
   - `GET /api/services/{id}/invoice` - Generate invoice

3. **Features**:
   - Arrival marking ("Bike Received")
   - In-progress status updates
   - Extra repair discovery logic
   - Customer approval for extras
   - Automated invoice generation (PDF)
   - Email/SMS invoice delivery

### Service Status Flow:
```
Service States:
- Pending: Waiting to start
- In-Progress: Service underway
- Extra-Repair-Found: Awaiting customer approval
- Completed: Service finished
- Billed: Invoice sent to customer
```

---

## Phase 8: Cancellation Token Logic

### Implementation:
1. **Database Schema**:
   - Add `cancellation_token` field to customer table
   - Add `cancellation_metadata` JSONB for tracking

2. **API Endpoints**:
   - `POST /api/cancellations/issue-token` - Issue cancellation token
   - `POST /api/cancellations/use-token` - Use token for cancellation
   - `GET /api/cancellations/balance` - Check token balance

3. **Business Logic**:
   ```
   Cancellation Tokens:
   - Customer starts with 2 tokens
   - Late cancellation (after booking confirmed): Costs 1 token
   - No-show (doesn't arrive): Costs 1 token
   - Cannot book if tokens reach 0
   - Tokens reset monthly OR manually by shop owner
   - SMS notification when tokens used
   ```

4. **Features**:
   - Token balance tracking
   - Automated token deduction
   - Manual reset by admin
   - Customer notifications
   - Booking blocklist for 0-token users

---

## Phase 9: Emergency Worker Re-assignment Logic

### Implementation:
1. **Database Schema**:
   - Add `reassignment_queue` table
   - Add `worker_unavailable_reason` field

2. **API Endpoints**:
   - `POST /api/jobs/reassign` - Trigger reassignment
   - `PUT /api/workers/{id}/availability` - Mark unavailable
   - `GET /api/jobs/{id}/reassignment-status` - Check status

3. **Business Logic**:
   ```
   Re-assignment Trigger:
   - Missing Worker: Boot offline for 5 minutes, reassign
   - Worker Request: Manual unavailability request
   - Admin Action: Force reassign from admin panel

   Process:
   1. Detect unavailability
   2. Find next available worker with same shop
   3. Send auto-assignment notification
   4. If accepted: Update booking
   5. If not: Find next worker
   6. If no workers: Trigger override/reschedule
   ```

4. **Features**:
   - Real-time worker availability tracking
   - Automatic emergency reassignment
   - Fallback job scheduling
   - Apology notification to customer
   - Override capability for admin

---

## Phase 10: Analytics & Reporting System

### Components to Create:
1. **Analytics Pages**:
   - `app/analytics/dashboard/page.tsx` - Main analytics
   - `app/analytics/customer/page.tsx` - Customer metrics
   - `app/analytics/shop/page.tsx` - Shop performance
   - `app/analytics/worker/page.tsx` - Worker efficiency

2. **API Endpoints**:
   - `GET /api/analytics/revenue-trends` - Revenue over time
   - `GET /api/analytics/worker-efficiency` - Worker metrics
   - `GET /api/analytics/no-show-rates` - No-show analysis
   - `GET /api/analytics/peak-hours` - Peak time analysis
   - `GET /api/analytics/customer-satisfaction` - Ratings & feedback

3. **Metrics to Track**:
   - **Revenue Analytics**:
     - Daily/weekly/monthly revenue
     - Revenue split (shop, platform, payment gateway)
     - Average booking value
   
   - **Performance Analytics**:
     - Worker efficiency (jobs per day, completion rate)
     - Service completion time
     - Customer ratings trend
     - No-show rate percentage
   
   - **Business Analytics**:
     - Peak booking hours
     - Busiest days/seasons
     - Customer retention rate
     - New customer acquisition
   
   - **Operational Analytics**:
     - Worker utilization rate
     - Job assignment success rate
     - Cancellation rate
     - Extra service uptake rate

4. **Features**:
   - Interactive dashboards with charts
   - Date range filtering
   - Export to PDF/CSV
   - Role-based analytics (Admin, Owner, Customer)
   - Predictive trends

---

## Database Schema Updates Required

### New Tables:
```sql
-- Cancellation Metadata
CREATE TABLE cancellation_metadata (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customer(customer_id),
  token_balance INTEGER DEFAULT 2,
  last_cancellation_date TIMESTAMP,
  blocked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reassignment Queue
CREATE TABLE reassignment_queue (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES booking(booking_id),
  original_worker_id INTEGER REFERENCES worker(worker_id),
  reassignment_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES shop(shop_id),
  worker_id INTEGER REFERENCES worker(worker_id),
  customer_id INTEGER REFERENCES customer(customer_id),
  event_type VARCHAR(100),
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Priority

1. **Critical (Core Functionality)**:
   - Phase 4: Worker Dashboard
   - Phase 6: Smart Booking
   - Phase 7: Service Execution

2. **High (Business Logic)**:
   - Phase 8: Cancellation Tokens
   - Phase 9: Re-assignment Logic
   - Phase 5: Admin Dashboard

3. **Medium (Monitoring & Analytics)**:
   - Phase 10: Analytics

---

## Testing Checklist

- [ ] Authentication flow for all roles
- [ ] Customer booking to completion
- [ ] Worker assignment logic
- [ ] Cancellation token system
- [ ] Re-assignment on worker unavailability
- [ ] Invoice generation and delivery
- [ ] Analytics data accuracy
- [ ] Real-time notifications
- [ ] Role-based access control

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Payment gateway integrated
- [ ] SMS/Email service setup
- [ ] Analytics tracking enabled
- [ ] Monitoring & alerts configured
- [ ] Load testing completed
- [ ] Security audit passed

