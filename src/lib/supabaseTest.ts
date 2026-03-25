import { supabase } from "./supabase"

console.log("Supabase client initialized:", !!supabase)

// expose globally for debugging
;(window as any).supabase = supabase
