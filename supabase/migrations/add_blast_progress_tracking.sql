-- Add progress tracking columns to whatsapp_blast_history table
-- This allows real-time progress updates during message blasting

ALTER TABLE whatsapp_blast_history
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_recipient_index INTEGER DEFAULT 0;

-- Add comment to explain the columns
COMMENT ON COLUMN whatsapp_blast_history.progress_percentage IS 'Current progress percentage (0-100) of the blast';
COMMENT ON COLUMN whatsapp_blast_history.current_recipient_index IS 'Index of the current recipient being processed (1-based)';
