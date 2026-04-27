// lib/supabase.js
import { createClient } from '@supabase/supabase-js'


const supabase = createClient(
  process.env.SUPABASE_URL,        // es. https://xyz.supabase.co
  process.env.SUPABASE_SERVICE_KEY // service_role key (non la anon!)
)

export default supabase