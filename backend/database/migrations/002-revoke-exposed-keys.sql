BEGIN;
-- Plaintext keys may have appeared in SQL logs and the committed dump.
UPDATE public.api_key SET is_active = false, key = 'revoked:' || id::text WHERE key NOT LIKE 'sha256:%';
COMMIT;
