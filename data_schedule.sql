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

ALTER TABLE IF EXISTS ONLY public.match_participants DROP CONSTRAINT IF EXISTS match_participants_match_id_fkey;
DROP INDEX IF EXISTS public.uq_match_participants_active_slot;
DROP INDEX IF EXISTS public.idx_schedule_venues_deleted_at;
DROP INDEX IF EXISTS public.idx_matches_venue_id;
DROP INDEX IF EXISTS public.idx_matches_deleted_at;
DROP INDEX IF EXISTS public.idx_match_participants_match_id;
DROP INDEX IF EXISTS public.idx_match_participants_deleted_at;
DROP INDEX IF EXISTS public.idx_match_participants_active_kontingen;
ALTER TABLE IF EXISTS ONLY public.venues DROP CONSTRAINT IF EXISTS venues_pkey;
ALTER TABLE IF EXISTS ONLY public.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_pkey;
ALTER TABLE IF EXISTS ONLY public.match_participants DROP CONSTRAINT IF EXISTS match_participants_pkey;
DROP TABLE IF EXISTS public.venues;
DROP TABLE IF EXISTS public.schema_migrations;
DROP TABLE IF EXISTS public.matches;
DROP TABLE IF EXISTS public.match_participants;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: match_participants; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.match_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    kontingen_id uuid NOT NULL,
    athlete_name character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by text,
    delete_reason text,
    participant_type character varying(20) DEFAULT 'contingent'::character varying NOT NULL,
    team_name character varying(150),
    slot smallint DEFAULT 1 NOT NULL,
    CONSTRAINT match_participants_identity_check CHECK (((((participant_type)::text = 'individual'::text) AND (NULLIF(btrim((athlete_name)::text), ''::text) IS NOT NULL) AND (NULLIF(btrim((team_name)::text), ''::text) IS NULL)) OR (((participant_type)::text = 'team'::text) AND (NULLIF(btrim((team_name)::text), ''::text) IS NOT NULL) AND (NULLIF(btrim((athlete_name)::text), ''::text) IS NULL)) OR (((participant_type)::text = 'contingent'::text) AND (NULLIF(btrim((athlete_name)::text), ''::text) IS NULL) AND (NULLIF(btrim((team_name)::text), ''::text) IS NULL)))),
    CONSTRAINT match_participants_slot_check CHECK (((slot >= 1) AND (slot <= 64))),
    CONSTRAINT match_participants_type_check CHECK (((participant_type)::text = ANY ((ARRAY['individual'::character varying, 'team'::character varying, 'contingent'::character varying])::text[])))
);


ALTER TABLE public.match_participants OWNER TO porprov_admin;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nomor_tanding_id uuid NOT NULL,
    venue_id uuid NOT NULL,
    match_date timestamp with time zone NOT NULL,
    status character varying(50) DEFAULT 'scheduled'::character varying NOT NULL,
    round character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by text,
    delete_reason text
);


ALTER TABLE public.matches OWNER TO porprov_admin;

--
-- Name: COLUMN matches.venue_id; Type: COMMENT; Schema: public; Owner: porprov_admin
--

COMMENT ON COLUMN public.matches.venue_id IS 'External UUID owned by venue-service; validated through the service contract.';


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
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    address text,
    capacity integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    city character varying(100) DEFAULT 'Depok'::character varying NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by text,
    delete_reason text
);


ALTER TABLE public.venues OWNER TO porprov_admin;

--
-- Data for Name: match_participants; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.match_participants (id, match_id, kontingen_id, athlete_name, created_at, updated_at, deleted_at, deleted_by, delete_reason, participant_type, team_name, slot) FROM stdin;
ee6982ac-e0fc-4e41-b5ac-090d6e9a2d1e	ef48ca73-820f-4ab9-8188-eaa1261d2991	70277ed6-ca91-4336-a462-511f44ee7517	\N	2026-07-22 04:26:40.309272+00	2026-07-22 04:26:40.309272+00	\N	\N	\N	contingent	\N	1
009f1f60-72e8-4184-b775-ed45402ad8cb	ef48ca73-820f-4ab9-8188-eaa1261d2991	3a5cb238-1bac-4757-adf4-1416b80b110d	\N	2026-07-22 04:26:40.309272+00	2026-07-22 04:26:40.309272+00	\N	\N	\N	contingent	\N	2
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.matches (id, nomor_tanding_id, venue_id, match_date, status, round, created_at, updated_at, deleted_at, deleted_by, delete_reason) FROM stdin;
ece64019-e5e6-48db-8520-f18e9e5f7d1d	3ba0c755-fd97-4e6b-9a75-643dad514d0c	79b4da00-8a61-46ee-a116-5192ad0afce8	2026-08-01 02:00:00+00	Scheduled	E2E	2026-07-14 05:52:33.748122+00	2026-07-14 05:52:42.78012+00	2026-07-14 05:52:42.78012+00	codex-e2e	Verifikasi E2E soft delete 2026-07-14
ef48ca73-820f-4ab9-8188-eaa1261d2991	e2d91d63-ed8c-4d65-8014-fc64cded26dd	2491c970-35c5-4493-971b-6abb8cc5371b	2026-07-16 08:33:00+00	ongoing	penyisihan	2026-07-16 08:34:00.497205+00	2026-07-22 04:26:40.309272+00	\N	\N	\N
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.schema_migrations (version, dirty) FROM stdin;
5	f
\.


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.venues (id, name, address, capacity, created_at, updated_at, city, deleted_at, deleted_by, delete_reason) FROM stdin;
5b8bea97-f6b8-4cde-aa3f-4409b8a90987	Stadion Sementara	Jalan Dihapus	100	2026-07-07 05:16:26.348838+00	2026-07-07 05:16:26.348838+00	Depok	\N	\N	\N
\.


--
-- Name: match_participants match_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.match_participants
    ADD CONSTRAINT match_participants_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


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
-- Name: idx_match_participants_active_kontingen; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_match_participants_active_kontingen ON public.match_participants USING btree (kontingen_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_match_participants_deleted_at; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_match_participants_deleted_at ON public.match_participants USING btree (deleted_at);


--
-- Name: idx_match_participants_match_id; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_match_participants_match_id ON public.match_participants USING btree (match_id);


--
-- Name: idx_matches_deleted_at; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_matches_deleted_at ON public.matches USING btree (deleted_at);


--
-- Name: idx_matches_venue_id; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_matches_venue_id ON public.matches USING btree (venue_id);


--
-- Name: idx_schedule_venues_deleted_at; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_schedule_venues_deleted_at ON public.venues USING btree (deleted_at);


--
-- Name: uq_match_participants_active_slot; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE UNIQUE INDEX uq_match_participants_active_slot ON public.match_participants USING btree (match_id, slot) WHERE (deleted_at IS NULL);


--
-- Name: match_participants match_participants_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.match_participants
    ADD CONSTRAINT match_participants_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

