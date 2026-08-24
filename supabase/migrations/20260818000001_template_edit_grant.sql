-- Add persistent edit-grant flag for module templates
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS template_edit_granted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_edit_granted_by uuid NULL,
  ADD COLUMN IF NOT EXISTS template_edit_granted_at timestamptz NULL;

-- Optional index to quickly find modules with grants
CREATE INDEX IF NOT EXISTS idx_modules_template_edit_granted ON public.modules (template_edit_granted);
