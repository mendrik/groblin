BEGIN;
CREATE INDEX list_scope_order ON public."values" (project_id, node_id, coalesce(list_path, '{}'::integer[]), "order", id);
CREATE INDEX list_scope_children ON public."values" (project_id, coalesce(list_path, '{}'::integer[]), node_id);
COMMIT;
