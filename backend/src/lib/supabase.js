import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Supabase server environment variables are not configured yet.')
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceRoleKey || '',
  {
    auth: { persistSession: false },
    realtime: { transport: ws },
  }
)
