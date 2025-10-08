import { createClient } from '@supabase/supabase-js'

// These are vaulus from your local env file, NOT PROVIDED IN GITHUB!!!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
