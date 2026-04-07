
-- Add foto_url column
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS foto_url text DEFAULT '';

-- Create storage bucket for farm photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fazenda-fotos', 'fazenda-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload fazenda photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'fazenda-fotos');

-- Allow public read
CREATE POLICY "Public can view fazenda photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'fazenda-fotos');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Authenticated users can update fazenda photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'fazenda-fotos');

CREATE POLICY "Authenticated users can delete fazenda photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'fazenda-fotos');
