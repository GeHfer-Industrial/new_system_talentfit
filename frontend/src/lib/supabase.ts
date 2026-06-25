import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Variáveis de ambiente faltando:\n` +
    `VITE_SUPABASE_URL: ${supabaseUrl ? 'OK' : 'FALTANDO'}\n` +
    `VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'OK' : 'FALTANDO'}`
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
