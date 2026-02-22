-- =============================================
-- Moto Service Hub - Full Database Schema
-- PostgreSQL (Supabase Compatible)
-- 13 Tables - Production Ready
-- =============================================

-- 1. OWNER
CREATE TABLE IF NOT EXISTS owner (
    owner_id SERIAL PRIMARY KEY,
    mail VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    aadhaar_card VARCHAR(12) UNIQUE,
    picture TEXT
);

-- 2. ADMIN
CREATE TABLE IF NOT EXISTS admin (
    admin_id SERIAL PRIMARY KEY,
    mail VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    support_mail VARCHAR(255),
    phone_number VARCHAR(15),
    picture TEXT
);

-- 3. CUSTOMER
CREATE TABLE IF NOT EXISTS customer (
    customer_id SERIAL PRIMARY KEY,
    mail VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    aadhaar_card VARCHAR(12),
    bike_id_array INTEGER[],
    rating NUMERIC(3,2) DEFAULT 0,
    token TEXT,
    preferance_score NUMERIC(5,2) DEFAULT 0,
    token_regenerated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    picture TEXT,
    location TEXT
);

-- 4. BIKE
CREATE TABLE IF NOT EXISTS bike (
    bike_id SERIAL PRIMARY KEY,
    reg_number VARCHAR(20) UNIQUE NOT NULL,
    regn_number VARCHAR(20),
    owner_name VARCHAR(255),
    owner_id INTEGER REFERENCES customer(customer_id) ON DELETE CASCADE,
    regn_date DATE,
    color VARCHAR(50),
    fuel VARCHAR(50),
    vehicle_class VARCHAR(50),
    body_type VARCHAR(50),
    manufacturer VARCHAR(100),
    chassis_no VARCHAR(50),
    engine VARCHAR(50),
    model_no VARCHAR(50),
    manufacture_date DATE,
    refid_validity DATE,
    address TEXT,
    picture_array TEXT[]
);

-- 5. SHOP (without holiday_calendar_id first - to avoid circular dependency)
CREATE TABLE IF NOT EXISTS shop (
    shop_id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES owner(owner_id) ON DELETE CASCADE,
    name VARCHAR(255),
    slug VARCHAR(255) UNIQUE,
    location TEXT,
    location_link TEXT,
    worker_id_array INTEGER[],
    revenue NUMERIC(15,2) DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0,
    picture_array TEXT[]
);

-- 6. HOLIDAY_CALENDAR
CREATE TABLE IF NOT EXISTS holiday_calendar (
    holiday_calendar_id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL REFERENCES shop(shop_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_holiday_dated DATE[],
    recurring_days_off INTEGER[],
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add holiday_calendar_id to shop (after holiday_calendar is created)
ALTER TABLE shop 
ADD COLUMN IF NOT EXISTS holiday_calendar_id INTEGER REFERENCES holiday_calendar(holiday_calendar_id) ON DELETE SET NULL;

-- 7. WORKER
CREATE TABLE IF NOT EXISTS worker (
    worker_id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shop(shop_id) ON DELETE CASCADE,
    mail VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    age INTEGER,
    aadhaar_card VARCHAR(12) UNIQUE,
    rating NUMERIC(3,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,
    service INTEGER DEFAULT 0,
    booking INTEGER DEFAULT 0,
    revenue NUMERIC(15,2) DEFAULT 0,
    performance_score NUMERIC(5,2) DEFAULT 0,
    picture TEXT
);

-- 8. WORKER_AVAILABILITY
CREATE TABLE IF NOT EXISTS worker_availability (
    worker_availability_id SERIAL PRIMARY KEY,
    worker_id INTEGER NOT NULL REFERENCES worker(worker_id) ON DELETE CASCADE,
    busy_from TIMESTAMP NOT NULL,
    busy_till TIMESTAMP NOT NULL,
    bike_id INTEGER REFERENCES bike(bike_id) ON DELETE SET NULL,
    shop_id INTEGER REFERENCES shop(shop_id) ON DELETE CASCADE
);

-- 9. REQUEST
CREATE TABLE IF NOT EXISTS request (
    request_id SERIAL PRIMARY KEY,
    owner_name VARCHAR(255),
    owner_email VARCHAR(255),
    owner_phone VARCHAR(15),
    shop_name VARCHAR(255),
    phone_number VARCHAR(15),
    location TEXT,
    aadhaar_card_photo TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. BOOKING
CREATE TABLE IF NOT EXISTS booking (
    booking_id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_id INTEGER REFERENCES customer(customer_id) ON DELETE CASCADE,
    bike_id INTEGER REFERENCES bike(bike_id) ON DELETE CASCADE,
    booking_trust BOOLEAN DEFAULT false,
    issue_from_customer TEXT,
    shop_id INTEGER REFERENCES shop(shop_id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES worker(worker_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending',
    cancelled_description TEXT,
    customer_scope_status VARCHAR(50),
    service_at TIMESTAMP
);

-- 11. JOB
CREATE TABLE IF NOT EXISTS job (
    job_id SERIAL PRIMARY KEY,
    bike_id INTEGER REFERENCES bike(bike_id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES shop(shop_id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES worker(worker_id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customer(customer_id) ON DELETE CASCADE,
    issue_from_customer TEXT,
    issue_from_worker TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    new_part_insert_json JSONB,
    cancelled_description TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    bill NUMERIC(15,2) DEFAULT 0
);

-- 12. SERVICE
CREATE TABLE IF NOT EXISTS service (
    service_id SERIAL PRIMARY KEY,
    booking_created_at TIMESTAMP,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_id INTEGER REFERENCES customer(customer_id) ON DELETE CASCADE,
    bike_id INTEGER REFERENCES bike(bike_id) ON DELETE CASCADE,
    booking_trust BOOLEAN DEFAULT false,
    issue_from_customer TEXT,
    issue_from_worker TEXT,
    shop_id INTEGER REFERENCES shop(shop_id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES worker(worker_id) ON DELETE SET NULL,
    duration INTEGER,
    start_at TIMESTAMP,
    end_at TIMESTAMP,
    bill NUMERIC(15,2) DEFAULT 0,
    new_part_insert_json JSONB,
    rating NUMERIC(3,2) DEFAULT 0,
    payement_status VARCHAR(50) DEFAULT 'pending',
    status VARCHAR(50) DEFAULT 'pending',
    cancelled_description TEXT,
    invoice_json JSONB
);

-- 13. DOCUMENT
CREATE TABLE IF NOT EXISTS document (
    document_id SERIAL PRIMARY KEY,
    document_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    document_path TEXT NOT NULL,
    document_by_role VARCHAR(50),
    role_id INTEGER
);

-- =============================================
-- Useful Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_shop_owner ON shop(owner_id);
CREATE INDEX IF NOT EXISTS idx_worker_shop ON worker(shop_id);
CREATE INDEX IF NOT EXISTS idx_bike_customer ON bike(owner_id);
CREATE INDEX IF NOT EXISTS idx_booking_customer ON booking(customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_shop ON booking(shop_id);
CREATE INDEX IF NOT EXISTS idx_job_worker ON job(worker_id);
CREATE INDEX IF NOT EXISTS idx_service_worker ON service(worker_id);

-- =============================================
-- Done!
-- =============================================
