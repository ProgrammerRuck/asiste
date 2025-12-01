import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vgjjqsjrlyyrtnufobwv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnampxc2pybHl5cnRudWZvYnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTA4MDAsImV4cCI6MjA3OTk4NjgwMH0.z0h5X32bcwlmvdcG7ru7N9hIqLVPPPzlr0tsqc__XTw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)