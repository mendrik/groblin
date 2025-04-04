--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.1 (Ubuntu 17.1-1.pgdg24.10+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: delete_referenced_rows(); Type: FUNCTION; Schema: public; Owner: groblin
--

CREATE FUNCTION public.delete_referenced_rows() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Delete rows where list_path contains the OLD.id (the id of the deleted row)
    DELETE FROM public."values"
    WHERE OLD.id = ANY(list_path);

    -- Return the old row (standard for delete triggers)
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.delete_referenced_rows() OWNER TO groblin;

--
-- Name: set_node_depth(); Type: FUNCTION; Schema: public; Owner: groblin
--

CREATE FUNCTION public.set_node_depth() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    parent_depth INTEGER;
BEGIN
    IF NEW.parent_id IS NULL THEN
        -- If no parent, this is a root node
        NEW.depth := 1;
    ELSE
        -- Fetch the parent's depth and add 1
        SELECT depth INTO parent_depth FROM public.node WHERE id = NEW.parent_id;

        IF parent_depth IS NULL THEN
            RAISE EXCEPTION 'Parent with id % not found or depth not set', NEW.parent_id;
        END IF;

        NEW.depth := parent_depth + 1;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_node_depth() OWNER TO groblin;

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: groblin
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;  -- set updated_at to current timestamp
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO groblin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public.account (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp without time zone,
    "refreshTokenExpiresAt" timestamp without time zone,
    scope text,
    password text,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public.account OWNER TO groblin;

--
-- Name: api_key; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public.api_key (
    id integer NOT NULL,
    project_id integer NOT NULL,
    key character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    last_used timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.api_key OWNER TO groblin;

--
-- Name: api_key_id_seq; Type: SEQUENCE; Schema: public; Owner: groblin
--

CREATE SEQUENCE public.api_key_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_key_id_seq OWNER TO groblin;

--
-- Name: api_key_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: groblin
--

ALTER SEQUENCE public.api_key_id_seq OWNED BY public.api_key.id;


--
-- Name: history; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public.history (
    user_id text NOT NULL,
    current_project_id integer
);


ALTER TABLE public.history OWNER TO groblin;

--
-- Name: node; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public.node (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "order" integer NOT NULL,
    parent_id integer,
    project_id integer NOT NULL,
    depth integer DEFAULT 0
);


ALTER TABLE public.node OWNER TO groblin;

--
-- Name: node_id_seq; Type: SEQUENCE; Schema: public; Owner: groblin
--

CREATE SEQUENCE public.node_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.node_id_seq OWNER TO groblin;

--
-- Name: node_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: groblin
--

ALTER SEQUENCE public.node_id_seq OWNED BY public.node.id;


--
-- Name: node_settings; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public.node_settings (
    id integer NOT NULL,
    node_id integer NOT NULL,
    settings jsonb,
    project_id integer NOT NULL,
    required boolean DEFAULT false,
    priority boolean DEFAULT false
);


ALTER TABLE public.node_settings OWNER TO groblin;

--
-- Name: node_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: groblin
--

CREATE SEQUENCE public.node_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.node_settings_id_seq OWNER TO groblin;

--
-- Name: node_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: groblin
--

ALTER SEQUENCE public.node_settings_id_seq OWNED BY public.node_settings.id;


--
-- Name: project; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public.project (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.project OWNER TO groblin;

--
-- Name: project_id_seq; Type: SEQUENCE; Schema: public; Owner: groblin
--

CREATE SEQUENCE public.project_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_id_seq OWNER TO groblin;

--
-- Name: project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: groblin
--

ALTER SEQUENCE public.project_id_seq OWNED BY public.project.id;


--
-- Name: project_user; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public.project_user (
    project_id integer NOT NULL,
    roles text[] NOT NULL,
    confirmed boolean DEFAULT false NOT NULL,
    owner boolean DEFAULT false NOT NULL,
    user_id text
);


ALTER TABLE public.project_user OWNER TO groblin;

--
-- Name: session; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public.session (
    id text NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL
);


ALTER TABLE public.session OWNER TO groblin;

--
-- Name: user; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public."user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."user" OWNER TO groblin;

--
-- Name: values; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public."values" (
    id integer NOT NULL,
    node_id integer NOT NULL,
    value jsonb,
    project_id integer NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    list_path integer[],
    external_id text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."values" OWNER TO groblin;

--
-- Name: values_id_seq; Type: SEQUENCE; Schema: public; Owner: groblin
--

CREATE SEQUENCE public.values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.values_id_seq OWNER TO groblin;

--
-- Name: values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: groblin
--

ALTER SEQUENCE public.values_id_seq OWNED BY public."values".id;


--
-- Name: verification; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "createdAt" timestamp without time zone,
    "updatedAt" timestamp without time zone
);


ALTER TABLE public.verification OWNER TO groblin;

--
-- Name: api_key id; Type: DEFAULT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.api_key ALTER COLUMN id SET DEFAULT nextval('public.api_key_id_seq'::regclass);


--
-- Name: node id; Type: DEFAULT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.node ALTER COLUMN id SET DEFAULT nextval('public.node_id_seq'::regclass);


--
-- Name: node_settings id; Type: DEFAULT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.node_settings ALTER COLUMN id SET DEFAULT nextval('public.node_settings_id_seq'::regclass);


--
-- Name: project id; Type: DEFAULT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.project ALTER COLUMN id SET DEFAULT nextval('public.project_id_seq'::regclass);


--
-- Name: values id; Type: DEFAULT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public."values" ALTER COLUMN id SET DEFAULT nextval('public.values_id_seq'::regclass);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: api_key api_key_key_key; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.api_key
    ADD CONSTRAINT api_key_key_key UNIQUE (key);


--
-- Name: api_key api_key_pkey; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.api_key
    ADD CONSTRAINT api_key_pkey PRIMARY KEY (id);


--
-- Name: values constraint_name; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public."values"
    ADD CONSTRAINT constraint_name UNIQUE (list_path, external_id);


--
-- Name: node constraint_node_name; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.node
    ADD CONSTRAINT constraint_node_name UNIQUE (name, parent_id);


--
-- Name: history history_pkey; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.history
    ADD CONSTRAINT history_pkey PRIMARY KEY (user_id);


--
-- Name: node node_pkey; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.node
    ADD CONSTRAINT node_pkey PRIMARY KEY (id);


--
-- Name: node_settings node_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.node_settings
    ADD CONSTRAINT node_settings_pkey PRIMARY KEY (id);


--
-- Name: project project_pkey; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: values values_pkey; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public."values"
    ADD CONSTRAINT values_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: constraint_ext_node; Type: INDEX; Schema: public; Owner: groblin
--

CREATE UNIQUE INDEX constraint_ext_node ON public."values" USING btree (external_id, node_id) WHERE (external_id IS NOT NULL);


--
-- Name: external_id_1733431595845_index; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX external_id_1733431595845_index ON public."values" USING btree (external_id);


--
-- Name: idx_values_node_id; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX idx_values_node_id ON public."values" USING btree (node_id);


--
-- Name: idx_values_project_id; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX idx_values_project_id ON public."values" USING btree (project_id);


--
-- Name: list_path_1734340899774_index; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX list_path_1734340899774_index ON public."values" USING btree (list_path);


--
-- Name: node_id; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX node_id ON public.node USING btree (id);


--
-- Name: node_id_1734381396869_index; Type: INDEX; Schema: public; Owner: groblin
--

CREATE UNIQUE INDEX node_id_1734381396869_index ON public.node_settings USING btree (node_id);


--
-- Name: parent_id_1734341132059_index; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX parent_id_1734341132059_index ON public.node USING btree (parent_id);


--
-- Name: project_id; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX project_id ON public.project USING btree (id);


--
-- Name: project_id_1734341137450_index; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX project_id_1734341137450_index ON public.node USING btree (project_id);


--
-- Name: project_id_1734381367913_index; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX project_id_1734381367913_index ON public.node_settings USING btree (project_id);


--
-- Name: project_user_project_id; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX project_user_project_id ON public.project_user USING btree (project_id);


--
-- Name: sqlite_autoindex_project_user_1; Type: INDEX; Schema: public; Owner: groblin
--

CREATE UNIQUE INDEX sqlite_autoindex_project_user_1 ON public.project_user USING btree (project_id);


--
-- Name: user_id_1741182052757_index; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX user_id_1741182052757_index ON public.project_user USING btree (user_id);


--
-- Name: values cascade_delete_on_list_path; Type: TRIGGER; Schema: public; Owner: groblin
--

CREATE TRIGGER cascade_delete_on_list_path AFTER DELETE ON public."values" FOR EACH ROW EXECUTE FUNCTION public.delete_referenced_rows();


--
-- Name: node set_node_depth_trg; Type: TRIGGER; Schema: public; Owner: groblin
--

CREATE TRIGGER set_node_depth_trg BEFORE INSERT ON public.node FOR EACH ROW EXECUTE FUNCTION public.set_node_depth();


--
-- Name: values set_values_updated_at; Type: TRIGGER; Schema: public; Owner: groblin
--

CREATE TRIGGER set_values_updated_at BEFORE UPDATE ON public."values" FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: account account_userId_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT "account_userId_fkey1" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: api_key api_key_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.api_key
    ADD CONSTRAINT api_key_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: node node_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.node
    ADD CONSTRAINT node_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.node(id) ON DELETE CASCADE;


--
-- Name: node node_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.node
    ADD CONSTRAINT node_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: node_settings node_settings_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.node_settings
    ADD CONSTRAINT node_settings_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.node(id) ON DELETE CASCADE;


--
-- Name: node_settings node_settings_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.node_settings
    ADD CONSTRAINT node_settings_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project_user project_user_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.project_user
    ADD CONSTRAINT project_user_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "session_userId_fkey1" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: values values_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public."values"
    ADD CONSTRAINT values_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.node(id) ON DELETE CASCADE;


--
-- Name: values values_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public."values"
    ADD CONSTRAINT values_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

