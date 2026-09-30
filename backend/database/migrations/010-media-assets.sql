BEGIN;
CREATE TABLE public.media_asset (
 key text PRIMARY KEY,
 project_id integer NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
 uploaded_by text REFERENCES public."user"(id) ON DELETE SET NULL,
 filename text NOT NULL,
 content_type text NOT NULL,
 size integer NOT NULL CHECK (size BETWEEN 0 AND 67108864),
 purpose text NOT NULL CHECK (purpose IN ('MEDIA', 'JSON_IMPORT', 'PROJECT_IMPORT', 'EXPORT')),
 created_at timestamptz NOT NULL DEFAULT now(),
 verified_at timestamptz,
 sha256 text,
 width integer,
 height integer,
 sealed_key text,
 expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
 cleanup_attempts integer NOT NULL DEFAULT 0,
 last_error text,
 CHECK (key ~ ('^project_' || project_id || '/[0-9a-f-]{36}$'))
);
CREATE INDEX expiring_media_assets ON public.media_asset(expires_at);
COMMIT;
BEGIN;
CREATE TABLE public.media_file_cleanup_job (
 key text PRIMARY KEY CHECK (key ~ '^project_[1-9][0-9]*/[0-9a-f-]{36}$'),
 not_before timestamptz NOT NULL DEFAULT now() + interval '24 hours',
 attempts integer NOT NULL DEFAULT 0,
 last_error text
);
COMMIT;
BEGIN;
-- Register files already referenced by pre-registry content and retained history.
WITH content AS (
 SELECT project_id, value FROM public."values"
 UNION ALL
 SELECT r.project_id, item -> 'value' FROM public.content_revision r,
 LATERAL jsonb_array_elements(r.snapshot -> 'values') item
), files AS (
 SELECT DISTINCT ON (project_id, value ->> 'file') project_id, value
 FROM content WHERE value ->> 'file' ~ '^project_[1-9][0-9]*/[0-9a-f-]{36}$'
 AND value ->> 'file' LIKE 'project_' || project_id || '/%'
)
INSERT INTO public.media_asset (key, project_id, filename, content_type, size, purpose, verified_at)
SELECT value ->> 'file', project_id, coalesce(value ->> 'name', 'Imported legacy file'),
 coalesce(value ->> 'contentType', 'application/octet-stream'),
 CASE WHEN value ->> 'size' ~ '^[0-9]{1,8}$' THEN least((value ->> 'size')::int, 67108864) ELSE 0 END,
 'MEDIA', now() FROM files
ON CONFLICT (key) DO NOTHING;
COMMIT;
