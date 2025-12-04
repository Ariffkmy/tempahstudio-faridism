import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ierrbnbghexwlwgizvww.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcnJibmJnaGV4d2x3Z2l6dnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTMwNzgsImV4cCI6MjA4MDM4OTA3OH0.g_iGvJj9KuoYuAP-UbXcI6Bi612J_5-JEWKc1COvDlY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
