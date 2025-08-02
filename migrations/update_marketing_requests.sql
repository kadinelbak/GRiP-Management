-- Migration: Update marketing_requests table for extended functionality
-- Add new columns to support art requests and improved marketing management

ALTER TABLE marketing_requests 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'marketing-request';

ALTER TABLE marketing_requests 
ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE marketing_requests 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE marketing_requests 
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';

ALTER TABLE marketing_requests 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE marketing_requests 
ADD COLUMN IF NOT EXISTS response_message TEXT;

ALTER TABLE marketing_requests 
ADD COLUMN IF NOT EXISTS details TEXT;

ALTER TABLE marketing_requests 
ADD COLUMN IF NOT EXISTS requester_name TEXT;

ALTER TABLE marketing_requests 
ADD COLUMN IF NOT EXISTS requester_email TEXT;

ALTER TABLE marketing_requests 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Update existing records to have the new title field based on request_type
UPDATE marketing_requests 
SET title = request_type 
WHERE title IS NULL;

-- Update existing records to have the new description field based on message
UPDATE marketing_requests 
SET description = message 
WHERE description IS NULL;

-- Update existing records to have requester fields
UPDATE marketing_requests 
SET requester_name = name,
    requester_email = email
WHERE requester_name IS NULL OR requester_email IS NULL;
