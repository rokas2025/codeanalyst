-- Setup Supabase Storage for Code Analysis ZIP uploads
-- Run this in Supabase SQL Editor

-- Create storage bucket for code analysis ZIPs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'code-analysis-zips',
    'code-analysis-zips',
    false,  -- Private bucket
    104857600,  -- 100MB limit
    ARRAY['application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for authenticated users
-- Policy 1: Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own code analysis ZIPs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'code-analysis-zips' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow authenticated users to read their own files
CREATE POLICY "Users can read their own code analysis ZIPs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'code-analysis-zips' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow service role to do everything (for backend)
CREATE POLICY "Service role has full access to code analysis ZIPs"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'code-analysis-zips')
WITH CHECK (bucket_id = 'code-analysis-zips');

-- Policy 4: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own code analysis ZIPs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'code-analysis-zips' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE name = 'code-analysis-zips';

-- Verify policies were created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%code analysis%';

