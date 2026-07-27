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

ALTER TABLE IF EXISTS ONLY public.livescore_revisions DROP CONSTRAINT IF EXISTS livescore_revisions_correction_of_fkey;
ALTER TABLE IF EXISTS ONLY public.livescore_current DROP CONSTRAINT IF EXISTS livescore_current_revision_id_fkey;
DROP TRIGGER IF EXISTS livescore_revisions_immutable ON public.livescore_revisions;
DROP INDEX IF EXISTS public.idx_livescore_revisions_match;
DROP INDEX IF EXISTS public.idx_livescore_outbox_pending;
ALTER TABLE IF EXISTS ONLY public.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.outbox_events DROP CONSTRAINT IF EXISTS outbox_events_pkey;
ALTER TABLE IF EXISTS ONLY public.outbox_events DROP CONSTRAINT IF EXISTS outbox_events_event_id_key;
ALTER TABLE IF EXISTS ONLY public.livescore_revisions DROP CONSTRAINT IF EXISTS livescore_revisions_pkey;
ALTER TABLE IF EXISTS ONLY public.livescore_revisions DROP CONSTRAINT IF EXISTS livescore_revisions_match_id_revision_number_key;
ALTER TABLE IF EXISTS ONLY public.livescore_current DROP CONSTRAINT IF EXISTS livescore_current_pkey;
DROP TABLE IF EXISTS public.schema_migrations;
DROP TABLE IF EXISTS public.outbox_events;
DROP TABLE IF EXISTS public.livescore_revisions;
DROP TABLE IF EXISTS public.livescore_current;
DROP FUNCTION IF EXISTS public.prevent_livescore_revision_mutation();
DROP EXTENSION IF EXISTS pgcrypto;
--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: prevent_livescore_revision_mutation(); Type: FUNCTION; Schema: public; Owner: porprov_admin
--

CREATE FUNCTION public.prevent_livescore_revision_mutation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'livescore revisions are immutable';
END;
$$;


ALTER FUNCTION public.prevent_livescore_revision_mutation() OWNER TO porprov_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: livescore_current; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.livescore_current (
    match_id uuid NOT NULL,
    revision_id uuid NOT NULL,
    revision_number bigint NOT NULL,
    score_a integer NOT NULL,
    score_b integer NOT NULL,
    status character varying(50) NOT NULL,
    actor_id character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT livescore_current_score_a_check CHECK ((score_a >= 0)),
    CONSTRAINT livescore_current_score_b_check CHECK ((score_b >= 0))
);


ALTER TABLE public.livescore_current OWNER TO porprov_admin;

--
-- Name: livescore_revisions; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.livescore_revisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    revision_number bigint NOT NULL,
    score_a integer NOT NULL,
    score_b integer NOT NULL,
    status character varying(50) NOT NULL,
    correction_of uuid,
    correction_reason text,
    actor_id character varying(255) NOT NULL,
    request_id character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT livescore_revisions_check CHECK ((((correction_of IS NULL) AND (correction_reason IS NULL)) OR ((correction_of IS NOT NULL) AND (length(TRIM(BOTH FROM correction_reason)) >= 5)))),
    CONSTRAINT livescore_revisions_score_a_check CHECK ((score_a >= 0)),
    CONSTRAINT livescore_revisions_score_b_check CHECK ((score_b >= 0))
);


ALTER TABLE public.livescore_revisions OWNER TO porprov_admin;

--
-- Name: outbox_events; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.outbox_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject character varying(255) NOT NULL,
    payload jsonb NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.outbox_events OWNER TO porprov_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    dirty boolean NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO porprov_admin;

--
-- Data for Name: livescore_current; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.livescore_current (match_id, revision_id, revision_number, score_a, score_b, status, actor_id, updated_at) FROM stdin;
ef48ca73-820f-4ab9-8188-eaa1261d2991	707969b2-1135-48ac-baa9-877b1f6a3290	14	10	18	Berlangsung	974c4449-21e0-4313-81ff-9fea0533f23b	2026-07-23 02:30:34.050717+00
\.


--
-- Data for Name: livescore_revisions; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.livescore_revisions (id, match_id, revision_number, score_a, score_b, status, correction_of, correction_reason, actor_id, request_id, created_at) FROM stdin;
c266d95f-38d5-490a-bc39-04535f98131c	ef48ca73-820f-4ab9-8188-eaa1261d2991	1	1	0	Berlangsung	\N	\N	974c4449-21e0-4313-81ff-9fea0533f23b	68a36d666a76/mjUTjoOQVK-000817	2026-07-16 08:34:18.207826+00
d213f739-f1ca-46ee-8d41-3dc413b042c0	ef48ca73-820f-4ab9-8188-eaa1261d2991	2	1	0	Berlangsung	\N	\N	974c4449-21e0-4313-81ff-9fea0533f23b	68a36d666a76/mjUTjoOQVK-000836	2026-07-16 08:36:29.887588+00
691f7d57-2849-4f65-a1ae-f97a879e4099	ef48ca73-820f-4ab9-8188-eaa1261d2991	3	3	2	Berlangsung	\N	\N	974c4449-21e0-4313-81ff-9fea0533f23b	68a36d666a76/mjUTjoOQVK-000844	2026-07-16 08:36:58.802872+00
130dbcea-9a54-4900-8037-9a5fda619339	ef48ca73-820f-4ab9-8188-eaa1261d2991	4	5	2	Berlangsung	\N	\N	364494a2-a476-4d9b-ae57-2fb27bf841c8	6ec27a876962/ljGtALE4aT-000093	2026-07-21 03:09:33.770096+00
96394b0b-c4ae-47fe-9bf9-dca9ae919db4	ef48ca73-820f-4ab9-8188-eaa1261d2991	5	5	2	Berlangsung	\N	\N	364494a2-a476-4d9b-ae57-2fb27bf841c8	fba1e395d2fa/8EDFiN8Ihp-000036	2026-07-21 03:30:42.831987+00
694e3ea3-a88c-4304-9eae-e98be122d89e	ef48ca73-820f-4ab9-8188-eaa1261d2991	6	5	4	Berlangsung	\N	\N	364494a2-a476-4d9b-ae57-2fb27bf841c8	fba1e395d2fa/8EDFiN8Ihp-000042	2026-07-21 03:30:52.997647+00
475b2dcb-c134-463e-8c98-23808f59ce18	ef48ca73-820f-4ab9-8188-eaa1261d2991	7	5	0	Berlangsung	\N	\N	364494a2-a476-4d9b-ae57-2fb27bf841c8	660aa1da53da/qusuAET53l-000095	2026-07-21 03:56:17.935858+00
11792cf1-6f7e-4c9d-9dd0-75da3cd3e55f	ef48ca73-820f-4ab9-8188-eaa1261d2991	8	5	6	Berlangsung	\N	\N	364494a2-a476-4d9b-ae57-2fb27bf841c8	660aa1da53da/qusuAET53l-000101	2026-07-21 03:56:31.620246+00
465b6421-8382-4cbd-ad01-f617a63b0a5e	ef48ca73-820f-4ab9-8188-eaa1261d2991	9	5	9	Berlangsung	\N	\N	974c4449-21e0-4313-81ff-9fea0533f23b	15f9c559f95c/BwMgncdo9g-000561	2026-07-22 02:20:47.031807+00
1ba099c5-4501-4e37-ba02-831d62a0fa70	ef48ca73-820f-4ab9-8188-eaa1261d2991	10	5	12	Berlangsung	\N	\N	974c4449-21e0-4313-81ff-9fea0533f23b	8b2dde156634/UxNMgTPTWl-000377	2026-07-22 04:26:48.541143+00
5bcebba3-ada5-446e-85bc-64b25618bbe4	ef48ca73-820f-4ab9-8188-eaa1261d2991	11	5	15	Berlangsung	\N	\N	974c4449-21e0-4313-81ff-9fea0533f23b	8b2dde156634/UxNMgTPTWl-000420	2026-07-22 04:30:17.901436+00
eb2bcc6d-efff-400b-8e1c-360218739ef7	ef48ca73-820f-4ab9-8188-eaa1261d2991	12	8	15	Berlangsung	\N	\N	974c4449-21e0-4313-81ff-9fea0533f23b	8b2dde156634/UxNMgTPTWl-000981	2026-07-22 06:49:04.51326+00
afd5650d-2fa1-43dc-901f-4e23f98be4ac	ef48ca73-820f-4ab9-8188-eaa1261d2991	13	8	18	Berlangsung	\N	\N	974c4449-21e0-4313-81ff-9fea0533f23b	1c2894c14976/m3i4Z5dTlB-000267	2026-07-23 01:44:39.657352+00
707969b2-1135-48ac-baa9-877b1f6a3290	ef48ca73-820f-4ab9-8188-eaa1261d2991	14	10	18	Berlangsung	\N	\N	974c4449-21e0-4313-81ff-9fea0533f23b	1c2894c14976/m3i4Z5dTlB-000530	2026-07-23 02:30:34.050717+00
\.


--
-- Data for Name: outbox_events; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.outbox_events (id, event_id, subject, payload, attempts, next_attempt_at, published_at, last_error, created_at) FROM stdin;
12236e2c-50eb-4861-afd3-dbfad5d37159	d92fcf67-eeb7-44ea-9617-deb16a4923de	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 1, "scoreB": 0, "status": "Berlangsung", "eventId": "d92fcf67-eeb7-44ea-9617-deb16a4923de", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 1, "eventType": "LIVESCORE_UPDATED", "requestId": "68a36d666a76/mjUTjoOQVK-000817", "timestamp": "2026-07-16T08:34:18.207826Z", "revisionId": "c266d95f-38d5-490a-bc39-04535f98131c", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-16 08:34:48.733942+00	2026-07-16 08:34:18.742341+00	\N	2026-07-16 08:34:18.207826+00
2a379d86-9121-4db4-bce6-c6f38bd42add	0f796ef3-5479-495d-bc4d-16aee678ac86	audit.livescore	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "action": "LIVESCORE_UPDATED", "eventId": "d92fcf67-eeb7-44ea-9617-deb16a4923de", "payload": {"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 1, "scoreB": 0, "status": "Berlangsung", "eventId": "d92fcf67-eeb7-44ea-9617-deb16a4923de", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 1, "eventType": "LIVESCORE_UPDATED", "requestId": "68a36d666a76/mjUTjoOQVK-000817", "timestamp": "2026-07-16T08:34:18.207826Z", "revisionId": "c266d95f-38d5-490a-bc39-04535f98131c", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "68a36d666a76/mjUTjoOQVK-000817", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-16 08:34:48.733942+00	2026-07-16 08:34:18.744471+00	\N	2026-07-16 08:34:18.207826+00
632d7894-fd2c-4da5-80fe-5947186b6a5e	2bef1c04-4092-4e9c-8478-a521aa4333cd	audit.livescore	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "action": "LIVESCORE_UPDATED", "eventId": "1cc70ab2-43af-4d0f-9ab4-9fe8f861aeb4", "payload": {"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 1, "scoreB": 0, "status": "Berlangsung", "eventId": "1cc70ab2-43af-4d0f-9ab4-9fe8f861aeb4", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 2, "eventType": "LIVESCORE_UPDATED", "requestId": "68a36d666a76/mjUTjoOQVK-000836", "timestamp": "2026-07-16T08:36:29.887588Z", "revisionId": "d213f739-f1ca-46ee-8d41-3dc413b042c0", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "68a36d666a76/mjUTjoOQVK-000836", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-16 08:37:00.718486+00	2026-07-16 08:36:30.722329+00	\N	2026-07-16 08:36:29.887588+00
f2e28f4d-1f1c-40d0-b217-c2764d73d881	1cc70ab2-43af-4d0f-9ab4-9fe8f861aeb4	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 1, "scoreB": 0, "status": "Berlangsung", "eventId": "1cc70ab2-43af-4d0f-9ab4-9fe8f861aeb4", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 2, "eventType": "LIVESCORE_UPDATED", "requestId": "68a36d666a76/mjUTjoOQVK-000836", "timestamp": "2026-07-16T08:36:29.887588Z", "revisionId": "d213f739-f1ca-46ee-8d41-3dc413b042c0", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-16 08:37:00.718486+00	2026-07-16 08:36:30.726747+00	\N	2026-07-16 08:36:29.887588+00
602d2607-3bf1-44d4-a475-6856f0c8e71f	8b9036c1-cee6-4df7-a56f-c6d0ea43d8ad	audit.livescore	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "action": "LIVESCORE_UPDATED", "eventId": "eb6a63e0-30ae-4c79-b110-df1e9e66e55f", "payload": {"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 3, "scoreB": 2, "status": "Berlangsung", "eventId": "eb6a63e0-30ae-4c79-b110-df1e9e66e55f", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 3, "eventType": "LIVESCORE_UPDATED", "requestId": "68a36d666a76/mjUTjoOQVK-000844", "timestamp": "2026-07-16T08:36:58.802872Z", "revisionId": "691f7d57-2849-4f65-a1ae-f97a879e4099", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "68a36d666a76/mjUTjoOQVK-000844", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-16 08:37:29.715595+00	2026-07-16 08:36:59.718347+00	\N	2026-07-16 08:36:58.802872+00
d8bba3f3-b766-4316-8a2e-1345280226fe	eb6a63e0-30ae-4c79-b110-df1e9e66e55f	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 3, "scoreB": 2, "status": "Berlangsung", "eventId": "eb6a63e0-30ae-4c79-b110-df1e9e66e55f", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 3, "eventType": "LIVESCORE_UPDATED", "requestId": "68a36d666a76/mjUTjoOQVK-000844", "timestamp": "2026-07-16T08:36:58.802872Z", "revisionId": "691f7d57-2849-4f65-a1ae-f97a879e4099", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-16 08:37:29.715595+00	2026-07-16 08:36:59.720299+00	\N	2026-07-16 08:36:58.802872+00
4753c095-5680-4751-9b84-bce593ee3b72	3ad4a13d-a80e-4f64-b11e-cbdc32b4fc0d	audit.livescore	{"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "action": "LIVESCORE_UPDATED", "eventId": "51b43dc3-add7-453e-b111-83c1ca19409c", "payload": {"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "scoreA": 5, "scoreB": 2, "status": "Berlangsung", "eventId": "51b43dc3-add7-453e-b111-83c1ca19409c", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 4, "eventType": "LIVESCORE_UPDATED", "requestId": "6ec27a876962/ljGtALE4aT-000093", "timestamp": "2026-07-21T03:09:33.770096Z", "revisionId": "130dbcea-9a54-4900-8037-9a5fda619339", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "6ec27a876962/ljGtALE4aT-000093", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-21 03:10:04.409258+00	2026-07-21 03:09:34.413462+00	\N	2026-07-21 03:09:33.770096+00
24c1e3b2-628d-4b02-aa93-82f588d50aa5	51b43dc3-add7-453e-b111-83c1ca19409c	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "scoreA": 5, "scoreB": 2, "status": "Berlangsung", "eventId": "51b43dc3-add7-453e-b111-83c1ca19409c", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 4, "eventType": "LIVESCORE_UPDATED", "requestId": "6ec27a876962/ljGtALE4aT-000093", "timestamp": "2026-07-21T03:09:33.770096Z", "revisionId": "130dbcea-9a54-4900-8037-9a5fda619339", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-21 03:10:04.409258+00	2026-07-21 03:09:34.415518+00	\N	2026-07-21 03:09:33.770096+00
0eb57406-d7ba-4ca6-bee4-30c96dde58cf	5a413fc4-06b3-47e1-b41c-6636fd2e3169	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "scoreA": 5, "scoreB": 2, "status": "Berlangsung", "eventId": "5a413fc4-06b3-47e1-b41c-6636fd2e3169", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 5, "eventType": "LIVESCORE_UPDATED", "requestId": "fba1e395d2fa/8EDFiN8Ihp-000036", "timestamp": "2026-07-21T03:30:42.831987Z", "revisionId": "96394b0b-c4ae-47fe-9bf9-dca9ae919db4", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-21 03:31:13.340103+00	2026-07-21 03:30:43.345047+00	\N	2026-07-21 03:30:42.831987+00
cb0dcca8-2347-4089-be44-0d99ab5776b4	2be5328b-31ab-4f64-8f1b-9a1325bb2283	audit.livescore	{"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "action": "LIVESCORE_UPDATED", "eventId": "5a413fc4-06b3-47e1-b41c-6636fd2e3169", "payload": {"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "scoreA": 5, "scoreB": 2, "status": "Berlangsung", "eventId": "5a413fc4-06b3-47e1-b41c-6636fd2e3169", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 5, "eventType": "LIVESCORE_UPDATED", "requestId": "fba1e395d2fa/8EDFiN8Ihp-000036", "timestamp": "2026-07-21T03:30:42.831987Z", "revisionId": "96394b0b-c4ae-47fe-9bf9-dca9ae919db4", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "fba1e395d2fa/8EDFiN8Ihp-000036", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-21 03:31:13.340103+00	2026-07-21 03:30:43.348114+00	\N	2026-07-21 03:30:42.831987+00
58c72a56-4264-418c-9f03-ce813711b2a9	a227747d-a73e-4c2b-9cb9-e4e6866e5175	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "scoreA": 5, "scoreB": 4, "status": "Berlangsung", "eventId": "a227747d-a73e-4c2b-9cb9-e4e6866e5175", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 6, "eventType": "LIVESCORE_UPDATED", "requestId": "fba1e395d2fa/8EDFiN8Ihp-000042", "timestamp": "2026-07-21T03:30:52.997647Z", "revisionId": "694e3ea3-a88c-4304-9eae-e98be122d89e", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-21 03:31:23.339626+00	2026-07-21 03:30:53.34813+00	\N	2026-07-21 03:30:52.997647+00
f7b9076f-484a-4b51-b746-05b5b0bc3c33	0f4db3ef-ef0e-4da1-9bb4-9d09f7dba269	audit.livescore	{"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "action": "LIVESCORE_UPDATED", "eventId": "a227747d-a73e-4c2b-9cb9-e4e6866e5175", "payload": {"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "scoreA": 5, "scoreB": 4, "status": "Berlangsung", "eventId": "a227747d-a73e-4c2b-9cb9-e4e6866e5175", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 6, "eventType": "LIVESCORE_UPDATED", "requestId": "fba1e395d2fa/8EDFiN8Ihp-000042", "timestamp": "2026-07-21T03:30:52.997647Z", "revisionId": "694e3ea3-a88c-4304-9eae-e98be122d89e", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "fba1e395d2fa/8EDFiN8Ihp-000042", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-21 03:31:23.339626+00	2026-07-21 03:30:53.351584+00	\N	2026-07-21 03:30:52.997647+00
e3c04e54-06a4-4a19-8e45-0059ce91b964	89669ad0-9be3-40af-ab5d-d8eacfd446f8	audit.livescore	{"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "action": "LIVESCORE_UPDATED", "eventId": "bc563091-d10a-4bd8-8c40-d1d1954b29de", "payload": {"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "scoreA": 5, "scoreB": 0, "status": "Berlangsung", "eventId": "bc563091-d10a-4bd8-8c40-d1d1954b29de", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 7, "eventType": "LIVESCORE_UPDATED", "requestId": "660aa1da53da/qusuAET53l-000095", "timestamp": "2026-07-21T03:56:17.935858Z", "revisionId": "475b2dcb-c134-463e-8c98-23808f59ce18", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "660aa1da53da/qusuAET53l-000095", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-21 03:56:48.558645+00	2026-07-21 03:56:18.563819+00	\N	2026-07-21 03:56:17.935858+00
3e3fb950-56c5-42f4-a0e3-8ccad3e7b5ee	bc563091-d10a-4bd8-8c40-d1d1954b29de	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "scoreA": 5, "scoreB": 0, "status": "Berlangsung", "eventId": "bc563091-d10a-4bd8-8c40-d1d1954b29de", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 7, "eventType": "LIVESCORE_UPDATED", "requestId": "660aa1da53da/qusuAET53l-000095", "timestamp": "2026-07-21T03:56:17.935858Z", "revisionId": "475b2dcb-c134-463e-8c98-23808f59ce18", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-21 03:56:48.558645+00	2026-07-21 03:56:18.566278+00	\N	2026-07-21 03:56:17.935858+00
562fd538-7169-4586-93a0-c5e6ee46245f	853f5f53-de9f-4da3-a33e-da298ac132c6	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "scoreA": 5, "scoreB": 6, "status": "Berlangsung", "eventId": "853f5f53-de9f-4da3-a33e-da298ac132c6", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 8, "eventType": "LIVESCORE_UPDATED", "requestId": "660aa1da53da/qusuAET53l-000101", "timestamp": "2026-07-21T03:56:31.620246Z", "revisionId": "11792cf1-6f7e-4c9d-9dd0-75da3cd3e55f", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-21 03:57:02.55872+00	2026-07-21 03:56:32.562977+00	\N	2026-07-21 03:56:31.620246+00
7e998ca5-824b-4590-ac14-71d82483d69f	9bb0a707-addc-4ffe-be1d-214e1e2630aa	audit.livescore	{"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "action": "LIVESCORE_UPDATED", "eventId": "853f5f53-de9f-4da3-a33e-da298ac132c6", "payload": {"actor": "364494a2-a476-4d9b-ae57-2fb27bf841c8", "scoreA": 5, "scoreB": 6, "status": "Berlangsung", "eventId": "853f5f53-de9f-4da3-a33e-da298ac132c6", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 8, "eventType": "LIVESCORE_UPDATED", "requestId": "660aa1da53da/qusuAET53l-000101", "timestamp": "2026-07-21T03:56:31.620246Z", "revisionId": "11792cf1-6f7e-4c9d-9dd0-75da3cd3e55f", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "660aa1da53da/qusuAET53l-000101", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-21 03:57:02.55872+00	2026-07-21 03:56:32.568289+00	\N	2026-07-21 03:56:31.620246+00
7fe3847e-f0bf-4d06-818a-07fea4246c23	c8e9eecb-9b94-46ec-9010-1e7d4b2beba2	audit.livescore	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "action": "LIVESCORE_UPDATED", "eventId": "a80d2eea-0411-4ca3-9b35-cb56df41fd43", "payload": {"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 5, "scoreB": 9, "status": "Berlangsung", "eventId": "a80d2eea-0411-4ca3-9b35-cb56df41fd43", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 9, "eventType": "LIVESCORE_UPDATED", "requestId": "15f9c559f95c/BwMgncdo9g-000561", "timestamp": "2026-07-22T02:20:47.031807Z", "revisionId": "465b6421-8382-4cbd-ad01-f617a63b0a5e", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "15f9c559f95c/BwMgncdo9g-000561", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-22 02:21:17.986712+00	2026-07-22 02:20:48.00466+00	\N	2026-07-22 02:20:47.031807+00
19a141a7-00cd-4887-a9d6-72b6be6d89fa	a80d2eea-0411-4ca3-9b35-cb56df41fd43	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 5, "scoreB": 9, "status": "Berlangsung", "eventId": "a80d2eea-0411-4ca3-9b35-cb56df41fd43", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 9, "eventType": "LIVESCORE_UPDATED", "requestId": "15f9c559f95c/BwMgncdo9g-000561", "timestamp": "2026-07-22T02:20:47.031807Z", "revisionId": "465b6421-8382-4cbd-ad01-f617a63b0a5e", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-22 02:21:17.986712+00	2026-07-22 02:20:48.008902+00	\N	2026-07-22 02:20:47.031807+00
9053e951-b626-4cd6-9406-807f92a0344e	2a3af36c-fc7d-4c24-abb2-ed99a6d97132	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 5, "scoreB": 12, "status": "Berlangsung", "eventId": "2a3af36c-fc7d-4c24-abb2-ed99a6d97132", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 10, "eventType": "LIVESCORE_UPDATED", "requestId": "8b2dde156634/UxNMgTPTWl-000377", "timestamp": "2026-07-22T04:26:48.541143Z", "revisionId": "1ba099c5-4501-4e37-ba02-831d62a0fa70", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-22 04:27:19.461901+00	2026-07-22 04:26:49.480321+00	\N	2026-07-22 04:26:48.541143+00
4101ee28-b3dd-4b97-9192-04384e12b9b8	cbb55a0a-de72-46ac-b4de-cd23d2f0ad5c	audit.livescore	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "action": "LIVESCORE_UPDATED", "eventId": "2a3af36c-fc7d-4c24-abb2-ed99a6d97132", "payload": {"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 5, "scoreB": 12, "status": "Berlangsung", "eventId": "2a3af36c-fc7d-4c24-abb2-ed99a6d97132", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 10, "eventType": "LIVESCORE_UPDATED", "requestId": "8b2dde156634/UxNMgTPTWl-000377", "timestamp": "2026-07-22T04:26:48.541143Z", "revisionId": "1ba099c5-4501-4e37-ba02-831d62a0fa70", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "8b2dde156634/UxNMgTPTWl-000377", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-22 04:27:19.461901+00	2026-07-22 04:26:49.484305+00	\N	2026-07-22 04:26:48.541143+00
9cd7d17e-4ebf-47f3-a918-7507b7400e20	8df0efe8-d998-485b-81d9-cf75186ee60c	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 5, "scoreB": 15, "status": "Berlangsung", "eventId": "8df0efe8-d998-485b-81d9-cf75186ee60c", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 11, "eventType": "LIVESCORE_UPDATED", "requestId": "8b2dde156634/UxNMgTPTWl-000420", "timestamp": "2026-07-22T04:30:17.901436Z", "revisionId": "5bcebba3-ada5-446e-85bc-64b25618bbe4", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-22 04:30:48.439972+00	2026-07-22 04:30:18.447844+00	\N	2026-07-22 04:30:17.901436+00
f13a2448-228a-44eb-aec9-00f8b16d25f2	14662db0-accb-4f05-bf16-eaccdea973b4	audit.livescore	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "action": "LIVESCORE_UPDATED", "eventId": "8df0efe8-d998-485b-81d9-cf75186ee60c", "payload": {"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 5, "scoreB": 15, "status": "Berlangsung", "eventId": "8df0efe8-d998-485b-81d9-cf75186ee60c", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 11, "eventType": "LIVESCORE_UPDATED", "requestId": "8b2dde156634/UxNMgTPTWl-000420", "timestamp": "2026-07-22T04:30:17.901436Z", "revisionId": "5bcebba3-ada5-446e-85bc-64b25618bbe4", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "8b2dde156634/UxNMgTPTWl-000420", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-22 04:30:48.439972+00	2026-07-22 04:30:18.445047+00	\N	2026-07-22 04:30:17.901436+00
052f8996-b2dd-4ec1-a01c-60dbde216c0c	fffac74f-8860-42fd-96f3-e0995e8bac88	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 8, "scoreB": 15, "status": "Berlangsung", "eventId": "fffac74f-8860-42fd-96f3-e0995e8bac88", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 12, "eventType": "LIVESCORE_UPDATED", "requestId": "8b2dde156634/UxNMgTPTWl-000981", "timestamp": "2026-07-22T06:49:04.51326Z", "revisionId": "eb2bcc6d-efff-400b-8e1c-360218739ef7", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-22 06:49:34.647465+00	2026-07-22 06:49:04.667629+00	\N	2026-07-22 06:49:04.51326+00
2565b7fb-b03f-4f3b-936a-687cd6c66458	1b8fc860-b0b0-4aa3-99f0-fd996518e8d1	audit.livescore	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "action": "LIVESCORE_UPDATED", "eventId": "fffac74f-8860-42fd-96f3-e0995e8bac88", "payload": {"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 8, "scoreB": 15, "status": "Berlangsung", "eventId": "fffac74f-8860-42fd-96f3-e0995e8bac88", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 12, "eventType": "LIVESCORE_UPDATED", "requestId": "8b2dde156634/UxNMgTPTWl-000981", "timestamp": "2026-07-22T06:49:04.51326Z", "revisionId": "eb2bcc6d-efff-400b-8e1c-360218739ef7", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "8b2dde156634/UxNMgTPTWl-000981", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-22 06:49:34.647465+00	2026-07-22 06:49:04.673728+00	\N	2026-07-22 06:49:04.51326+00
7e1b70f4-d6bc-42e1-a4ad-68b687590c7e	f07e68da-5247-4238-a8ea-41b92f3170c8	audit.livescore	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "action": "LIVESCORE_UPDATED", "eventId": "8c7e3f75-4d9b-48a7-95c7-390277f66045", "payload": {"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 8, "scoreB": 18, "status": "Berlangsung", "eventId": "8c7e3f75-4d9b-48a7-95c7-390277f66045", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 13, "eventType": "LIVESCORE_UPDATED", "requestId": "1c2894c14976/m3i4Z5dTlB-000267", "timestamp": "2026-07-23T01:44:39.657352Z", "revisionId": "afd5650d-2fa1-43dc-901f-4e23f98be4ac", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "1c2894c14976/m3i4Z5dTlB-000267", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-23 01:45:10.067614+00	2026-07-23 01:44:40.094343+00	\N	2026-07-23 01:44:39.657352+00
e8db4de0-b22c-4e25-9ddb-282eb5823acc	8c7e3f75-4d9b-48a7-95c7-390277f66045	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 8, "scoreB": 18, "status": "Berlangsung", "eventId": "8c7e3f75-4d9b-48a7-95c7-390277f66045", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 13, "eventType": "LIVESCORE_UPDATED", "requestId": "1c2894c14976/m3i4Z5dTlB-000267", "timestamp": "2026-07-23T01:44:39.657352Z", "revisionId": "afd5650d-2fa1-43dc-901f-4e23f98be4ac", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-23 01:45:10.067614+00	2026-07-23 01:44:40.099333+00	\N	2026-07-23 01:44:39.657352+00
7604ac78-af7f-441f-9f81-6d7dc94d56dc	284b40d5-131b-4407-bc5d-55123a9e1fc9	livescore.update.ef48ca73-820f-4ab9-8188-eaa1261d2991	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 10, "scoreB": 18, "status": "Berlangsung", "eventId": "284b40d5-131b-4407-bc5d-55123a9e1fc9", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 14, "eventType": "LIVESCORE_UPDATED", "requestId": "1c2894c14976/m3i4Z5dTlB-000530", "timestamp": "2026-07-23T02:30:34.050717Z", "revisionId": "707969b2-1135-48ac-baa9-877b1f6a3290", "eventVersion": "1.0", "isCorrection": false}	0	2026-07-23 02:31:04.362045+00	2026-07-23 02:30:34.370666+00	\N	2026-07-23 02:30:34.050717+00
efc13be6-4de8-4103-9e00-994ee0bfc1ca	39258048-511a-405f-8add-8e41d22f8e7d	audit.livescore	{"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "action": "LIVESCORE_UPDATED", "eventId": "284b40d5-131b-4407-bc5d-55123a9e1fc9", "payload": {"actor": "974c4449-21e0-4313-81ff-9fea0533f23b", "scoreA": 10, "scoreB": 18, "status": "Berlangsung", "eventId": "284b40d5-131b-4407-bc5d-55123a9e1fc9", "matchId": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "sequence": 14, "eventType": "LIVESCORE_UPDATED", "requestId": "1c2894c14976/m3i4Z5dTlB-000530", "timestamp": "2026-07-23T02:30:34.050717Z", "revisionId": "707969b2-1135-48ac-baa9-877b1f6a3290", "eventVersion": "1.0", "isCorrection": false}, "entity_id": "ef48ca73-820f-4ab9-8188-eaa1261d2991", "ipAddress": "172.18.0.1", "requestId": "1c2894c14976/m3i4Z5dTlB-000530", "entity_name": "LiveScore", "eventVersion": "1.0", "service_name": "livescore-service"}	0	2026-07-23 02:31:04.362045+00	2026-07-23 02:30:34.375562+00	\N	2026-07-23 02:30:34.050717+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.schema_migrations (version, dirty) FROM stdin;
1	f
\.


--
-- Name: livescore_current livescore_current_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.livescore_current
    ADD CONSTRAINT livescore_current_pkey PRIMARY KEY (match_id);


--
-- Name: livescore_revisions livescore_revisions_match_id_revision_number_key; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.livescore_revisions
    ADD CONSTRAINT livescore_revisions_match_id_revision_number_key UNIQUE (match_id, revision_number);


--
-- Name: livescore_revisions livescore_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.livescore_revisions
    ADD CONSTRAINT livescore_revisions_pkey PRIMARY KEY (id);


--
-- Name: outbox_events outbox_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_event_id_key UNIQUE (event_id);


--
-- Name: outbox_events outbox_events_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: idx_livescore_outbox_pending; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_livescore_outbox_pending ON public.outbox_events USING btree (next_attempt_at, created_at) WHERE (published_at IS NULL);


--
-- Name: idx_livescore_revisions_match; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_livescore_revisions_match ON public.livescore_revisions USING btree (match_id, revision_number DESC);


--
-- Name: livescore_revisions livescore_revisions_immutable; Type: TRIGGER; Schema: public; Owner: porprov_admin
--

CREATE TRIGGER livescore_revisions_immutable BEFORE DELETE OR UPDATE ON public.livescore_revisions FOR EACH ROW EXECUTE FUNCTION public.prevent_livescore_revision_mutation();


--
-- Name: livescore_current livescore_current_revision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.livescore_current
    ADD CONSTRAINT livescore_current_revision_id_fkey FOREIGN KEY (revision_id) REFERENCES public.livescore_revisions(id);


--
-- Name: livescore_revisions livescore_revisions_correction_of_fkey; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.livescore_revisions
    ADD CONSTRAINT livescore_revisions_correction_of_fkey FOREIGN KEY (correction_of) REFERENCES public.livescore_revisions(id);


--
-- PostgreSQL database dump complete
--

