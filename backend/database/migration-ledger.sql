CREATE TABLE IF NOT EXISTS public.schema_migration (
 version integer PRIMARY KEY,
 name text NOT NULL,
 checksum text NOT NULL,
 applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
