BEGIN;
ALTER TABLE public."values" DROP CONSTRAINT constraint_name;
DROP INDEX public.constraint_ext_node;
CREATE UNIQUE INDEX external_content_identity ON public."values"
 (project_id, node_id, coalesce(list_path, '{}'::integer[]), external_id)
 WHERE external_id IS NOT NULL;
COMMIT;
