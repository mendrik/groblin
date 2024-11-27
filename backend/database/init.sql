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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: node; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public.node (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "order" integer NOT NULL,
    parent_id integer,
    project_id integer NOT NULL
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
    node_id integer,
    settings jsonb
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
    user_id integer NOT NULL,
    role text NOT NULL
);


ALTER TABLE public.project_user OWNER TO groblin;

--
-- Name: user; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    confirmed boolean DEFAULT false NOT NULL,
    last_project_id integer
);


ALTER TABLE public."user" OWNER TO groblin;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: groblin
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO groblin;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: groblin
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: values; Type: TABLE; Schema: public; Owner: groblin
--

CREATE TABLE public."values" (
    id integer NOT NULL,
    node_id integer NOT NULL,
    value jsonb,
    project_id integer,
    "order" integer,
    list_path jsonb
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
-- Name: user id; Type: DEFAULT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: values id; Type: DEFAULT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public."values" ALTER COLUMN id SET DEFAULT nextval('public.values_id_seq'::regclass);


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
-- Name: project_user project_user_pkey; Type: CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.project_user
    ADD CONSTRAINT project_user_pkey PRIMARY KEY (project_id, user_id);


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
-- Name: idx_values_node_id; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX idx_values_node_id ON public."values" USING btree (node_id);


--
-- Name: idx_values_project_id; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX idx_values_project_id ON public."values" USING btree (project_id);


--
-- Name: node_id; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX node_id ON public.node USING btree (id);


--
-- Name: project_id; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX project_id ON public.project USING btree (id);


--
-- Name: project_user_project_id; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX project_user_project_id ON public.project_user USING btree (project_id);


--
-- Name: project_user_user_id; Type: INDEX; Schema: public; Owner: groblin
--

CREATE INDEX project_user_user_id ON public.project_user USING btree (user_id);


--
-- Name: sqlite_autoindex_project_user_1; Type: INDEX; Schema: public; Owner: groblin
--

CREATE UNIQUE INDEX sqlite_autoindex_project_user_1 ON public.project_user USING btree (project_id);


--
-- Name: user last_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT last_project_id_fk FOREIGN KEY (last_project_id) REFERENCES public.project(id) ON DELETE RESTRICT;


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
-- Name: project_user project_user_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.project_user
    ADD CONSTRAINT project_user_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project_user project_user_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public.project_user
    ADD CONSTRAINT project_user_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user user_last_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: groblin
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_last_project_id_fkey FOREIGN KEY (last_project_id) REFERENCES public.project(id) ON UPDATE CASCADE ON DELETE SET NULL;


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

