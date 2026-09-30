BEGIN;
CREATE TABLE public.project_import_receipt (
 user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
 upload_key text NOT NULL,
 source_hash text NOT NULL,
 project_id integer REFERENCES public.project(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, upload_key, source_hash)
);
COMMIT;
