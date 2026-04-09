import { createClient } from '@supabase/supabase-js'

// Credentials are injected at build time via Vite env vars.
// In development: create a .env file in the project root.
// In production: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as GitHub Secrets.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnabled = !!(supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY')

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
