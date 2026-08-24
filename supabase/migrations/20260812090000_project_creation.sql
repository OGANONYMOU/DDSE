-- =============================================================================
-- DDSE Migration: Project creation fields + document storage bucket
--
-- The "New Project" button in ProjectsPage.tsx had no handler at all. Adding
-- the fields and storage needed for a real create-project flow: a short
-- "reason" for opening the project and a longer free-text "summary", plus a
-- dedicated storage bucket for the BOQ/permit/report documents already
-- modeled by public.project_documents but never given anywhere to land.
-- =============================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS reason  text,
  ADD COLUMN IF NOT EXISTS summary text;

COMMENT ON COLUMN public.projects.reason  IS 'Why this project is being opened.';
COMMENT ON COLUMN public.projects.summary IS 'Free-text summary of the full project.';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  26214400, -- 25MB
  ARRAY['application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY project_documents_storage_read ON storage.objects
  FOR SELECT USING (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY project_documents_storage_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);
