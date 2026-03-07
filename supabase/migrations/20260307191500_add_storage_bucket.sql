-- Create a public bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('interferencias_images', 'interferencias_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for storage (disable it so we can upload freely for now)
CREATE POLICY "Public Access" 
ON storage.objects FOR ALL 
USING (bucket_id = 'interferencias_images');
