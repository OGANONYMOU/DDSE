-- declineReport() has always written a `review_note` column that never existed,
-- so every report decline has been failing with an "unknown column" error.
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS review_note text NULL;
