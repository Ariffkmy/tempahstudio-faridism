-- Quick diagnostic query to check if tables and policies exist
-- Run this in Supabase SQL Editor

-- Check if tables exist
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE tablename IN ('whatsapp_blast_history', 'whatsapp_message_tracking', 'whatsapp_sessions')
ORDER BY tablename;

-- Check RLS policies for blast history
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'whatsapp_blast_history'
ORDER BY policyname;

-- Check RLS policies for message tracking
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'whatsapp_message_tracking'
ORDER BY policyname;

-- Check if there's any data
SELECT 'blast_history' as table_name, COUNT(*) as row_count FROM whatsapp_blast_history
UNION ALL
SELECT 'message_tracking', COUNT(*) FROM whatsapp_message_tracking
UNION ALL
SELECT 'sessions', COUNT(*) FROM whatsapp_sessions;
