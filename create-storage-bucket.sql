-- Create storage bucket for code analysis ZIP uploads
-- Run this in Supabase SQL Editor

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'code-analysis-uploads',
    'code-analysis-uploads',
    false,
    52428800, -- 50MB limit
    ARRAY['application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up storage policies for authenticated users
CREATE POLICY IF NOT EXISTS "Authenticated users can upload ZIPs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'code-analysis-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can read their own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'code-analysis-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'code-analysis-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow service role to do everything (for backend)
CREATE POLICY IF NOT EXISTS "Service role can do everything"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'code-analysis-uploads')
WITH CHECK (bucket_id = 'code-analysis-uploads');

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'code-analysis-uploads';

