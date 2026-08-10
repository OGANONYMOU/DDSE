-- =============================================================================
-- DDSE Migration: Foreign keys required for PostgREST resource embedding
--
-- PostgREST only auto-detects embeddable relationships (the `table(cols)`
-- nested-select syntax used throughout supabase/functions) via real foreign
-- key constraints — it will not infer them from application logic alone, and
-- silently drops or errors on the embed otherwise. Several columns were being
-- joined as if they were FKs without ever having the constraint, which
-- silently broke: inspection question/score review (get-inspection-detail),
-- completion-percent calculation (list-inspections), the scoring engine
-- itself defaulting every response to weight=1 instead of its real item
-- weight (save-inspection-response), review comment author display, and the
-- admin registration-approval queue (blank names/service numbers).
-- =============================================================================

ALTER TABLE public.inspection_responses
  ADD CONSTRAINT inspection_responses_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES public.inspection_items(id) ON DELETE CASCADE;

ALTER TABLE public.review_comments
  ADD CONSTRAINT review_comments_user_id_profile_fkey
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);

ALTER TABLE public.registration_approvals
  ADD CONSTRAINT registration_approvals_user_id_profile_fkey
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);
