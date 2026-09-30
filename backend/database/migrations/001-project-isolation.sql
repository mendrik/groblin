BEGIN;
DROP INDEX IF EXISTS public.sqlite_autoindex_project_user_1;
CREATE UNIQUE INDEX IF NOT EXISTS project_user_membership ON public.project_user(project_id, user_id);
ALTER TABLE public.node ADD CONSTRAINT node_project_identity UNIQUE (id, project_id);
ALTER TABLE public.node DROP CONSTRAINT node_parent_id_fkey;
ALTER TABLE public.node ADD CONSTRAINT node_parent_id_fkey FOREIGN KEY (parent_id, project_id) REFERENCES public.node(id, project_id) ON DELETE CASCADE;
ALTER TABLE public.node_settings DROP CONSTRAINT node_settings_node_id_fkey;
ALTER TABLE public.node_settings ADD CONSTRAINT node_settings_node_id_fkey FOREIGN KEY (node_id, project_id) REFERENCES public.node(id, project_id) ON DELETE CASCADE;
ALTER TABLE public."values" DROP CONSTRAINT values_node_id_fkey;
ALTER TABLE public."values" ADD CONSTRAINT values_node_id_fkey FOREIGN KEY (node_id, project_id) REFERENCES public.node(id, project_id) ON DELETE CASCADE;
CREATE OR REPLACE FUNCTION public.delete_referenced_rows() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 DELETE FROM public."values" WHERE project_id = OLD.project_id AND OLD.id = ANY(list_path);
 RETURN OLD;
END;
$$;
COMMIT;
