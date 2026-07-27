--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4 (Debian 15.4-1.pgdg110+1)
-- Dumped by pg_dump version 15.4 (Debian 15.4-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP INDEX IF EXISTS public.idx_users_keycloak_id;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_keycloak_id_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.schema_migrations;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    dirty boolean NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO porprov_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    keycloak_id character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255),
    role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    delete_reason text
);


ALTER TABLE public.users OWNER TO porprov_admin;

--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.schema_migrations (version, dirty) FROM stdin;
2	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.users (id, keycloak_id, username, email, full_name, role, created_at, updated_at, deleted_at, deleted_by, delete_reason) FROM stdin;
92e60594-07f7-41be-81fc-98a432196968	364494a2-a476-4d9b-ae57-2fb27bf841c8	pedroiriano	pdzeus83aw@gmail.com	Pedro Iriano	super_admin	2026-07-21 03:06:58.888138+00	2026-07-21 03:06:58.888138+00	\N	\N	\N
5664e6d9-fd85-4584-9a46-0f5e061c250d	uuid-keycloak-123	atlet_depok	atlet@depok.go.id	Atlet Kontingen Depok	atlet	2026-07-07 04:21:08.799908+00	2026-07-07 04:21:08.799908+00	2026-07-21 03:53:13.86797+00	system	Deleted by Super Admin via Admin Web
\.


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_keycloak_id_key; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_keycloak_id_key UNIQUE (keycloak_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_users_keycloak_id; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_users_keycloak_id ON public.users USING btree (keycloak_id);


--
-- PostgreSQL database dump complete
--

