-- Check what templates exist in the database
-- Run this in Supabase SQL Editor

SELECT 
  template_id,
  name,
  description,
  category,
  translations,
  is_active,
  created_at
FROM content_templates
WHERE is_active = true
ORDER BY sort_order ASC, name ASC;

-- This will show you:
-- 1. All active templates
-- 2. Their current translations (if any)
-- 3. Which ones need Lithuanian translations

