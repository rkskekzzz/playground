
import { createClient } from '@supabase/supabase-js'

// New Supabase API Key Spec (Publishable Key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  realtime: {
    params: { log_level: 'info' },
  },
})
