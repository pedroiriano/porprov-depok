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

DROP INDEX IF EXISTS public.uq_venues_active_name;
DROP INDEX IF EXISTS public.idx_venues_deleted_at;
ALTER TABLE IF EXISTS ONLY public.venues DROP CONSTRAINT IF EXISTS venues_pkey;
ALTER TABLE IF EXISTS ONLY public.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
DROP TABLE IF EXISTS public.venues;
DROP TABLE IF EXISTS public.schema_migrations;
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


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
-- Name: venues; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.venues (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    image_url text,
    address text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    map_route_url text,
    city_guide_ids uuid[],
    cabor_ids uuid[],
    capacity integer DEFAULT 0,
    facilities text,
    readiness_status character varying(50) DEFAULT 'Persiapan'::character varying,
    contact_person character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    deleted_by text,
    delete_reason text
);


ALTER TABLE public.venues OWNER TO porprov_admin;

--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.schema_migrations (version, dirty) FROM stdin;
2	f
\.


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.venues (id, name, image_url, address, latitude, longitude, map_route_url, city_guide_ids, cabor_ids, capacity, facilities, readiness_status, contact_person, created_at, updated_at, deleted_at, deleted_by, delete_reason) FROM stdin;
79b4da00-8a61-46ee-a116-5192ad0afce8	E2E Venue 1784008352	\N	Depok	\N	\N	\N	\N	{25b016b4-4fed-42a4-985c-3a1090332e39}	100	E2E	Siap	Codex	2026-07-14 05:52:33.052429+00	2026-07-14 05:52:43.900527+00	2026-07-14 05:52:43.900527+00	codex-e2e	Verifikasi E2E soft delete 2026-07-14
2491c970-35c5-4493-971b-6abb8cc5371b	Depok Sport Hall	/uploads/1a916ad63407a0bc4261026b8f957520.png	Jl. Boulevard Grand Depok City, Tirtajaya, Kec. Sukmajaya	-6.40570000	106.81930000	https://maps.app.goo.gl/Jy8gJSoB6RTpoMnG6	\N	{78ad3fb9-ff39-4634-840c-10f85495a5ad,fa0a7ca7-e4b1-46f1-a959-251e838e88d0}	1000	\N	Siap	\N	2026-07-15 07:25:59.190914+00	2026-07-15 07:25:59.190914+00	\N	\N	\N
73978855-ee20-4973-a84d-488ef040c54d	Eden Sports Center	/uploads/e995b8792cbdc22333c19b413c7ac594.png	Jl. Raya Pengasinan, RT.0.4/RW.01, Pengasinan, Kec. Sawangan, Kota Depok, Jawa Barat 16518	-6.42550000	106.76450000	https://maps.app.goo.gl/bN2Gqs9DwQff3Qsp7	\N	{cd80ba66-d31b-4561-902a-e94a20bf5a38,c965c3b7-5b66-433a-aeae-4b4ba3f3b3a3}	1000	\N	Siap	\N	2026-07-15 07:35:07.191492+00	2026-07-15 07:35:07.191492+00	\N	\N	\N
8201cec6-3d53-442a-a9ba-b2fbf39887f4	Lapangan Bola PSP	/uploads/edde7cbdba83f105d360173f1ae67189.png	Jl. Abdul Wahab No.19, Sawangan Lama, Kec. Sawangan, Kota Depok, Jawa Barat	-6.40000000	106.75000000	https://maps.app.goo.gl/XhqjetfxLufQ2KNG9	\N	{c965c3b7-5b66-433a-aeae-4b4ba3f3b3a3}	10000	Toilet, Parkir, Ruang Medis	Siap	\N	2026-07-23 08:11:03.210177+00	2026-07-23 08:19:55.307499+00	\N	\N	\N
4407f950-2a77-4520-b730-87b4513a4d44	Lapangan Tembak Kostrad Cilodong	/uploads/1c0ce890db6195645def20eb98a432d7.png	Jl. Kp. No.23, Cilodong, Kec. Cilodong, Kota Depok, Jawa Barat 16414	-6.43000000	106.85000000	https://maps.app.goo.gl/JHBmqckW9Wvium1t8	\N	{b4722d77-8dcf-49f8-b8f3-614a0ff323fb}	1000	\N	Siap	\N	2026-07-23 08:36:55.27685+00	2026-07-23 08:42:06.41061+00	\N	\N	\N
\.


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: idx_venues_deleted_at; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_venues_deleted_at ON public.venues USING btree (deleted_at);


--
-- Name: uq_venues_active_name; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE UNIQUE INDEX uq_venues_active_name ON public.venues USING btree (lower((name)::text)) WHERE (deleted_at IS NULL);


--
-- PostgreSQL database dump complete
--

