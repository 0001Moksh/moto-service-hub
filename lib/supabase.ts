import { createClient } from '@supabase/supabase-js'

// Ensure we always have valid values for Supabase client initialization
// During builds with missing env vars, use valid placeholders
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url && url.startsWith('https://')) return url
  return 'https://brnsimoaoxuhpxzrfpcg.supabase.co' // Default to actual project
}

const getAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (key && key.length > 20) return key // Real key is long
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybnNpbW9hb3h1aHB4enJmcGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzMxNTksImV4cCI6MjA4NzMwOTE1OX0.BJExkoHvoobYBKeMjG00mYhW4iXxKU5Ot7_deMgajVQ'
}

const getServiceRoleKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (key && key.length > 20) return key // Real key is long
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybnNpbW9hb3h1aHB4enJmcGNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTczMzE1OSwiZXhwIjoyMDg3MzA5MTU5fQ.UVS9HFyC2gQM6kR7u3-Whwn7u3cq2UJeFF2Yu_n0QhA'
}

const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getAnonKey()
const supabaseServiceRoleKey = getServiceRoleKey()

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
