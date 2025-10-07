-- Fix Database Trigger Issue
-- The code_analyses table doesn't have an updated_at column
-- but the trigger is trying to set it, causing errors

-- Drop the trigger from code_analyses table
DROP TRIGGER IF EXISTS update_code_analyses_updated_at ON code_analyses;

-- Check if we need to add the column or just remove the trigger
-- Option 1: Add the missing column (recommended)
ALTER TABLE code_analyses 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Recreate the trigger with the column now present
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_code_analyses_updated_at
    BEFORE UPDATE ON code_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Option 2: If you don't want the updated_at column, just drop the trigger
-- DROP TRIGGER IF EXISTS update_code_analyses_updated_at ON code_analyses;

