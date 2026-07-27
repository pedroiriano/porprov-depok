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

ALTER TABLE IF EXISTS ONLY public.nomor_tandings DROP CONSTRAINT IF EXISTS nomor_tandings_cabor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.medal_submission_history DROP CONSTRAINT IF EXISTS medal_submission_history_submission_id_fkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_venue_id_fkey;
ALTER TABLE IF EXISTS ONLY public.match_participants DROP CONSTRAINT IF EXISTS match_participants_match_id_fkey;
ALTER TABLE IF EXISTS ONLY public.identity_provider_config DROP CONSTRAINT IF EXISTS fkdc4897cf864c4e43;
ALTER TABLE IF EXISTS ONLY public.policy_config DROP CONSTRAINT IF EXISTS fkdc34197cf864c4e43;
ALTER TABLE IF EXISTS ONLY public.user_group_membership DROP CONSTRAINT IF EXISTS fk_user_group_user;
ALTER TABLE IF EXISTS ONLY public.user_federation_config DROP CONSTRAINT IF EXISTS fk_t13hpu1j94r2ebpekr39x5eu5;
ALTER TABLE IF EXISTS ONLY public.realm_supported_locales DROP CONSTRAINT IF EXISTS fk_supported_locales_realm;
ALTER TABLE IF EXISTS ONLY public.role_attribute DROP CONSTRAINT IF EXISTS fk_role_attribute_id;
ALTER TABLE IF EXISTS ONLY public.resource_uris DROP CONSTRAINT IF EXISTS fk_resource_server_uris;
ALTER TABLE IF EXISTS ONLY public.required_action_provider DROP CONSTRAINT IF EXISTS fk_req_act_realm;
ALTER TABLE IF EXISTS ONLY public.default_client_scope DROP CONSTRAINT IF EXISTS fk_r_def_cli_scope_realm;
ALTER TABLE IF EXISTS ONLY public.protocol_mapper_config DROP CONSTRAINT IF EXISTS fk_pmconfig;
ALTER TABLE IF EXISTS ONLY public.credential DROP CONSTRAINT IF EXISTS fk_pfyr0glasqyl0dei3kl69r6v0;
ALTER TABLE IF EXISTS ONLY public.protocol_mapper DROP CONSTRAINT IF EXISTS fk_pcm_realm;
ALTER TABLE IF EXISTS ONLY public.scope_mapping DROP CONSTRAINT IF EXISTS fk_ouse064plmlr732lxjcn1q5f1;
ALTER TABLE IF EXISTS ONLY public.web_origins DROP CONSTRAINT IF EXISTS fk_lojpho213xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.idp_mapper_config DROP CONSTRAINT IF EXISTS fk_idpmconfig;
ALTER TABLE IF EXISTS ONLY public.identity_provider_mapper DROP CONSTRAINT IF EXISTS fk_idpm_realm;
ALTER TABLE IF EXISTS ONLY public.realm_events_listeners DROP CONSTRAINT IF EXISTS fk_h846o4h0w8epx5nxev9f5y69j;
ALTER TABLE IF EXISTS ONLY public.realm_enabled_event_types DROP CONSTRAINT IF EXISTS fk_h846o4h0w8epx5nwedrf5y69j;
ALTER TABLE IF EXISTS ONLY public.group_role_mapping DROP CONSTRAINT IF EXISTS fk_group_role_group;
ALTER TABLE IF EXISTS ONLY public.group_attribute DROP CONSTRAINT IF EXISTS fk_group_attribute_group;
ALTER TABLE IF EXISTS ONLY public.user_consent DROP CONSTRAINT IF EXISTS fk_grntcsnt_user;
ALTER TABLE IF EXISTS ONLY public.user_consent_client_scope DROP CONSTRAINT IF EXISTS fk_grntcsnt_clsc_usc;
ALTER TABLE IF EXISTS ONLY public.composite_role DROP CONSTRAINT IF EXISTS fk_gr7thllb9lu8q4vqa4524jjy8;
ALTER TABLE IF EXISTS ONLY public.resource_server_scope DROP CONSTRAINT IF EXISTS fk_frsrso213xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.resource_scope DROP CONSTRAINT IF EXISTS fk_frsrps213xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.resource_policy DROP CONSTRAINT IF EXISTS fk_frsrpp213xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.resource_policy DROP CONSTRAINT IF EXISTS fk_frsrpos53xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.resource_scope DROP CONSTRAINT IF EXISTS fk_frsrpos13xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.resource_server_policy DROP CONSTRAINT IF EXISTS fk_frsrpo213xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.resource_server_perm_ticket DROP CONSTRAINT IF EXISTS fk_frsrpo2128cx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.scope_policy DROP CONSTRAINT IF EXISTS fk_frsrpass3xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.associated_policy DROP CONSTRAINT IF EXISTS fk_frsrpas14xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.resource_server_perm_ticket DROP CONSTRAINT IF EXISTS fk_frsrho213xcx4wnkog84sspmt;
ALTER TABLE IF EXISTS ONLY public.resource_server_perm_ticket DROP CONSTRAINT IF EXISTS fk_frsrho213xcx4wnkog83sspmt;
ALTER TABLE IF EXISTS ONLY public.resource_server_resource DROP CONSTRAINT IF EXISTS fk_frsrho213xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.resource_server_perm_ticket DROP CONSTRAINT IF EXISTS fk_frsrho213xcx4wnkog82sspmt;
ALTER TABLE IF EXISTS ONLY public.scope_policy DROP CONSTRAINT IF EXISTS fk_frsrasp13xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.associated_policy DROP CONSTRAINT IF EXISTS fk_frsr5s213xcx4wnkog82ssrfy;
ALTER TABLE IF EXISTS ONLY public.user_federation_mapper DROP CONSTRAINT IF EXISTS fk_fedmapperpm_realm;
ALTER TABLE IF EXISTS ONLY public.user_federation_mapper DROP CONSTRAINT IF EXISTS fk_fedmapperpm_fedprv;
ALTER TABLE IF EXISTS ONLY public.user_federation_mapper_config DROP CONSTRAINT IF EXISTS fk_fedmapper_cfg;
ALTER TABLE IF EXISTS ONLY public.realm_default_groups DROP CONSTRAINT IF EXISTS fk_def_groups_realm;
ALTER TABLE IF EXISTS ONLY public.component DROP CONSTRAINT IF EXISTS fk_component_realm;
ALTER TABLE IF EXISTS ONLY public.component_config DROP CONSTRAINT IF EXISTS fk_component_config;
ALTER TABLE IF EXISTS ONLY public.client_initial_access DROP CONSTRAINT IF EXISTS fk_client_init_acc_realm;
ALTER TABLE IF EXISTS ONLY public.protocol_mapper DROP CONSTRAINT IF EXISTS fk_cli_scope_mapper;
ALTER TABLE IF EXISTS ONLY public.client_user_session_note DROP CONSTRAINT IF EXISTS fk_cl_usr_ses_note;
ALTER TABLE IF EXISTS ONLY public.client_scope_role_mapping DROP CONSTRAINT IF EXISTS fk_cl_scope_rm_scope;
ALTER TABLE IF EXISTS ONLY public.client_scope_attributes DROP CONSTRAINT IF EXISTS fk_cl_scope_attr_scope;
ALTER TABLE IF EXISTS ONLY public.user_role_mapping DROP CONSTRAINT IF EXISTS fk_c4fqv34p1mbylloxang7b1q3l;
ALTER TABLE IF EXISTS ONLY public.client_session DROP CONSTRAINT IF EXISTS fk_b4ao2vcvat6ukau74wbwtfqo1;
ALTER TABLE IF EXISTS ONLY public.authenticator_config DROP CONSTRAINT IF EXISTS fk_auth_realm;
ALTER TABLE IF EXISTS ONLY public.authentication_flow DROP CONSTRAINT IF EXISTS fk_auth_flow_realm;
ALTER TABLE IF EXISTS ONLY public.authentication_execution DROP CONSTRAINT IF EXISTS fk_auth_exec_realm;
ALTER TABLE IF EXISTS ONLY public.authentication_execution DROP CONSTRAINT IF EXISTS fk_auth_exec_flow;
ALTER TABLE IF EXISTS ONLY public.composite_role DROP CONSTRAINT IF EXISTS fk_a63wvekftu8jo1pnj81e7mce2;
ALTER TABLE IF EXISTS ONLY public.realm_attribute DROP CONSTRAINT IF EXISTS fk_8shxd6l3e9atqukacxgpffptw;
ALTER TABLE IF EXISTS ONLY public.realm_smtp_config DROP CONSTRAINT IF EXISTS fk_70ej8xdxgxd0b9hh6180irr0o;
ALTER TABLE IF EXISTS ONLY public.keycloak_role DROP CONSTRAINT IF EXISTS fk_6vyqfe4cn4wlq8r6kt5vdsj5c;
ALTER TABLE IF EXISTS ONLY public.user_required_action DROP CONSTRAINT IF EXISTS fk_6qj3w1jw9cvafhe19bwsiuvmd;
ALTER TABLE IF EXISTS ONLY public.user_attribute DROP CONSTRAINT IF EXISTS fk_5hrm2vlf9ql5fu043kqepovbr;
ALTER TABLE IF EXISTS ONLY public.resource_attribute DROP CONSTRAINT IF EXISTS fk_5hrm2vlf9ql5fu022kqepovbr;
ALTER TABLE IF EXISTS ONLY public.realm_required_credential DROP CONSTRAINT IF EXISTS fk_5hg65lybevavkqfki3kponh9v;
ALTER TABLE IF EXISTS ONLY public.client_session_prot_mapper DROP CONSTRAINT IF EXISTS fk_33a8sgqw18i532811v7o2dk89;
ALTER TABLE IF EXISTS ONLY public.user_federation_provider DROP CONSTRAINT IF EXISTS fk_1fj32f6ptolw2qy60cd8n01e8;
ALTER TABLE IF EXISTS ONLY public.redirect_uris DROP CONSTRAINT IF EXISTS fk_1burs8pb4ouj97h5wuppahv9f;
ALTER TABLE IF EXISTS ONLY public.client_session_role DROP CONSTRAINT IF EXISTS fk_11b7sgqw18i532811v7o2dv76;
ALTER TABLE IF EXISTS ONLY public.user_session_note DROP CONSTRAINT IF EXISTS fk5edfb00ff51d3472;
ALTER TABLE IF EXISTS ONLY public.client_session_note DROP CONSTRAINT IF EXISTS fk5edfb00ff51c2736;
ALTER TABLE IF EXISTS ONLY public.client_node_registrations DROP CONSTRAINT IF EXISTS fk4129723ba992f594;
ALTER TABLE IF EXISTS ONLY public.federated_identity DROP CONSTRAINT IF EXISTS fk404288b92ef007a6;
ALTER TABLE IF EXISTS ONLY public.client_attributes DROP CONSTRAINT IF EXISTS fk3c47c64beacca966;
ALTER TABLE IF EXISTS ONLY public.identity_provider DROP CONSTRAINT IF EXISTS fk2b4ebc52ae5c3b34;
ALTER TABLE IF EXISTS ONLY public.client_session_auth_status DROP CONSTRAINT IF EXISTS auth_status_constraint;
DROP TRIGGER IF EXISTS medal_submission_history_immutable ON public.medal_submission_history;
DROP INDEX IF EXISTS public.user_attr_long_values_lower_case;
DROP INDEX IF EXISTS public.user_attr_long_values;
DROP INDEX IF EXISTS public.idx_web_orig_client;
DROP INDEX IF EXISTS public.idx_usr_fed_prv_realm;
DROP INDEX IF EXISTS public.idx_usr_fed_map_realm;
DROP INDEX IF EXISTS public.idx_usr_fed_map_fed_prv;
DROP INDEX IF EXISTS public.idx_user_service_account;
DROP INDEX IF EXISTS public.idx_user_role_mapping;
DROP INDEX IF EXISTS public.idx_user_reqactions;
DROP INDEX IF EXISTS public.idx_user_group_mapping;
DROP INDEX IF EXISTS public.idx_user_email;
DROP INDEX IF EXISTS public.idx_user_credential;
DROP INDEX IF EXISTS public.idx_user_consent;
DROP INDEX IF EXISTS public.idx_user_attribute_name;
DROP INDEX IF EXISTS public.idx_user_attribute;
DROP INDEX IF EXISTS public.idx_usconsent_clscope;
DROP INDEX IF EXISTS public.idx_us_sess_id_on_cl_sess;
DROP INDEX IF EXISTS public.idx_update_time;
DROP INDEX IF EXISTS public.idx_scope_policy_policy;
DROP INDEX IF EXISTS public.idx_scope_mapping_role;
DROP INDEX IF EXISTS public.idx_role_clscope;
DROP INDEX IF EXISTS public.idx_role_attribute;
DROP INDEX IF EXISTS public.idx_res_srv_scope_res_srv;
DROP INDEX IF EXISTS public.idx_res_srv_res_res_srv;
DROP INDEX IF EXISTS public.idx_res_serv_pol_res_serv;
DROP INDEX IF EXISTS public.idx_res_scope_scope;
DROP INDEX IF EXISTS public.idx_res_policy_policy;
DROP INDEX IF EXISTS public.idx_req_act_prov_realm;
DROP INDEX IF EXISTS public.idx_redir_uri_client;
DROP INDEX IF EXISTS public.idx_realm_supp_local_realm;
DROP INDEX IF EXISTS public.idx_realm_master_adm_cli;
DROP INDEX IF EXISTS public.idx_realm_evt_types_realm;
DROP INDEX IF EXISTS public.idx_realm_evt_list_realm;
DROP INDEX IF EXISTS public.idx_realm_def_grp_realm;
DROP INDEX IF EXISTS public.idx_realm_clscope;
DROP INDEX IF EXISTS public.idx_realm_attr_realm;
DROP INDEX IF EXISTS public.idx_protocol_mapper_client;
DROP INDEX IF EXISTS public.idx_offline_uss_preload;
DROP INDEX IF EXISTS public.idx_offline_uss_createdon;
DROP INDEX IF EXISTS public.idx_offline_uss_by_usersess;
DROP INDEX IF EXISTS public.idx_offline_uss_by_user;
DROP INDEX IF EXISTS public.idx_offline_css_preload;
DROP INDEX IF EXISTS public.idx_nomor_tandings_cabor_id;
DROP INDEX IF EXISTS public.idx_medal_submissions_status;
DROP INDEX IF EXISTS public.idx_medal_outbox_pending;
DROP INDEX IF EXISTS public.idx_medal_history_submission;
DROP INDEX IF EXISTS public.idx_matches_venue_id;
DROP INDEX IF EXISTS public.idx_match_participants_match_id;
DROP INDEX IF EXISTS public.idx_keycloak_role_realm;
DROP INDEX IF EXISTS public.idx_keycloak_role_client;
DROP INDEX IF EXISTS public.idx_ident_prov_realm;
DROP INDEX IF EXISTS public.idx_id_prov_mapp_realm;
DROP INDEX IF EXISTS public.idx_group_role_mapp_group;
DROP INDEX IF EXISTS public.idx_group_attr_group;
DROP INDEX IF EXISTS public.idx_group_att_by_name_value;
DROP INDEX IF EXISTS public.idx_fu_role_mapping_ru;
DROP INDEX IF EXISTS public.idx_fu_role_mapping;
DROP INDEX IF EXISTS public.idx_fu_required_action_ru;
DROP INDEX IF EXISTS public.idx_fu_required_action;
DROP INDEX IF EXISTS public.idx_fu_group_membership_ru;
DROP INDEX IF EXISTS public.idx_fu_group_membership;
DROP INDEX IF EXISTS public.idx_fu_credential_ru;
DROP INDEX IF EXISTS public.idx_fu_credential;
DROP INDEX IF EXISTS public.idx_fu_consent_ru;
DROP INDEX IF EXISTS public.idx_fu_consent;
DROP INDEX IF EXISTS public.idx_fu_cnsnt_ext;
DROP INDEX IF EXISTS public.idx_fu_attribute;
DROP INDEX IF EXISTS public.idx_fedidentity_user;
DROP INDEX IF EXISTS public.idx_fedidentity_feduser;
DROP INDEX IF EXISTS public.idx_event_time;
DROP INDEX IF EXISTS public.idx_defcls_scope;
DROP INDEX IF EXISTS public.idx_defcls_realm;
DROP INDEX IF EXISTS public.idx_composite_child;
DROP INDEX IF EXISTS public.idx_composite;
DROP INDEX IF EXISTS public.idx_component_realm;
DROP INDEX IF EXISTS public.idx_component_provider_type;
DROP INDEX IF EXISTS public.idx_compo_config_compo;
DROP INDEX IF EXISTS public.idx_clscope_role;
DROP INDEX IF EXISTS public.idx_clscope_protmap;
DROP INDEX IF EXISTS public.idx_clscope_cl;
DROP INDEX IF EXISTS public.idx_clscope_attrs;
DROP INDEX IF EXISTS public.idx_client_session_session;
DROP INDEX IF EXISTS public.idx_client_init_acc_realm;
DROP INDEX IF EXISTS public.idx_client_id;
DROP INDEX IF EXISTS public.idx_client_att_by_name_value;
DROP INDEX IF EXISTS public.idx_cl_clscope;
DROP INDEX IF EXISTS public.idx_auth_flow_realm;
DROP INDEX IF EXISTS public.idx_auth_exec_realm_flow;
DROP INDEX IF EXISTS public.idx_auth_exec_flow;
DROP INDEX IF EXISTS public.idx_auth_config_realm;
DROP INDEX IF EXISTS public.idx_assoc_pol_assoc_pol_id;
DROP INDEX IF EXISTS public.idx_admin_event_time;
DROP INDEX IF EXISTS public.fed_user_attr_long_values_lower_case;
DROP INDEX IF EXISTS public.fed_user_attr_long_values;
ALTER TABLE IF EXISTS ONLY public.venues DROP CONSTRAINT IF EXISTS venues_pkey;
ALTER TABLE IF EXISTS ONLY public.user_entity DROP CONSTRAINT IF EXISTS uk_ru8tt6t700s9v50bu18ws5ha6;
ALTER TABLE IF EXISTS ONLY public.realm DROP CONSTRAINT IF EXISTS uk_orvsdmla56612eaefiq6wl5oi;
ALTER TABLE IF EXISTS ONLY public.user_consent DROP CONSTRAINT IF EXISTS uk_jkuwuvd56ontgsuhogm8uewrt;
ALTER TABLE IF EXISTS ONLY public.resource_server_scope DROP CONSTRAINT IF EXISTS uk_frsrst700s9v50bu18ws5ha6;
ALTER TABLE IF EXISTS ONLY public.resource_server_policy DROP CONSTRAINT IF EXISTS uk_frsrpt700s9v50bu18ws5ha6;
ALTER TABLE IF EXISTS ONLY public.resource_server_perm_ticket DROP CONSTRAINT IF EXISTS uk_frsr6t700s9v50bu18ws5pmt;
ALTER TABLE IF EXISTS ONLY public.resource_server_resource DROP CONSTRAINT IF EXISTS uk_frsr6t700s9v50bu18ws5ha6;
ALTER TABLE IF EXISTS ONLY public.user_entity DROP CONSTRAINT IF EXISTS uk_dykn684sl8up1crfei6eckhd7;
ALTER TABLE IF EXISTS ONLY public.client_scope DROP CONSTRAINT IF EXISTS uk_cli_scope;
ALTER TABLE IF EXISTS ONLY public.client DROP CONSTRAINT IF EXISTS uk_b71cjlbenv945rb6gcon438at;
ALTER TABLE IF EXISTS ONLY public.identity_provider DROP CONSTRAINT IF EXISTS uk_2daelwnibji49avxsrtuf6xj33;
ALTER TABLE IF EXISTS ONLY public.keycloak_group DROP CONSTRAINT IF EXISTS sibling_names;
ALTER TABLE IF EXISTS ONLY public.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.resource_attribute DROP CONSTRAINT IF EXISTS res_attr_pk;
ALTER TABLE IF EXISTS ONLY public.realm_localizations DROP CONSTRAINT IF EXISTS realm_localizations_pkey;
ALTER TABLE IF EXISTS ONLY public.default_client_scope DROP CONSTRAINT IF EXISTS r_def_cli_scope_bind;
ALTER TABLE IF EXISTS ONLY public.client_scope_role_mapping DROP CONSTRAINT IF EXISTS pk_template_scope;
ALTER TABLE IF EXISTS ONLY public.resource_server DROP CONSTRAINT IF EXISTS pk_resource_server;
ALTER TABLE IF EXISTS ONLY public.client_scope DROP CONSTRAINT IF EXISTS pk_cli_template;
ALTER TABLE IF EXISTS ONLY public.client_scope_attributes DROP CONSTRAINT IF EXISTS pk_cl_tmpl_attr;
ALTER TABLE IF EXISTS ONLY public.outbox_events DROP CONSTRAINT IF EXISTS outbox_events_pkey;
ALTER TABLE IF EXISTS ONLY public.outbox_events DROP CONSTRAINT IF EXISTS outbox_events_event_id_key;
ALTER TABLE IF EXISTS ONLY public.nomor_tandings DROP CONSTRAINT IF EXISTS nomor_tandings_pkey;
ALTER TABLE IF EXISTS ONLY public.media_assets DROP CONSTRAINT IF EXISTS media_assets_pkey;
ALTER TABLE IF EXISTS ONLY public.medals DROP CONSTRAINT IF EXISTS medals_pkey;
ALTER TABLE IF EXISTS ONLY public.medals DROP CONSTRAINT IF EXISTS medals_kontingen_id_key;
ALTER TABLE IF EXISTS ONLY public.medal_submissions DROP CONSTRAINT IF EXISTS medal_submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.medal_submission_history DROP CONSTRAINT IF EXISTS medal_submission_history_pkey;
ALTER TABLE IF EXISTS ONLY public.matches DROP CONSTRAINT IF EXISTS matches_pkey;
ALTER TABLE IF EXISTS ONLY public.match_participants DROP CONSTRAINT IF EXISTS match_participants_pkey;
ALTER TABLE IF EXISTS ONLY public.kontingens DROP CONSTRAINT IF EXISTS kontingens_pkey;
ALTER TABLE IF EXISTS ONLY public.kontingens DROP CONSTRAINT IF EXISTS kontingens_name_key;
ALTER TABLE IF EXISTS ONLY public.databasechangeloglock DROP CONSTRAINT IF EXISTS databasechangeloglock_pkey;
ALTER TABLE IF EXISTS ONLY public.web_origins DROP CONSTRAINT IF EXISTS constraint_web_origins;
ALTER TABLE IF EXISTS ONLY public.user_session_note DROP CONSTRAINT IF EXISTS constraint_usn_pk;
ALTER TABLE IF EXISTS ONLY public.user_group_membership DROP CONSTRAINT IF EXISTS constraint_user_group;
ALTER TABLE IF EXISTS ONLY public.user_attribute DROP CONSTRAINT IF EXISTS constraint_user_attribute_pk;
ALTER TABLE IF EXISTS ONLY public.role_attribute DROP CONSTRAINT IF EXISTS constraint_role_attribute_pk;
ALTER TABLE IF EXISTS ONLY public.resource_uris DROP CONSTRAINT IF EXISTS constraint_resour_uris_pk;
ALTER TABLE IF EXISTS ONLY public.user_required_action DROP CONSTRAINT IF EXISTS constraint_required_action;
ALTER TABLE IF EXISTS ONLY public.required_action_provider DROP CONSTRAINT IF EXISTS constraint_req_act_prv_pk;
ALTER TABLE IF EXISTS ONLY public.required_action_config DROP CONSTRAINT IF EXISTS constraint_req_act_cfg_pk;
ALTER TABLE IF EXISTS ONLY public.redirect_uris DROP CONSTRAINT IF EXISTS constraint_redirect_uris;
ALTER TABLE IF EXISTS ONLY public.protocol_mapper_config DROP CONSTRAINT IF EXISTS constraint_pmconfig;
ALTER TABLE IF EXISTS ONLY public.protocol_mapper DROP CONSTRAINT IF EXISTS constraint_pcm;
ALTER TABLE IF EXISTS ONLY public.offline_user_session DROP CONSTRAINT IF EXISTS constraint_offl_us_ses_pk2;
ALTER TABLE IF EXISTS ONLY public.offline_client_session DROP CONSTRAINT IF EXISTS constraint_offl_cl_ses_pk3;
ALTER TABLE IF EXISTS ONLY public.migration_model DROP CONSTRAINT IF EXISTS constraint_migmod;
ALTER TABLE IF EXISTS ONLY public.idp_mapper_config DROP CONSTRAINT IF EXISTS constraint_idpmconfig;
ALTER TABLE IF EXISTS ONLY public.identity_provider_mapper DROP CONSTRAINT IF EXISTS constraint_idpm;
ALTER TABLE IF EXISTS ONLY public.group_role_mapping DROP CONSTRAINT IF EXISTS constraint_group_role;
ALTER TABLE IF EXISTS ONLY public.group_attribute DROP CONSTRAINT IF EXISTS constraint_group_attribute_pk;
ALTER TABLE IF EXISTS ONLY public.keycloak_group DROP CONSTRAINT IF EXISTS constraint_group;
ALTER TABLE IF EXISTS ONLY public.user_consent DROP CONSTRAINT IF EXISTS constraint_grntcsnt_pm;
ALTER TABLE IF EXISTS ONLY public.user_consent_client_scope DROP CONSTRAINT IF EXISTS constraint_grntcsnt_clsc_pm;
ALTER TABLE IF EXISTS ONLY public.fed_user_consent_cl_scope DROP CONSTRAINT IF EXISTS constraint_fgrntcsnt_clsc_pm;
ALTER TABLE IF EXISTS ONLY public.user_federation_mapper DROP CONSTRAINT IF EXISTS constraint_fedmapperpm;
ALTER TABLE IF EXISTS ONLY public.user_federation_mapper_config DROP CONSTRAINT IF EXISTS constraint_fedmapper_cfg_pm;
ALTER TABLE IF EXISTS ONLY public.user_entity DROP CONSTRAINT IF EXISTS constraint_fb;
ALTER TABLE IF EXISTS ONLY public.scope_policy DROP CONSTRAINT IF EXISTS constraint_farsrsps;
ALTER TABLE IF EXISTS ONLY public.resource_scope DROP CONSTRAINT IF EXISTS constraint_farsrsp;
ALTER TABLE IF EXISTS ONLY public.resource_server_scope DROP CONSTRAINT IF EXISTS constraint_farsrs;
ALTER TABLE IF EXISTS ONLY public.resource_policy DROP CONSTRAINT IF EXISTS constraint_farsrpp;
ALTER TABLE IF EXISTS ONLY public.associated_policy DROP CONSTRAINT IF EXISTS constraint_farsrpap;
ALTER TABLE IF EXISTS ONLY public.resource_server_policy DROP CONSTRAINT IF EXISTS constraint_farsrp;
ALTER TABLE IF EXISTS ONLY public.resource_server_resource DROP CONSTRAINT IF EXISTS constraint_farsr;
ALTER TABLE IF EXISTS ONLY public.resource_server_perm_ticket DROP CONSTRAINT IF EXISTS constraint_fapmt;
ALTER TABLE IF EXISTS ONLY public.user_federation_config DROP CONSTRAINT IF EXISTS constraint_f9;
ALTER TABLE IF EXISTS ONLY public.credential DROP CONSTRAINT IF EXISTS constraint_f;
ALTER TABLE IF EXISTS ONLY public.realm_smtp_config DROP CONSTRAINT IF EXISTS constraint_e;
ALTER TABLE IF EXISTS ONLY public.policy_config DROP CONSTRAINT IF EXISTS constraint_dpc;
ALTER TABLE IF EXISTS ONLY public.identity_provider_config DROP CONSTRAINT IF EXISTS constraint_d;
ALTER TABLE IF EXISTS ONLY public.client_session_prot_mapper DROP CONSTRAINT IF EXISTS constraint_cs_pmp_pk;
ALTER TABLE IF EXISTS ONLY public.composite_role DROP CONSTRAINT IF EXISTS constraint_composite_role;
ALTER TABLE IF EXISTS ONLY public.user_role_mapping DROP CONSTRAINT IF EXISTS constraint_c;
ALTER TABLE IF EXISTS ONLY public.client_session_auth_status DROP CONSTRAINT IF EXISTS constraint_auth_status_pk;
ALTER TABLE IF EXISTS ONLY public.authenticator_config DROP CONSTRAINT IF EXISTS constraint_auth_pk;
ALTER TABLE IF EXISTS ONLY public.authentication_flow DROP CONSTRAINT IF EXISTS constraint_auth_flow_pk;
ALTER TABLE IF EXISTS ONLY public.authentication_execution DROP CONSTRAINT IF EXISTS constraint_auth_exec_pk;
ALTER TABLE IF EXISTS ONLY public.authenticator_config_entry DROP CONSTRAINT IF EXISTS constraint_auth_cfg_pk;
ALTER TABLE IF EXISTS ONLY public.admin_event_entity DROP CONSTRAINT IF EXISTS constraint_admin_event_entity;
ALTER TABLE IF EXISTS ONLY public.keycloak_role DROP CONSTRAINT IF EXISTS constraint_a;
ALTER TABLE IF EXISTS ONLY public.realm_required_credential DROP CONSTRAINT IF EXISTS constraint_92;
ALTER TABLE IF EXISTS ONLY public.realm_attribute DROP CONSTRAINT IF EXISTS constraint_9;
ALTER TABLE IF EXISTS ONLY public.client_node_registrations DROP CONSTRAINT IF EXISTS constraint_84;
ALTER TABLE IF EXISTS ONLY public.scope_mapping DROP CONSTRAINT IF EXISTS constraint_81;
ALTER TABLE IF EXISTS ONLY public.client_session DROP CONSTRAINT IF EXISTS constraint_8;
ALTER TABLE IF EXISTS ONLY public.client DROP CONSTRAINT IF EXISTS constraint_7;
ALTER TABLE IF EXISTS ONLY public.client_session_note DROP CONSTRAINT IF EXISTS constraint_5e;
ALTER TABLE IF EXISTS ONLY public.user_federation_provider DROP CONSTRAINT IF EXISTS constraint_5c;
ALTER TABLE IF EXISTS ONLY public.user_session DROP CONSTRAINT IF EXISTS constraint_57;
ALTER TABLE IF EXISTS ONLY public.client_session_role DROP CONSTRAINT IF EXISTS constraint_5;
ALTER TABLE IF EXISTS ONLY public.realm DROP CONSTRAINT IF EXISTS constraint_4a;
ALTER TABLE IF EXISTS ONLY public.federated_identity DROP CONSTRAINT IF EXISTS constraint_40;
ALTER TABLE IF EXISTS ONLY public.event_entity DROP CONSTRAINT IF EXISTS constraint_4;
ALTER TABLE IF EXISTS ONLY public.client_attributes DROP CONSTRAINT IF EXISTS constraint_3c;
ALTER TABLE IF EXISTS ONLY public.identity_provider DROP CONSTRAINT IF EXISTS constraint_2b;
ALTER TABLE IF EXISTS ONLY public.realm_supported_locales DROP CONSTRAINT IF EXISTS constr_realm_supported_locales;
ALTER TABLE IF EXISTS ONLY public.realm_events_listeners DROP CONSTRAINT IF EXISTS constr_realm_events_listeners;
ALTER TABLE IF EXISTS ONLY public.realm_enabled_event_types DROP CONSTRAINT IF EXISTS constr_realm_enabl_event_types;
ALTER TABLE IF EXISTS ONLY public.realm_default_groups DROP CONSTRAINT IF EXISTS constr_realm_default_groups;
ALTER TABLE IF EXISTS ONLY public.federated_user DROP CONSTRAINT IF EXISTS constr_federated_user;
ALTER TABLE IF EXISTS ONLY public.fed_user_role_mapping DROP CONSTRAINT IF EXISTS constr_fed_user_role;
ALTER TABLE IF EXISTS ONLY public.fed_user_group_membership DROP CONSTRAINT IF EXISTS constr_fed_user_group;
ALTER TABLE IF EXISTS ONLY public.fed_user_credential DROP CONSTRAINT IF EXISTS constr_fed_user_cred_pk;
ALTER TABLE IF EXISTS ONLY public.fed_user_consent DROP CONSTRAINT IF EXISTS constr_fed_user_consent_pk;
ALTER TABLE IF EXISTS ONLY public.fed_user_attribute DROP CONSTRAINT IF EXISTS constr_fed_user_attr_pk;
ALTER TABLE IF EXISTS ONLY public.fed_user_required_action DROP CONSTRAINT IF EXISTS constr_fed_required_action;
ALTER TABLE IF EXISTS ONLY public.component DROP CONSTRAINT IF EXISTS constr_component_pk;
ALTER TABLE IF EXISTS ONLY public.component_config DROP CONSTRAINT IF EXISTS constr_component_config_pk;
ALTER TABLE IF EXISTS ONLY public.client_user_session_note DROP CONSTRAINT IF EXISTS constr_cl_usr_ses_note;
ALTER TABLE IF EXISTS ONLY public.broker_link DROP CONSTRAINT IF EXISTS constr_broker_link_pk;
ALTER TABLE IF EXISTS ONLY public.realm_default_groups DROP CONSTRAINT IF EXISTS con_group_id_def_groups;
ALTER TABLE IF EXISTS ONLY public.client_initial_access DROP CONSTRAINT IF EXISTS cnstr_client_init_acc_pk;
ALTER TABLE IF EXISTS ONLY public.city_guides DROP CONSTRAINT IF EXISTS city_guides_pkey;
ALTER TABLE IF EXISTS ONLY public.cabors DROP CONSTRAINT IF EXISTS cabors_pkey;
ALTER TABLE IF EXISTS ONLY public.cabors DROP CONSTRAINT IF EXISTS cabors_name_key;
ALTER TABLE IF EXISTS ONLY public.client_scope_client DROP CONSTRAINT IF EXISTS c_cli_scope_bind;
ALTER TABLE IF EXISTS ONLY public.client_auth_flow_bindings DROP CONSTRAINT IF EXISTS c_cli_flow_bind;
ALTER TABLE IF EXISTS ONLY public.keycloak_role DROP CONSTRAINT IF EXISTS "UK_J3RWUVD56ONTGSUHOGM184WW2-2";
ALTER TABLE IF EXISTS ONLY public.username_login_failure DROP CONSTRAINT IF EXISTS "CONSTRAINT_17-2";
DROP TABLE IF EXISTS public.web_origins;
DROP TABLE IF EXISTS public.venues;
DROP TABLE IF EXISTS public.username_login_failure;
DROP TABLE IF EXISTS public.user_session_note;
DROP TABLE IF EXISTS public.user_session;
DROP TABLE IF EXISTS public.user_role_mapping;
DROP TABLE IF EXISTS public.user_required_action;
DROP TABLE IF EXISTS public.user_group_membership;
DROP TABLE IF EXISTS public.user_federation_provider;
DROP TABLE IF EXISTS public.user_federation_mapper_config;
DROP TABLE IF EXISTS public.user_federation_mapper;
DROP TABLE IF EXISTS public.user_federation_config;
DROP TABLE IF EXISTS public.user_entity;
DROP TABLE IF EXISTS public.user_consent_client_scope;
DROP TABLE IF EXISTS public.user_consent;
DROP TABLE IF EXISTS public.user_attribute;
DROP TABLE IF EXISTS public.scope_policy;
DROP TABLE IF EXISTS public.scope_mapping;
DROP TABLE IF EXISTS public.schema_migrations;
DROP TABLE IF EXISTS public.role_attribute;
DROP TABLE IF EXISTS public.resource_uris;
DROP TABLE IF EXISTS public.resource_server_scope;
DROP TABLE IF EXISTS public.resource_server_resource;
DROP TABLE IF EXISTS public.resource_server_policy;
DROP TABLE IF EXISTS public.resource_server_perm_ticket;
DROP TABLE IF EXISTS public.resource_server;
DROP TABLE IF EXISTS public.resource_scope;
DROP TABLE IF EXISTS public.resource_policy;
DROP TABLE IF EXISTS public.resource_attribute;
DROP TABLE IF EXISTS public.required_action_provider;
DROP TABLE IF EXISTS public.required_action_config;
DROP TABLE IF EXISTS public.redirect_uris;
DROP TABLE IF EXISTS public.realm_supported_locales;
DROP TABLE IF EXISTS public.realm_smtp_config;
DROP TABLE IF EXISTS public.realm_required_credential;
DROP TABLE IF EXISTS public.realm_localizations;
DROP TABLE IF EXISTS public.realm_events_listeners;
DROP TABLE IF EXISTS public.realm_enabled_event_types;
DROP TABLE IF EXISTS public.realm_default_groups;
DROP TABLE IF EXISTS public.realm_attribute;
DROP TABLE IF EXISTS public.realm;
DROP TABLE IF EXISTS public.protocol_mapper_config;
DROP TABLE IF EXISTS public.protocol_mapper;
DROP TABLE IF EXISTS public.policy_config;
DROP TABLE IF EXISTS public.outbox_events;
DROP TABLE IF EXISTS public.offline_user_session;
DROP TABLE IF EXISTS public.offline_client_session;
DROP TABLE IF EXISTS public.nomor_tandings;
DROP TABLE IF EXISTS public.migration_model;
DROP TABLE IF EXISTS public.media_assets;
DROP TABLE IF EXISTS public.medals;
DROP TABLE IF EXISTS public.medal_submissions;
DROP TABLE IF EXISTS public.medal_submission_history;
DROP TABLE IF EXISTS public.matches;
DROP TABLE IF EXISTS public.match_participants;
DROP TABLE IF EXISTS public.kontingens;
DROP TABLE IF EXISTS public.keycloak_role;
DROP TABLE IF EXISTS public.keycloak_group;
DROP TABLE IF EXISTS public.idp_mapper_config;
DROP TABLE IF EXISTS public.identity_provider_mapper;
DROP TABLE IF EXISTS public.identity_provider_config;
DROP TABLE IF EXISTS public.identity_provider;
DROP TABLE IF EXISTS public.group_role_mapping;
DROP TABLE IF EXISTS public.group_attribute;
DROP TABLE IF EXISTS public.federated_user;
DROP TABLE IF EXISTS public.federated_identity;
DROP TABLE IF EXISTS public.fed_user_role_mapping;
DROP TABLE IF EXISTS public.fed_user_required_action;
DROP TABLE IF EXISTS public.fed_user_group_membership;
DROP TABLE IF EXISTS public.fed_user_credential;
DROP TABLE IF EXISTS public.fed_user_consent_cl_scope;
DROP TABLE IF EXISTS public.fed_user_consent;
DROP TABLE IF EXISTS public.fed_user_attribute;
DROP TABLE IF EXISTS public.event_entity;
DROP TABLE IF EXISTS public.default_client_scope;
DROP TABLE IF EXISTS public.databasechangeloglock;
DROP TABLE IF EXISTS public.databasechangelog;
DROP TABLE IF EXISTS public.credential;
DROP TABLE IF EXISTS public.composite_role;
DROP TABLE IF EXISTS public.component_config;
DROP TABLE IF EXISTS public.component;
DROP TABLE IF EXISTS public.client_user_session_note;
DROP TABLE IF EXISTS public.client_session_role;
DROP TABLE IF EXISTS public.client_session_prot_mapper;
DROP TABLE IF EXISTS public.client_session_note;
DROP TABLE IF EXISTS public.client_session_auth_status;
DROP TABLE IF EXISTS public.client_session;
DROP TABLE IF EXISTS public.client_scope_role_mapping;
DROP TABLE IF EXISTS public.client_scope_client;
DROP TABLE IF EXISTS public.client_scope_attributes;
DROP TABLE IF EXISTS public.client_scope;
DROP TABLE IF EXISTS public.client_node_registrations;
DROP TABLE IF EXISTS public.client_initial_access;
DROP TABLE IF EXISTS public.client_auth_flow_bindings;
DROP TABLE IF EXISTS public.client_attributes;
DROP TABLE IF EXISTS public.client;
DROP TABLE IF EXISTS public.city_guides;
DROP TABLE IF EXISTS public.cabors;
DROP TABLE IF EXISTS public.broker_link;
DROP TABLE IF EXISTS public.authenticator_config_entry;
DROP TABLE IF EXISTS public.authenticator_config;
DROP TABLE IF EXISTS public.authentication_flow;
DROP TABLE IF EXISTS public.authentication_execution;
DROP TABLE IF EXISTS public.associated_policy;
DROP TABLE IF EXISTS public.admin_event_entity;
DROP FUNCTION IF EXISTS public.prevent_medal_history_mutation();
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS postgis_topology;
DROP EXTENSION IF EXISTS postgis_tiger_geocoder;
DROP EXTENSION IF EXISTS postgis;
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS fuzzystrmatch;
DROP SCHEMA IF EXISTS topology;
DROP SCHEMA IF EXISTS tiger_data;
DROP SCHEMA IF EXISTS tiger;
--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: porprov_admin
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO porprov_admin;

--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: porprov_admin
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO porprov_admin;

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: porprov_admin
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO porprov_admin;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: porprov_admin
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: prevent_medal_history_mutation(); Type: FUNCTION; Schema: public; Owner: porprov_admin
--

CREATE FUNCTION public.prevent_medal_history_mutation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'medal submission history is immutable';
END;
$$;


ALTER FUNCTION public.prevent_medal_history_mutation() OWNER TO porprov_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_event_entity; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.admin_event_entity (
    id character varying(36) NOT NULL,
    admin_event_time bigint,
    realm_id character varying(255),
    operation_type character varying(255),
    auth_realm_id character varying(255),
    auth_client_id character varying(255),
    auth_user_id character varying(255),
    ip_address character varying(255),
    resource_path character varying(2550),
    representation text,
    error character varying(255),
    resource_type character varying(64)
);


ALTER TABLE public.admin_event_entity OWNER TO porprov_admin;

--
-- Name: associated_policy; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.associated_policy (
    policy_id character varying(36) NOT NULL,
    associated_policy_id character varying(36) NOT NULL
);


ALTER TABLE public.associated_policy OWNER TO porprov_admin;

--
-- Name: authentication_execution; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.authentication_execution (
    id character varying(36) NOT NULL,
    alias character varying(255),
    authenticator character varying(36),
    realm_id character varying(36),
    flow_id character varying(36),
    requirement integer,
    priority integer,
    authenticator_flow boolean DEFAULT false NOT NULL,
    auth_flow_id character varying(36),
    auth_config character varying(36)
);


ALTER TABLE public.authentication_execution OWNER TO porprov_admin;

--
-- Name: authentication_flow; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.authentication_flow (
    id character varying(36) NOT NULL,
    alias character varying(255),
    description character varying(255),
    realm_id character varying(36),
    provider_id character varying(36) DEFAULT 'basic-flow'::character varying NOT NULL,
    top_level boolean DEFAULT false NOT NULL,
    built_in boolean DEFAULT false NOT NULL
);


ALTER TABLE public.authentication_flow OWNER TO porprov_admin;

--
-- Name: authenticator_config; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.authenticator_config (
    id character varying(36) NOT NULL,
    alias character varying(255),
    realm_id character varying(36)
);


ALTER TABLE public.authenticator_config OWNER TO porprov_admin;

--
-- Name: authenticator_config_entry; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.authenticator_config_entry (
    authenticator_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.authenticator_config_entry OWNER TO porprov_admin;

--
-- Name: broker_link; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.broker_link (
    identity_provider character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL,
    broker_user_id character varying(255),
    broker_username character varying(255),
    token text,
    user_id character varying(255) NOT NULL
);


ALTER TABLE public.broker_link OWNER TO porprov_admin;

--
-- Name: cabors; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.cabors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon_url character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    kategori character varying(50) DEFAULT ''::character varying,
    total_medali integer DEFAULT 0,
    technical_delegate character varying(100) DEFAULT ''::character varying,
    status character varying(20) DEFAULT 'Aktif'::character varying
);


ALTER TABLE public.cabors OWNER TO porprov_admin;

--
-- Name: city_guides; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.city_guides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    description text,
    address text,
    image_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.city_guides OWNER TO porprov_admin;

--
-- Name: client; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client (
    id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    full_scope_allowed boolean DEFAULT false NOT NULL,
    client_id character varying(255),
    not_before integer,
    public_client boolean DEFAULT false NOT NULL,
    secret character varying(255),
    base_url character varying(255),
    bearer_only boolean DEFAULT false NOT NULL,
    management_url character varying(255),
    surrogate_auth_required boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    protocol character varying(255),
    node_rereg_timeout integer DEFAULT 0,
    frontchannel_logout boolean DEFAULT false NOT NULL,
    consent_required boolean DEFAULT false NOT NULL,
    name character varying(255),
    service_accounts_enabled boolean DEFAULT false NOT NULL,
    client_authenticator_type character varying(255),
    root_url character varying(255),
    description character varying(255),
    registration_token character varying(255),
    standard_flow_enabled boolean DEFAULT true NOT NULL,
    implicit_flow_enabled boolean DEFAULT false NOT NULL,
    direct_access_grants_enabled boolean DEFAULT false NOT NULL,
    always_display_in_console boolean DEFAULT false NOT NULL
);


ALTER TABLE public.client OWNER TO porprov_admin;

--
-- Name: client_attributes; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_attributes (
    client_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.client_attributes OWNER TO porprov_admin;

--
-- Name: client_auth_flow_bindings; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_auth_flow_bindings (
    client_id character varying(36) NOT NULL,
    flow_id character varying(36),
    binding_name character varying(255) NOT NULL
);


ALTER TABLE public.client_auth_flow_bindings OWNER TO porprov_admin;

--
-- Name: client_initial_access; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_initial_access (
    id character varying(36) NOT NULL,
    realm_id character varying(36) NOT NULL,
    "timestamp" integer,
    expiration integer,
    count integer,
    remaining_count integer
);


ALTER TABLE public.client_initial_access OWNER TO porprov_admin;

--
-- Name: client_node_registrations; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_node_registrations (
    client_id character varying(36) NOT NULL,
    value integer,
    name character varying(255) NOT NULL
);


ALTER TABLE public.client_node_registrations OWNER TO porprov_admin;

--
-- Name: client_scope; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_scope (
    id character varying(36) NOT NULL,
    name character varying(255),
    realm_id character varying(36),
    description character varying(255),
    protocol character varying(255)
);


ALTER TABLE public.client_scope OWNER TO porprov_admin;

--
-- Name: client_scope_attributes; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_scope_attributes (
    scope_id character varying(36) NOT NULL,
    value character varying(2048),
    name character varying(255) NOT NULL
);


ALTER TABLE public.client_scope_attributes OWNER TO porprov_admin;

--
-- Name: client_scope_client; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_scope_client (
    client_id character varying(255) NOT NULL,
    scope_id character varying(255) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE public.client_scope_client OWNER TO porprov_admin;

--
-- Name: client_scope_role_mapping; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_scope_role_mapping (
    scope_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE public.client_scope_role_mapping OWNER TO porprov_admin;

--
-- Name: client_session; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_session (
    id character varying(36) NOT NULL,
    client_id character varying(36),
    redirect_uri character varying(255),
    state character varying(255),
    "timestamp" integer,
    session_id character varying(36),
    auth_method character varying(255),
    realm_id character varying(255),
    auth_user_id character varying(36),
    current_action character varying(36)
);


ALTER TABLE public.client_session OWNER TO porprov_admin;

--
-- Name: client_session_auth_status; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_session_auth_status (
    authenticator character varying(36) NOT NULL,
    status integer,
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_auth_status OWNER TO porprov_admin;

--
-- Name: client_session_note; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_session_note (
    name character varying(255) NOT NULL,
    value character varying(255),
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_note OWNER TO porprov_admin;

--
-- Name: client_session_prot_mapper; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_session_prot_mapper (
    protocol_mapper_id character varying(36) NOT NULL,
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_prot_mapper OWNER TO porprov_admin;

--
-- Name: client_session_role; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_session_role (
    role_id character varying(255) NOT NULL,
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_role OWNER TO porprov_admin;

--
-- Name: client_user_session_note; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.client_user_session_note (
    name character varying(255) NOT NULL,
    value character varying(2048),
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_user_session_note OWNER TO porprov_admin;

--
-- Name: component; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.component (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_id character varying(36),
    provider_id character varying(36),
    provider_type character varying(255),
    realm_id character varying(36),
    sub_type character varying(255)
);


ALTER TABLE public.component OWNER TO porprov_admin;

--
-- Name: component_config; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.component_config (
    id character varying(36) NOT NULL,
    component_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.component_config OWNER TO porprov_admin;

--
-- Name: composite_role; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.composite_role (
    composite character varying(36) NOT NULL,
    child_role character varying(36) NOT NULL
);


ALTER TABLE public.composite_role OWNER TO porprov_admin;

--
-- Name: credential; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    user_id character varying(36),
    created_date bigint,
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE public.credential OWNER TO porprov_admin;

--
-- Name: databasechangelog; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.databasechangelog (
    id character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    dateexecuted timestamp without time zone NOT NULL,
    orderexecuted integer NOT NULL,
    exectype character varying(10) NOT NULL,
    md5sum character varying(35),
    description character varying(255),
    comments character varying(255),
    tag character varying(255),
    liquibase character varying(20),
    contexts character varying(255),
    labels character varying(255),
    deployment_id character varying(10)
);


ALTER TABLE public.databasechangelog OWNER TO porprov_admin;

--
-- Name: databasechangeloglock; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.databasechangeloglock (
    id integer NOT NULL,
    locked boolean NOT NULL,
    lockgranted timestamp without time zone,
    lockedby character varying(255)
);


ALTER TABLE public.databasechangeloglock OWNER TO porprov_admin;

--
-- Name: default_client_scope; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.default_client_scope (
    realm_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE public.default_client_scope OWNER TO porprov_admin;

--
-- Name: event_entity; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.event_entity (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    details_json character varying(2550),
    error character varying(255),
    ip_address character varying(255),
    realm_id character varying(255),
    session_id character varying(255),
    event_time bigint,
    type character varying(255),
    user_id character varying(255),
    details_json_long_value text
);


ALTER TABLE public.event_entity OWNER TO porprov_admin;

--
-- Name: fed_user_attribute; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.fed_user_attribute (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    value character varying(2024),
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


ALTER TABLE public.fed_user_attribute OWNER TO porprov_admin;

--
-- Name: fed_user_consent; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.fed_user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE public.fed_user_consent OWNER TO porprov_admin;

--
-- Name: fed_user_consent_cl_scope; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.fed_user_consent_cl_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.fed_user_consent_cl_scope OWNER TO porprov_admin;

--
-- Name: fed_user_credential; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.fed_user_credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    created_date bigint,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE public.fed_user_credential OWNER TO porprov_admin;

--
-- Name: fed_user_group_membership; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.fed_user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_group_membership OWNER TO porprov_admin;

--
-- Name: fed_user_required_action; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.fed_user_required_action (
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_required_action OWNER TO porprov_admin;

--
-- Name: fed_user_role_mapping; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.fed_user_role_mapping (
    role_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_role_mapping OWNER TO porprov_admin;

--
-- Name: federated_identity; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.federated_identity (
    identity_provider character varying(255) NOT NULL,
    realm_id character varying(36),
    federated_user_id character varying(255),
    federated_username character varying(255),
    token text,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.federated_identity OWNER TO porprov_admin;

--
-- Name: federated_user; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.federated_user (
    id character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.federated_user OWNER TO porprov_admin;

--
-- Name: group_attribute; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.group_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.group_attribute OWNER TO porprov_admin;

--
-- Name: group_role_mapping; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.group_role_mapping (
    role_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.group_role_mapping OWNER TO porprov_admin;

--
-- Name: identity_provider; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.identity_provider (
    internal_id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    provider_alias character varying(255),
    provider_id character varying(255),
    store_token boolean DEFAULT false NOT NULL,
    authenticate_by_default boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    add_token_role boolean DEFAULT true NOT NULL,
    trust_email boolean DEFAULT false NOT NULL,
    first_broker_login_flow_id character varying(36),
    post_broker_login_flow_id character varying(36),
    provider_display_name character varying(255),
    link_only boolean DEFAULT false NOT NULL
);


ALTER TABLE public.identity_provider OWNER TO porprov_admin;

--
-- Name: identity_provider_config; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.identity_provider_config (
    identity_provider_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.identity_provider_config OWNER TO porprov_admin;

--
-- Name: identity_provider_mapper; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.identity_provider_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    idp_alias character varying(255) NOT NULL,
    idp_mapper_name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.identity_provider_mapper OWNER TO porprov_admin;

--
-- Name: idp_mapper_config; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.idp_mapper_config (
    idp_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.idp_mapper_config OWNER TO porprov_admin;

--
-- Name: keycloak_group; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.keycloak_group (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_group character varying(36) NOT NULL,
    realm_id character varying(36)
);


ALTER TABLE public.keycloak_group OWNER TO porprov_admin;

--
-- Name: keycloak_role; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.keycloak_role (
    id character varying(36) NOT NULL,
    client_realm_constraint character varying(255),
    client_role boolean DEFAULT false NOT NULL,
    description character varying(255),
    name character varying(255),
    realm_id character varying(255),
    client character varying(36),
    realm character varying(36)
);


ALTER TABLE public.keycloak_role OWNER TO porprov_admin;

--
-- Name: kontingens; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.kontingens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    region_type character varying(50) NOT NULL,
    logo_url character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.kontingens OWNER TO porprov_admin;

--
-- Name: match_participants; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.match_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    match_id uuid NOT NULL,
    kontingen_id uuid NOT NULL,
    athlete_name character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.matches OWNER TO porprov_admin;

--
-- Name: medal_submission_history; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.medal_submission_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    from_status character varying(20),
    to_status character varying(20) NOT NULL,
    actor_id character varying(255) NOT NULL,
    reason text,
    request_id character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.medal_submission_history OWNER TO porprov_admin;

--
-- Name: medal_submissions; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.medal_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kontingen_id uuid NOT NULL,
    gold integer DEFAULT 0 NOT NULL,
    silver integer DEFAULT 0 NOT NULL,
    bronze integer DEFAULT 0 NOT NULL,
    evidence_url text,
    notes text,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    submitted_by character varying(255) NOT NULL,
    verified_by character varying(255),
    verification_notes text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    verified_at timestamp with time zone,
    published_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    rejected_by character varying(255),
    published_by character varying(255),
    rejected_at timestamp with time zone,
    CONSTRAINT medal_submissions_bronze_check CHECK ((bronze >= 0)),
    CONSTRAINT medal_submissions_check CHECK ((((gold + silver) + bronze) > 0)),
    CONSTRAINT medal_submissions_gold_check CHECK ((gold >= 0)),
    CONSTRAINT medal_submissions_silver_check CHECK ((silver >= 0)),
    CONSTRAINT medal_submissions_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'VERIFIED'::character varying, 'REJECTED'::character varying, 'OFFICIAL'::character varying])::text[])))
);


ALTER TABLE public.medal_submissions OWNER TO porprov_admin;

--
-- Name: medals; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.medals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    kontingen_id uuid NOT NULL,
    gold integer DEFAULT 0 NOT NULL,
    silver integer DEFAULT 0 NOT NULL,
    bronze integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT medals_non_negative CHECK (((gold >= 0) AND (silver >= 0) AND (bronze >= 0)))
);


ALTER TABLE public.medals OWNER TO porprov_admin;

--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.media_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_name character varying(255) NOT NULL,
    file_url text NOT NULL,
    mime_type character varying(100),
    file_size integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.media_assets OWNER TO porprov_admin;

--
-- Name: migration_model; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.migration_model (
    id character varying(36) NOT NULL,
    version character varying(36),
    update_time bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.migration_model OWNER TO porprov_admin;

--
-- Name: nomor_tandings; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.nomor_tandings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cabor_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    gender_category character varying(20) NOT NULL,
    match_type character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.nomor_tandings OWNER TO porprov_admin;

--
-- Name: offline_client_session; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.offline_client_session (
    user_session_id character varying(36) NOT NULL,
    client_id character varying(255) NOT NULL,
    offline_flag character varying(4) NOT NULL,
    "timestamp" integer,
    data text,
    client_storage_provider character varying(36) DEFAULT 'local'::character varying NOT NULL,
    external_client_id character varying(255) DEFAULT 'local'::character varying NOT NULL
);


ALTER TABLE public.offline_client_session OWNER TO porprov_admin;

--
-- Name: offline_user_session; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.offline_user_session (
    user_session_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    created_on integer NOT NULL,
    offline_flag character varying(4) NOT NULL,
    data text,
    last_session_refresh integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.offline_user_session OWNER TO porprov_admin;

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
-- Name: policy_config; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.policy_config (
    policy_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.policy_config OWNER TO porprov_admin;

--
-- Name: protocol_mapper; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.protocol_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    protocol character varying(255) NOT NULL,
    protocol_mapper_name character varying(255) NOT NULL,
    client_id character varying(36),
    client_scope_id character varying(36)
);


ALTER TABLE public.protocol_mapper OWNER TO porprov_admin;

--
-- Name: protocol_mapper_config; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.protocol_mapper_config (
    protocol_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.protocol_mapper_config OWNER TO porprov_admin;

--
-- Name: realm; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.realm (
    id character varying(36) NOT NULL,
    access_code_lifespan integer,
    user_action_lifespan integer,
    access_token_lifespan integer,
    account_theme character varying(255),
    admin_theme character varying(255),
    email_theme character varying(255),
    enabled boolean DEFAULT false NOT NULL,
    events_enabled boolean DEFAULT false NOT NULL,
    events_expiration bigint,
    login_theme character varying(255),
    name character varying(255),
    not_before integer,
    password_policy character varying(2550),
    registration_allowed boolean DEFAULT false NOT NULL,
    remember_me boolean DEFAULT false NOT NULL,
    reset_password_allowed boolean DEFAULT false NOT NULL,
    social boolean DEFAULT false NOT NULL,
    ssl_required character varying(255),
    sso_idle_timeout integer,
    sso_max_lifespan integer,
    update_profile_on_soc_login boolean DEFAULT false NOT NULL,
    verify_email boolean DEFAULT false NOT NULL,
    master_admin_client character varying(36),
    login_lifespan integer,
    internationalization_enabled boolean DEFAULT false NOT NULL,
    default_locale character varying(255),
    reg_email_as_username boolean DEFAULT false NOT NULL,
    admin_events_enabled boolean DEFAULT false NOT NULL,
    admin_events_details_enabled boolean DEFAULT false NOT NULL,
    edit_username_allowed boolean DEFAULT false NOT NULL,
    otp_policy_counter integer DEFAULT 0,
    otp_policy_window integer DEFAULT 1,
    otp_policy_period integer DEFAULT 30,
    otp_policy_digits integer DEFAULT 6,
    otp_policy_alg character varying(36) DEFAULT 'HmacSHA1'::character varying,
    otp_policy_type character varying(36) DEFAULT 'totp'::character varying,
    browser_flow character varying(36),
    registration_flow character varying(36),
    direct_grant_flow character varying(36),
    reset_credentials_flow character varying(36),
    client_auth_flow character varying(36),
    offline_session_idle_timeout integer DEFAULT 0,
    revoke_refresh_token boolean DEFAULT false NOT NULL,
    access_token_life_implicit integer DEFAULT 0,
    login_with_email_allowed boolean DEFAULT true NOT NULL,
    duplicate_emails_allowed boolean DEFAULT false NOT NULL,
    docker_auth_flow character varying(36),
    refresh_token_max_reuse integer DEFAULT 0,
    allow_user_managed_access boolean DEFAULT false NOT NULL,
    sso_max_lifespan_remember_me integer DEFAULT 0 NOT NULL,
    sso_idle_timeout_remember_me integer DEFAULT 0 NOT NULL,
    default_role character varying(255)
);


ALTER TABLE public.realm OWNER TO porprov_admin;

--
-- Name: realm_attribute; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.realm_attribute (
    name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    value text
);


ALTER TABLE public.realm_attribute OWNER TO porprov_admin;

--
-- Name: realm_default_groups; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.realm_default_groups (
    realm_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.realm_default_groups OWNER TO porprov_admin;

--
-- Name: realm_enabled_event_types; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.realm_enabled_event_types (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_enabled_event_types OWNER TO porprov_admin;

--
-- Name: realm_events_listeners; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.realm_events_listeners (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_events_listeners OWNER TO porprov_admin;

--
-- Name: realm_localizations; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.realm_localizations (
    realm_id character varying(255) NOT NULL,
    locale character varying(255) NOT NULL,
    texts text NOT NULL
);


ALTER TABLE public.realm_localizations OWNER TO porprov_admin;

--
-- Name: realm_required_credential; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.realm_required_credential (
    type character varying(255) NOT NULL,
    form_label character varying(255),
    input boolean DEFAULT false NOT NULL,
    secret boolean DEFAULT false NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.realm_required_credential OWNER TO porprov_admin;

--
-- Name: realm_smtp_config; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.realm_smtp_config (
    realm_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.realm_smtp_config OWNER TO porprov_admin;

--
-- Name: realm_supported_locales; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.realm_supported_locales (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_supported_locales OWNER TO porprov_admin;

--
-- Name: redirect_uris; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.redirect_uris (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.redirect_uris OWNER TO porprov_admin;

--
-- Name: required_action_config; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.required_action_config (
    required_action_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.required_action_config OWNER TO porprov_admin;

--
-- Name: required_action_provider; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.required_action_provider (
    id character varying(36) NOT NULL,
    alias character varying(255),
    name character varying(255),
    realm_id character varying(36),
    enabled boolean DEFAULT false NOT NULL,
    default_action boolean DEFAULT false NOT NULL,
    provider_id character varying(255),
    priority integer
);


ALTER TABLE public.required_action_provider OWNER TO porprov_admin;

--
-- Name: resource_attribute; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.resource_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    resource_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_attribute OWNER TO porprov_admin;

--
-- Name: resource_policy; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.resource_policy (
    resource_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_policy OWNER TO porprov_admin;

--
-- Name: resource_scope; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.resource_scope (
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_scope OWNER TO porprov_admin;

--
-- Name: resource_server; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.resource_server (
    id character varying(36) NOT NULL,
    allow_rs_remote_mgmt boolean DEFAULT false NOT NULL,
    policy_enforce_mode smallint NOT NULL,
    decision_strategy smallint DEFAULT 1 NOT NULL
);


ALTER TABLE public.resource_server OWNER TO porprov_admin;

--
-- Name: resource_server_perm_ticket; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.resource_server_perm_ticket (
    id character varying(36) NOT NULL,
    owner character varying(255) NOT NULL,
    requester character varying(255) NOT NULL,
    created_timestamp bigint NOT NULL,
    granted_timestamp bigint,
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36),
    resource_server_id character varying(36) NOT NULL,
    policy_id character varying(36)
);


ALTER TABLE public.resource_server_perm_ticket OWNER TO porprov_admin;

--
-- Name: resource_server_policy; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.resource_server_policy (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    type character varying(255) NOT NULL,
    decision_strategy smallint,
    logic smallint,
    resource_server_id character varying(36) NOT NULL,
    owner character varying(255)
);


ALTER TABLE public.resource_server_policy OWNER TO porprov_admin;

--
-- Name: resource_server_resource; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.resource_server_resource (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255),
    icon_uri character varying(255),
    owner character varying(255) NOT NULL,
    resource_server_id character varying(36) NOT NULL,
    owner_managed_access boolean DEFAULT false NOT NULL,
    display_name character varying(255)
);


ALTER TABLE public.resource_server_resource OWNER TO porprov_admin;

--
-- Name: resource_server_scope; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.resource_server_scope (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    icon_uri character varying(255),
    resource_server_id character varying(36) NOT NULL,
    display_name character varying(255)
);


ALTER TABLE public.resource_server_scope OWNER TO porprov_admin;

--
-- Name: resource_uris; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.resource_uris (
    resource_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.resource_uris OWNER TO porprov_admin;

--
-- Name: role_attribute; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.role_attribute (
    id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255)
);


ALTER TABLE public.role_attribute OWNER TO porprov_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    dirty boolean NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO porprov_admin;

--
-- Name: scope_mapping; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.scope_mapping (
    client_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE public.scope_mapping OWNER TO porprov_admin;

--
-- Name: scope_policy; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.scope_policy (
    scope_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE public.scope_policy OWNER TO porprov_admin;

--
-- Name: user_attribute; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_attribute (
    name character varying(255) NOT NULL,
    value character varying(255),
    user_id character varying(36) NOT NULL,
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


ALTER TABLE public.user_attribute OWNER TO porprov_admin;

--
-- Name: user_consent; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(36) NOT NULL,
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE public.user_consent OWNER TO porprov_admin;

--
-- Name: user_consent_client_scope; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_consent_client_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.user_consent_client_scope OWNER TO porprov_admin;

--
-- Name: user_entity; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_entity (
    id character varying(36) NOT NULL,
    email character varying(255),
    email_constraint character varying(255),
    email_verified boolean DEFAULT false NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    federation_link character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    realm_id character varying(255),
    username character varying(255),
    created_timestamp bigint,
    service_account_client_link character varying(255),
    not_before integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.user_entity OWNER TO porprov_admin;

--
-- Name: user_federation_config; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_federation_config (
    user_federation_provider_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.user_federation_config OWNER TO porprov_admin;

--
-- Name: user_federation_mapper; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_federation_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    federation_provider_id character varying(36) NOT NULL,
    federation_mapper_type character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.user_federation_mapper OWNER TO porprov_admin;

--
-- Name: user_federation_mapper_config; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_federation_mapper_config (
    user_federation_mapper_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.user_federation_mapper_config OWNER TO porprov_admin;

--
-- Name: user_federation_provider; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_federation_provider (
    id character varying(36) NOT NULL,
    changed_sync_period integer,
    display_name character varying(255),
    full_sync_period integer,
    last_sync integer,
    priority integer,
    provider_name character varying(255),
    realm_id character varying(36)
);


ALTER TABLE public.user_federation_provider OWNER TO porprov_admin;

--
-- Name: user_group_membership; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.user_group_membership OWNER TO porprov_admin;

--
-- Name: user_required_action; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_required_action (
    user_id character varying(36) NOT NULL,
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL
);


ALTER TABLE public.user_required_action OWNER TO porprov_admin;

--
-- Name: user_role_mapping; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_role_mapping (
    role_id character varying(255) NOT NULL,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.user_role_mapping OWNER TO porprov_admin;

--
-- Name: user_session; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_session (
    id character varying(36) NOT NULL,
    auth_method character varying(255),
    ip_address character varying(255),
    last_session_refresh integer,
    login_username character varying(255),
    realm_id character varying(255),
    remember_me boolean DEFAULT false NOT NULL,
    started integer,
    user_id character varying(255),
    user_session_state integer,
    broker_session_id character varying(255),
    broker_user_id character varying(255)
);


ALTER TABLE public.user_session OWNER TO porprov_admin;

--
-- Name: user_session_note; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.user_session_note (
    user_session character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(2048)
);


ALTER TABLE public.user_session_note OWNER TO porprov_admin;

--
-- Name: username_login_failure; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.username_login_failure (
    realm_id character varying(36) NOT NULL,
    username character varying(255) NOT NULL,
    failed_login_not_before integer,
    last_failure bigint,
    last_ip_failure character varying(255),
    num_failures integer
);


ALTER TABLE public.username_login_failure OWNER TO porprov_admin;

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
    image_url text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    map_route_url text,
    city_guide_ids uuid[],
    cabor_ids uuid[],
    facilities text,
    readiness_status character varying(50) DEFAULT 'Persiapan'::character varying,
    contact_person character varying(255)
);


ALTER TABLE public.venues OWNER TO porprov_admin;

--
-- Name: web_origins; Type: TABLE; Schema: public; Owner: porprov_admin
--

CREATE TABLE public.web_origins (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.web_origins OWNER TO porprov_admin;

--
-- Data for Name: admin_event_entity; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.admin_event_entity (id, admin_event_time, realm_id, operation_type, auth_realm_id, auth_client_id, auth_user_id, ip_address, resource_path, representation, error, resource_type) FROM stdin;
\.


--
-- Data for Name: associated_policy; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.associated_policy (policy_id, associated_policy_id) FROM stdin;
\.


--
-- Data for Name: authentication_execution; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.authentication_execution (id, alias, authenticator, realm_id, flow_id, requirement, priority, authenticator_flow, auth_flow_id, auth_config) FROM stdin;
82d5ecc4-1a3d-446b-9b22-9931f27e4e82	\N	auth-cookie	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	3168add5-fed5-4edb-a1e4-f3c62c7f6cc6	2	10	f	\N	\N
763e966e-6031-4067-928e-e76419ae52ae	\N	auth-spnego	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	3168add5-fed5-4edb-a1e4-f3c62c7f6cc6	3	20	f	\N	\N
2d197738-6c86-42cb-af48-346cd8bd52bd	\N	identity-provider-redirector	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	3168add5-fed5-4edb-a1e4-f3c62c7f6cc6	2	25	f	\N	\N
c6456e89-6447-47e6-a45b-056a352ddc55	\N	\N	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	3168add5-fed5-4edb-a1e4-f3c62c7f6cc6	2	30	t	71f70f64-aa50-4968-bd4b-7dfbff132c53	\N
d6e8530c-0ea0-4b77-9849-318b8249d169	\N	auth-username-password-form	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	71f70f64-aa50-4968-bd4b-7dfbff132c53	0	10	f	\N	\N
f29defd8-b526-454c-9566-2cb207bba310	\N	\N	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	71f70f64-aa50-4968-bd4b-7dfbff132c53	1	20	t	631276c4-598e-43b7-bcbc-58d3f421ef31	\N
be7a34c0-6dea-4b41-bf5e-0cf96555d69a	\N	conditional-user-configured	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	631276c4-598e-43b7-bcbc-58d3f421ef31	0	10	f	\N	\N
7d494fdc-2d21-4e0f-a076-97e2a357df8d	\N	auth-otp-form	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	631276c4-598e-43b7-bcbc-58d3f421ef31	0	20	f	\N	\N
edad5744-6f53-4df3-add6-9e82eb88b1b4	\N	direct-grant-validate-username	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	b3262137-2453-4d85-a4cc-9813dcf4e774	0	10	f	\N	\N
1ff92fe8-8804-4938-b316-b9db3447865b	\N	direct-grant-validate-password	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	b3262137-2453-4d85-a4cc-9813dcf4e774	0	20	f	\N	\N
946736ec-6c8a-46ec-8b8e-749a793770aa	\N	\N	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	b3262137-2453-4d85-a4cc-9813dcf4e774	1	30	t	e0a70d42-9fb1-4917-9da8-de6f34685dc6	\N
f9c09fe8-6942-41b2-9319-2cdf069d5c46	\N	conditional-user-configured	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	e0a70d42-9fb1-4917-9da8-de6f34685dc6	0	10	f	\N	\N
2c61473f-141d-4137-aabc-d84f2f22c4f2	\N	direct-grant-validate-otp	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	e0a70d42-9fb1-4917-9da8-de6f34685dc6	0	20	f	\N	\N
4367a061-46a0-41a9-a6cc-101a62cd3649	\N	registration-page-form	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d468cefc-20b7-4a24-805e-9651bcd67744	0	10	t	ed05270a-1198-433d-8ebb-bbc9684e01c6	\N
d12ed50a-181a-4415-b7ff-435db59788b1	\N	registration-user-creation	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	ed05270a-1198-433d-8ebb-bbc9684e01c6	0	20	f	\N	\N
94ef4bb1-8fb6-4c20-b3ea-37fde0cbbc11	\N	registration-password-action	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	ed05270a-1198-433d-8ebb-bbc9684e01c6	0	50	f	\N	\N
c93e26bd-d073-4d49-9587-8d561c7767b9	\N	registration-recaptcha-action	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	ed05270a-1198-433d-8ebb-bbc9684e01c6	3	60	f	\N	\N
1b4e65bc-ed5f-417e-9cec-0dc558232167	\N	registration-terms-and-conditions	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	ed05270a-1198-433d-8ebb-bbc9684e01c6	3	70	f	\N	\N
850c3fb8-3c8a-46e0-ac52-af3ee3046eae	\N	reset-credentials-choose-user	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	8e0bfad0-b9b8-492c-b4ad-4a245ee853b0	0	10	f	\N	\N
324445fb-6834-48cc-8c51-be6f3857bbaa	\N	reset-credential-email	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	8e0bfad0-b9b8-492c-b4ad-4a245ee853b0	0	20	f	\N	\N
a99b5922-edbe-43d3-83ad-2fae8db7f81a	\N	reset-password	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	8e0bfad0-b9b8-492c-b4ad-4a245ee853b0	0	30	f	\N	\N
7c115924-91e0-45ef-96b1-9501b45c0d6f	\N	\N	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	8e0bfad0-b9b8-492c-b4ad-4a245ee853b0	1	40	t	ca4c291a-67b5-4318-8039-c8b03976a4f4	\N
e88317b0-2105-4850-bbf1-5c0363a061ad	\N	conditional-user-configured	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	ca4c291a-67b5-4318-8039-c8b03976a4f4	0	10	f	\N	\N
eb20ce96-27b0-4ce2-894c-d7eeae05ee17	\N	reset-otp	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	ca4c291a-67b5-4318-8039-c8b03976a4f4	0	20	f	\N	\N
fc35c5d2-0b37-44df-84a1-8c657752fb70	\N	client-secret	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	576fa06c-5ed0-46b5-908d-a2169f84fb4a	2	10	f	\N	\N
2c575bad-4d77-4875-9d5e-f8b6f82bf963	\N	client-jwt	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	576fa06c-5ed0-46b5-908d-a2169f84fb4a	2	20	f	\N	\N
4c37804b-7c54-4ce2-84b1-37139012e57f	\N	client-secret-jwt	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	576fa06c-5ed0-46b5-908d-a2169f84fb4a	2	30	f	\N	\N
ff6b5790-8b85-4e5f-9acd-3f3a4fd68691	\N	client-x509	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	576fa06c-5ed0-46b5-908d-a2169f84fb4a	2	40	f	\N	\N
9d31abf5-14c8-4e04-8b98-9ac01d668d83	\N	idp-review-profile	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	eeefce3e-0b13-4368-94ff-8ef77b4c4f9a	0	10	f	\N	e170f6f3-d849-4de1-b880-88cc49fe7df2
cf9fd894-8551-4c4a-a91d-c0656eb59c60	\N	\N	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	eeefce3e-0b13-4368-94ff-8ef77b4c4f9a	0	20	t	17e7ef2c-341d-42aa-aacc-58cfd9d80b55	\N
3786154e-0bfd-442a-95c0-89a98f301707	\N	idp-create-user-if-unique	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	17e7ef2c-341d-42aa-aacc-58cfd9d80b55	2	10	f	\N	87255cd9-9c6a-42ee-9547-5b36d3ff9100
1281f743-9b63-428f-8319-d53937ac897d	\N	\N	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	17e7ef2c-341d-42aa-aacc-58cfd9d80b55	2	20	t	c245ea68-6d15-4f42-9fb1-1b0a4f83e358	\N
d747f712-098d-43d9-85f1-ce5b58089427	\N	idp-confirm-link	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	c245ea68-6d15-4f42-9fb1-1b0a4f83e358	0	10	f	\N	\N
c8a3ac39-0dc4-49c7-a71c-da0a41c45925	\N	\N	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	c245ea68-6d15-4f42-9fb1-1b0a4f83e358	0	20	t	d4f37dda-d2e8-4c42-afd9-dc730b784270	\N
6a5e5f48-2a0c-4975-9a45-85c68967c8b8	\N	idp-email-verification	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d4f37dda-d2e8-4c42-afd9-dc730b784270	2	10	f	\N	\N
e49fd933-4d19-4571-bc1e-916ba63946ed	\N	\N	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d4f37dda-d2e8-4c42-afd9-dc730b784270	2	20	t	6cf9f767-b72a-4542-904d-ec0920207403	\N
c062204c-c667-4de1-802c-225734689cb8	\N	idp-username-password-form	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	6cf9f767-b72a-4542-904d-ec0920207403	0	10	f	\N	\N
cb59fc66-e99e-4247-a37d-4d8b4a9e8fbb	\N	\N	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	6cf9f767-b72a-4542-904d-ec0920207403	1	20	t	5c5985ef-9ac0-4916-aedf-ee57489917e3	\N
dce98107-fd8a-489c-a8d0-4493b9cd36ee	\N	conditional-user-configured	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	5c5985ef-9ac0-4916-aedf-ee57489917e3	0	10	f	\N	\N
656ea9ee-4000-4cee-bbc6-60b66be8f998	\N	auth-otp-form	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	5c5985ef-9ac0-4916-aedf-ee57489917e3	0	20	f	\N	\N
f5a0c90e-052d-4a7f-aa5d-c2a687d7d936	\N	http-basic-authenticator	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	01f57d80-ea99-4c76-8e42-d9083ceecac7	0	10	f	\N	\N
41086b72-1d4a-4e49-bc43-f3c37947011e	\N	docker-http-basic-authenticator	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	a5e2dd03-cd14-4f69-bfce-ad7b7b454df1	0	10	f	\N	\N
7c166108-52ab-42ac-923a-2dff104c0b3a	\N	auth-cookie	81407725-cab3-4c86-9e57-5dfbd60ae9c1	9e9ed574-628b-4563-92fa-32ea502f920b	2	10	f	\N	\N
c060010c-a903-4cab-a126-c7f47ee5fa74	\N	auth-spnego	81407725-cab3-4c86-9e57-5dfbd60ae9c1	9e9ed574-628b-4563-92fa-32ea502f920b	3	20	f	\N	\N
bc5dbdbf-13d6-40ea-bb5a-f05070394062	\N	identity-provider-redirector	81407725-cab3-4c86-9e57-5dfbd60ae9c1	9e9ed574-628b-4563-92fa-32ea502f920b	2	25	f	\N	\N
a17f5400-e87a-4375-9cf4-53ab7b926c04	\N	\N	81407725-cab3-4c86-9e57-5dfbd60ae9c1	9e9ed574-628b-4563-92fa-32ea502f920b	2	30	t	bc45db54-185f-4380-a1cb-976ae6434cda	\N
cda8c91f-08af-4a97-8000-5a1e5385137d	\N	auth-username-password-form	81407725-cab3-4c86-9e57-5dfbd60ae9c1	bc45db54-185f-4380-a1cb-976ae6434cda	0	10	f	\N	\N
ebf1cfdb-649a-4cb7-bd19-49c0c27f8f80	\N	\N	81407725-cab3-4c86-9e57-5dfbd60ae9c1	bc45db54-185f-4380-a1cb-976ae6434cda	1	20	t	9115a846-6d31-423c-bf0c-9ef2efc7e946	\N
bd139670-6239-4045-be6b-7bcaacad138f	\N	conditional-user-configured	81407725-cab3-4c86-9e57-5dfbd60ae9c1	9115a846-6d31-423c-bf0c-9ef2efc7e946	0	10	f	\N	\N
e35e6e93-571a-40f4-9ece-205565241be5	\N	auth-otp-form	81407725-cab3-4c86-9e57-5dfbd60ae9c1	9115a846-6d31-423c-bf0c-9ef2efc7e946	0	20	f	\N	\N
7e490a72-1f5e-4ba2-98fe-4ffac94abab3	\N	direct-grant-validate-username	81407725-cab3-4c86-9e57-5dfbd60ae9c1	2551c17b-6a68-4951-a32f-07a5ba2de15a	0	10	f	\N	\N
1636b3e1-bdb5-49b6-82b5-88c94ffc0b6a	\N	direct-grant-validate-password	81407725-cab3-4c86-9e57-5dfbd60ae9c1	2551c17b-6a68-4951-a32f-07a5ba2de15a	0	20	f	\N	\N
eafd62f1-96d9-41f7-97af-03bf161a68f6	\N	\N	81407725-cab3-4c86-9e57-5dfbd60ae9c1	2551c17b-6a68-4951-a32f-07a5ba2de15a	1	30	t	c32f00b3-cf49-43d2-9995-406553c563e0	\N
b7b34910-3af7-4d6b-ae95-b99dca332105	\N	conditional-user-configured	81407725-cab3-4c86-9e57-5dfbd60ae9c1	c32f00b3-cf49-43d2-9995-406553c563e0	0	10	f	\N	\N
391eb64c-805e-4004-9be7-83cbd9a67fd4	\N	direct-grant-validate-otp	81407725-cab3-4c86-9e57-5dfbd60ae9c1	c32f00b3-cf49-43d2-9995-406553c563e0	0	20	f	\N	\N
6a333c66-fa3e-4f63-b291-9dbdf68a91db	\N	registration-page-form	81407725-cab3-4c86-9e57-5dfbd60ae9c1	e3f47bdb-34b8-467f-ae1c-4a5baeb1e673	0	10	t	f75f2961-d494-4a44-8546-911fdc0d3878	\N
4d5db3e6-15aa-448b-9ea0-579ecf009734	\N	registration-user-creation	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f75f2961-d494-4a44-8546-911fdc0d3878	0	20	f	\N	\N
73091f2c-e889-49fc-bb37-171dd5de9622	\N	registration-password-action	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f75f2961-d494-4a44-8546-911fdc0d3878	0	50	f	\N	\N
71dfd01b-5b06-4232-b529-f170428eb05f	\N	registration-recaptcha-action	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f75f2961-d494-4a44-8546-911fdc0d3878	3	60	f	\N	\N
dcf7012a-febd-43f1-9b9b-8acf278db77b	\N	registration-terms-and-conditions	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f75f2961-d494-4a44-8546-911fdc0d3878	3	70	f	\N	\N
9174a22d-80dc-4828-a72c-73df1476b1ef	\N	reset-credentials-choose-user	81407725-cab3-4c86-9e57-5dfbd60ae9c1	49b9a780-1201-491b-8a51-a4213aff9eb8	0	10	f	\N	\N
06e2634b-58aa-4791-b9bb-05daa11d7bbe	\N	reset-credential-email	81407725-cab3-4c86-9e57-5dfbd60ae9c1	49b9a780-1201-491b-8a51-a4213aff9eb8	0	20	f	\N	\N
eb46a27a-f305-44f6-823d-909daf9f2280	\N	reset-password	81407725-cab3-4c86-9e57-5dfbd60ae9c1	49b9a780-1201-491b-8a51-a4213aff9eb8	0	30	f	\N	\N
46cf46fd-a871-4542-85aa-814974f250a7	\N	\N	81407725-cab3-4c86-9e57-5dfbd60ae9c1	49b9a780-1201-491b-8a51-a4213aff9eb8	1	40	t	a509f63c-a1ca-4b1c-8d00-970b4c534715	\N
66ea039e-b6a2-49de-8831-d24145e574c7	\N	conditional-user-configured	81407725-cab3-4c86-9e57-5dfbd60ae9c1	a509f63c-a1ca-4b1c-8d00-970b4c534715	0	10	f	\N	\N
3670bbe0-1266-41c7-8df7-3714208ebba8	\N	reset-otp	81407725-cab3-4c86-9e57-5dfbd60ae9c1	a509f63c-a1ca-4b1c-8d00-970b4c534715	0	20	f	\N	\N
3d8ef427-f173-46e3-9ce0-3035f5c63969	\N	client-secret	81407725-cab3-4c86-9e57-5dfbd60ae9c1	2dd9992e-23a5-400b-90c7-64b4d48eb81c	2	10	f	\N	\N
4820dd2e-897d-44e5-8409-39f862bb7ae0	\N	client-jwt	81407725-cab3-4c86-9e57-5dfbd60ae9c1	2dd9992e-23a5-400b-90c7-64b4d48eb81c	2	20	f	\N	\N
1ae57c31-259d-45f6-81c5-61d9efc820a8	\N	client-secret-jwt	81407725-cab3-4c86-9e57-5dfbd60ae9c1	2dd9992e-23a5-400b-90c7-64b4d48eb81c	2	30	f	\N	\N
8e1244e1-9498-4bf4-9ed3-ed7350d7cf02	\N	client-x509	81407725-cab3-4c86-9e57-5dfbd60ae9c1	2dd9992e-23a5-400b-90c7-64b4d48eb81c	2	40	f	\N	\N
9c1a2132-d710-4cba-933a-8d466314128b	\N	idp-review-profile	81407725-cab3-4c86-9e57-5dfbd60ae9c1	1f0f1535-5c79-4a6a-8b3a-ba4a27a038bc	0	10	f	\N	ac658bdc-feeb-4f5d-83a1-6c714fb582b3
0f5df5f3-5184-49e8-bc09-f02b99671f8c	\N	\N	81407725-cab3-4c86-9e57-5dfbd60ae9c1	1f0f1535-5c79-4a6a-8b3a-ba4a27a038bc	0	20	t	ba6fdf25-224b-4385-b414-132cb11c9cbf	\N
75c11751-680b-4647-80d9-e6b888929564	\N	idp-create-user-if-unique	81407725-cab3-4c86-9e57-5dfbd60ae9c1	ba6fdf25-224b-4385-b414-132cb11c9cbf	2	10	f	\N	0429053b-cd7c-4b45-84c8-7cd0b34fd6b7
3f85b606-668b-462a-be35-31adfa05465d	\N	\N	81407725-cab3-4c86-9e57-5dfbd60ae9c1	ba6fdf25-224b-4385-b414-132cb11c9cbf	2	20	t	58a50963-7a2b-4c80-a166-0810c098c483	\N
a7f1c270-b1af-4533-a8d8-eb3467ee1a66	\N	idp-confirm-link	81407725-cab3-4c86-9e57-5dfbd60ae9c1	58a50963-7a2b-4c80-a166-0810c098c483	0	10	f	\N	\N
bfd7aca1-7d25-4a07-a5dc-3337c5594e02	\N	\N	81407725-cab3-4c86-9e57-5dfbd60ae9c1	58a50963-7a2b-4c80-a166-0810c098c483	0	20	t	ced31c06-d716-491d-98a4-fe003b1ae2e5	\N
3d38de4b-3d10-43f2-bc3a-63a5665a6cd3	\N	idp-email-verification	81407725-cab3-4c86-9e57-5dfbd60ae9c1	ced31c06-d716-491d-98a4-fe003b1ae2e5	2	10	f	\N	\N
6a388c7a-d920-4b42-aa7e-199ff8ee8ea5	\N	\N	81407725-cab3-4c86-9e57-5dfbd60ae9c1	ced31c06-d716-491d-98a4-fe003b1ae2e5	2	20	t	7ca86d1f-0ef3-46f8-9b33-edf02cfd2c53	\N
446c2ab3-4732-4192-bbda-fd024639a61b	\N	idp-username-password-form	81407725-cab3-4c86-9e57-5dfbd60ae9c1	7ca86d1f-0ef3-46f8-9b33-edf02cfd2c53	0	10	f	\N	\N
2c54e311-21bd-43c4-b18c-cf32da384857	\N	\N	81407725-cab3-4c86-9e57-5dfbd60ae9c1	7ca86d1f-0ef3-46f8-9b33-edf02cfd2c53	1	20	t	9bd9d15f-7b33-4e73-ad1b-328cdbce0e73	\N
fff78d28-b52f-4e90-b461-d998deb93ca1	\N	conditional-user-configured	81407725-cab3-4c86-9e57-5dfbd60ae9c1	9bd9d15f-7b33-4e73-ad1b-328cdbce0e73	0	10	f	\N	\N
f431df4b-e9cc-4747-8aff-e093d20717f1	\N	auth-otp-form	81407725-cab3-4c86-9e57-5dfbd60ae9c1	9bd9d15f-7b33-4e73-ad1b-328cdbce0e73	0	20	f	\N	\N
1ce21993-08a1-41b9-b9b7-504bdbb03ecf	\N	http-basic-authenticator	81407725-cab3-4c86-9e57-5dfbd60ae9c1	0980dd8c-38de-4daa-a41d-26a4e574db45	0	10	f	\N	\N
953c0683-bc43-4afe-96ea-c7eb0a4609bf	\N	docker-http-basic-authenticator	81407725-cab3-4c86-9e57-5dfbd60ae9c1	d6dcc9f0-f535-43a9-b272-9a84e3f6f1c4	0	10	f	\N	\N
\.


--
-- Data for Name: authentication_flow; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.authentication_flow (id, alias, description, realm_id, provider_id, top_level, built_in) FROM stdin;
3168add5-fed5-4edb-a1e4-f3c62c7f6cc6	browser	browser based authentication	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	t	t
71f70f64-aa50-4968-bd4b-7dfbff132c53	forms	Username, password, otp and other auth forms.	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	f	t
631276c4-598e-43b7-bcbc-58d3f421ef31	Browser - Conditional OTP	Flow to determine if the OTP is required for the authentication	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	f	t
b3262137-2453-4d85-a4cc-9813dcf4e774	direct grant	OpenID Connect Resource Owner Grant	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	t	t
e0a70d42-9fb1-4917-9da8-de6f34685dc6	Direct Grant - Conditional OTP	Flow to determine if the OTP is required for the authentication	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	f	t
d468cefc-20b7-4a24-805e-9651bcd67744	registration	registration flow	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	t	t
ed05270a-1198-433d-8ebb-bbc9684e01c6	registration form	registration form	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	form-flow	f	t
8e0bfad0-b9b8-492c-b4ad-4a245ee853b0	reset credentials	Reset credentials for a user if they forgot their password or something	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	t	t
ca4c291a-67b5-4318-8039-c8b03976a4f4	Reset - Conditional OTP	Flow to determine if the OTP should be reset or not. Set to REQUIRED to force.	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	f	t
576fa06c-5ed0-46b5-908d-a2169f84fb4a	clients	Base authentication for clients	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	client-flow	t	t
eeefce3e-0b13-4368-94ff-8ef77b4c4f9a	first broker login	Actions taken after first broker login with identity provider account, which is not yet linked to any Keycloak account	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	t	t
17e7ef2c-341d-42aa-aacc-58cfd9d80b55	User creation or linking	Flow for the existing/non-existing user alternatives	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	f	t
c245ea68-6d15-4f42-9fb1-1b0a4f83e358	Handle Existing Account	Handle what to do if there is existing account with same email/username like authenticated identity provider	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	f	t
d4f37dda-d2e8-4c42-afd9-dc730b784270	Account verification options	Method with which to verity the existing account	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	f	t
6cf9f767-b72a-4542-904d-ec0920207403	Verify Existing Account by Re-authentication	Reauthentication of existing account	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	f	t
5c5985ef-9ac0-4916-aedf-ee57489917e3	First broker login - Conditional OTP	Flow to determine if the OTP is required for the authentication	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	f	t
01f57d80-ea99-4c76-8e42-d9083ceecac7	saml ecp	SAML ECP Profile Authentication Flow	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	t	t
a5e2dd03-cd14-4f69-bfce-ad7b7b454df1	docker auth	Used by Docker clients to authenticate against the IDP	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	basic-flow	t	t
9e9ed574-628b-4563-92fa-32ea502f920b	browser	browser based authentication	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	t	t
bc45db54-185f-4380-a1cb-976ae6434cda	forms	Username, password, otp and other auth forms.	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	f	t
9115a846-6d31-423c-bf0c-9ef2efc7e946	Browser - Conditional OTP	Flow to determine if the OTP is required for the authentication	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	f	t
2551c17b-6a68-4951-a32f-07a5ba2de15a	direct grant	OpenID Connect Resource Owner Grant	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	t	t
c32f00b3-cf49-43d2-9995-406553c563e0	Direct Grant - Conditional OTP	Flow to determine if the OTP is required for the authentication	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	f	t
e3f47bdb-34b8-467f-ae1c-4a5baeb1e673	registration	registration flow	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	t	t
f75f2961-d494-4a44-8546-911fdc0d3878	registration form	registration form	81407725-cab3-4c86-9e57-5dfbd60ae9c1	form-flow	f	t
49b9a780-1201-491b-8a51-a4213aff9eb8	reset credentials	Reset credentials for a user if they forgot their password or something	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	t	t
a509f63c-a1ca-4b1c-8d00-970b4c534715	Reset - Conditional OTP	Flow to determine if the OTP should be reset or not. Set to REQUIRED to force.	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	f	t
2dd9992e-23a5-400b-90c7-64b4d48eb81c	clients	Base authentication for clients	81407725-cab3-4c86-9e57-5dfbd60ae9c1	client-flow	t	t
1f0f1535-5c79-4a6a-8b3a-ba4a27a038bc	first broker login	Actions taken after first broker login with identity provider account, which is not yet linked to any Keycloak account	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	t	t
ba6fdf25-224b-4385-b414-132cb11c9cbf	User creation or linking	Flow for the existing/non-existing user alternatives	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	f	t
58a50963-7a2b-4c80-a166-0810c098c483	Handle Existing Account	Handle what to do if there is existing account with same email/username like authenticated identity provider	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	f	t
ced31c06-d716-491d-98a4-fe003b1ae2e5	Account verification options	Method with which to verity the existing account	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	f	t
7ca86d1f-0ef3-46f8-9b33-edf02cfd2c53	Verify Existing Account by Re-authentication	Reauthentication of existing account	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	f	t
9bd9d15f-7b33-4e73-ad1b-328cdbce0e73	First broker login - Conditional OTP	Flow to determine if the OTP is required for the authentication	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	f	t
0980dd8c-38de-4daa-a41d-26a4e574db45	saml ecp	SAML ECP Profile Authentication Flow	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	t	t
d6dcc9f0-f535-43a9-b272-9a84e3f6f1c4	docker auth	Used by Docker clients to authenticate against the IDP	81407725-cab3-4c86-9e57-5dfbd60ae9c1	basic-flow	t	t
\.


--
-- Data for Name: authenticator_config; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.authenticator_config (id, alias, realm_id) FROM stdin;
e170f6f3-d849-4de1-b880-88cc49fe7df2	review profile config	252774b0-8c55-4991-a6ff-6b8ecd8bcc75
87255cd9-9c6a-42ee-9547-5b36d3ff9100	create unique user config	252774b0-8c55-4991-a6ff-6b8ecd8bcc75
ac658bdc-feeb-4f5d-83a1-6c714fb582b3	review profile config	81407725-cab3-4c86-9e57-5dfbd60ae9c1
0429053b-cd7c-4b45-84c8-7cd0b34fd6b7	create unique user config	81407725-cab3-4c86-9e57-5dfbd60ae9c1
\.


--
-- Data for Name: authenticator_config_entry; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.authenticator_config_entry (authenticator_id, value, name) FROM stdin;
87255cd9-9c6a-42ee-9547-5b36d3ff9100	false	require.password.update.after.registration
e170f6f3-d849-4de1-b880-88cc49fe7df2	missing	update.profile.on.first.login
0429053b-cd7c-4b45-84c8-7cd0b34fd6b7	false	require.password.update.after.registration
ac658bdc-feeb-4f5d-83a1-6c714fb582b3	missing	update.profile.on.first.login
\.


--
-- Data for Name: broker_link; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.broker_link (identity_provider, storage_provider_id, realm_id, broker_user_id, broker_username, token, user_id) FROM stdin;
\.


--
-- Data for Name: cabors; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.cabors (id, name, description, icon_url, created_at, updated_at, kategori, total_medali, technical_delegate, status) FROM stdin;
c0000000-0000-0000-0000-000000000001	Sepak Bola	Sepak Bola	/assets/extracted/page8_img1.png	2026-07-08 06:29:03.241369+00	2026-07-08 06:29:03.241369+00		0		Aktif
c0000000-0000-0000-0000-000000000002	Selancar Ombak	Selancar Ombak	/assets/extracted/page8_img2.png	2026-07-08 06:29:03.241369+00	2026-07-08 06:29:03.241369+00		0		Aktif
c0000000-0000-0000-0000-000000000003	Hockey Indoor & Outdoor	Hockey Indoor & Outdoor	/assets/extracted/page8_img3.png	2026-07-08 06:29:03.241369+00	2026-07-08 06:29:03.241369+00		0		Aktif
c0000000-0000-0000-0000-000000000004	Sepak Takraw	Sepak Takraw	/assets/extracted/page8_img4.png	2026-07-08 06:29:03.241369+00	2026-07-08 06:29:03.241369+00		0		Aktif
c0000000-0000-0000-0000-000000000005	Menembak Outdoor	Menembak Outdoor	/assets/extracted/page8_img5.png	2026-07-08 06:29:03.241369+00	2026-07-08 06:29:03.241369+00		0		Aktif
c0000000-0000-0000-0000-000000000006	Golf	Golf	/assets/extracted/page8_img6.png	2026-07-08 06:29:03.241369+00	2026-07-08 06:29:03.241369+00		0		Aktif
c0000000-0000-0000-0000-000000000007	Karate	Karate	/assets/extracted/page8_img7.png	2026-07-08 06:29:03.241369+00	2026-07-08 06:29:03.241369+00		0		Aktif
c0000000-0000-0000-0000-000000000008	Floorball	Floorball	/assets/extracted/page8_img8.png	2026-07-08 06:29:03.241369+00	2026-07-08 06:29:03.241369+00		0		Aktif
c0000000-0000-0000-0000-000000000009	Basketball	Bola Basket 5x5 dan 3x3	/assets/extracted/page8_img9.png	2026-07-08 06:29:03.241369+00	2026-07-08 06:29:03.241369+00		0		Aktif
c0000000-0000-0000-0000-000000000010	Gateball	Gateball	/assets/extracted/page8_img10.png	2026-07-08 06:29:03.241369+00	2026-07-08 06:29:03.241369+00		0		Aktif
\.


--
-- Data for Name: city_guides; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.city_guides (id, title, category, description, address, image_url, created_at, updated_at) FROM stdin;
8627bef4-60f5-4970-8060-a30c08efbaec	Tamelo Rooftop Cafe	Coffee Shop	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
793e779a-54dc-4d2e-9807-eb9efca26eec	JPW Cafe	Coffee Shop	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
b36db6df-8324-4e48-bebf-daf886a9091a	Kopi Nako	Coffee Shop	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
5c7e19d3-5ec5-47cd-8bb7-9decad2b76d1	Coffee Toffee	Coffee Shop	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
40eab73a-d4bc-40a8-8d52-885bc48e0f59	D'Clan	Coffee Shop	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
80a05d47-a6b0-4900-88f7-53042a69d953	Kopitagram	Coffee Shop	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
51892850-8ffe-43c7-b9c5-71c0c1c76a53	Sedjuk Bakmi & Kopi	Coffee Shop	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
66de5f19-463e-4fa3-ade8-8054ad8973ac	Dadi's Cafe	Coffee Shop	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
1ff98fbb-de60-44dc-869d-66bec5d01c98	Bakoel Samara Resto	Wisata Kuliner	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
63d4b1ed-0e32-435b-8e3c-38be997d05ed	Saung Gandasari	Wisata Kuliner	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
439750f7-e8db-4cc5-89cc-02ef2098bb97	RM. Kampung Kecil	Wisata Kuliner	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
139339df-d887-4dfd-9f1b-e717cbfc428a	Saung Telaga	Wisata Kuliner	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
511c0641-cea8-4873-9db7-48d7e9b98bce	Pecak Sawangan	Wisata Kuliner	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
6e1bc7db-6591-49a5-9efa-8c1149971494	Pondok Zidane	Tempat Menginap	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
f8421c76-6cc4-4693-b524-2f5d1b5ad911	Hotel Nonies Huis	Tempat Menginap	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
1c633f0a-ea54-4dad-bbcf-8b3db5230c0a	Apartemen Royal Garden	Tempat Menginap	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
306f1880-436e-49d6-b05b-eeb150ff5527	Newly Hotel Indonesia	Tempat Menginap	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
364d69a7-b23b-40d5-bd5c-ad3148fd569a	Daima Suites Margonda	Tempat Menginap	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
43b9dbce-f39c-4268-9e36-bb2dac3b122e	D'Kandang Amazing	Wisata Buatan	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
3b10f3a3-4cbd-4fe0-aa9f-57aa4dca0241	Godong Ijo	Wisata Buatan	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
ce4a53cf-df3f-4645-a5c3-98f976c3197e	Taman Herbal Insani	Wisata Buatan	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
192e0904-a23a-427f-8a2a-79d2e96a18fd	Telaga Arwana Cibubur	Wisata Buatan	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
e0abd2c1-1565-4d93-af34-de28d58caac7	Situ Jatijajar	Wisata Situ	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
bfab2c7d-3cd9-4478-a484-eeffee1d488e	Situ Cilodong	Wisata Situ	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
02bc40b4-a181-47b2-9cea-1bfd67b846f9	Situ Sidamukti	Wisata Situ	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
210099b6-2387-4ab8-8a7a-3f9f7955b286	ITC Depok	Pusat Perbelanjaan	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
d5c9df4e-1b18-4ba3-9208-2896a94a7d12	Depok Mall	Pusat Perbelanjaan	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
df5584e2-504c-4004-b9d6-1d540f0a4ab7	Depok Town Square	Pusat Perbelanjaan	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
fea6c70f-8019-481e-a0d5-652038f23a2c	Margo City	Pusat Perbelanjaan	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
16f683c7-ce47-4161-848e-705149148238	Rumah Sakit Brawijaya	Rumah Sakit	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
f6f67681-1372-4b6c-88f2-fab4472d642f	Mitra Keluarga Cibubur	Rumah Sakit	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
bbdd6272-1581-4cba-a211-8f81662db62c	Rumah Sakit Universitas Indonesia	Rumah Sakit	\N	Depok	\N	2026-07-08 06:29:03.246261+00	2026-07-08 06:29:03.246261+00
400d695d-b4d0-4980-9163-9954c1cc9021	Tamelo Rooftop Cafe	Coffee Shop	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
c37de450-9618-42a3-b436-eefdf84e31b1	JPW Cafe	Coffee Shop	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
d25a7c57-12e7-42f2-a16f-a8ecf7100997	Kopi Nako	Coffee Shop	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
cf5a9ee8-51d3-47ef-8b2a-905504ada166	Coffee Toffee	Coffee Shop	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
c353803a-ad13-44d5-a5a3-68a07269964c	D'Clan	Coffee Shop	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
2cac3fee-87cf-4ea9-bc54-70d00e8e6253	Kopitagram	Coffee Shop	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
af14a13c-08d4-444a-860e-5f116b3d53af	Sedjuk Bakmi & Kopi	Coffee Shop	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
605311ce-4ac9-46de-86d5-661a69e4c608	Dadi's Cafe	Coffee Shop	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
688bb9d8-ab44-48bf-b4fb-3f7ca7be2dbc	Bakoel Samara Resto	Wisata Kuliner	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
e2c28b43-f796-49ef-9e99-3037fbd610bd	Saung Gandasari	Wisata Kuliner	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
578a2215-d3f7-44e4-8017-8601bec0c78c	RM. Kampung Kecil	Wisata Kuliner	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
dc575446-34bb-467f-9068-d83c59d90df2	Saung Telaga	Wisata Kuliner	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
b490929d-0d98-4c4e-ad22-31a03302ed1a	Pecak Sawangan	Wisata Kuliner	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
d6b98382-ef0b-45ca-a54f-e36ba773a3b3	Pondok Zidane	Tempat Menginap	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
304852b1-0fcb-456c-9648-37e4b424a9bb	Hotel Nonies Huis	Tempat Menginap	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
ead95be7-82a9-47b6-bed5-ab731e8f8430	Apartemen Royal Garden	Tempat Menginap	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
eda4e2e7-9a05-4835-8071-43c989a9ec96	Newly Hotel Indonesia	Tempat Menginap	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
ad4553eb-0b61-44d3-9036-d93aa9aa44c3	Daima Suites Margonda	Tempat Menginap	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
9d27315c-af6e-4f6e-8f3b-253033d34154	D'Kandang Amazing	Wisata Buatan	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
8ebd29c4-14ac-4119-8d07-367a2f7f56c0	Godong Ijo	Wisata Buatan	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
001c78a5-fb20-4287-9379-80bb2278180b	Taman Herbal Insani	Wisata Buatan	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
51c92420-340d-41b6-82cc-c5bd35bd3c62	Telaga Arwana Cibubur	Wisata Buatan	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
3097004e-bc64-4b06-8916-40ea310a0004	Situ Jatijajar	Wisata Situ	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
dfcdd95b-e726-470d-8f34-c6b446e8b57c	Situ Cilodong	Wisata Situ	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
4f3ea8da-cdce-455e-827d-a5059abb7b93	Situ Sidamukti	Wisata Situ	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
0838008d-742a-4331-8b40-7e7d5f5549dc	ITC Depok	Pusat Perbelanjaan	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
8357313b-37ac-44db-a5fd-4171133ee4b4	Depok Mall	Pusat Perbelanjaan	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
a4c4366c-d0b1-4c53-b1f8-c307af6d7522	Depok Town Square	Pusat Perbelanjaan	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
bbab7c5d-5d93-4e3a-97a6-85f2485b04ff	Margo City	Pusat Perbelanjaan	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
0a96b162-a844-4271-91e6-b4b80b8eaf06	Rumah Sakit Brawijaya	Rumah Sakit	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
d718b044-0a83-453f-91be-607864ca2bda	Mitra Keluarga Cibubur	Rumah Sakit	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
7485dae4-38e5-4d6f-b3f0-939ebaa4d8c8	Rumah Sakit Universitas Indonesia	Rumah Sakit	\N	Depok	\N	2026-07-08 06:31:00.487859+00	2026-07-08 06:31:00.487859+00
e40f2575-b54a-4a72-9afe-d45984517315	Tamelo Rooftop Cafe	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
cec8bf06-9aa7-4cca-8eef-08b0f0332d10	JPW Cafe	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
f3d79e31-21e2-4225-b67a-4078308a0c5c	Kopi Nako	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
65da45a0-075c-46b2-8178-efd8a2d0bf2e	Coffee Toffee	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
c09ca498-ad38-4c8a-a739-c289aec8223d	D'Clan	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
0548fe38-2127-46c2-b24a-3e830b3a5b84	Kopitagram	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
aef6ab65-4e09-4878-9fa2-daba69f0e93c	Sedjuk Bakmi & Kopi	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
28f39b16-e70d-43f7-a50e-650c65f2f9cf	Dadi's Cafe	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
5b543377-fd78-4673-8727-aacd8a0a392c	Bakoel Samara Resto	Wisata Kuliner	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
9feccf39-2807-444e-84a6-60f60433401f	Saung Gandasari	Wisata Kuliner	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
1ff91ed9-3416-4845-bf96-288dec7efc81	RM. Kampung Kecil	Wisata Kuliner	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
bb340e17-53e5-46da-8b73-ef60ecdaecc4	Saung Telaga	Wisata Kuliner	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
91fb0e3f-70fc-45e2-afbd-b31feb74da8c	Pecak Sawangan	Wisata Kuliner	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
62badb51-25ab-4220-8b03-2c6d25c5db28	Pondok Zidane	Tempat Menginap	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
36bc0c74-002a-4395-bc46-1f5db15dd642	Hotel Nonies Huis	Tempat Menginap	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
93fe0f45-b796-4742-9382-64e026c85228	Apartemen Royal Garden	Tempat Menginap	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
8615f89c-9bf9-4cab-8cca-40272edd64d8	Newly Hotel Indonesia	Tempat Menginap	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
9110774c-cf13-4590-b72f-697687bf546d	Daima Suites Margonda	Tempat Menginap	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
f21d814d-0307-4535-846e-876c849a9002	D'Kandang Amazing	Wisata Buatan	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
1f942438-08c9-4322-ac63-ab03db12fb8b	Godong Ijo	Wisata Buatan	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
ed45c1bc-9482-43f2-a4cc-649a8bf4d380	Taman Herbal Insani	Wisata Buatan	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
6eeb3c0e-e86d-4158-b808-a40dbcc4cbe9	Telaga Arwana Cibubur	Wisata Buatan	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
bb6e74d3-2b02-4db7-84de-11235f3835c7	Situ Jatijajar	Wisata Situ	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
bd2cf5fd-98d1-4703-837b-f9168b7de163	Situ Cilodong	Wisata Situ	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
9f381b70-b516-4e02-928c-dcfc132c18bb	Situ Sidamukti	Wisata Situ	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
0e539f20-8370-4d22-82aa-db05ff2672f7	ITC Depok	Pusat Perbelanjaan	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
be4320a3-159e-486f-a23d-2fa18e06fd7b	Depok Mall	Pusat Perbelanjaan	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
5cbe2324-3855-4e7b-a35f-953cfd9ba227	Depok Town Square	Pusat Perbelanjaan	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
776d6c89-8e06-4df3-bac1-d6d00ac7b1d5	Margo City	Pusat Perbelanjaan	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
101ed9cd-3392-4366-bd71-5a62578e7d2c	Rumah Sakit Brawijaya	Rumah Sakit	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
0f6988e7-86c0-4a21-8e82-d5ee9b1fabd0	Mitra Keluarga Cibubur	Rumah Sakit	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
2cd363a4-7517-40e5-98db-fef54549c45b	Rumah Sakit Universitas Indonesia	Rumah Sakit	\N	Depok	\N	2026-07-09 08:48:30.7019+00	2026-07-09 08:48:30.7019+00
af13a2f0-8fa9-47d0-a3aa-0a0cff932e3a	Tamelo Rooftop Cafe	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
a4cd3f68-2b58-47a2-98a5-d5a0d555aa76	JPW Cafe	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
d11e143b-7f68-41fc-b283-5d80af4b39fa	Kopi Nako	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
ce6f5dda-f1b4-4fd2-9f24-4f30b375065e	Coffee Toffee	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
9cff35c5-ba7b-42d9-88c9-d5d153156057	D'Clan	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
8a6f27f7-3417-4e9a-bbb9-9f53ab2762e6	Kopitagram	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
bd71dc5b-9f1a-4962-b837-4a40fc07d924	Sedjuk Bakmi & Kopi	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
f0436366-6a7c-4fdd-9780-0c0e066a9668	Dadi's Cafe	Coffee Shop	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
ae073510-48cc-4ab1-89c5-2311de8bfc8c	Bakoel Samara Resto	Wisata Kuliner	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
e35e20cd-3373-4ddd-8071-d2e023295d35	Saung Gandasari	Wisata Kuliner	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
a0008994-36d3-4aae-8e1d-e6613f002ecd	RM. Kampung Kecil	Wisata Kuliner	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
4c4dfd5b-280f-40c7-96a0-6260a2e71366	Saung Telaga	Wisata Kuliner	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
d3f0a056-17b8-49b4-b332-0f8075ff9310	Pecak Sawangan	Wisata Kuliner	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
2ab59c9f-7cba-4198-92d8-905d31c4f578	Pondok Zidane	Tempat Menginap	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
a655ee01-51ba-411c-b846-2324745502eb	Hotel Nonies Huis	Tempat Menginap	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
296ba6a6-70de-4d5d-bea0-7d648d8adc87	Apartemen Royal Garden	Tempat Menginap	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
4813cf6e-8720-4231-9653-6ade9528d233	Newly Hotel Indonesia	Tempat Menginap	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
80f6a0ea-5c17-4f76-88ff-8ba6f172d150	Daima Suites Margonda	Tempat Menginap	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
c3ae6f3a-948b-4cc1-a733-7da7d78f4735	D'Kandang Amazing	Wisata Buatan	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
f65c0bb4-d841-4c37-a444-fa6c136d3a1d	Godong Ijo	Wisata Buatan	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
f52c0d7a-806f-4770-b579-527968a33ddb	Taman Herbal Insani	Wisata Buatan	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
3c519e34-a1dd-451c-83eb-71594279bd0c	Telaga Arwana Cibubur	Wisata Buatan	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
7e1540d0-4f63-4ec6-a6c1-3929b0ced719	Situ Jatijajar	Wisata Situ	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
2a25d9a0-f65f-42f8-8e70-9db8b394a374	Situ Cilodong	Wisata Situ	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
f4ef2f66-a401-4f06-b3b8-a77e15acded7	Situ Sidamukti	Wisata Situ	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
6346135a-1721-4e17-a3de-80effc048a75	ITC Depok	Pusat Perbelanjaan	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
9943753c-5bba-4331-80cd-5b594a7ba44d	Depok Mall	Pusat Perbelanjaan	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
c7d477ad-c5ec-4183-a4fb-7fb42b340f86	Depok Town Square	Pusat Perbelanjaan	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
8f2e48fe-eed1-4d68-b0e1-ade333a07fda	Margo City	Pusat Perbelanjaan	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
8943102c-8ca7-4428-a574-252050fa1d74	Rumah Sakit Brawijaya	Rumah Sakit	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
a8914a60-4495-454c-8fd3-8238b4fbf086	Mitra Keluarga Cibubur	Rumah Sakit	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
b001d954-615f-40ae-b90f-ef0aaf96581d	Rumah Sakit Universitas Indonesia	Rumah Sakit	\N	Depok	\N	2026-07-09 08:48:46.589321+00	2026-07-09 08:48:46.589321+00
\.


--
-- Data for Name: client; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client (id, enabled, full_scope_allowed, client_id, not_before, public_client, secret, base_url, bearer_only, management_url, surrogate_auth_required, realm_id, protocol, node_rereg_timeout, frontchannel_logout, consent_required, name, service_accounts_enabled, client_authenticator_type, root_url, description, registration_token, standard_flow_enabled, implicit_flow_enabled, direct_access_grants_enabled, always_display_in_console) FROM stdin;
9412a86d-4c55-4e39-b797-7f9239c20c0d	t	f	master-realm	0	f	\N	\N	t	\N	f	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N	0	f	f	master Realm	f	client-secret	\N	\N	\N	t	f	f	f
d4521e1e-84c7-4b33-b982-056ba57f8928	t	f	account	0	t	\N	/realms/master/account/	f	\N	f	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	openid-connect	0	f	f	${client_account}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	t	f	account-console	0	t	\N	/realms/master/account/	f	\N	f	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	openid-connect	0	f	f	${client_account-console}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
768c1510-8715-4637-8169-230084c0c212	t	f	broker	0	f	\N	\N	t	\N	f	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	openid-connect	0	f	f	${client_broker}	f	client-secret	\N	\N	\N	t	f	f	f
0ff83107-f980-4fe5-9571-fda3de2c72ad	t	f	security-admin-console	0	t	\N	/admin/master/console/	f	\N	f	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	openid-connect	0	f	f	${client_security-admin-console}	f	client-secret	${authAdminUrl}	\N	\N	t	f	f	f
58aa69ee-e0fa-4fcd-9433-11176543abaf	t	f	admin-cli	0	t	\N	\N	f	\N	f	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	openid-connect	0	f	f	${client_admin-cli}	f	client-secret	\N	\N	\N	f	f	t	f
9c11e110-0483-4223-8f3d-431c76cdc7a1	t	f	porprov-realm	0	f	\N	\N	t	\N	f	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N	0	f	f	porprov Realm	f	client-secret	\N	\N	\N	t	f	f	f
609354c7-799d-4df2-ac46-f65b30be8568	t	f	realm-management	0	f	\N	\N	t	\N	f	81407725-cab3-4c86-9e57-5dfbd60ae9c1	openid-connect	0	f	f	${client_realm-management}	f	client-secret	\N	\N	\N	t	f	f	f
f5832c79-96f4-4f22-8504-e4175dea30ab	t	f	account	0	t	\N	/realms/porprov/account/	f	\N	f	81407725-cab3-4c86-9e57-5dfbd60ae9c1	openid-connect	0	f	f	${client_account}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
d4ae43b8-c3fe-45bd-8a99-7106f8956005	t	f	account-console	0	t	\N	/realms/porprov/account/	f	\N	f	81407725-cab3-4c86-9e57-5dfbd60ae9c1	openid-connect	0	f	f	${client_account-console}	f	client-secret	${authBaseUrl}	\N	\N	t	f	f	f
3a74947a-1491-470f-bfee-35ea7024cf9b	t	f	broker	0	f	\N	\N	t	\N	f	81407725-cab3-4c86-9e57-5dfbd60ae9c1	openid-connect	0	f	f	${client_broker}	f	client-secret	\N	\N	\N	t	f	f	f
c76139e0-33c9-45e7-ad54-593f40ea79cd	t	f	security-admin-console	0	t	\N	/admin/porprov/console/	f	\N	f	81407725-cab3-4c86-9e57-5dfbd60ae9c1	openid-connect	0	f	f	${client_security-admin-console}	f	client-secret	${authAdminUrl}	\N	\N	t	f	f	f
e17bcbb9-b64d-4ced-bacd-b6a3a26e7246	t	f	admin-cli	0	t	\N	\N	f	\N	f	81407725-cab3-4c86-9e57-5dfbd60ae9c1	openid-connect	0	f	f	${client_admin-cli}	f	client-secret	\N	\N	\N	f	f	t	f
ac15b0b1-470c-48d5-90de-70a5ad10bc80	t	t	porprov-admin-web	0	t	\N	\N	f	\N	f	81407725-cab3-4c86-9e57-5dfbd60ae9c1	openid-connect	-1	f	f	\N	f	client-secret	\N	\N	\N	t	f	f	f
65fbdf68-3759-4999-b63f-dc572777adc7	t	t	porprov-mobile-admin	0	t	\N	\N	f	\N	f	81407725-cab3-4c86-9e57-5dfbd60ae9c1	openid-connect	-1	f	f	\N	f	client-secret	\N	\N	\N	t	f	t	f
71e0ee67-90a8-433a-9af5-65a902688daa	t	t	porprov-backend-service	0	f	backend_secret	\N	f	\N	f	81407725-cab3-4c86-9e57-5dfbd60ae9c1	openid-connect	-1	f	f	\N	t	client-secret	\N	\N	\N	f	f	f	f
\.


--
-- Data for Name: client_attributes; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_attributes (client_id, name, value) FROM stdin;
d4521e1e-84c7-4b33-b982-056ba57f8928	post.logout.redirect.uris	+
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	post.logout.redirect.uris	+
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	pkce.code.challenge.method	S256
0ff83107-f980-4fe5-9571-fda3de2c72ad	post.logout.redirect.uris	+
0ff83107-f980-4fe5-9571-fda3de2c72ad	pkce.code.challenge.method	S256
f5832c79-96f4-4f22-8504-e4175dea30ab	post.logout.redirect.uris	+
d4ae43b8-c3fe-45bd-8a99-7106f8956005	post.logout.redirect.uris	+
d4ae43b8-c3fe-45bd-8a99-7106f8956005	pkce.code.challenge.method	S256
c76139e0-33c9-45e7-ad54-593f40ea79cd	post.logout.redirect.uris	+
c76139e0-33c9-45e7-ad54-593f40ea79cd	pkce.code.challenge.method	S256
ac15b0b1-470c-48d5-90de-70a5ad10bc80	pkce.code.challenge.method	S256
\.


--
-- Data for Name: client_auth_flow_bindings; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_auth_flow_bindings (client_id, flow_id, binding_name) FROM stdin;
\.


--
-- Data for Name: client_initial_access; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_initial_access (id, realm_id, "timestamp", expiration, count, remaining_count) FROM stdin;
\.


--
-- Data for Name: client_node_registrations; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_node_registrations (client_id, value, name) FROM stdin;
\.


--
-- Data for Name: client_scope; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_scope (id, name, realm_id, description, protocol) FROM stdin;
73348c55-dc67-4f9d-90b4-426b0ff8dd5e	offline_access	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	OpenID Connect built-in scope: offline_access	openid-connect
f7ee9263-7df1-4787-b332-a141c9988a92	role_list	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	SAML role list	saml
5fef7423-c3c4-482a-aee0-38838ff9bf94	profile	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	OpenID Connect built-in scope: profile	openid-connect
270c3296-0bf9-483e-bc48-a4a2f1b306b6	email	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	OpenID Connect built-in scope: email	openid-connect
70455d37-9b31-4351-9897-2abf64c827dd	address	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	OpenID Connect built-in scope: address	openid-connect
e0361c9f-4ca7-4b68-96df-1d7800e65705	phone	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	OpenID Connect built-in scope: phone	openid-connect
d900d703-375a-4cc0-a4ad-13de9c65f47e	roles	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	OpenID Connect scope for add user roles to the access token	openid-connect
58f158f2-7d61-4210-89ae-a2fe0d012592	web-origins	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	OpenID Connect scope for add allowed web origins to the access token	openid-connect
388bc21a-1250-4870-b331-5a0912e25bac	microprofile-jwt	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	Microprofile - JWT built-in scope	openid-connect
432dd6ab-31b4-468d-a3c8-dc73bc12cd31	acr	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	OpenID Connect scope for add acr (authentication context class reference) to the token	openid-connect
c33558d0-acf2-451c-99e0-31ddf2125ec3	offline_access	81407725-cab3-4c86-9e57-5dfbd60ae9c1	OpenID Connect built-in scope: offline_access	openid-connect
4f35038e-2f68-4a14-896f-2e853dfa3664	role_list	81407725-cab3-4c86-9e57-5dfbd60ae9c1	SAML role list	saml
8d4106ba-a05a-45fa-a766-37337d6571d5	profile	81407725-cab3-4c86-9e57-5dfbd60ae9c1	OpenID Connect built-in scope: profile	openid-connect
3f544efc-c545-4945-a597-e546b652b878	email	81407725-cab3-4c86-9e57-5dfbd60ae9c1	OpenID Connect built-in scope: email	openid-connect
9ce0984f-ac09-4d06-bd52-ca90f3e37d13	address	81407725-cab3-4c86-9e57-5dfbd60ae9c1	OpenID Connect built-in scope: address	openid-connect
72058ae9-c3f7-4ebb-aea2-0304ed5c3786	phone	81407725-cab3-4c86-9e57-5dfbd60ae9c1	OpenID Connect built-in scope: phone	openid-connect
8d4f60a8-478a-4c56-9685-bffc8ff48a2c	roles	81407725-cab3-4c86-9e57-5dfbd60ae9c1	OpenID Connect scope for add user roles to the access token	openid-connect
8de68a90-fc00-4e2e-9d8e-890c1e8e4700	web-origins	81407725-cab3-4c86-9e57-5dfbd60ae9c1	OpenID Connect scope for add allowed web origins to the access token	openid-connect
b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	microprofile-jwt	81407725-cab3-4c86-9e57-5dfbd60ae9c1	Microprofile - JWT built-in scope	openid-connect
7d448375-40de-4386-bf2f-bb56d7f9e1a2	acr	81407725-cab3-4c86-9e57-5dfbd60ae9c1	OpenID Connect scope for add acr (authentication context class reference) to the token	openid-connect
\.


--
-- Data for Name: client_scope_attributes; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_scope_attributes (scope_id, value, name) FROM stdin;
73348c55-dc67-4f9d-90b4-426b0ff8dd5e	true	display.on.consent.screen
73348c55-dc67-4f9d-90b4-426b0ff8dd5e	${offlineAccessScopeConsentText}	consent.screen.text
f7ee9263-7df1-4787-b332-a141c9988a92	true	display.on.consent.screen
f7ee9263-7df1-4787-b332-a141c9988a92	${samlRoleListScopeConsentText}	consent.screen.text
5fef7423-c3c4-482a-aee0-38838ff9bf94	true	display.on.consent.screen
5fef7423-c3c4-482a-aee0-38838ff9bf94	${profileScopeConsentText}	consent.screen.text
5fef7423-c3c4-482a-aee0-38838ff9bf94	true	include.in.token.scope
270c3296-0bf9-483e-bc48-a4a2f1b306b6	true	display.on.consent.screen
270c3296-0bf9-483e-bc48-a4a2f1b306b6	${emailScopeConsentText}	consent.screen.text
270c3296-0bf9-483e-bc48-a4a2f1b306b6	true	include.in.token.scope
70455d37-9b31-4351-9897-2abf64c827dd	true	display.on.consent.screen
70455d37-9b31-4351-9897-2abf64c827dd	${addressScopeConsentText}	consent.screen.text
70455d37-9b31-4351-9897-2abf64c827dd	true	include.in.token.scope
e0361c9f-4ca7-4b68-96df-1d7800e65705	true	display.on.consent.screen
e0361c9f-4ca7-4b68-96df-1d7800e65705	${phoneScopeConsentText}	consent.screen.text
e0361c9f-4ca7-4b68-96df-1d7800e65705	true	include.in.token.scope
d900d703-375a-4cc0-a4ad-13de9c65f47e	true	display.on.consent.screen
d900d703-375a-4cc0-a4ad-13de9c65f47e	${rolesScopeConsentText}	consent.screen.text
d900d703-375a-4cc0-a4ad-13de9c65f47e	false	include.in.token.scope
58f158f2-7d61-4210-89ae-a2fe0d012592	false	display.on.consent.screen
58f158f2-7d61-4210-89ae-a2fe0d012592		consent.screen.text
58f158f2-7d61-4210-89ae-a2fe0d012592	false	include.in.token.scope
388bc21a-1250-4870-b331-5a0912e25bac	false	display.on.consent.screen
388bc21a-1250-4870-b331-5a0912e25bac	true	include.in.token.scope
432dd6ab-31b4-468d-a3c8-dc73bc12cd31	false	display.on.consent.screen
432dd6ab-31b4-468d-a3c8-dc73bc12cd31	false	include.in.token.scope
c33558d0-acf2-451c-99e0-31ddf2125ec3	true	display.on.consent.screen
c33558d0-acf2-451c-99e0-31ddf2125ec3	${offlineAccessScopeConsentText}	consent.screen.text
4f35038e-2f68-4a14-896f-2e853dfa3664	true	display.on.consent.screen
4f35038e-2f68-4a14-896f-2e853dfa3664	${samlRoleListScopeConsentText}	consent.screen.text
8d4106ba-a05a-45fa-a766-37337d6571d5	true	display.on.consent.screen
8d4106ba-a05a-45fa-a766-37337d6571d5	${profileScopeConsentText}	consent.screen.text
8d4106ba-a05a-45fa-a766-37337d6571d5	true	include.in.token.scope
3f544efc-c545-4945-a597-e546b652b878	true	display.on.consent.screen
3f544efc-c545-4945-a597-e546b652b878	${emailScopeConsentText}	consent.screen.text
3f544efc-c545-4945-a597-e546b652b878	true	include.in.token.scope
9ce0984f-ac09-4d06-bd52-ca90f3e37d13	true	display.on.consent.screen
9ce0984f-ac09-4d06-bd52-ca90f3e37d13	${addressScopeConsentText}	consent.screen.text
9ce0984f-ac09-4d06-bd52-ca90f3e37d13	true	include.in.token.scope
72058ae9-c3f7-4ebb-aea2-0304ed5c3786	true	display.on.consent.screen
72058ae9-c3f7-4ebb-aea2-0304ed5c3786	${phoneScopeConsentText}	consent.screen.text
72058ae9-c3f7-4ebb-aea2-0304ed5c3786	true	include.in.token.scope
8d4f60a8-478a-4c56-9685-bffc8ff48a2c	true	display.on.consent.screen
8d4f60a8-478a-4c56-9685-bffc8ff48a2c	${rolesScopeConsentText}	consent.screen.text
8d4f60a8-478a-4c56-9685-bffc8ff48a2c	false	include.in.token.scope
8de68a90-fc00-4e2e-9d8e-890c1e8e4700	false	display.on.consent.screen
8de68a90-fc00-4e2e-9d8e-890c1e8e4700		consent.screen.text
8de68a90-fc00-4e2e-9d8e-890c1e8e4700	false	include.in.token.scope
b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	false	display.on.consent.screen
b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	true	include.in.token.scope
7d448375-40de-4386-bf2f-bb56d7f9e1a2	false	display.on.consent.screen
7d448375-40de-4386-bf2f-bb56d7f9e1a2	false	include.in.token.scope
\.


--
-- Data for Name: client_scope_client; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_scope_client (client_id, scope_id, default_scope) FROM stdin;
d4521e1e-84c7-4b33-b982-056ba57f8928	5fef7423-c3c4-482a-aee0-38838ff9bf94	t
d4521e1e-84c7-4b33-b982-056ba57f8928	d900d703-375a-4cc0-a4ad-13de9c65f47e	t
d4521e1e-84c7-4b33-b982-056ba57f8928	58f158f2-7d61-4210-89ae-a2fe0d012592	t
d4521e1e-84c7-4b33-b982-056ba57f8928	270c3296-0bf9-483e-bc48-a4a2f1b306b6	t
d4521e1e-84c7-4b33-b982-056ba57f8928	432dd6ab-31b4-468d-a3c8-dc73bc12cd31	t
d4521e1e-84c7-4b33-b982-056ba57f8928	70455d37-9b31-4351-9897-2abf64c827dd	f
d4521e1e-84c7-4b33-b982-056ba57f8928	73348c55-dc67-4f9d-90b4-426b0ff8dd5e	f
d4521e1e-84c7-4b33-b982-056ba57f8928	e0361c9f-4ca7-4b68-96df-1d7800e65705	f
d4521e1e-84c7-4b33-b982-056ba57f8928	388bc21a-1250-4870-b331-5a0912e25bac	f
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	5fef7423-c3c4-482a-aee0-38838ff9bf94	t
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	d900d703-375a-4cc0-a4ad-13de9c65f47e	t
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	58f158f2-7d61-4210-89ae-a2fe0d012592	t
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	270c3296-0bf9-483e-bc48-a4a2f1b306b6	t
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	432dd6ab-31b4-468d-a3c8-dc73bc12cd31	t
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	70455d37-9b31-4351-9897-2abf64c827dd	f
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	73348c55-dc67-4f9d-90b4-426b0ff8dd5e	f
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	e0361c9f-4ca7-4b68-96df-1d7800e65705	f
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	388bc21a-1250-4870-b331-5a0912e25bac	f
58aa69ee-e0fa-4fcd-9433-11176543abaf	5fef7423-c3c4-482a-aee0-38838ff9bf94	t
58aa69ee-e0fa-4fcd-9433-11176543abaf	d900d703-375a-4cc0-a4ad-13de9c65f47e	t
58aa69ee-e0fa-4fcd-9433-11176543abaf	58f158f2-7d61-4210-89ae-a2fe0d012592	t
58aa69ee-e0fa-4fcd-9433-11176543abaf	270c3296-0bf9-483e-bc48-a4a2f1b306b6	t
58aa69ee-e0fa-4fcd-9433-11176543abaf	432dd6ab-31b4-468d-a3c8-dc73bc12cd31	t
58aa69ee-e0fa-4fcd-9433-11176543abaf	70455d37-9b31-4351-9897-2abf64c827dd	f
58aa69ee-e0fa-4fcd-9433-11176543abaf	73348c55-dc67-4f9d-90b4-426b0ff8dd5e	f
58aa69ee-e0fa-4fcd-9433-11176543abaf	e0361c9f-4ca7-4b68-96df-1d7800e65705	f
58aa69ee-e0fa-4fcd-9433-11176543abaf	388bc21a-1250-4870-b331-5a0912e25bac	f
768c1510-8715-4637-8169-230084c0c212	5fef7423-c3c4-482a-aee0-38838ff9bf94	t
768c1510-8715-4637-8169-230084c0c212	d900d703-375a-4cc0-a4ad-13de9c65f47e	t
768c1510-8715-4637-8169-230084c0c212	58f158f2-7d61-4210-89ae-a2fe0d012592	t
768c1510-8715-4637-8169-230084c0c212	270c3296-0bf9-483e-bc48-a4a2f1b306b6	t
768c1510-8715-4637-8169-230084c0c212	432dd6ab-31b4-468d-a3c8-dc73bc12cd31	t
768c1510-8715-4637-8169-230084c0c212	70455d37-9b31-4351-9897-2abf64c827dd	f
768c1510-8715-4637-8169-230084c0c212	73348c55-dc67-4f9d-90b4-426b0ff8dd5e	f
768c1510-8715-4637-8169-230084c0c212	e0361c9f-4ca7-4b68-96df-1d7800e65705	f
768c1510-8715-4637-8169-230084c0c212	388bc21a-1250-4870-b331-5a0912e25bac	f
9412a86d-4c55-4e39-b797-7f9239c20c0d	5fef7423-c3c4-482a-aee0-38838ff9bf94	t
9412a86d-4c55-4e39-b797-7f9239c20c0d	d900d703-375a-4cc0-a4ad-13de9c65f47e	t
9412a86d-4c55-4e39-b797-7f9239c20c0d	58f158f2-7d61-4210-89ae-a2fe0d012592	t
9412a86d-4c55-4e39-b797-7f9239c20c0d	270c3296-0bf9-483e-bc48-a4a2f1b306b6	t
9412a86d-4c55-4e39-b797-7f9239c20c0d	432dd6ab-31b4-468d-a3c8-dc73bc12cd31	t
9412a86d-4c55-4e39-b797-7f9239c20c0d	70455d37-9b31-4351-9897-2abf64c827dd	f
9412a86d-4c55-4e39-b797-7f9239c20c0d	73348c55-dc67-4f9d-90b4-426b0ff8dd5e	f
9412a86d-4c55-4e39-b797-7f9239c20c0d	e0361c9f-4ca7-4b68-96df-1d7800e65705	f
9412a86d-4c55-4e39-b797-7f9239c20c0d	388bc21a-1250-4870-b331-5a0912e25bac	f
0ff83107-f980-4fe5-9571-fda3de2c72ad	5fef7423-c3c4-482a-aee0-38838ff9bf94	t
0ff83107-f980-4fe5-9571-fda3de2c72ad	d900d703-375a-4cc0-a4ad-13de9c65f47e	t
0ff83107-f980-4fe5-9571-fda3de2c72ad	58f158f2-7d61-4210-89ae-a2fe0d012592	t
0ff83107-f980-4fe5-9571-fda3de2c72ad	270c3296-0bf9-483e-bc48-a4a2f1b306b6	t
0ff83107-f980-4fe5-9571-fda3de2c72ad	432dd6ab-31b4-468d-a3c8-dc73bc12cd31	t
0ff83107-f980-4fe5-9571-fda3de2c72ad	70455d37-9b31-4351-9897-2abf64c827dd	f
0ff83107-f980-4fe5-9571-fda3de2c72ad	73348c55-dc67-4f9d-90b4-426b0ff8dd5e	f
0ff83107-f980-4fe5-9571-fda3de2c72ad	e0361c9f-4ca7-4b68-96df-1d7800e65705	f
0ff83107-f980-4fe5-9571-fda3de2c72ad	388bc21a-1250-4870-b331-5a0912e25bac	f
f5832c79-96f4-4f22-8504-e4175dea30ab	7d448375-40de-4386-bf2f-bb56d7f9e1a2	t
f5832c79-96f4-4f22-8504-e4175dea30ab	3f544efc-c545-4945-a597-e546b652b878	t
f5832c79-96f4-4f22-8504-e4175dea30ab	8d4f60a8-478a-4c56-9685-bffc8ff48a2c	t
f5832c79-96f4-4f22-8504-e4175dea30ab	8d4106ba-a05a-45fa-a766-37337d6571d5	t
f5832c79-96f4-4f22-8504-e4175dea30ab	8de68a90-fc00-4e2e-9d8e-890c1e8e4700	t
f5832c79-96f4-4f22-8504-e4175dea30ab	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	f
f5832c79-96f4-4f22-8504-e4175dea30ab	9ce0984f-ac09-4d06-bd52-ca90f3e37d13	f
f5832c79-96f4-4f22-8504-e4175dea30ab	72058ae9-c3f7-4ebb-aea2-0304ed5c3786	f
f5832c79-96f4-4f22-8504-e4175dea30ab	c33558d0-acf2-451c-99e0-31ddf2125ec3	f
d4ae43b8-c3fe-45bd-8a99-7106f8956005	7d448375-40de-4386-bf2f-bb56d7f9e1a2	t
d4ae43b8-c3fe-45bd-8a99-7106f8956005	3f544efc-c545-4945-a597-e546b652b878	t
d4ae43b8-c3fe-45bd-8a99-7106f8956005	8d4f60a8-478a-4c56-9685-bffc8ff48a2c	t
d4ae43b8-c3fe-45bd-8a99-7106f8956005	8d4106ba-a05a-45fa-a766-37337d6571d5	t
d4ae43b8-c3fe-45bd-8a99-7106f8956005	8de68a90-fc00-4e2e-9d8e-890c1e8e4700	t
d4ae43b8-c3fe-45bd-8a99-7106f8956005	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	f
d4ae43b8-c3fe-45bd-8a99-7106f8956005	9ce0984f-ac09-4d06-bd52-ca90f3e37d13	f
d4ae43b8-c3fe-45bd-8a99-7106f8956005	72058ae9-c3f7-4ebb-aea2-0304ed5c3786	f
d4ae43b8-c3fe-45bd-8a99-7106f8956005	c33558d0-acf2-451c-99e0-31ddf2125ec3	f
e17bcbb9-b64d-4ced-bacd-b6a3a26e7246	7d448375-40de-4386-bf2f-bb56d7f9e1a2	t
e17bcbb9-b64d-4ced-bacd-b6a3a26e7246	3f544efc-c545-4945-a597-e546b652b878	t
e17bcbb9-b64d-4ced-bacd-b6a3a26e7246	8d4f60a8-478a-4c56-9685-bffc8ff48a2c	t
e17bcbb9-b64d-4ced-bacd-b6a3a26e7246	8d4106ba-a05a-45fa-a766-37337d6571d5	t
e17bcbb9-b64d-4ced-bacd-b6a3a26e7246	8de68a90-fc00-4e2e-9d8e-890c1e8e4700	t
e17bcbb9-b64d-4ced-bacd-b6a3a26e7246	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	f
e17bcbb9-b64d-4ced-bacd-b6a3a26e7246	9ce0984f-ac09-4d06-bd52-ca90f3e37d13	f
e17bcbb9-b64d-4ced-bacd-b6a3a26e7246	72058ae9-c3f7-4ebb-aea2-0304ed5c3786	f
e17bcbb9-b64d-4ced-bacd-b6a3a26e7246	c33558d0-acf2-451c-99e0-31ddf2125ec3	f
3a74947a-1491-470f-bfee-35ea7024cf9b	7d448375-40de-4386-bf2f-bb56d7f9e1a2	t
3a74947a-1491-470f-bfee-35ea7024cf9b	3f544efc-c545-4945-a597-e546b652b878	t
3a74947a-1491-470f-bfee-35ea7024cf9b	8d4f60a8-478a-4c56-9685-bffc8ff48a2c	t
3a74947a-1491-470f-bfee-35ea7024cf9b	8d4106ba-a05a-45fa-a766-37337d6571d5	t
3a74947a-1491-470f-bfee-35ea7024cf9b	8de68a90-fc00-4e2e-9d8e-890c1e8e4700	t
3a74947a-1491-470f-bfee-35ea7024cf9b	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	f
3a74947a-1491-470f-bfee-35ea7024cf9b	9ce0984f-ac09-4d06-bd52-ca90f3e37d13	f
3a74947a-1491-470f-bfee-35ea7024cf9b	72058ae9-c3f7-4ebb-aea2-0304ed5c3786	f
3a74947a-1491-470f-bfee-35ea7024cf9b	c33558d0-acf2-451c-99e0-31ddf2125ec3	f
609354c7-799d-4df2-ac46-f65b30be8568	7d448375-40de-4386-bf2f-bb56d7f9e1a2	t
609354c7-799d-4df2-ac46-f65b30be8568	3f544efc-c545-4945-a597-e546b652b878	t
609354c7-799d-4df2-ac46-f65b30be8568	8d4f60a8-478a-4c56-9685-bffc8ff48a2c	t
609354c7-799d-4df2-ac46-f65b30be8568	8d4106ba-a05a-45fa-a766-37337d6571d5	t
609354c7-799d-4df2-ac46-f65b30be8568	8de68a90-fc00-4e2e-9d8e-890c1e8e4700	t
609354c7-799d-4df2-ac46-f65b30be8568	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	f
609354c7-799d-4df2-ac46-f65b30be8568	9ce0984f-ac09-4d06-bd52-ca90f3e37d13	f
609354c7-799d-4df2-ac46-f65b30be8568	72058ae9-c3f7-4ebb-aea2-0304ed5c3786	f
609354c7-799d-4df2-ac46-f65b30be8568	c33558d0-acf2-451c-99e0-31ddf2125ec3	f
c76139e0-33c9-45e7-ad54-593f40ea79cd	7d448375-40de-4386-bf2f-bb56d7f9e1a2	t
c76139e0-33c9-45e7-ad54-593f40ea79cd	3f544efc-c545-4945-a597-e546b652b878	t
c76139e0-33c9-45e7-ad54-593f40ea79cd	8d4f60a8-478a-4c56-9685-bffc8ff48a2c	t
c76139e0-33c9-45e7-ad54-593f40ea79cd	8d4106ba-a05a-45fa-a766-37337d6571d5	t
c76139e0-33c9-45e7-ad54-593f40ea79cd	8de68a90-fc00-4e2e-9d8e-890c1e8e4700	t
c76139e0-33c9-45e7-ad54-593f40ea79cd	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	f
c76139e0-33c9-45e7-ad54-593f40ea79cd	9ce0984f-ac09-4d06-bd52-ca90f3e37d13	f
c76139e0-33c9-45e7-ad54-593f40ea79cd	72058ae9-c3f7-4ebb-aea2-0304ed5c3786	f
c76139e0-33c9-45e7-ad54-593f40ea79cd	c33558d0-acf2-451c-99e0-31ddf2125ec3	f
ac15b0b1-470c-48d5-90de-70a5ad10bc80	7d448375-40de-4386-bf2f-bb56d7f9e1a2	t
ac15b0b1-470c-48d5-90de-70a5ad10bc80	3f544efc-c545-4945-a597-e546b652b878	t
ac15b0b1-470c-48d5-90de-70a5ad10bc80	8d4f60a8-478a-4c56-9685-bffc8ff48a2c	t
ac15b0b1-470c-48d5-90de-70a5ad10bc80	8d4106ba-a05a-45fa-a766-37337d6571d5	t
ac15b0b1-470c-48d5-90de-70a5ad10bc80	8de68a90-fc00-4e2e-9d8e-890c1e8e4700	t
ac15b0b1-470c-48d5-90de-70a5ad10bc80	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	f
ac15b0b1-470c-48d5-90de-70a5ad10bc80	9ce0984f-ac09-4d06-bd52-ca90f3e37d13	f
ac15b0b1-470c-48d5-90de-70a5ad10bc80	72058ae9-c3f7-4ebb-aea2-0304ed5c3786	f
ac15b0b1-470c-48d5-90de-70a5ad10bc80	c33558d0-acf2-451c-99e0-31ddf2125ec3	f
65fbdf68-3759-4999-b63f-dc572777adc7	7d448375-40de-4386-bf2f-bb56d7f9e1a2	t
65fbdf68-3759-4999-b63f-dc572777adc7	3f544efc-c545-4945-a597-e546b652b878	t
65fbdf68-3759-4999-b63f-dc572777adc7	8d4f60a8-478a-4c56-9685-bffc8ff48a2c	t
65fbdf68-3759-4999-b63f-dc572777adc7	8d4106ba-a05a-45fa-a766-37337d6571d5	t
65fbdf68-3759-4999-b63f-dc572777adc7	8de68a90-fc00-4e2e-9d8e-890c1e8e4700	t
65fbdf68-3759-4999-b63f-dc572777adc7	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	f
65fbdf68-3759-4999-b63f-dc572777adc7	9ce0984f-ac09-4d06-bd52-ca90f3e37d13	f
65fbdf68-3759-4999-b63f-dc572777adc7	72058ae9-c3f7-4ebb-aea2-0304ed5c3786	f
65fbdf68-3759-4999-b63f-dc572777adc7	c33558d0-acf2-451c-99e0-31ddf2125ec3	f
71e0ee67-90a8-433a-9af5-65a902688daa	7d448375-40de-4386-bf2f-bb56d7f9e1a2	t
71e0ee67-90a8-433a-9af5-65a902688daa	3f544efc-c545-4945-a597-e546b652b878	t
71e0ee67-90a8-433a-9af5-65a902688daa	8d4f60a8-478a-4c56-9685-bffc8ff48a2c	t
71e0ee67-90a8-433a-9af5-65a902688daa	8d4106ba-a05a-45fa-a766-37337d6571d5	t
71e0ee67-90a8-433a-9af5-65a902688daa	8de68a90-fc00-4e2e-9d8e-890c1e8e4700	t
71e0ee67-90a8-433a-9af5-65a902688daa	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	f
71e0ee67-90a8-433a-9af5-65a902688daa	9ce0984f-ac09-4d06-bd52-ca90f3e37d13	f
71e0ee67-90a8-433a-9af5-65a902688daa	72058ae9-c3f7-4ebb-aea2-0304ed5c3786	f
71e0ee67-90a8-433a-9af5-65a902688daa	c33558d0-acf2-451c-99e0-31ddf2125ec3	f
\.


--
-- Data for Name: client_scope_role_mapping; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_scope_role_mapping (scope_id, role_id) FROM stdin;
73348c55-dc67-4f9d-90b4-426b0ff8dd5e	a7aafa88-db1e-4c21-831e-189e3d0623c9
c33558d0-acf2-451c-99e0-31ddf2125ec3	54b6de4a-2a12-4125-ad65-0bcba8fca1b8
\.


--
-- Data for Name: client_session; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_session (id, client_id, redirect_uri, state, "timestamp", session_id, auth_method, realm_id, auth_user_id, current_action) FROM stdin;
\.


--
-- Data for Name: client_session_auth_status; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_session_auth_status (authenticator, status, client_session) FROM stdin;
\.


--
-- Data for Name: client_session_note; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_session_note (name, value, client_session) FROM stdin;
\.


--
-- Data for Name: client_session_prot_mapper; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_session_prot_mapper (protocol_mapper_id, client_session) FROM stdin;
\.


--
-- Data for Name: client_session_role; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_session_role (role_id, client_session) FROM stdin;
\.


--
-- Data for Name: client_user_session_note; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.client_user_session_note (name, value, client_session) FROM stdin;
\.


--
-- Data for Name: component; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.component (id, name, parent_id, provider_id, provider_type, realm_id, sub_type) FROM stdin;
65479d77-1d93-4700-9d85-a4acc793b43c	Trusted Hosts	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	trusted-hosts	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	anonymous
b6a6b9af-13d8-40d5-8332-69f772d962ec	Consent Required	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	consent-required	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	anonymous
51316082-9bdb-4b33-b1ff-58dc692a9f21	Full Scope Disabled	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	scope	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	anonymous
cc639b46-088f-471d-a2fd-3d3393fca258	Max Clients Limit	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	max-clients	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	anonymous
c19750d9-bf89-42cb-a463-ab6d4dcc57e6	Allowed Protocol Mapper Types	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	anonymous
1d612e3c-a69a-456f-8cf0-51d328ea9a8b	Allowed Client Scopes	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	anonymous
36e44fd2-b615-4ffd-bdfc-bca9a37f4564	Allowed Protocol Mapper Types	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	authenticated
feade0cd-9adb-4f98-a044-6c38d18dadaf	Allowed Client Scopes	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	authenticated
32c13897-4d09-4129-bc3b-29d334dd25b1	rsa-generated	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	rsa-generated	org.keycloak.keys.KeyProvider	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N
ce7ba8d7-735b-4920-9162-6ea315ef927c	rsa-enc-generated	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	rsa-enc-generated	org.keycloak.keys.KeyProvider	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N
241fb623-c9d8-4556-8008-e86c4223ab95	hmac-generated-hs512	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	hmac-generated	org.keycloak.keys.KeyProvider	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N
5b17ed0e-a523-45d7-a4b9-ea17cd26ce16	aes-generated	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	aes-generated	org.keycloak.keys.KeyProvider	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N
e7a83701-f013-4397-bce6-84961d4fe7f3	\N	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	declarative-user-profile	org.keycloak.userprofile.UserProfileProvider	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N
8f1b580d-a51d-454b-92ab-83e20d7a13cb	rsa-generated	81407725-cab3-4c86-9e57-5dfbd60ae9c1	rsa-generated	org.keycloak.keys.KeyProvider	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N
faa47067-4adb-44d7-8331-3101ede2e4ea	rsa-enc-generated	81407725-cab3-4c86-9e57-5dfbd60ae9c1	rsa-enc-generated	org.keycloak.keys.KeyProvider	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N
1fa715c3-71ee-490d-80ef-2d7e2727664d	hmac-generated-hs512	81407725-cab3-4c86-9e57-5dfbd60ae9c1	hmac-generated	org.keycloak.keys.KeyProvider	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N
dc510a9b-3b52-4443-a46c-bf332e2434ab	aes-generated	81407725-cab3-4c86-9e57-5dfbd60ae9c1	aes-generated	org.keycloak.keys.KeyProvider	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N
601ebdc3-7f80-40ee-97c0-95f3e0aded0d	Trusted Hosts	81407725-cab3-4c86-9e57-5dfbd60ae9c1	trusted-hosts	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	81407725-cab3-4c86-9e57-5dfbd60ae9c1	anonymous
3e0291eb-f968-4963-a698-1eada16d9ac8	Consent Required	81407725-cab3-4c86-9e57-5dfbd60ae9c1	consent-required	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	81407725-cab3-4c86-9e57-5dfbd60ae9c1	anonymous
14668276-d690-43d7-b640-89748751b68e	Full Scope Disabled	81407725-cab3-4c86-9e57-5dfbd60ae9c1	scope	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	81407725-cab3-4c86-9e57-5dfbd60ae9c1	anonymous
14255c5c-1628-4f8f-af37-8619550b01a4	Max Clients Limit	81407725-cab3-4c86-9e57-5dfbd60ae9c1	max-clients	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	81407725-cab3-4c86-9e57-5dfbd60ae9c1	anonymous
815ffd0f-6372-4711-b726-9c9d77aa5929	Allowed Protocol Mapper Types	81407725-cab3-4c86-9e57-5dfbd60ae9c1	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	81407725-cab3-4c86-9e57-5dfbd60ae9c1	anonymous
5ead9114-ba0c-4a5d-95f3-fd59d9cc3edc	Allowed Client Scopes	81407725-cab3-4c86-9e57-5dfbd60ae9c1	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	81407725-cab3-4c86-9e57-5dfbd60ae9c1	anonymous
a24aced5-595b-4cdf-8b16-769aeb791e61	Allowed Protocol Mapper Types	81407725-cab3-4c86-9e57-5dfbd60ae9c1	allowed-protocol-mappers	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	81407725-cab3-4c86-9e57-5dfbd60ae9c1	authenticated
b4f06c9c-ef2b-4e4a-9f2a-f43a10b9b85c	Allowed Client Scopes	81407725-cab3-4c86-9e57-5dfbd60ae9c1	allowed-client-templates	org.keycloak.services.clientregistration.policy.ClientRegistrationPolicy	81407725-cab3-4c86-9e57-5dfbd60ae9c1	authenticated
\.


--
-- Data for Name: component_config; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.component_config (id, component_id, name, value) FROM stdin;
9e7e0f63-f9c8-4507-b401-71ab6fa09292	65479d77-1d93-4700-9d85-a4acc793b43c	client-uris-must-match	true
5a46cd11-836b-45e9-960e-82fe69c1c637	65479d77-1d93-4700-9d85-a4acc793b43c	host-sending-registration-request-must-match	true
75390934-55ce-46ca-b10b-beff9d340948	36e44fd2-b615-4ffd-bdfc-bca9a37f4564	allowed-protocol-mapper-types	oidc-full-name-mapper
58034807-c5a6-4c75-ab87-274a95c55121	36e44fd2-b615-4ffd-bdfc-bca9a37f4564	allowed-protocol-mapper-types	saml-user-property-mapper
5f53fd23-5ac2-4b6d-8f9a-973ffb27bc2c	36e44fd2-b615-4ffd-bdfc-bca9a37f4564	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
5a414997-a6b9-43a1-b854-7cb3c93802cf	36e44fd2-b615-4ffd-bdfc-bca9a37f4564	allowed-protocol-mapper-types	saml-user-attribute-mapper
e70c3d62-ebff-4c95-a6e7-b7b59b365380	36e44fd2-b615-4ffd-bdfc-bca9a37f4564	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
9e0fafcc-0b02-4308-8643-f460f2992427	36e44fd2-b615-4ffd-bdfc-bca9a37f4564	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
f23b4499-0918-4773-a1eb-7a9c487f5a22	36e44fd2-b615-4ffd-bdfc-bca9a37f4564	allowed-protocol-mapper-types	oidc-address-mapper
de1bfcc8-4286-4cc3-88ac-cdc38dd54c89	36e44fd2-b615-4ffd-bdfc-bca9a37f4564	allowed-protocol-mapper-types	saml-role-list-mapper
6e6d126e-75c5-4b25-82cb-3e335ab6ef9d	1d612e3c-a69a-456f-8cf0-51d328ea9a8b	allow-default-scopes	true
388475f8-4d6d-410a-9835-315cfba55be2	c19750d9-bf89-42cb-a463-ab6d4dcc57e6	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
d3f3f29e-4985-4317-ae10-b512010728f9	c19750d9-bf89-42cb-a463-ab6d4dcc57e6	allowed-protocol-mapper-types	saml-user-property-mapper
6d431d26-3896-43d6-afa8-ade2765021da	c19750d9-bf89-42cb-a463-ab6d4dcc57e6	allowed-protocol-mapper-types	saml-role-list-mapper
c1228f03-c8ad-44a4-b924-7522c94677ed	c19750d9-bf89-42cb-a463-ab6d4dcc57e6	allowed-protocol-mapper-types	saml-user-attribute-mapper
d0bd823d-e498-4195-9c28-f606d3e8c41b	c19750d9-bf89-42cb-a463-ab6d4dcc57e6	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
e8367cda-ff8a-4ed4-b0dc-edcf14ba3f6e	c19750d9-bf89-42cb-a463-ab6d4dcc57e6	allowed-protocol-mapper-types	oidc-full-name-mapper
fce32875-7eca-4004-85a4-68bb9b292b63	c19750d9-bf89-42cb-a463-ab6d4dcc57e6	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
9cf4d03b-9c2b-4194-934c-aedad0813f55	c19750d9-bf89-42cb-a463-ab6d4dcc57e6	allowed-protocol-mapper-types	oidc-address-mapper
811cd765-14b9-466b-86b7-2f7968c9a384	feade0cd-9adb-4f98-a044-6c38d18dadaf	allow-default-scopes	true
c14677fd-c501-4eb9-92d5-e82955e17c3e	cc639b46-088f-471d-a2fd-3d3393fca258	max-clients	200
f989d5a4-a098-4b8b-880e-67ac866b4e6e	e7a83701-f013-4397-bce6-84961d4fe7f3	kc.user.profile.config	{"attributes":[{"name":"username","displayName":"${username}","validations":{"length":{"min":3,"max":255},"username-prohibited-characters":{},"up-username-not-idn-homograph":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"email","displayName":"${email}","validations":{"email":{},"length":{"max":255}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"firstName","displayName":"${firstName}","validations":{"length":{"max":255},"person-name-prohibited-characters":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false},{"name":"lastName","displayName":"${lastName}","validations":{"length":{"max":255},"person-name-prohibited-characters":{}},"permissions":{"view":["admin","user"],"edit":["admin","user"]},"multivalued":false}],"groups":[{"name":"user-metadata","displayHeader":"User metadata","displayDescription":"Attributes, which refer to user metadata"}]}
466a92e4-40f2-4e59-b6bd-5b032f892cce	32c13897-4d09-4129-bc3b-29d334dd25b1	privateKey	MIIEowIBAAKCAQEA4gtobYJwPjEwccDyauvFXzJFmT3tC5cjeV21RLPaLItzuAgrI2eeNvsGqTtCxXmfj9gENJm386V4vd50UKb+KduTCZN6sopuobcRhBANjRf6HENshsRap7PQ7UCegqL33xI1SlllRZ9DS+6E7OampYL9fai3fuTFCmyob1vQPu7WDc2MK8NSgCquj++tz1waxo+5+49aeU1PEYRwGPlVrZQ8G4dBjyfFBI8Z9q+ZpNFtKbmU6Mwxy6A18uIlI4Iw3HJVda41YX2QHZandrf09CS+bZKZmkiXc47CKCQ8zNznGnlJnLwbt32qQY/mvVlnavpkLNjrIRb2fiBsGfSwdQIDAQABAoIBAF0KpAu7TncS6SVRbZbcAAwslaA7cJg+ODBLBYNHYkzGg7WiyxrSGjn4PmgnB9dftfFP0X9TLHfhyt6gM5FFA0X4Zr/gz/awa1QuFcwdjW5fiafbis64ALaZmawmVnhgGxXbGUtGm5w6L0mQXm9iiwKCddOkwA6/nGkri3L2wDM+dl0ppabWG29GBRMBrAisVxN4ivebJal+dUSbm8onvsLekHlBPk66g41j4jMtPOgU8yvM8X8Azja2D/N4DmtKjKABhB80r1s+RvmxK08Y1d94WHtMh1puD+N9sNi1Dyy2zmZZ+mhd0CCheFiaXHB2jRRE6lWPaoeSexuvcWREFxsCgYEA/QGiZxG+98o76MSOB+tP4X6ZUZFJ7wux/SnCLEcYGLFNeYG1dvL5/m4hZrwKmAKaBnsGENSrkztlhcGtZC7uzpRAGOTGBHR9ROtdYAKP1JOsbpApbwrDVjsHW+DZxFPLLiYjO6/uYXLfnORD2NEKKRo0YMkCnhGa9UNuvh86x+MCgYEA5Lga7ZlWoEnWE3wfYg/U3GYLhOhf20NHnpz0UQ+OPRkm09YqOWqqe30ZnfYR2iqDtWLZv6rcRkDQQ8qUg7tCttQnoB1xX+NgfiOo6nLD2/NLOtCCSPtEYKHs1Mg29v87GSPIdHsub7u+37idEPAXaHZ1bVjcBJggnQ4V3G06pccCgYBdwqBLsADkVTbUcRrthl/JAiCRYNVUWDIyzqndvM8KP5Klh9MW7L6GcovARclrQfOQmUDLNfULkAR0iCzYpqfrOHd0gjt75SuTQeINtYVV0xAgvR4Nv6BaMW/ttaseHat7Q7jk4rLlvCtwOguGqxkn2EU25Ocqav3RDJdar7oZ3wKBgGnXqN57L1NN1/t8XSmMGf1EW+BNiM52/BWynH1GrZQop4cwfKnFas9qvQgUb35+XiT6cbn436bDJ523ibLMXbstwoieF3FAT88PwYN9SJXoqM+23hPX83SkemydmpIC2t5vaLw+pOagA1yUmlrUQIDfEMhhbq/RloYXlpZDFfjRAoGBAKrTt+TNnTbJsMw27M7nmqPFE66txB7Gbf51ZVFJDmEGzrvq8gO2IwPrwK0919DUKwHdEdga42OYiyvZK+YxJJZu6X53gz72CD2Q9v6mr3xobM6M/ed9dKcZK2LAtFvIUIVd5UCbYzXw3Nanv9qNdfd2aAeUR4SvK1vCIih6pKpk
e62e4456-4930-41bc-a90f-be6498f2842a	32c13897-4d09-4129-bc3b-29d334dd25b1	keyUse	SIG
9bd08879-d78a-43ea-8abb-72f6ece6e8cc	32c13897-4d09-4129-bc3b-29d334dd25b1	certificate	MIICmzCCAYMCBgGfOqgr2jANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZtYXN0ZXIwHhcNMjYwNzA3MDMzNzA3WhcNMzYwNzA3MDMzODQ3WjARMQ8wDQYDVQQDDAZtYXN0ZXIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDiC2htgnA+MTBxwPJq68VfMkWZPe0LlyN5XbVEs9osi3O4CCsjZ542+wapO0LFeZ+P2AQ0mbfzpXi93nRQpv4p25MJk3qyim6htxGEEA2NF/ocQ2yGxFqns9DtQJ6CovffEjVKWWVFn0NL7oTs5qalgv19qLd+5MUKbKhvW9A+7tYNzYwrw1KAKq6P763PXBrGj7n7j1p5TU8RhHAY+VWtlDwbh0GPJ8UEjxn2r5mk0W0puZTozDHLoDXy4iUjgjDcclV1rjVhfZAdlqd2t/T0JL5tkpmaSJdzjsIoJDzM3OcaeUmcvBu3fapBj+a9WWdq+mQs2OshFvZ+IGwZ9LB1AgMBAAEwDQYJKoZIhvcNAQELBQADggEBAEKzoZld9IL8f9NVecB+3ho+OtpWHAo/7U9sM7O62BR1KoXhx/Ye72uyDXkxwbBM9nbggkgLrcZ5jpmNdteG9vxM5978WP4jR+BT8SN0kN7rgLWO5W102WhezUsnZONgUZxZ46j3ofvAvOaGiII+KEkdg46xVPlzEg4Lx92Tv2zN3THhNRfqkvjdZPmM0tWlDeBdCu4YA5gOwISq53906ow44aoKEECdVj7fjfFH0isXyhoEtPV+W7M0b2aQ0oRpOYkvDQJE2WUJnuRkX91swZ2EkrdvT8wfdOWxgUqpCs6//asIo1VDt/M+QEhEXVYlODef8dVuCzuY6JjMws9RfRE=
326a6cad-d525-4a32-9f7a-e96dd5ed7b0d	32c13897-4d09-4129-bc3b-29d334dd25b1	priority	100
9dff73b0-f462-4574-8820-2e532f32956c	dc510a9b-3b52-4443-a46c-bf332e2434ab	priority	100
5984cf7c-5a49-4194-8368-2d9e2533c0f6	ce7ba8d7-735b-4920-9162-6ea315ef927c	privateKey	MIIEowIBAAKCAQEAzk76IzDxWDTJ2OCikMLQRHuIWINh4fAvgk6ezKz3u0g9lhUmr3lz+dac5ylHJBPiYH+miA7yaQxuhlXLNsc72zvzR2bMLMJm6w1NTYi45p5a5Sl6hEUeDMxxHSfQTA+Up/dM5EgrWGAhT6EAVeDxB9sKsk861TY4bls416BrCv6VmRsmAOJf4Dk8ibHRZmSZIRwoZmsZj/yG3DLB3fWxRAFH184jFvwzVg3ge6vWx5Mj6cSzunFDLYf1HyuQ7t6lqkcJclkBFMhuprs/CTydMbz0x6Vf6YF/EFauzXQQiPnj+mVWLiYQWaKmkDu9r/Bmk6pvIPbvP8QhFNe+VNsVQQIDAQABAoIBAAZwbZs6lFXR8/jabgiBpBl3F5bXpu7z3a+9/3PY9DR6uT1ddKMmccm6+pO2dJt6KWckpNB7UvKXaj20IM8ZYdNiaCHy4e2FtcuhUyfX3BmKmMCtTj8hnyH8IY2s5/HvzI5/h/1aCUxNV8zR9B46EpvRqOBO28G62wEKxNfqEF077Zu1XGGsvcrWy+r0oCBg7swqc/aw1YfLihssJ2FBPvoQijQ01MRoJ3baBHr0hATGO+VK5T63vXDFfbNhGXNE0UpLp+HD3XpKBzp1ILLXQxMlMrZlpqXF4lBMajip27hSXv8tWRbIgPV8xh4FJsXHToeYEUZS61aDFMN8kfmCkKECgYEA58mjgTPXE4FMQgKQ17qQ11WuTUbWsolEnD7aKlIgwSnkMUYXOqzM0t9Rjc4QPXCbOJ81nhpgSTQmFhVMAdWhsbQSMgf8jraFHl9AgIli1ZN/p+tfJcFf5nVGdsy89vRPl+RL86RA4867DvxNVZxueQusrn+GwOwWhdARs7QwjckCgYEA49v8i3P7iH8kM5Dio5DJaOyALLR5Z4K8by/+GZdkhY7hCzZJNvsfL4dCEdo5q5NitzlwatcSpW6YsQ+nwx21x9TMIQPkhR8vaX/Q9HG2n1Sdj34NJuSLduqxydvJAufRXhovoPk0/byPqL/ji1DCh9tktQFH7JFTdkcMEcBTJ7kCgYBj8eNJ2/Oamn8qW3bfPrgj0fM1qRz8oQnvoX5rDzzGbezSflmX2Fj9eIPu9HK2O28C7EuvX8oy5oShsw8yH074lB/gaOczFmqyHPpwMk1msJIz8t71JbvXYKxAn6m/hrsnUK6bYTEFyeeI36vtBWXxVeJg3+ZYG7TegEiRx1nEWQKBgG8jt/TVJ5UWXrQAMWuSjYruAD7N8IF6lSqugAQ/gbpbTI1Jd0CoEDgAg0tt4786bmXsUFbsfJ3Qag3DExLqhOXpd3+LBIWiBmAxBdyVMnxYq1l4JDYaN6RTKVDKMSuHoumBYEXmB+DTfkbTAcvMInZdnqti6pAK+miwksR9yJGRAoGBAKOlaZgfqwHj/ReP0zUP24zQyrFhEYBcxMe2PPxPt6ditGHBFXmnC6SLVNJ4hrdj6GkgxEAP2aQLJS5CyLeIMBAvy+I6Ln1cngtHK2XQGbnqjhNlU1UJqIRfzGTOxz7Lm/SJm+LHf/EdZUddDpFd+IutW1H0rSj+QMkPdtOrAyIA
d5298e84-da46-41e5-9bc0-214445eff611	ce7ba8d7-735b-4920-9162-6ea315ef927c	keyUse	ENC
a27f1650-a084-4cfe-921c-db67bc0b9417	ce7ba8d7-735b-4920-9162-6ea315ef927c	algorithm	RSA-OAEP
ea62c19d-c113-44ca-88ba-36b8b644b4be	ce7ba8d7-735b-4920-9162-6ea315ef927c	priority	100
d19ca3aa-326a-4dc0-93dc-5658d00d08b4	ce7ba8d7-735b-4920-9162-6ea315ef927c	certificate	MIICmzCCAYMCBgGfOqgtBzANBgkqhkiG9w0BAQsFADARMQ8wDQYDVQQDDAZtYXN0ZXIwHhcNMjYwNzA3MDMzNzA3WhcNMzYwNzA3MDMzODQ3WjARMQ8wDQYDVQQDDAZtYXN0ZXIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDOTvojMPFYNMnY4KKQwtBEe4hYg2Hh8C+CTp7MrPe7SD2WFSaveXP51pznKUckE+Jgf6aIDvJpDG6GVcs2xzvbO/NHZswswmbrDU1NiLjmnlrlKXqERR4MzHEdJ9BMD5Sn90zkSCtYYCFPoQBV4PEH2wqyTzrVNjhuWzjXoGsK/pWZGyYA4l/gOTyJsdFmZJkhHChmaxmP/IbcMsHd9bFEAUfXziMW/DNWDeB7q9bHkyPpxLO6cUMth/UfK5Du3qWqRwlyWQEUyG6muz8JPJ0xvPTHpV/pgX8QVq7NdBCI+eP6ZVYuJhBZoqaQO72v8GaTqm8g9u8/xCEU175U2xVBAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAIbgz4XRo9tuvvNCXM6NPal2JOe/J5G9YecRKS0w9uEh7BbFkDiivERoI3ofxkc32YMOFSXYNt/Vo2LhNbtexj0Zd7e3uIIv34m/N0yXxjGuplT9oQhL4ZfTjJLYN94fAVQ0bG3MbIPtNoU+Y02zf0c4C77LuYp/WvpDUfs8rD3gNyC6Vm7VD2bIsjbLpCidWlQnf+w4poHm71jd2Ho54+0W2D15rmWWzXYZuzwRDp9yyvaHlEokFPOjlos5qB8og7sPBt2HDVnf2+DSEvSuvC+izqQh+7bCuz8BcUjkhEHqSk3IayK4Oite0f5LF3E0Vj11wdO0WCUT8YXcH8cJLsA=
c8234886-60b7-43cd-809d-6ea14f3dabcc	241fb623-c9d8-4556-8008-e86c4223ab95	algorithm	HS512
bdbd18a0-abf7-47f4-8853-b5aff78b9cc8	241fb623-c9d8-4556-8008-e86c4223ab95	kid	02dee87e-c498-4b70-becd-9031e3387763
25770820-ba1a-4567-9cc1-6c03c42f3822	241fb623-c9d8-4556-8008-e86c4223ab95	secret	pN_Zdjr41C5kqTfkdVfnb2u4CqWUKqyyCMu_C4bazLGlZAmMFqbbaNMJAxV5asKZeeuAKXjDS-H_tE14505xWQDz2Nq1Hu2824JqtQmTMCLxzG3JO9UAQWOTUqrf25gXNvOeLNFKG6Hx8tXcE_69eeGXDjZt89EXlZ8fcqcWmQk
dbeaf5cb-26de-46f8-80aa-b5fd69ebe9ac	241fb623-c9d8-4556-8008-e86c4223ab95	priority	100
f7407649-4301-44a6-aa7b-6aca7873bb05	5b17ed0e-a523-45d7-a4b9-ea17cd26ce16	kid	177368dd-89f4-42b0-a647-fe3a215e612f
3be86764-fcc5-48b2-84db-2c876d96ba4a	5b17ed0e-a523-45d7-a4b9-ea17cd26ce16	priority	100
1769caf4-e832-4d51-b482-0e6393b50f97	5b17ed0e-a523-45d7-a4b9-ea17cd26ce16	secret	wvKZVWOrzLy8wmC4Wesn4g
f57fd1c2-6211-4fcb-bf5c-dabd441b00c3	1fa715c3-71ee-490d-80ef-2d7e2727664d	priority	100
7eda4ab3-4e8e-4de8-9009-650b8781599c	1fa715c3-71ee-490d-80ef-2d7e2727664d	algorithm	HS512
a0bef68f-33ce-4b69-b21a-69e44bb22700	1fa715c3-71ee-490d-80ef-2d7e2727664d	kid	a2473e3b-09ce-4ab5-b60d-da94e430615c
902e50b8-d2e5-4b39-ba76-77b2aa5b8421	1fa715c3-71ee-490d-80ef-2d7e2727664d	secret	nLHeO2y0B-zJz_8-SYnG4om7LFlUZJ4MIFROZWw0-KVuXQEHQxm2CjVrZzV01X126SPpdqG791B0pAIXmXurh9y-Cp9x8Z9rHLQh4q-AYXi3Y9kLSzgmGFJdX6ORe0dV6Lsc8ENwLXOSbk0Nn621tilWgEhnS-LDlt1icfPRD9M
1c041e5b-e0eb-4625-a598-c499895c9d38	8f1b580d-a51d-454b-92ab-83e20d7a13cb	keyUse	SIG
164225ff-d9cc-4603-a8c3-3fdd221b5b21	8f1b580d-a51d-454b-92ab-83e20d7a13cb	priority	100
1dfc759e-2e35-4d51-a19e-b67c9d98fe2d	8f1b580d-a51d-454b-92ab-83e20d7a13cb	privateKey	MIIEowIBAAKCAQEAsE6lyzi58LyAMuUnqf/jjChnXp11DdwnyurabVXFBhHX+H44v9wxDLKcGk7+m57lxKscgir31vM+xPds9nAdLFjL1nWPSdoz8YuwymJdkoYhSBACPnAn3E3IzkbQJ7IXE9fly0+Z2PXBpRcbVI8DySB58AfzA5Ls68tzDs3F0eFJbR38GG/n5orfZDjlKbNqMQu8QGsTogMGEi8gHfbbX08s7CtzDprI19qnX3gQS5bc2xmnb4/5pVzPUqkb+KtXy1sgdCHy3SSEfFgym9YFQbJupvewaOMWBjpYxW0xkOeqhvOLkjeEv4ASp4O7JFtuuYXi4EwvErPtfqa6wwTmawIDAQABAoIBAADkQFuJBwxFMOnsZ+SoxFb3+MS2S7XRqX1IpQ2Ro8IB0IXKVHqRoDcEy6VNRYoRpe6tQSMVGR4NKpQY/oQS0aU8Vt3X7KPeZqBGqSUTukVqSDw76sb86jawtyfT5iK6+Gd6bb8SnI21eZnMIdT3Eeb5V6SF+A3KSZGVamHUNkmbtZ9wkJS0K22nZ/WQhd8edJNlaNNwJxu/rwVKxcGQrSmtmz+Yfljzm+7ZHM6JJIeC+a5dPAtSfo5qDovrzeKM5EOb+62ZpHxjc9UEn1+29k/D6+Z5MnYqqjjK4bHvr417vMZYYV/+byYyRMS9V5Scdqqwdx6Ww32yeoHdg45x2YECgYEA2Ke6m2WkZmKgHUSTevYvyHwEFzj9aOUxeih/2O6qLV4KoL3t7PcIQycNhhOIA2Ewezrx5KmN4M9QxWQu/3N0eCunZmRQfVKot4uBAvluN5aoqZ/E2CPeBJZE84p31IphKlmbgih5hna/0AIvQxNXYHeVRaa0PSZkwlCWoIoQbWcCgYEA0FMlkZgsgd9M0pZyNYMmvIZ5ylU86e5NpFFZD8BmYSbaV5xX1GySR8PbFFOza7+HAUDFrgo6BnqmOIOc6NNmk1HUDndnrqz1c2sxXbf+g53WYvUjHZ2/6bDfK6kelfFyN/KhhZfLA4j64Wz3+TS7ySyKlSC+8gIuWUJZmO4omF0CgYAJv7po5bD5HnT//Cb6wHsz9Uil1t2oS6/nRE1EcLDdq76krwc2w4LuqqI0J0rWhBgPY36hAHQu6oVC7JgkzIgwJB67P8ZTbVXENJXQkXLBM5lRUKwl4a9K24wsvU1ZFgT7R970g2e8gjltXbvMs+EZqSfhY3f2zHR6PfAZNz03/wKBgQCtOaZQpYfEykhYB6+aHZ81PmDBRRVss7IuA1KaTXMUL7l5BlDmGw2bzRk7ksnru4voF9MIgAp13sCe15m+5CI0N+Orz9AQKFPFEIoxEtD44mMlUA9ODiFJkcBQzsTXC7jdGs0CiBDQtLNghTrBJv9LLdViYaNFG1ks8YYNK2PoJQKBgDJsQZOPwQ721O258Dd5hS7lBVl7BPpZ9N1ofTSaAalZtEn4LPT/glRX+80YJWr/gG8nGKL4oqV679s22LjIb9bKZ8l9Rl1QfWsK6SGotQ5nl2BF66joS2lSIlYLy4g2iL8OwiTOSFK5LzQiVArzzV3+5UO8vNdGthCiVIHenc7S
fd5f1a7f-da5d-4a5f-940d-5c74d9b6798a	8f1b580d-a51d-454b-92ab-83e20d7a13cb	certificate	MIICnTCCAYUCBgGfOrPKYTANBgkqhkiG9w0BAQsFADASMRAwDgYDVQQDDAdwb3Jwcm92MB4XDTI2MDcwNzAzNDk0OVoXDTM2MDcwNzAzNTEyOVowEjEQMA4GA1UEAwwHcG9ycHJvdjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALBOpcs4ufC8gDLlJ6n/44woZ16ddQ3cJ8rq2m1VxQYR1/h+OL/cMQyynBpO/pue5cSrHIIq99bzPsT3bPZwHSxYy9Z1j0naM/GLsMpiXZKGIUgQAj5wJ9xNyM5G0CeyFxPX5ctPmdj1waUXG1SPA8kgefAH8wOS7OvLcw7NxdHhSW0d/Bhv5+aK32Q45SmzajELvEBrE6IDBhIvIB32219PLOwrcw6ayNfap194EEuW3NsZp2+P+aVcz1KpG/irV8tbIHQh8t0khHxYMpvWBUGybqb3sGjjFgY6WMVtMZDnqobzi5I3hL+AEqeDuyRbbrmF4uBMLxKz7X6musME5msCAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAq5x+LYZYUdEhRTnzQmZJWUyOL/X2/Dy5rP7REjBAJ79wUD+K9eyA2zoCfjn/bKcxEgig5+IE+rY4neMHr/E0bIHiiuhTm8IDDc5SKHL+5jDYwSKkrlLPSjMYSvfkPNb1HOymVtim0s3t/WHF+2nZPNYU92XSKEZAMc0zmfSfW2p9r1t7NTLsx7pG7T8JFrqRlbIhPYv2Rf5AndP35NMmgafAbpDwUd5oC6UwVZbEW7jLayJRsi3zIrYVwKhaWvMpjUco79OyhZ1zRFDumQEvEYw7lTsuHdfPqED5LsPp5kFVuRRh+Tt7tgUy04G8yFuTF3ycne05PVMQhs0NcKtuSg==
27fa3f1e-4b09-48d8-9e7d-71b877663cf2	dc510a9b-3b52-4443-a46c-bf332e2434ab	kid	9cc8320c-7fc6-4633-b3c1-349768fca0ab
f78a585f-5ae6-47c2-a081-bda50f88524b	dc510a9b-3b52-4443-a46c-bf332e2434ab	secret	g9GK3VVgbFV7aY-w-iQNMw
8f21e286-b8f3-4f27-a66f-aa3394b3d8d5	faa47067-4adb-44d7-8331-3101ede2e4ea	certificate	MIICnTCCAYUCBgGfOrPLQzANBgkqhkiG9w0BAQsFADASMRAwDgYDVQQDDAdwb3Jwcm92MB4XDTI2MDcwNzAzNDk0OVoXDTM2MDcwNzAzNTEyOVowEjEQMA4GA1UEAwwHcG9ycHJvdjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALzyjgBwL0vEY4MnmZRJPJNVJgaoIokOVVI+vmp1wPJULzkwYaYZqOG+B3XK8RzpewAq4VGJCTLxph2kphomTWpTeUadbbMY4rvKpwcLd7Rozfq4dfMLbOjfFe7jyqsuUyWPqv3jgEM+h6ZXDxvRwyz2uM9FLoVAVmu5Q3Jp+7byIMgUnNrz2EB8aA5dKnSWJV3GCwFM9+rTcd4SWZL9WC8jNVizjLU5B8Es43E81CQeAcgLHd2YF4JmQDFwz4QJb2PdzkA2Jh9knvxeriDeEygP3peCBj8g/roVucv1PftZtGow5xa7AOiooWIETl38Tn+li7DZ0yUdXK2lY8iwDjkCAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAY5wfP56bCKd3E9IQCPAr2cNtSmyB5cSES5K99UZHId0GnIZle2H1+zJjqVfxKfJdIFC0EoC3xjJASA20L7THFUmV2BrZkcz15oLODdOvGhyYeoJW9QbjcLfIOTz7gFsV4prVLHSkgdQQlbQtKyERTkiq2UIU/fOxVArMnHWlXbBLerCblX6OSMjyTN8P1sSbqNbbnmAhP4H6L1BU7UmuFsng83t6/WQK3H+oKf2cTrWk0gWu12fCL5CXvasYwSMRKeH2bRorIAPa5j/3IFTmc7bu3Xd/xQAzpwA0egjLwb4goSdaedrHBnGVWvKAmuiNtW0Y3xKTz/iEZWyJgaFjBg==
cbc4154e-905b-4ee1-a73a-4c934db3b2b0	faa47067-4adb-44d7-8331-3101ede2e4ea	keyUse	ENC
5bbd67e3-b49e-4f2c-87d4-b675bdcef05a	faa47067-4adb-44d7-8331-3101ede2e4ea	priority	100
ca0a6e39-196a-4dad-a835-321d403403c8	faa47067-4adb-44d7-8331-3101ede2e4ea	privateKey	MIIEowIBAAKCAQEAvPKOAHAvS8RjgyeZlEk8k1UmBqgiiQ5VUj6+anXA8lQvOTBhphmo4b4HdcrxHOl7ACrhUYkJMvGmHaSmGiZNalN5Rp1tsxjiu8qnBwt3tGjN+rh18wts6N8V7uPKqy5TJY+q/eOAQz6HplcPG9HDLPa4z0UuhUBWa7lDcmn7tvIgyBSc2vPYQHxoDl0qdJYlXcYLAUz36tNx3hJZkv1YLyM1WLOMtTkHwSzjcTzUJB4ByAsd3ZgXgmZAMXDPhAlvY93OQDYmH2Se/F6uIN4TKA/el4IGPyD+uhW5y/U9+1m0ajDnFrsA6KihYgROXfxOf6WLsNnTJR1craVjyLAOOQIDAQABAoIBADKGN5OFbBg6DRQSoD4nMUQCZlcsWYPFqeoCrh9AmpYSDcigl9P3E5I9orgMStoc0s+yJ6sKVkPhmzZdAy+F43iVlp3b1ewosORfZbd8CQfcaIvtDFkvynEgyjglgFmy2vf1yVb3oSIaE+LWb8tUFXkuBjAigzSNhi5rDU6IaY87DDOm5SUUakH2KQ1IOGvxgBB7FzuJts3j8XDNvvwAw8IrYAoBg8tEbm9YciH0qriOYS9BZJUKPKPPf1ihtr2RAovgZyqcGBRFhorwAMVVWSgO90cDWx8rli2FkF9VxSXmeHPP5k6/V1Vn7QpoMUZ4yQuKDM5qQ6UYb2EHcxX/QcsCgYEA99pMiJfhzywRDZRlmcJy/1KmbjzohvE2313MtqluMwJpuV8Ok/zuUxozUNyVrvY/zgGiktrv3v9wK4ela23+tkDePkOsUZOoKkuuwefcT+pj+PoKPaezEutenV5Zf+1Lco0DWDFXqPhUQrqTaR7umjgTvzVHlbgwd3FC4bwUij8CgYEAwyiQLyQsZBF4PrFQMJCRqK8kJSOukLHu6dUErzktVS2OJXA7e2DLDpVFhx8+OiVXuUMWaUYeu9o8RxpsFuZmsbtn0empMO33iKU5+UcFifxZdzjLSfXtH6DSAZKWNMeoTVPE0tJYHbFObM3x0RlsEKvS27gvxeWHYk3HPJLlGYcCgYAcYBqo/LJ2dHYTVuz22IMv5fd14XVBlbYRhnycYPNj1Z/jABX8LVXfn71GQarFWB3f6OIC7BvQLPBbm3D9xp8FoJGREVBWGpCDHx0HyBK593ywkXfArUVcIiQ34ghfE/yyRaCfZS7DAoMrDI851re8YjUoi+IBKxApbIcartyvIwKBgFPCtR+Ghwbr+I/vylsNsXaUtQ67odC4jbIOm1QZVjuYscmfwefSQ1Se/Jhh8HNEU8JP6O6GCerWX8ikrn+lo63koUqW3ucBO5yKTbePo/D1PfDNj3LO+lb4zymdoJpGlxWZPoC9htQ3pVFNktwL7TW6iWWER/zH5rNqbnixE2NBAoGBAPe2VhJ2jltDcPV7YTHazr7bpcU5GVXcwRypIqSLfFeDEAAR2G3nNtspC5q85P6DZqemXqW1FpoHV4lYmFxIpdr8XZQrNmq9Q3K27olIWtw1UbY28/xwze/wos4922l3Pb7K6THq45kEc3z7FaKV2UI6YNi4r8pQYVR5P2XT+MCC
45516d24-d9b3-4ee2-81a1-42e52600a2f7	faa47067-4adb-44d7-8331-3101ede2e4ea	algorithm	RSA-OAEP
3171db6b-05e0-4cd0-be7e-e42fedb3fa08	14255c5c-1628-4f8f-af37-8619550b01a4	max-clients	200
01223bf6-88c9-440a-a841-6e5d34cede69	a24aced5-595b-4cdf-8b16-769aeb791e61	allowed-protocol-mapper-types	oidc-full-name-mapper
ca928771-5319-4253-81ae-a5450d5b926d	a24aced5-595b-4cdf-8b16-769aeb791e61	allowed-protocol-mapper-types	saml-role-list-mapper
ce221359-06d7-48ec-a1ee-0ba392a29689	a24aced5-595b-4cdf-8b16-769aeb791e61	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
e0111569-0866-47d7-b7dc-a3c7e6263233	a24aced5-595b-4cdf-8b16-769aeb791e61	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
885bc3ae-88fe-4b84-8d97-64138da9123e	a24aced5-595b-4cdf-8b16-769aeb791e61	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
4c0b40cb-5490-41e3-a2dd-146a5502e6cd	a24aced5-595b-4cdf-8b16-769aeb791e61	allowed-protocol-mapper-types	saml-user-attribute-mapper
964258a6-c44a-455e-87cd-eea882769428	a24aced5-595b-4cdf-8b16-769aeb791e61	allowed-protocol-mapper-types	oidc-address-mapper
265d9446-755c-465e-ad87-e3a49dbc2a30	a24aced5-595b-4cdf-8b16-769aeb791e61	allowed-protocol-mapper-types	saml-user-property-mapper
889f2e48-75ba-4ff3-8148-e6224aa5ce37	b4f06c9c-ef2b-4e4a-9f2a-f43a10b9b85c	allow-default-scopes	true
b47ab996-5fa3-4edf-846d-4453a104d055	5ead9114-ba0c-4a5d-95f3-fd59d9cc3edc	allow-default-scopes	true
18cdfc39-53ac-4523-92ed-b7f919a13cdc	815ffd0f-6372-4711-b726-9c9d77aa5929	allowed-protocol-mapper-types	oidc-full-name-mapper
fadbcd56-a659-42fa-b6f2-51d5397da753	815ffd0f-6372-4711-b726-9c9d77aa5929	allowed-protocol-mapper-types	oidc-address-mapper
a6641991-5b59-49ac-a960-27910fb0aeed	815ffd0f-6372-4711-b726-9c9d77aa5929	allowed-protocol-mapper-types	saml-user-property-mapper
ba54ac1c-fd71-43ea-92c5-001700a93abf	815ffd0f-6372-4711-b726-9c9d77aa5929	allowed-protocol-mapper-types	oidc-usermodel-attribute-mapper
19f4eed8-b9f1-4d31-846a-60f64692d500	815ffd0f-6372-4711-b726-9c9d77aa5929	allowed-protocol-mapper-types	oidc-usermodel-property-mapper
e1b56c4b-deea-450b-9ce3-ae95db94754d	815ffd0f-6372-4711-b726-9c9d77aa5929	allowed-protocol-mapper-types	oidc-sha256-pairwise-sub-mapper
478c55b2-1168-4405-bb48-e8e35311ef9d	815ffd0f-6372-4711-b726-9c9d77aa5929	allowed-protocol-mapper-types	saml-role-list-mapper
159391db-a11c-49c5-a22a-63c12e5ac77f	815ffd0f-6372-4711-b726-9c9d77aa5929	allowed-protocol-mapper-types	saml-user-attribute-mapper
c705f2e1-5e3d-440f-8758-0a764cc47562	601ebdc3-7f80-40ee-97c0-95f3e0aded0d	host-sending-registration-request-must-match	true
3890eab3-d515-4f7d-9dc4-24f059d06578	601ebdc3-7f80-40ee-97c0-95f3e0aded0d	client-uris-must-match	true
\.


--
-- Data for Name: composite_role; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.composite_role (composite, child_role) FROM stdin;
1b417689-632d-4f5d-90b1-5cf82799f3ba	97b6c364-7bf2-4f08-8024-0a33b5b6b51f
1b417689-632d-4f5d-90b1-5cf82799f3ba	490a6b82-dc40-4b70-933b-6b6cb2e517fe
1b417689-632d-4f5d-90b1-5cf82799f3ba	06c6aac4-cb7c-4236-bf1d-aba235243ea7
1b417689-632d-4f5d-90b1-5cf82799f3ba	d621c02f-418a-4c09-85b1-137f18172736
1b417689-632d-4f5d-90b1-5cf82799f3ba	0a99dda6-41f7-4582-99cf-2057acf1c480
1b417689-632d-4f5d-90b1-5cf82799f3ba	8105383a-bab4-4d49-9642-1042f4d6be33
1b417689-632d-4f5d-90b1-5cf82799f3ba	10dc135d-b1c7-46b3-a063-ab7401a5fa0f
1b417689-632d-4f5d-90b1-5cf82799f3ba	d1e1a164-c5b9-4a88-a36d-a9b3add42b51
1b417689-632d-4f5d-90b1-5cf82799f3ba	223d20e7-75b1-42ba-b2de-e2181f230599
1b417689-632d-4f5d-90b1-5cf82799f3ba	f91c540c-0e25-4c51-8eeb-ed73831b4c92
1b417689-632d-4f5d-90b1-5cf82799f3ba	51311ab0-6093-436f-8e2a-824e097968fb
1b417689-632d-4f5d-90b1-5cf82799f3ba	fede3654-a4b0-4c33-b940-05cd78fed5ed
1b417689-632d-4f5d-90b1-5cf82799f3ba	aa320486-4d6f-4b81-b9af-640b5a0bf321
1b417689-632d-4f5d-90b1-5cf82799f3ba	6ca3f6af-e7b1-43ef-8c0b-f289a9cca514
1b417689-632d-4f5d-90b1-5cf82799f3ba	23c62a01-dd4c-451b-98dc-2a1faf42c8aa
1b417689-632d-4f5d-90b1-5cf82799f3ba	97829d33-3a9d-488a-85e4-7a27e623d004
1b417689-632d-4f5d-90b1-5cf82799f3ba	d0808318-7f9d-4053-9b5c-56e333a7773b
1b417689-632d-4f5d-90b1-5cf82799f3ba	5b0d6b11-8dc5-421a-bde4-58238bd73459
07036674-dd02-4938-a2ca-8b9b447abe3d	548e5c2e-563c-41f0-ad86-679fe152ded5
0a99dda6-41f7-4582-99cf-2057acf1c480	97829d33-3a9d-488a-85e4-7a27e623d004
d621c02f-418a-4c09-85b1-137f18172736	5b0d6b11-8dc5-421a-bde4-58238bd73459
d621c02f-418a-4c09-85b1-137f18172736	23c62a01-dd4c-451b-98dc-2a1faf42c8aa
07036674-dd02-4938-a2ca-8b9b447abe3d	052a5b92-31c3-40c1-9727-9be115ca4272
052a5b92-31c3-40c1-9727-9be115ca4272	1519ee94-6fd0-44f2-b88a-939afba08abb
5093a90c-8cd4-49bc-9e09-7a09f1deeaf3	1b0503ef-5f09-4ef2-bd1a-44a6bee9b878
1b417689-632d-4f5d-90b1-5cf82799f3ba	85975ac0-9bae-42e0-a431-6697b6e3d667
07036674-dd02-4938-a2ca-8b9b447abe3d	a7aafa88-db1e-4c21-831e-189e3d0623c9
07036674-dd02-4938-a2ca-8b9b447abe3d	f8db04a5-0f55-4804-bad6-167901c0c560
1b417689-632d-4f5d-90b1-5cf82799f3ba	91f83e3c-b56c-444c-b800-7d56a7c37343
1b417689-632d-4f5d-90b1-5cf82799f3ba	849a52ce-f089-4811-a95b-436c8002aa31
1b417689-632d-4f5d-90b1-5cf82799f3ba	67ca29ac-71cd-400e-b6f1-e3ea4c4a5f7e
1b417689-632d-4f5d-90b1-5cf82799f3ba	56979e18-9bcd-4272-9f0f-eedc504f10a4
1b417689-632d-4f5d-90b1-5cf82799f3ba	67e1c20f-4633-41fb-b0b6-a7a05aad19df
1b417689-632d-4f5d-90b1-5cf82799f3ba	129ecfa4-a7bf-49b9-899d-a79f1a0a926a
1b417689-632d-4f5d-90b1-5cf82799f3ba	143ccf9a-0afb-4bb9-b34b-94a56ad23673
1b417689-632d-4f5d-90b1-5cf82799f3ba	bf14f1c5-2138-46db-8146-74048cbbfbd2
1b417689-632d-4f5d-90b1-5cf82799f3ba	1b36931c-798e-4855-9644-7fec4f5efbd1
1b417689-632d-4f5d-90b1-5cf82799f3ba	dc700d1f-ff4a-4c77-8701-f128b32b3ab7
1b417689-632d-4f5d-90b1-5cf82799f3ba	3f29de09-3359-4dbc-b77b-7fb24483d9c7
1b417689-632d-4f5d-90b1-5cf82799f3ba	2a5018f8-c73d-499a-8504-fe4439ceb952
1b417689-632d-4f5d-90b1-5cf82799f3ba	b994cc41-565a-4e5a-b380-2dc57209ce93
1b417689-632d-4f5d-90b1-5cf82799f3ba	75f87cf9-8449-42a1-a5dd-1db6bcff99c9
1b417689-632d-4f5d-90b1-5cf82799f3ba	10d802c3-5b09-4d02-a46a-36565b1aeb7d
1b417689-632d-4f5d-90b1-5cf82799f3ba	cf4996c7-ccf6-4c37-aabd-370ee177cfb0
1b417689-632d-4f5d-90b1-5cf82799f3ba	fd11eae8-4dd2-423c-a12b-88ad97747006
56979e18-9bcd-4272-9f0f-eedc504f10a4	10d802c3-5b09-4d02-a46a-36565b1aeb7d
67ca29ac-71cd-400e-b6f1-e3ea4c4a5f7e	fd11eae8-4dd2-423c-a12b-88ad97747006
67ca29ac-71cd-400e-b6f1-e3ea4c4a5f7e	75f87cf9-8449-42a1-a5dd-1db6bcff99c9
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	4d7ec9f8-4cf1-4139-afa1-7848865c8f9b
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	ca0fe817-e3d5-4c0d-9491-431a9044cd2d
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	8e39c824-8706-40e9-b7fe-92da61a6fbcd
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	44cdfbb2-2df3-43c3-a41f-827d83580664
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	4c46c7fd-4f21-40c5-aacb-0909f317b503
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	88990572-91e8-4ddd-adb1-ea0d760a85e7
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	77919051-d9db-4da2-834c-81244866cf65
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	de1aba14-8eca-437e-a71f-606f031aa191
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	c24c761c-57a3-4873-a53e-35639bb13c4d
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	28f7d7b9-e3da-440f-b833-8e7509a3794a
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	865c77ec-ba4f-425f-bb8a-397694349b88
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	b83248bf-f9b5-4bce-9cfd-d7d0407b0da8
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	71635a6f-5161-4038-9019-a444969b78a9
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	6904c409-3e83-40a3-a219-15c0035b6064
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	d6b8ccfc-e27b-4427-bcce-3fab9728e6b8
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	e0ee0262-865a-439d-8286-7c3c5e5e2da0
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	a5887f76-6145-48e8-9f80-dcd27d2d9244
44cdfbb2-2df3-43c3-a41f-827d83580664	d6b8ccfc-e27b-4427-bcce-3fab9728e6b8
8e39c824-8706-40e9-b7fe-92da61a6fbcd	6904c409-3e83-40a3-a219-15c0035b6064
8e39c824-8706-40e9-b7fe-92da61a6fbcd	a5887f76-6145-48e8-9f80-dcd27d2d9244
e597f43c-a870-4165-956f-465900305fd3	bf6af00c-f7a0-4077-b72e-8c61ce2e127c
e597f43c-a870-4165-956f-465900305fd3	46f081fb-5aeb-4119-af16-ae43ab2ada42
46f081fb-5aeb-4119-af16-ae43ab2ada42	d5a0fce4-38c3-47a1-a969-062992ae2e06
d0f6dfed-a03f-42a3-8b6c-d51be796c2e3	1417966e-7965-4027-b80a-fd27078a9beb
1b417689-632d-4f5d-90b1-5cf82799f3ba	0570652a-5259-4420-b32b-901a59c6dd2d
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	cc991d9f-5074-43fe-a022-93f926f72b35
e597f43c-a870-4165-956f-465900305fd3	54b6de4a-2a12-4125-ad65-0bcba8fca1b8
e597f43c-a870-4165-956f-465900305fd3	a71c24ac-635d-4b4a-bfd8-d38db0a5e57f
\.


--
-- Data for Name: credential; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.credential (id, salt, type, user_id, created_date, user_label, secret_data, credential_data, priority) FROM stdin;
5051ae7d-d35a-475f-ab88-002747485b74	\N	password	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be	1783395529061	\N	{"value":"CG5SGgI+omi7M5flJLtLKgK6wx1BDol/aii2lJpLWlrwUlnL8K8eT5YKmTTr7ngFNrftQky9iBu7ZEgUBduvGA==","salt":"gyZ6PI6gzAUN/fkQqIy1bA==","additionalParameters":{}}	{"hashIterations":210000,"algorithm":"pbkdf2-sha512","additionalParameters":{}}	10
7bfa6039-10dd-4448-984c-1ac9cfd09bcd	\N	password	364494a2-a476-4d9b-ae57-2fb27bf841c8	1784603218609	\N	{"value":"xkM4Zc4OaLSj3YE8gPktqKZzIut1rT6kCRChMD2PV5RxA/tr5WBTN9UZxdIOJXVmP1VqqZti0EtTdG10YQbskg==","salt":"FbFCltagvHSz5MdZtEg4Vg==","additionalParameters":{}}	{"hashIterations":210000,"algorithm":"pbkdf2-sha512","additionalParameters":{}}	10
8617b14a-50c6-414d-9d02-a8edbe56c85a	\N	password	974c4449-21e0-4313-81ff-9fea0533f23b	1785120316367	\N	{"value":"bYS/MS7cFldkgMCb/3ijkJbPzZr7T3FGX9qsX/IYgJS0WzOCZ4Y395wxM6UO4vBfo+PKiz74QhguCk4EvRB6Ww==","salt":"3GSC8KYjsFZ4ee1rHqtPxQ==","additionalParameters":{}}	{"hashIterations":210000,"algorithm":"pbkdf2-sha512","additionalParameters":{}}	10
3e57ea2a-8329-4764-9615-c3c34b74375d	\N	password	0b6fcae4-b852-4ad1-8d5b-dfc17d3f55a0	1785120328067	\N	{"value":"Bt7cEVir4xCgXvJmiA9viSDESnQONgVWo4ziOFXU4gIbs/K5UkCCSf8Bjx/RDNJ1PbCMb7dq5GN2+ZSYdaRGUw==","salt":"x0qiM2qUhV8RM+paaiTVFQ==","additionalParameters":{}}	{"hashIterations":210000,"algorithm":"pbkdf2-sha512","additionalParameters":{}}	10
\.


--
-- Data for Name: databasechangelog; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.databasechangelog (id, author, filename, dateexecuted, orderexecuted, exectype, md5sum, description, comments, tag, liquibase, contexts, labels, deployment_id) FROM stdin;
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/jpa-changelog-1.0.0.Final.xml	2026-07-07 03:38:42.993624	1	EXECUTED	9:6f1016664e21e16d26517a4418f5e3df	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.25.1	\N	\N	3395522334
1.0.0.Final-KEYCLOAK-5461	sthorger@redhat.com	META-INF/db2-jpa-changelog-1.0.0.Final.xml	2026-07-07 03:38:43.021145	2	MARK_RAN	9:828775b1596a07d1200ba1d49e5e3941	createTable tableName=APPLICATION_DEFAULT_ROLES; createTable tableName=CLIENT; createTable tableName=CLIENT_SESSION; createTable tableName=CLIENT_SESSION_ROLE; createTable tableName=COMPOSITE_ROLE; createTable tableName=CREDENTIAL; createTable tab...		\N	4.25.1	\N	\N	3395522334
1.1.0.Beta1	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Beta1.xml	2026-07-07 03:38:43.105235	3	EXECUTED	9:5f090e44a7d595883c1fb61f4b41fd38	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=CLIENT_ATTRIBUTES; createTable tableName=CLIENT_SESSION_NOTE; createTable tableName=APP_NODE_REGISTRATIONS; addColumn table...		\N	4.25.1	\N	\N	3395522334
1.1.0.Final	sthorger@redhat.com	META-INF/jpa-changelog-1.1.0.Final.xml	2026-07-07 03:38:43.120359	4	EXECUTED	9:c07e577387a3d2c04d1adc9aaad8730e	renameColumn newColumnName=EVENT_TIME, oldColumnName=TIME, tableName=EVENT_ENTITY		\N	4.25.1	\N	\N	3395522334
1.2.0.Beta1	psilva@redhat.com	META-INF/jpa-changelog-1.2.0.Beta1.xml	2026-07-07 03:38:43.350714	5	EXECUTED	9:b68ce996c655922dbcd2fe6b6ae72686	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.25.1	\N	\N	3395522334
1.2.0.Beta1	psilva@redhat.com	META-INF/db2-jpa-changelog-1.2.0.Beta1.xml	2026-07-07 03:38:43.35922	6	MARK_RAN	9:543b5c9989f024fe35c6f6c5a97de88e	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION; createTable tableName=PROTOCOL_MAPPER; createTable tableName=PROTOCOL_MAPPER_CONFIG; createTable tableName=...		\N	4.25.1	\N	\N	3395522334
1.2.0.RC1	bburke@redhat.com	META-INF/jpa-changelog-1.2.0.CR1.xml	2026-07-07 03:38:43.485828	7	EXECUTED	9:765afebbe21cf5bbca048e632df38336	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.25.1	\N	\N	3395522334
1.2.0.RC1	bburke@redhat.com	META-INF/db2-jpa-changelog-1.2.0.CR1.xml	2026-07-07 03:38:43.49732	8	MARK_RAN	9:db4a145ba11a6fdaefb397f6dbf829a1	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=MIGRATION_MODEL; createTable tableName=IDENTITY_P...		\N	4.25.1	\N	\N	3395522334
1.2.0.Final	keycloak	META-INF/jpa-changelog-1.2.0.Final.xml	2026-07-07 03:38:43.50955	9	EXECUTED	9:9d05c7be10cdb873f8bcb41bc3a8ab23	update tableName=CLIENT; update tableName=CLIENT; update tableName=CLIENT		\N	4.25.1	\N	\N	3395522334
1.3.0	bburke@redhat.com	META-INF/jpa-changelog-1.3.0.xml	2026-07-07 03:38:43.721447	10	EXECUTED	9:18593702353128d53111f9b1ff0b82b8	delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete tableName=USER_SESSION; createTable tableName=ADMI...		\N	4.25.1	\N	\N	3395522334
1.4.0	bburke@redhat.com	META-INF/jpa-changelog-1.4.0.xml	2026-07-07 03:38:43.851996	11	EXECUTED	9:6122efe5f090e41a85c0f1c9e52cbb62	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.25.1	\N	\N	3395522334
1.4.0	bburke@redhat.com	META-INF/db2-jpa-changelog-1.4.0.xml	2026-07-07 03:38:43.857634	12	MARK_RAN	9:e1ff28bf7568451453f844c5d54bb0b5	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.25.1	\N	\N	3395522334
1.5.0	bburke@redhat.com	META-INF/jpa-changelog-1.5.0.xml	2026-07-07 03:38:43.889183	13	EXECUTED	9:7af32cd8957fbc069f796b61217483fd	delete tableName=CLIENT_SESSION_AUTH_STATUS; delete tableName=CLIENT_SESSION_ROLE; delete tableName=CLIENT_SESSION_PROT_MAPPER; delete tableName=CLIENT_SESSION_NOTE; delete tableName=CLIENT_SESSION; delete tableName=USER_SESSION_NOTE; delete table...		\N	4.25.1	\N	\N	3395522334
1.6.1_from15	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-07-07 03:38:43.931422	14	EXECUTED	9:6005e15e84714cd83226bf7879f54190	addColumn tableName=REALM; addColumn tableName=KEYCLOAK_ROLE; addColumn tableName=CLIENT; createTable tableName=OFFLINE_USER_SESSION; createTable tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_US_SES_PK2, tableName=...		\N	4.25.1	\N	\N	3395522334
1.6.1_from16-pre	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-07-07 03:38:43.934516	15	MARK_RAN	9:bf656f5a2b055d07f314431cae76f06c	delete tableName=OFFLINE_CLIENT_SESSION; delete tableName=OFFLINE_USER_SESSION		\N	4.25.1	\N	\N	3395522334
1.6.1_from16	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-07-07 03:38:43.938787	16	MARK_RAN	9:f8dadc9284440469dcf71e25ca6ab99b	dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_US_SES_PK, tableName=OFFLINE_USER_SESSION; dropPrimaryKey constraintName=CONSTRAINT_OFFLINE_CL_SES_PK, tableName=OFFLINE_CLIENT_SESSION; addColumn tableName=OFFLINE_USER_SESSION; update tableName=OF...		\N	4.25.1	\N	\N	3395522334
1.6.1	mposolda@redhat.com	META-INF/jpa-changelog-1.6.1.xml	2026-07-07 03:38:43.943445	17	EXECUTED	9:d41d8cd98f00b204e9800998ecf8427e	empty		\N	4.25.1	\N	\N	3395522334
1.7.0	bburke@redhat.com	META-INF/jpa-changelog-1.7.0.xml	2026-07-07 03:38:43.997881	18	EXECUTED	9:3368ff0be4c2855ee2dd9ca813b38d8e	createTable tableName=KEYCLOAK_GROUP; createTable tableName=GROUP_ROLE_MAPPING; createTable tableName=GROUP_ATTRIBUTE; createTable tableName=USER_GROUP_MEMBERSHIP; createTable tableName=REALM_DEFAULT_GROUPS; addColumn tableName=IDENTITY_PROVIDER; ...		\N	4.25.1	\N	\N	3395522334
1.8.0	mposolda@redhat.com	META-INF/jpa-changelog-1.8.0.xml	2026-07-07 03:38:44.062237	19	EXECUTED	9:8ac2fb5dd030b24c0570a763ed75ed20	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.25.1	\N	\N	3395522334
1.8.0-2	keycloak	META-INF/jpa-changelog-1.8.0.xml	2026-07-07 03:38:44.069071	20	EXECUTED	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.25.1	\N	\N	3395522334
24.0.0-9758-2	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-07-07 03:38:45.874833	119	EXECUTED	9:bf0fdee10afdf597a987adbf291db7b2	customChange		\N	4.25.1	\N	\N	3395522334
1.8.0	mposolda@redhat.com	META-INF/db2-jpa-changelog-1.8.0.xml	2026-07-07 03:38:44.075609	21	MARK_RAN	9:831e82914316dc8a57dc09d755f23c51	addColumn tableName=IDENTITY_PROVIDER; createTable tableName=CLIENT_TEMPLATE; createTable tableName=CLIENT_TEMPLATE_ATTRIBUTES; createTable tableName=TEMPLATE_SCOPE_MAPPING; dropNotNullConstraint columnName=CLIENT_ID, tableName=PROTOCOL_MAPPER; ad...		\N	4.25.1	\N	\N	3395522334
1.8.0-2	keycloak	META-INF/db2-jpa-changelog-1.8.0.xml	2026-07-07 03:38:44.083269	22	MARK_RAN	9:f91ddca9b19743db60e3057679810e6c	dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; update tableName=CREDENTIAL		\N	4.25.1	\N	\N	3395522334
1.9.0	mposolda@redhat.com	META-INF/jpa-changelog-1.9.0.xml	2026-07-07 03:38:44.11719	23	EXECUTED	9:bc3d0f9e823a69dc21e23e94c7a94bb1	update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=REALM; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=REALM; update tableName=REALM; customChange; dr...		\N	4.25.1	\N	\N	3395522334
1.9.1	keycloak	META-INF/jpa-changelog-1.9.1.xml	2026-07-07 03:38:44.125318	24	EXECUTED	9:c9999da42f543575ab790e76439a2679	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=PUBLIC_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.25.1	\N	\N	3395522334
1.9.1	keycloak	META-INF/db2-jpa-changelog-1.9.1.xml	2026-07-07 03:38:44.127607	25	MARK_RAN	9:0d6c65c6f58732d81569e77b10ba301d	modifyDataType columnName=PRIVATE_KEY, tableName=REALM; modifyDataType columnName=CERTIFICATE, tableName=REALM		\N	4.25.1	\N	\N	3395522334
1.9.2	keycloak	META-INF/jpa-changelog-1.9.2.xml	2026-07-07 03:38:44.181236	26	EXECUTED	9:fc576660fc016ae53d2d4778d84d86d0	createIndex indexName=IDX_USER_EMAIL, tableName=USER_ENTITY; createIndex indexName=IDX_USER_ROLE_MAPPING, tableName=USER_ROLE_MAPPING; createIndex indexName=IDX_USER_GROUP_MAPPING, tableName=USER_GROUP_MEMBERSHIP; createIndex indexName=IDX_USER_CO...		\N	4.25.1	\N	\N	3395522334
authz-2.0.0	psilva@redhat.com	META-INF/jpa-changelog-authz-2.0.0.xml	2026-07-07 03:38:44.304071	27	EXECUTED	9:43ed6b0da89ff77206289e87eaa9c024	createTable tableName=RESOURCE_SERVER; addPrimaryKey constraintName=CONSTRAINT_FARS, tableName=RESOURCE_SERVER; addUniqueConstraint constraintName=UK_AU8TT6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER; createTable tableName=RESOURCE_SERVER_RESOU...		\N	4.25.1	\N	\N	3395522334
authz-2.5.1	psilva@redhat.com	META-INF/jpa-changelog-authz-2.5.1.xml	2026-07-07 03:38:44.312353	28	EXECUTED	9:44bae577f551b3738740281eceb4ea70	update tableName=RESOURCE_SERVER_POLICY		\N	4.25.1	\N	\N	3395522334
2.1.0-KEYCLOAK-5461	bburke@redhat.com	META-INF/jpa-changelog-2.1.0.xml	2026-07-07 03:38:44.44443	29	EXECUTED	9:bd88e1f833df0420b01e114533aee5e8	createTable tableName=BROKER_LINK; createTable tableName=FED_USER_ATTRIBUTE; createTable tableName=FED_USER_CONSENT; createTable tableName=FED_USER_CONSENT_ROLE; createTable tableName=FED_USER_CONSENT_PROT_MAPPER; createTable tableName=FED_USER_CR...		\N	4.25.1	\N	\N	3395522334
2.2.0	bburke@redhat.com	META-INF/jpa-changelog-2.2.0.xml	2026-07-07 03:38:44.480622	30	EXECUTED	9:a7022af5267f019d020edfe316ef4371	addColumn tableName=ADMIN_EVENT_ENTITY; createTable tableName=CREDENTIAL_ATTRIBUTE; createTable tableName=FED_CREDENTIAL_ATTRIBUTE; modifyDataType columnName=VALUE, tableName=CREDENTIAL; addForeignKeyConstraint baseTableName=FED_CREDENTIAL_ATTRIBU...		\N	4.25.1	\N	\N	3395522334
2.3.0	bburke@redhat.com	META-INF/jpa-changelog-2.3.0.xml	2026-07-07 03:38:44.515943	31	EXECUTED	9:fc155c394040654d6a79227e56f5e25a	createTable tableName=FEDERATED_USER; addPrimaryKey constraintName=CONSTR_FEDERATED_USER, tableName=FEDERATED_USER; dropDefaultValue columnName=TOTP, tableName=USER_ENTITY; dropColumn columnName=TOTP, tableName=USER_ENTITY; addColumn tableName=IDE...		\N	4.25.1	\N	\N	3395522334
2.4.0	bburke@redhat.com	META-INF/jpa-changelog-2.4.0.xml	2026-07-07 03:38:44.523268	32	EXECUTED	9:eac4ffb2a14795e5dc7b426063e54d88	customChange		\N	4.25.1	\N	\N	3395522334
2.5.0	bburke@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-07-07 03:38:44.532573	33	EXECUTED	9:54937c05672568c4c64fc9524c1e9462	customChange; modifyDataType columnName=USER_ID, tableName=OFFLINE_USER_SESSION		\N	4.25.1	\N	\N	3395522334
2.5.0-unicode-oracle	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-07-07 03:38:44.535823	34	MARK_RAN	9:3a32bace77c84d7678d035a7f5a8084e	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.25.1	\N	\N	3395522334
2.5.0-unicode-other-dbs	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-07-07 03:38:44.575431	35	EXECUTED	9:33d72168746f81f98ae3a1e8e0ca3554	modifyDataType columnName=DESCRIPTION, tableName=AUTHENTICATION_FLOW; modifyDataType columnName=DESCRIPTION, tableName=CLIENT_TEMPLATE; modifyDataType columnName=DESCRIPTION, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=DESCRIPTION,...		\N	4.25.1	\N	\N	3395522334
2.5.0-duplicate-email-support	slawomir@dabek.name	META-INF/jpa-changelog-2.5.0.xml	2026-07-07 03:38:44.582143	36	EXECUTED	9:61b6d3d7a4c0e0024b0c839da283da0c	addColumn tableName=REALM		\N	4.25.1	\N	\N	3395522334
2.5.0-unique-group-names	hmlnarik@redhat.com	META-INF/jpa-changelog-2.5.0.xml	2026-07-07 03:38:44.593155	37	EXECUTED	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.25.1	\N	\N	3395522334
2.5.1	bburke@redhat.com	META-INF/jpa-changelog-2.5.1.xml	2026-07-07 03:38:44.599529	38	EXECUTED	9:a2b870802540cb3faa72098db5388af3	addColumn tableName=FED_USER_CONSENT		\N	4.25.1	\N	\N	3395522334
3.0.0	bburke@redhat.com	META-INF/jpa-changelog-3.0.0.xml	2026-07-07 03:38:44.604468	39	EXECUTED	9:132a67499ba24bcc54fb5cbdcfe7e4c0	addColumn tableName=IDENTITY_PROVIDER		\N	4.25.1	\N	\N	3395522334
3.2.0-fix	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-07-07 03:38:44.606688	40	MARK_RAN	9:938f894c032f5430f2b0fafb1a243462	addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS		\N	4.25.1	\N	\N	3395522334
3.2.0-fix-with-keycloak-5416	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-07-07 03:38:44.609435	41	MARK_RAN	9:845c332ff1874dc5d35974b0babf3006	dropIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS; addNotNullConstraint columnName=REALM_ID, tableName=CLIENT_INITIAL_ACCESS; createIndex indexName=IDX_CLIENT_INIT_ACC_REALM, tableName=CLIENT_INITIAL_ACCESS		\N	4.25.1	\N	\N	3395522334
3.2.0-fix-offline-sessions	hmlnarik	META-INF/jpa-changelog-3.2.0.xml	2026-07-07 03:38:44.61636	42	EXECUTED	9:fc86359c079781adc577c5a217e4d04c	customChange		\N	4.25.1	\N	\N	3395522334
3.2.0-fixed	keycloak	META-INF/jpa-changelog-3.2.0.xml	2026-07-07 03:38:44.854081	43	EXECUTED	9:59a64800e3c0d09b825f8a3b444fa8f4	addColumn tableName=REALM; dropPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_PK2, tableName=OFFLINE_CLIENT_SESSION; dropColumn columnName=CLIENT_SESSION_ID, tableName=OFFLINE_CLIENT_SESSION; addPrimaryKey constraintName=CONSTRAINT_OFFL_CL_SES_P...		\N	4.25.1	\N	\N	3395522334
3.3.0	keycloak	META-INF/jpa-changelog-3.3.0.xml	2026-07-07 03:38:44.863786	44	EXECUTED	9:d48d6da5c6ccf667807f633fe489ce88	addColumn tableName=USER_ENTITY		\N	4.25.1	\N	\N	3395522334
authz-3.4.0.CR1-resource-server-pk-change-part1	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-07-07 03:38:44.873938	45	EXECUTED	9:dde36f7973e80d71fceee683bc5d2951	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_RESOURCE; addColumn tableName=RESOURCE_SERVER_SCOPE		\N	4.25.1	\N	\N	3395522334
authz-3.4.0.CR1-resource-server-pk-change-part2-KEYCLOAK-6095	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-07-07 03:38:44.884095	46	EXECUTED	9:b855e9b0a406b34fa323235a0cf4f640	customChange		\N	4.25.1	\N	\N	3395522334
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-07-07 03:38:44.886668	47	MARK_RAN	9:51abbacd7b416c50c4421a8cabf7927e	dropIndex indexName=IDX_RES_SERV_POL_RES_SERV, tableName=RESOURCE_SERVER_POLICY; dropIndex indexName=IDX_RES_SRV_RES_RES_SRV, tableName=RESOURCE_SERVER_RESOURCE; dropIndex indexName=IDX_RES_SRV_SCOPE_RES_SRV, tableName=RESOURCE_SERVER_SCOPE		\N	4.25.1	\N	\N	3395522334
authz-3.4.0.CR1-resource-server-pk-change-part3-fixed-nodropindex	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-07-07 03:38:44.932301	48	EXECUTED	9:bdc99e567b3398bac83263d375aad143	addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_POLICY; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, tableName=RESOURCE_SERVER_RESOURCE; addNotNullConstraint columnName=RESOURCE_SERVER_CLIENT_ID, ...		\N	4.25.1	\N	\N	3395522334
authn-3.4.0.CR1-refresh-token-max-reuse	glavoie@gmail.com	META-INF/jpa-changelog-authz-3.4.0.CR1.xml	2026-07-07 03:38:44.938272	49	EXECUTED	9:d198654156881c46bfba39abd7769e69	addColumn tableName=REALM		\N	4.25.1	\N	\N	3395522334
3.4.0	keycloak	META-INF/jpa-changelog-3.4.0.xml	2026-07-07 03:38:45.00867	50	EXECUTED	9:cfdd8736332ccdd72c5256ccb42335db	addPrimaryKey constraintName=CONSTRAINT_REALM_DEFAULT_ROLES, tableName=REALM_DEFAULT_ROLES; addPrimaryKey constraintName=CONSTRAINT_COMPOSITE_ROLE, tableName=COMPOSITE_ROLE; addPrimaryKey constraintName=CONSTR_REALM_DEFAULT_GROUPS, tableName=REALM...		\N	4.25.1	\N	\N	3395522334
3.4.0-KEYCLOAK-5230	hmlnarik@redhat.com	META-INF/jpa-changelog-3.4.0.xml	2026-07-07 03:38:45.067198	51	EXECUTED	9:7c84de3d9bd84d7f077607c1a4dcb714	createIndex indexName=IDX_FU_ATTRIBUTE, tableName=FED_USER_ATTRIBUTE; createIndex indexName=IDX_FU_CONSENT, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CONSENT_RU, tableName=FED_USER_CONSENT; createIndex indexName=IDX_FU_CREDENTIAL, t...		\N	4.25.1	\N	\N	3395522334
3.4.1	psilva@redhat.com	META-INF/jpa-changelog-3.4.1.xml	2026-07-07 03:38:45.073836	52	EXECUTED	9:5a6bb36cbefb6a9d6928452c0852af2d	modifyDataType columnName=VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	3395522334
3.4.2	keycloak	META-INF/jpa-changelog-3.4.2.xml	2026-07-07 03:38:45.078752	53	EXECUTED	9:8f23e334dbc59f82e0a328373ca6ced0	update tableName=REALM		\N	4.25.1	\N	\N	3395522334
3.4.2-KEYCLOAK-5172	mkanis@redhat.com	META-INF/jpa-changelog-3.4.2.xml	2026-07-07 03:38:45.083602	54	EXECUTED	9:9156214268f09d970cdf0e1564d866af	update tableName=CLIENT		\N	4.25.1	\N	\N	3395522334
4.0.0-KEYCLOAK-6335	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-07-07 03:38:45.094152	55	EXECUTED	9:db806613b1ed154826c02610b7dbdf74	createTable tableName=CLIENT_AUTH_FLOW_BINDINGS; addPrimaryKey constraintName=C_CLI_FLOW_BIND, tableName=CLIENT_AUTH_FLOW_BINDINGS		\N	4.25.1	\N	\N	3395522334
4.0.0-CLEANUP-UNUSED-TABLE	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-07-07 03:38:45.10147	56	EXECUTED	9:229a041fb72d5beac76bb94a5fa709de	dropTable tableName=CLIENT_IDENTITY_PROV_MAPPING		\N	4.25.1	\N	\N	3395522334
4.0.0-KEYCLOAK-6228	bburke@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-07-07 03:38:45.13105	57	EXECUTED	9:079899dade9c1e683f26b2aa9ca6ff04	dropUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHOGM8UEWRT, tableName=USER_CONSENT; dropNotNullConstraint columnName=CLIENT_ID, tableName=USER_CONSENT; addColumn tableName=USER_CONSENT; addUniqueConstraint constraintName=UK_JKUWUVD56ONTGSUHO...		\N	4.25.1	\N	\N	3395522334
4.0.0-KEYCLOAK-5579-fixed	mposolda@redhat.com	META-INF/jpa-changelog-4.0.0.xml	2026-07-07 03:38:45.236512	58	EXECUTED	9:139b79bcbbfe903bb1c2d2a4dbf001d9	dropForeignKeyConstraint baseTableName=CLIENT_TEMPLATE_ATTRIBUTES, constraintName=FK_CL_TEMPL_ATTR_TEMPL; renameTable newTableName=CLIENT_SCOPE_ATTRIBUTES, oldTableName=CLIENT_TEMPLATE_ATTRIBUTES; renameColumn newColumnName=SCOPE_ID, oldColumnName...		\N	4.25.1	\N	\N	3395522334
authz-4.0.0.CR1	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.CR1.xml	2026-07-07 03:38:45.264348	59	EXECUTED	9:b55738ad889860c625ba2bf483495a04	createTable tableName=RESOURCE_SERVER_PERM_TICKET; addPrimaryKey constraintName=CONSTRAINT_FAPMT, tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRHO213XCX4WNKOG82SSPMT...		\N	4.25.1	\N	\N	3395522334
authz-4.0.0.Beta3	psilva@redhat.com	META-INF/jpa-changelog-authz-4.0.0.Beta3.xml	2026-07-07 03:38:45.272261	60	EXECUTED	9:e0057eac39aa8fc8e09ac6cfa4ae15fe	addColumn tableName=RESOURCE_SERVER_POLICY; addColumn tableName=RESOURCE_SERVER_PERM_TICKET; addForeignKeyConstraint baseTableName=RESOURCE_SERVER_PERM_TICKET, constraintName=FK_FRSRPO2128CX4WNKOG82SSRFY, referencedTableName=RESOURCE_SERVER_POLICY		\N	4.25.1	\N	\N	3395522334
authz-4.2.0.Final	mhajas@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2026-07-07 03:38:45.283738	61	EXECUTED	9:42a33806f3a0443fe0e7feeec821326c	createTable tableName=RESOURCE_URIS; addForeignKeyConstraint baseTableName=RESOURCE_URIS, constraintName=FK_RESOURCE_SERVER_URIS, referencedTableName=RESOURCE_SERVER_RESOURCE; customChange; dropColumn columnName=URI, tableName=RESOURCE_SERVER_RESO...		\N	4.25.1	\N	\N	3395522334
authz-4.2.0.Final-KEYCLOAK-9944	hmlnarik@redhat.com	META-INF/jpa-changelog-authz-4.2.0.Final.xml	2026-07-07 03:38:45.292432	62	EXECUTED	9:9968206fca46eecc1f51db9c024bfe56	addPrimaryKey constraintName=CONSTRAINT_RESOUR_URIS_PK, tableName=RESOURCE_URIS		\N	4.25.1	\N	\N	3395522334
4.2.0-KEYCLOAK-6313	wadahiro@gmail.com	META-INF/jpa-changelog-4.2.0.xml	2026-07-07 03:38:45.29784	63	EXECUTED	9:92143a6daea0a3f3b8f598c97ce55c3d	addColumn tableName=REQUIRED_ACTION_PROVIDER		\N	4.25.1	\N	\N	3395522334
4.3.0-KEYCLOAK-7984	wadahiro@gmail.com	META-INF/jpa-changelog-4.3.0.xml	2026-07-07 03:38:45.302759	64	EXECUTED	9:82bab26a27195d889fb0429003b18f40	update tableName=REQUIRED_ACTION_PROVIDER		\N	4.25.1	\N	\N	3395522334
4.6.0-KEYCLOAK-7950	psilva@redhat.com	META-INF/jpa-changelog-4.6.0.xml	2026-07-07 03:38:45.306175	65	EXECUTED	9:e590c88ddc0b38b0ae4249bbfcb5abc3	update tableName=RESOURCE_SERVER_RESOURCE		\N	4.25.1	\N	\N	3395522334
4.6.0-KEYCLOAK-8377	keycloak	META-INF/jpa-changelog-4.6.0.xml	2026-07-07 03:38:45.323512	66	EXECUTED	9:5c1f475536118dbdc38d5d7977950cc0	createTable tableName=ROLE_ATTRIBUTE; addPrimaryKey constraintName=CONSTRAINT_ROLE_ATTRIBUTE_PK, tableName=ROLE_ATTRIBUTE; addForeignKeyConstraint baseTableName=ROLE_ATTRIBUTE, constraintName=FK_ROLE_ATTRIBUTE_ID, referencedTableName=KEYCLOAK_ROLE...		\N	4.25.1	\N	\N	3395522334
4.6.0-KEYCLOAK-8555	gideonray@gmail.com	META-INF/jpa-changelog-4.6.0.xml	2026-07-07 03:38:45.331091	67	EXECUTED	9:e7c9f5f9c4d67ccbbcc215440c718a17	createIndex indexName=IDX_COMPONENT_PROVIDER_TYPE, tableName=COMPONENT		\N	4.25.1	\N	\N	3395522334
4.7.0-KEYCLOAK-1267	sguilhen@redhat.com	META-INF/jpa-changelog-4.7.0.xml	2026-07-07 03:38:45.33909	68	EXECUTED	9:88e0bfdda924690d6f4e430c53447dd5	addColumn tableName=REALM		\N	4.25.1	\N	\N	3395522334
4.7.0-KEYCLOAK-7275	keycloak	META-INF/jpa-changelog-4.7.0.xml	2026-07-07 03:38:45.360564	69	EXECUTED	9:f53177f137e1c46b6a88c59ec1cb5218	renameColumn newColumnName=CREATED_ON, oldColumnName=LAST_SESSION_REFRESH, tableName=OFFLINE_USER_SESSION; addNotNullConstraint columnName=CREATED_ON, tableName=OFFLINE_USER_SESSION; addColumn tableName=OFFLINE_USER_SESSION; customChange; createIn...		\N	4.25.1	\N	\N	3395522334
4.8.0-KEYCLOAK-8835	sguilhen@redhat.com	META-INF/jpa-changelog-4.8.0.xml	2026-07-07 03:38:45.370026	70	EXECUTED	9:a74d33da4dc42a37ec27121580d1459f	addNotNullConstraint columnName=SSO_MAX_LIFESPAN_REMEMBER_ME, tableName=REALM; addNotNullConstraint columnName=SSO_IDLE_TIMEOUT_REMEMBER_ME, tableName=REALM		\N	4.25.1	\N	\N	3395522334
authz-7.0.0-KEYCLOAK-10443	psilva@redhat.com	META-INF/jpa-changelog-authz-7.0.0.xml	2026-07-07 03:38:45.376584	71	EXECUTED	9:fd4ade7b90c3b67fae0bfcfcb42dfb5f	addColumn tableName=RESOURCE_SERVER		\N	4.25.1	\N	\N	3395522334
8.0.0-adding-credential-columns	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-07-07 03:38:45.386378	72	EXECUTED	9:aa072ad090bbba210d8f18781b8cebf4	addColumn tableName=CREDENTIAL; addColumn tableName=FED_USER_CREDENTIAL		\N	4.25.1	\N	\N	3395522334
8.0.0-updating-credential-data-not-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-07-07 03:38:45.396041	73	EXECUTED	9:1ae6be29bab7c2aa376f6983b932be37	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.25.1	\N	\N	3395522334
8.0.0-updating-credential-data-oracle-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-07-07 03:38:45.399748	74	MARK_RAN	9:14706f286953fc9a25286dbd8fb30d97	update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL; update tableName=FED_USER_CREDENTIAL		\N	4.25.1	\N	\N	3395522334
8.0.0-credential-cleanup-fixed	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-07-07 03:38:45.421924	75	EXECUTED	9:2b9cc12779be32c5b40e2e67711a218b	dropDefaultValue columnName=COUNTER, tableName=CREDENTIAL; dropDefaultValue columnName=DIGITS, tableName=CREDENTIAL; dropDefaultValue columnName=PERIOD, tableName=CREDENTIAL; dropDefaultValue columnName=ALGORITHM, tableName=CREDENTIAL; dropColumn ...		\N	4.25.1	\N	\N	3395522334
8.0.0-resource-tag-support	keycloak	META-INF/jpa-changelog-8.0.0.xml	2026-07-07 03:38:45.430692	76	EXECUTED	9:91fa186ce7a5af127a2d7a91ee083cc5	addColumn tableName=MIGRATION_MODEL; createIndex indexName=IDX_UPDATE_TIME, tableName=MIGRATION_MODEL		\N	4.25.1	\N	\N	3395522334
9.0.0-always-display-client	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-07-07 03:38:45.436435	77	EXECUTED	9:6335e5c94e83a2639ccd68dd24e2e5ad	addColumn tableName=CLIENT		\N	4.25.1	\N	\N	3395522334
9.0.0-drop-constraints-for-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-07-07 03:38:45.439032	78	MARK_RAN	9:6bdb5658951e028bfe16fa0a8228b530	dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5PMT, tableName=RESOURCE_SERVER_PERM_TICKET; dropUniqueConstraint constraintName=UK_FRSR6T700S9V50BU18WS5HA6, tableName=RESOURCE_SERVER_RESOURCE; dropPrimaryKey constraintName=CONSTRAINT_O...		\N	4.25.1	\N	\N	3395522334
9.0.0-increase-column-size-federated-fk	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-07-07 03:38:45.463288	79	EXECUTED	9:d5bc15a64117ccad481ce8792d4c608f	modifyDataType columnName=CLIENT_ID, tableName=FED_USER_CONSENT; modifyDataType columnName=CLIENT_REALM_CONSTRAINT, tableName=KEYCLOAK_ROLE; modifyDataType columnName=OWNER, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=CLIENT_ID, ta...		\N	4.25.1	\N	\N	3395522334
9.0.0-recreate-constraints-after-column-increase	keycloak	META-INF/jpa-changelog-9.0.0.xml	2026-07-07 03:38:45.466009	80	MARK_RAN	9:077cba51999515f4d3e7ad5619ab592c	addNotNullConstraint columnName=CLIENT_ID, tableName=OFFLINE_CLIENT_SESSION; addNotNullConstraint columnName=OWNER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNullConstraint columnName=REQUESTER, tableName=RESOURCE_SERVER_PERM_TICKET; addNotNull...		\N	4.25.1	\N	\N	3395522334
9.0.1-add-index-to-client.client_id	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-07-07 03:38:45.482508	81	EXECUTED	9:be969f08a163bf47c6b9e9ead8ac2afb	createIndex indexName=IDX_CLIENT_ID, tableName=CLIENT		\N	4.25.1	\N	\N	3395522334
9.0.1-KEYCLOAK-12579-drop-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-07-07 03:38:45.484932	82	MARK_RAN	9:6d3bb4408ba5a72f39bd8a0b301ec6e3	dropUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.25.1	\N	\N	3395522334
9.0.1-KEYCLOAK-12579-add-not-null-constraint	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-07-07 03:38:45.491597	83	EXECUTED	9:966bda61e46bebf3cc39518fbed52fa7	addNotNullConstraint columnName=PARENT_GROUP, tableName=KEYCLOAK_GROUP		\N	4.25.1	\N	\N	3395522334
9.0.1-KEYCLOAK-12579-recreate-constraints	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-07-07 03:38:45.493965	84	MARK_RAN	9:8dcac7bdf7378e7d823cdfddebf72fda	addUniqueConstraint constraintName=SIBLING_NAMES, tableName=KEYCLOAK_GROUP		\N	4.25.1	\N	\N	3395522334
9.0.1-add-index-to-events	keycloak	META-INF/jpa-changelog-9.0.1.xml	2026-07-07 03:38:45.503666	85	EXECUTED	9:7d93d602352a30c0c317e6a609b56599	createIndex indexName=IDX_EVENT_TIME, tableName=EVENT_ENTITY		\N	4.25.1	\N	\N	3395522334
map-remove-ri	keycloak	META-INF/jpa-changelog-11.0.0.xml	2026-07-07 03:38:45.511506	86	EXECUTED	9:71c5969e6cdd8d7b6f47cebc86d37627	dropForeignKeyConstraint baseTableName=REALM, constraintName=FK_TRAF444KK6QRKMS7N56AIWQ5Y; dropForeignKeyConstraint baseTableName=KEYCLOAK_ROLE, constraintName=FK_KJHO5LE2C0RAL09FL8CM9WFW9		\N	4.25.1	\N	\N	3395522334
map-remove-ri	keycloak	META-INF/jpa-changelog-12.0.0.xml	2026-07-07 03:38:45.52199	87	EXECUTED	9:a9ba7d47f065f041b7da856a81762021	dropForeignKeyConstraint baseTableName=REALM_DEFAULT_GROUPS, constraintName=FK_DEF_GROUPS_GROUP; dropForeignKeyConstraint baseTableName=REALM_DEFAULT_ROLES, constraintName=FK_H4WPD7W4HSOOLNI3H0SW7BTJE; dropForeignKeyConstraint baseTableName=CLIENT...		\N	4.25.1	\N	\N	3395522334
12.1.0-add-realm-localization-table	keycloak	META-INF/jpa-changelog-12.0.0.xml	2026-07-07 03:38:45.538243	88	EXECUTED	9:fffabce2bc01e1a8f5110d5278500065	createTable tableName=REALM_LOCALIZATIONS; addPrimaryKey tableName=REALM_LOCALIZATIONS		\N	4.25.1	\N	\N	3395522334
default-roles	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-07-07 03:38:45.551955	89	EXECUTED	9:fa8a5b5445e3857f4b010bafb5009957	addColumn tableName=REALM; customChange		\N	4.25.1	\N	\N	3395522334
default-roles-cleanup	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-07-07 03:38:45.560548	90	EXECUTED	9:67ac3241df9a8582d591c5ed87125f39	dropTable tableName=REALM_DEFAULT_ROLES; dropTable tableName=CLIENT_DEFAULT_ROLES		\N	4.25.1	\N	\N	3395522334
13.0.0-KEYCLOAK-16844	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-07-07 03:38:45.570143	91	EXECUTED	9:ad1194d66c937e3ffc82386c050ba089	createIndex indexName=IDX_OFFLINE_USS_PRELOAD, tableName=OFFLINE_USER_SESSION		\N	4.25.1	\N	\N	3395522334
map-remove-ri-13.0.0	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-07-07 03:38:45.580261	92	EXECUTED	9:d9be619d94af5a2f5d07b9f003543b91	dropForeignKeyConstraint baseTableName=DEFAULT_CLIENT_SCOPE, constraintName=FK_R_DEF_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SCOPE_CLIENT, constraintName=FK_C_CLI_SCOPE_SCOPE; dropForeignKeyConstraint baseTableName=CLIENT_SC...		\N	4.25.1	\N	\N	3395522334
13.0.0-KEYCLOAK-17992-drop-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-07-07 03:38:45.585859	93	MARK_RAN	9:544d201116a0fcc5a5da0925fbbc3bde	dropPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CLSCOPE_CL, tableName=CLIENT_SCOPE_CLIENT; dropIndex indexName=IDX_CL_CLSCOPE, tableName=CLIENT_SCOPE_CLIENT		\N	4.25.1	\N	\N	3395522334
13.0.0-increase-column-size-federated	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-07-07 03:38:45.598008	94	EXECUTED	9:43c0c1055b6761b4b3e89de76d612ccf	modifyDataType columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; modifyDataType columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT		\N	4.25.1	\N	\N	3395522334
13.0.0-KEYCLOAK-17992-recreate-constraints	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-07-07 03:38:45.600546	95	MARK_RAN	9:8bd711fd0330f4fe980494ca43ab1139	addNotNullConstraint columnName=CLIENT_ID, tableName=CLIENT_SCOPE_CLIENT; addNotNullConstraint columnName=SCOPE_ID, tableName=CLIENT_SCOPE_CLIENT; addPrimaryKey constraintName=C_CLI_SCOPE_BIND, tableName=CLIENT_SCOPE_CLIENT; createIndex indexName=...		\N	4.25.1	\N	\N	3395522334
json-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-13.0.0.xml	2026-07-07 03:38:45.608881	96	EXECUTED	9:e07d2bc0970c348bb06fb63b1f82ddbf	addColumn tableName=REALM_ATTRIBUTE; update tableName=REALM_ATTRIBUTE; dropColumn columnName=VALUE, tableName=REALM_ATTRIBUTE; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=REALM_ATTRIBUTE		\N	4.25.1	\N	\N	3395522334
14.0.0-KEYCLOAK-11019	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-07-07 03:38:45.627766	97	EXECUTED	9:24fb8611e97f29989bea412aa38d12b7	createIndex indexName=IDX_OFFLINE_CSS_PRELOAD, tableName=OFFLINE_CLIENT_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USER, tableName=OFFLINE_USER_SESSION; createIndex indexName=IDX_OFFLINE_USS_BY_USERSESS, tableName=OFFLINE_USER_SESSION		\N	4.25.1	\N	\N	3395522334
14.0.0-KEYCLOAK-18286	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-07-07 03:38:45.631097	98	MARK_RAN	9:259f89014ce2506ee84740cbf7163aa7	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	3395522334
14.0.0-KEYCLOAK-18286-revert	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-07-07 03:38:45.649123	99	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	3395522334
14.0.0-KEYCLOAK-18286-supported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-07-07 03:38:45.661656	100	EXECUTED	9:60ca84a0f8c94ec8c3504a5a3bc88ee8	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	3395522334
14.0.0-KEYCLOAK-18286-unsupported-dbs	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-07-07 03:38:45.664476	101	MARK_RAN	9:d3d977031d431db16e2c181ce49d73e9	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	3395522334
KEYCLOAK-17267-add-index-to-user-attributes	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-07-07 03:38:45.675154	102	EXECUTED	9:0b305d8d1277f3a89a0a53a659ad274c	createIndex indexName=IDX_USER_ATTRIBUTE_NAME, tableName=USER_ATTRIBUTE		\N	4.25.1	\N	\N	3395522334
KEYCLOAK-18146-add-saml-art-binding-identifier	keycloak	META-INF/jpa-changelog-14.0.0.xml	2026-07-07 03:38:45.683721	103	EXECUTED	9:2c374ad2cdfe20e2905a84c8fac48460	customChange		\N	4.25.1	\N	\N	3395522334
15.0.0-KEYCLOAK-18467	keycloak	META-INF/jpa-changelog-15.0.0.xml	2026-07-07 03:38:45.691796	104	EXECUTED	9:47a760639ac597360a8219f5b768b4de	addColumn tableName=REALM_LOCALIZATIONS; update tableName=REALM_LOCALIZATIONS; dropColumn columnName=TEXTS, tableName=REALM_LOCALIZATIONS; renameColumn newColumnName=TEXTS, oldColumnName=TEXTS_NEW, tableName=REALM_LOCALIZATIONS; addNotNullConstrai...		\N	4.25.1	\N	\N	3395522334
17.0.0-9562	keycloak	META-INF/jpa-changelog-17.0.0.xml	2026-07-07 03:38:45.701665	105	EXECUTED	9:a6272f0576727dd8cad2522335f5d99e	createIndex indexName=IDX_USER_SERVICE_ACCOUNT, tableName=USER_ENTITY		\N	4.25.1	\N	\N	3395522334
18.0.0-10625-IDX_ADMIN_EVENT_TIME	keycloak	META-INF/jpa-changelog-18.0.0.xml	2026-07-07 03:38:45.710318	106	EXECUTED	9:015479dbd691d9cc8669282f4828c41d	createIndex indexName=IDX_ADMIN_EVENT_TIME, tableName=ADMIN_EVENT_ENTITY		\N	4.25.1	\N	\N	3395522334
19.0.0-10135	keycloak	META-INF/jpa-changelog-19.0.0.xml	2026-07-07 03:38:45.717722	107	EXECUTED	9:9518e495fdd22f78ad6425cc30630221	customChange		\N	4.25.1	\N	\N	3395522334
20.0.0-12964-supported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-07-07 03:38:45.727381	108	EXECUTED	9:e5f243877199fd96bcc842f27a1656ac	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.25.1	\N	\N	3395522334
20.0.0-12964-unsupported-dbs	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-07-07 03:38:45.730225	109	MARK_RAN	9:1a6fcaa85e20bdeae0a9ce49b41946a5	createIndex indexName=IDX_GROUP_ATT_BY_NAME_VALUE, tableName=GROUP_ATTRIBUTE		\N	4.25.1	\N	\N	3395522334
client-attributes-string-accomodation-fixed	keycloak	META-INF/jpa-changelog-20.0.0.xml	2026-07-07 03:38:45.738847	110	EXECUTED	9:3f332e13e90739ed0c35b0b25b7822ca	addColumn tableName=CLIENT_ATTRIBUTES; update tableName=CLIENT_ATTRIBUTES; dropColumn columnName=VALUE, tableName=CLIENT_ATTRIBUTES; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	3395522334
21.0.2-17277	keycloak	META-INF/jpa-changelog-21.0.2.xml	2026-07-07 03:38:45.745774	111	EXECUTED	9:7ee1f7a3fb8f5588f171fb9a6ab623c0	customChange		\N	4.25.1	\N	\N	3395522334
21.1.0-19404	keycloak	META-INF/jpa-changelog-21.1.0.xml	2026-07-07 03:38:45.799894	112	EXECUTED	9:3d7e830b52f33676b9d64f7f2b2ea634	modifyDataType columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=LOGIC, tableName=RESOURCE_SERVER_POLICY; modifyDataType columnName=POLICY_ENFORCE_MODE, tableName=RESOURCE_SERVER		\N	4.25.1	\N	\N	3395522334
21.1.0-19404-2	keycloak	META-INF/jpa-changelog-21.1.0.xml	2026-07-07 03:38:45.805568	113	MARK_RAN	9:627d032e3ef2c06c0e1f73d2ae25c26c	addColumn tableName=RESOURCE_SERVER_POLICY; update tableName=RESOURCE_SERVER_POLICY; dropColumn columnName=DECISION_STRATEGY, tableName=RESOURCE_SERVER_POLICY; renameColumn newColumnName=DECISION_STRATEGY, oldColumnName=DECISION_STRATEGY_NEW, tabl...		\N	4.25.1	\N	\N	3395522334
22.0.0-17484-updated	keycloak	META-INF/jpa-changelog-22.0.0.xml	2026-07-07 03:38:45.819303	114	EXECUTED	9:90af0bfd30cafc17b9f4d6eccd92b8b3	customChange		\N	4.25.1	\N	\N	3395522334
22.0.5-24031	keycloak	META-INF/jpa-changelog-22.0.0.xml	2026-07-07 03:38:45.822688	115	MARK_RAN	9:a60d2d7b315ec2d3eba9e2f145f9df28	customChange		\N	4.25.1	\N	\N	3395522334
23.0.0-12062	keycloak	META-INF/jpa-changelog-23.0.0.xml	2026-07-07 03:38:45.832759	116	EXECUTED	9:2168fbe728fec46ae9baf15bf80927b8	addColumn tableName=COMPONENT_CONFIG; update tableName=COMPONENT_CONFIG; dropColumn columnName=VALUE, tableName=COMPONENT_CONFIG; renameColumn newColumnName=VALUE, oldColumnName=VALUE_NEW, tableName=COMPONENT_CONFIG		\N	4.25.1	\N	\N	3395522334
23.0.0-17258	keycloak	META-INF/jpa-changelog-23.0.0.xml	2026-07-07 03:38:45.838777	117	EXECUTED	9:36506d679a83bbfda85a27ea1864dca8	addColumn tableName=EVENT_ENTITY		\N	4.25.1	\N	\N	3395522334
24.0.0-9758	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-07-07 03:38:45.86505	118	EXECUTED	9:502c557a5189f600f0f445a9b49ebbce	addColumn tableName=USER_ATTRIBUTE; addColumn tableName=FED_USER_ATTRIBUTE; createIndex indexName=USER_ATTR_LONG_VALUES, tableName=USER_ATTRIBUTE; createIndex indexName=FED_USER_ATTR_LONG_VALUES, tableName=FED_USER_ATTRIBUTE; createIndex indexName...		\N	4.25.1	\N	\N	3395522334
24.0.0-26618-drop-index-if-present	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-07-07 03:38:45.883318	120	MARK_RAN	9:04baaf56c116ed19951cbc2cca584022	dropIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	3395522334
24.0.0-26618-reindex	keycloak	META-INF/jpa-changelog-24.0.0.xml	2026-07-07 03:38:45.896048	121	EXECUTED	9:08707c0f0db1cef6b352db03a60edc7f	createIndex indexName=IDX_CLIENT_ATT_BY_NAME_VALUE, tableName=CLIENT_ATTRIBUTES		\N	4.25.1	\N	\N	3395522334
\.


--
-- Data for Name: databasechangeloglock; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.databasechangeloglock (id, locked, lockgranted, lockedby) FROM stdin;
1	f	\N	\N
1000	f	\N	\N
1001	f	\N	\N
\.


--
-- Data for Name: default_client_scope; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.default_client_scope (realm_id, scope_id, default_scope) FROM stdin;
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	73348c55-dc67-4f9d-90b4-426b0ff8dd5e	f
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	f7ee9263-7df1-4787-b332-a141c9988a92	t
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	5fef7423-c3c4-482a-aee0-38838ff9bf94	t
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	270c3296-0bf9-483e-bc48-a4a2f1b306b6	t
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	70455d37-9b31-4351-9897-2abf64c827dd	f
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	e0361c9f-4ca7-4b68-96df-1d7800e65705	f
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d900d703-375a-4cc0-a4ad-13de9c65f47e	t
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	58f158f2-7d61-4210-89ae-a2fe0d012592	t
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	388bc21a-1250-4870-b331-5a0912e25bac	f
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	432dd6ab-31b4-468d-a3c8-dc73bc12cd31	t
81407725-cab3-4c86-9e57-5dfbd60ae9c1	c33558d0-acf2-451c-99e0-31ddf2125ec3	f
81407725-cab3-4c86-9e57-5dfbd60ae9c1	4f35038e-2f68-4a14-896f-2e853dfa3664	t
81407725-cab3-4c86-9e57-5dfbd60ae9c1	8d4106ba-a05a-45fa-a766-37337d6571d5	t
81407725-cab3-4c86-9e57-5dfbd60ae9c1	3f544efc-c545-4945-a597-e546b652b878	t
81407725-cab3-4c86-9e57-5dfbd60ae9c1	9ce0984f-ac09-4d06-bd52-ca90f3e37d13	f
81407725-cab3-4c86-9e57-5dfbd60ae9c1	72058ae9-c3f7-4ebb-aea2-0304ed5c3786	f
81407725-cab3-4c86-9e57-5dfbd60ae9c1	8d4f60a8-478a-4c56-9685-bffc8ff48a2c	t
81407725-cab3-4c86-9e57-5dfbd60ae9c1	8de68a90-fc00-4e2e-9d8e-890c1e8e4700	t
81407725-cab3-4c86-9e57-5dfbd60ae9c1	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc	f
81407725-cab3-4c86-9e57-5dfbd60ae9c1	7d448375-40de-4386-bf2f-bb56d7f9e1a2	t
\.


--
-- Data for Name: event_entity; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.event_entity (id, client_id, details_json, error, ip_address, realm_id, session_id, event_time, type, user_id, details_json_long_value) FROM stdin;
\.


--
-- Data for Name: fed_user_attribute; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.fed_user_attribute (id, name, user_id, realm_id, storage_provider_id, value, long_value_hash, long_value_hash_lower_case, long_value) FROM stdin;
\.


--
-- Data for Name: fed_user_consent; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.fed_user_consent (id, client_id, user_id, realm_id, storage_provider_id, created_date, last_updated_date, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: fed_user_consent_cl_scope; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.fed_user_consent_cl_scope (user_consent_id, scope_id) FROM stdin;
\.


--
-- Data for Name: fed_user_credential; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.fed_user_credential (id, salt, type, created_date, user_id, realm_id, storage_provider_id, user_label, secret_data, credential_data, priority) FROM stdin;
\.


--
-- Data for Name: fed_user_group_membership; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.fed_user_group_membership (group_id, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: fed_user_required_action; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.fed_user_required_action (required_action, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: fed_user_role_mapping; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.fed_user_role_mapping (role_id, user_id, realm_id, storage_provider_id) FROM stdin;
\.


--
-- Data for Name: federated_identity; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.federated_identity (identity_provider, realm_id, federated_user_id, federated_username, token, user_id) FROM stdin;
\.


--
-- Data for Name: federated_user; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.federated_user (id, storage_provider_id, realm_id) FROM stdin;
\.


--
-- Data for Name: group_attribute; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.group_attribute (id, name, value, group_id) FROM stdin;
\.


--
-- Data for Name: group_role_mapping; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.group_role_mapping (role_id, group_id) FROM stdin;
\.


--
-- Data for Name: identity_provider; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.identity_provider (internal_id, enabled, provider_alias, provider_id, store_token, authenticate_by_default, realm_id, add_token_role, trust_email, first_broker_login_flow_id, post_broker_login_flow_id, provider_display_name, link_only) FROM stdin;
\.


--
-- Data for Name: identity_provider_config; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.identity_provider_config (identity_provider_id, value, name) FROM stdin;
\.


--
-- Data for Name: identity_provider_mapper; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.identity_provider_mapper (id, name, idp_alias, idp_mapper_name, realm_id) FROM stdin;
\.


--
-- Data for Name: idp_mapper_config; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.idp_mapper_config (idp_mapper_id, value, name) FROM stdin;
\.


--
-- Data for Name: keycloak_group; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.keycloak_group (id, name, parent_group, realm_id) FROM stdin;
\.


--
-- Data for Name: keycloak_role; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.keycloak_role (id, client_realm_constraint, client_role, description, name, realm_id, client, realm) FROM stdin;
07036674-dd02-4938-a2ca-8b9b447abe3d	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	f	${role_default-roles}	default-roles-master	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N	\N
1b417689-632d-4f5d-90b1-5cf82799f3ba	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	f	${role_admin}	admin	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N	\N
97b6c364-7bf2-4f08-8024-0a33b5b6b51f	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	f	${role_create-realm}	create-realm	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N	\N
490a6b82-dc40-4b70-933b-6b6cb2e517fe	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_create-client}	create-client	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
06c6aac4-cb7c-4236-bf1d-aba235243ea7	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_view-realm}	view-realm	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
d621c02f-418a-4c09-85b1-137f18172736	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_view-users}	view-users	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
0a99dda6-41f7-4582-99cf-2057acf1c480	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_view-clients}	view-clients	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
8105383a-bab4-4d49-9642-1042f4d6be33	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_view-events}	view-events	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
10dc135d-b1c7-46b3-a063-ab7401a5fa0f	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_view-identity-providers}	view-identity-providers	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
d1e1a164-c5b9-4a88-a36d-a9b3add42b51	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_view-authorization}	view-authorization	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
223d20e7-75b1-42ba-b2de-e2181f230599	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_manage-realm}	manage-realm	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
f91c540c-0e25-4c51-8eeb-ed73831b4c92	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_manage-users}	manage-users	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
51311ab0-6093-436f-8e2a-824e097968fb	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_manage-clients}	manage-clients	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
fede3654-a4b0-4c33-b940-05cd78fed5ed	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_manage-events}	manage-events	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
aa320486-4d6f-4b81-b9af-640b5a0bf321	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_manage-identity-providers}	manage-identity-providers	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
6ca3f6af-e7b1-43ef-8c0b-f289a9cca514	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_manage-authorization}	manage-authorization	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
23c62a01-dd4c-451b-98dc-2a1faf42c8aa	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_query-users}	query-users	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
97829d33-3a9d-488a-85e4-7a27e623d004	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_query-clients}	query-clients	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
d0808318-7f9d-4053-9b5c-56e333a7773b	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_query-realms}	query-realms	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
5b0d6b11-8dc5-421a-bde4-58238bd73459	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_query-groups}	query-groups	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
548e5c2e-563c-41f0-ad86-679fe152ded5	d4521e1e-84c7-4b33-b982-056ba57f8928	t	${role_view-profile}	view-profile	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d4521e1e-84c7-4b33-b982-056ba57f8928	\N
052a5b92-31c3-40c1-9727-9be115ca4272	d4521e1e-84c7-4b33-b982-056ba57f8928	t	${role_manage-account}	manage-account	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d4521e1e-84c7-4b33-b982-056ba57f8928	\N
1519ee94-6fd0-44f2-b88a-939afba08abb	d4521e1e-84c7-4b33-b982-056ba57f8928	t	${role_manage-account-links}	manage-account-links	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d4521e1e-84c7-4b33-b982-056ba57f8928	\N
562f8290-ecef-4308-89f4-90a958a617e8	d4521e1e-84c7-4b33-b982-056ba57f8928	t	${role_view-applications}	view-applications	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d4521e1e-84c7-4b33-b982-056ba57f8928	\N
1b0503ef-5f09-4ef2-bd1a-44a6bee9b878	d4521e1e-84c7-4b33-b982-056ba57f8928	t	${role_view-consent}	view-consent	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d4521e1e-84c7-4b33-b982-056ba57f8928	\N
5093a90c-8cd4-49bc-9e09-7a09f1deeaf3	d4521e1e-84c7-4b33-b982-056ba57f8928	t	${role_manage-consent}	manage-consent	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d4521e1e-84c7-4b33-b982-056ba57f8928	\N
3126269e-b5f2-4180-84dc-3e3315ae0ef2	d4521e1e-84c7-4b33-b982-056ba57f8928	t	${role_view-groups}	view-groups	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d4521e1e-84c7-4b33-b982-056ba57f8928	\N
adc8ee76-4560-4eaa-8072-a290d60c36d9	d4521e1e-84c7-4b33-b982-056ba57f8928	t	${role_delete-account}	delete-account	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	d4521e1e-84c7-4b33-b982-056ba57f8928	\N
4eebae4c-d763-43f3-9b79-76e45bc8d149	768c1510-8715-4637-8169-230084c0c212	t	${role_read-token}	read-token	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	768c1510-8715-4637-8169-230084c0c212	\N
85975ac0-9bae-42e0-a431-6697b6e3d667	9412a86d-4c55-4e39-b797-7f9239c20c0d	t	${role_impersonation}	impersonation	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9412a86d-4c55-4e39-b797-7f9239c20c0d	\N
a7aafa88-db1e-4c21-831e-189e3d0623c9	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	f	${role_offline-access}	offline_access	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N	\N
f8db04a5-0f55-4804-bad6-167901c0c560	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	f	${role_uma_authorization}	uma_authorization	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	\N	\N
e597f43c-a870-4165-956f-465900305fd3	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f	${role_default-roles}	default-roles-porprov	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N	\N
91f83e3c-b56c-444c-b800-7d56a7c37343	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_create-client}	create-client	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
849a52ce-f089-4811-a95b-436c8002aa31	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_view-realm}	view-realm	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
67ca29ac-71cd-400e-b6f1-e3ea4c4a5f7e	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_view-users}	view-users	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
56979e18-9bcd-4272-9f0f-eedc504f10a4	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_view-clients}	view-clients	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
67e1c20f-4633-41fb-b0b6-a7a05aad19df	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_view-events}	view-events	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
129ecfa4-a7bf-49b9-899d-a79f1a0a926a	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_view-identity-providers}	view-identity-providers	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
143ccf9a-0afb-4bb9-b34b-94a56ad23673	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_view-authorization}	view-authorization	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
bf14f1c5-2138-46db-8146-74048cbbfbd2	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_manage-realm}	manage-realm	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
1b36931c-798e-4855-9644-7fec4f5efbd1	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_manage-users}	manage-users	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
dc700d1f-ff4a-4c77-8701-f128b32b3ab7	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_manage-clients}	manage-clients	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
3f29de09-3359-4dbc-b77b-7fb24483d9c7	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_manage-events}	manage-events	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
2a5018f8-c73d-499a-8504-fe4439ceb952	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_manage-identity-providers}	manage-identity-providers	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
b994cc41-565a-4e5a-b380-2dc57209ce93	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_manage-authorization}	manage-authorization	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
75f87cf9-8449-42a1-a5dd-1db6bcff99c9	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_query-users}	query-users	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
10d802c3-5b09-4d02-a46a-36565b1aeb7d	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_query-clients}	query-clients	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
cf4996c7-ccf6-4c37-aabd-370ee177cfb0	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_query-realms}	query-realms	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
fd11eae8-4dd2-423c-a12b-88ad97747006	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_query-groups}	query-groups	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
1890fafa-59ea-49c4-b8d8-0a2e6fa3a75f	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_realm-admin}	realm-admin	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
4d7ec9f8-4cf1-4139-afa1-7848865c8f9b	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_create-client}	create-client	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
ca0fe817-e3d5-4c0d-9491-431a9044cd2d	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_view-realm}	view-realm	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
8e39c824-8706-40e9-b7fe-92da61a6fbcd	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_view-users}	view-users	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
44cdfbb2-2df3-43c3-a41f-827d83580664	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_view-clients}	view-clients	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
4c46c7fd-4f21-40c5-aacb-0909f317b503	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_view-events}	view-events	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
88990572-91e8-4ddd-adb1-ea0d760a85e7	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_view-identity-providers}	view-identity-providers	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
77919051-d9db-4da2-834c-81244866cf65	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_view-authorization}	view-authorization	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
de1aba14-8eca-437e-a71f-606f031aa191	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_manage-realm}	manage-realm	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
c24c761c-57a3-4873-a53e-35639bb13c4d	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_manage-users}	manage-users	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
28f7d7b9-e3da-440f-b833-8e7509a3794a	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_manage-clients}	manage-clients	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
865c77ec-ba4f-425f-bb8a-397694349b88	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_manage-events}	manage-events	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
b83248bf-f9b5-4bce-9cfd-d7d0407b0da8	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_manage-identity-providers}	manage-identity-providers	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
71635a6f-5161-4038-9019-a444969b78a9	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_manage-authorization}	manage-authorization	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
6904c409-3e83-40a3-a219-15c0035b6064	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_query-users}	query-users	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
d6b8ccfc-e27b-4427-bcce-3fab9728e6b8	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_query-clients}	query-clients	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
e0ee0262-865a-439d-8286-7c3c5e5e2da0	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_query-realms}	query-realms	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
a5887f76-6145-48e8-9f80-dcd27d2d9244	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_query-groups}	query-groups	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
bf6af00c-f7a0-4077-b72e-8c61ce2e127c	f5832c79-96f4-4f22-8504-e4175dea30ab	t	${role_view-profile}	view-profile	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f5832c79-96f4-4f22-8504-e4175dea30ab	\N
46f081fb-5aeb-4119-af16-ae43ab2ada42	f5832c79-96f4-4f22-8504-e4175dea30ab	t	${role_manage-account}	manage-account	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f5832c79-96f4-4f22-8504-e4175dea30ab	\N
d5a0fce4-38c3-47a1-a969-062992ae2e06	f5832c79-96f4-4f22-8504-e4175dea30ab	t	${role_manage-account-links}	manage-account-links	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f5832c79-96f4-4f22-8504-e4175dea30ab	\N
f8f22605-51d3-40c7-bafd-2ea5934fbbac	f5832c79-96f4-4f22-8504-e4175dea30ab	t	${role_view-applications}	view-applications	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f5832c79-96f4-4f22-8504-e4175dea30ab	\N
1417966e-7965-4027-b80a-fd27078a9beb	f5832c79-96f4-4f22-8504-e4175dea30ab	t	${role_view-consent}	view-consent	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f5832c79-96f4-4f22-8504-e4175dea30ab	\N
d0f6dfed-a03f-42a3-8b6c-d51be796c2e3	f5832c79-96f4-4f22-8504-e4175dea30ab	t	${role_manage-consent}	manage-consent	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f5832c79-96f4-4f22-8504-e4175dea30ab	\N
b4aedf21-73cb-4091-95a4-f2c63667e50c	f5832c79-96f4-4f22-8504-e4175dea30ab	t	${role_view-groups}	view-groups	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f5832c79-96f4-4f22-8504-e4175dea30ab	\N
2ad8f867-3ae2-417e-b754-54ef487effe4	f5832c79-96f4-4f22-8504-e4175dea30ab	t	${role_delete-account}	delete-account	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f5832c79-96f4-4f22-8504-e4175dea30ab	\N
0570652a-5259-4420-b32b-901a59c6dd2d	9c11e110-0483-4223-8f3d-431c76cdc7a1	t	${role_impersonation}	impersonation	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	9c11e110-0483-4223-8f3d-431c76cdc7a1	\N
cc991d9f-5074-43fe-a022-93f926f72b35	609354c7-799d-4df2-ac46-f65b30be8568	t	${role_impersonation}	impersonation	81407725-cab3-4c86-9e57-5dfbd60ae9c1	609354c7-799d-4df2-ac46-f65b30be8568	\N
efc4c255-13f4-4875-b59d-bdb70090e2e0	3a74947a-1491-470f-bfee-35ea7024cf9b	t	${role_read-token}	read-token	81407725-cab3-4c86-9e57-5dfbd60ae9c1	3a74947a-1491-470f-bfee-35ea7024cf9b	\N
54b6de4a-2a12-4125-ad65-0bcba8fca1b8	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f	${role_offline-access}	offline_access	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N	\N
a71c24ac-635d-4b4a-bfd8-d38db0a5e57f	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f	${role_uma_authorization}	uma_authorization	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N	\N
88a51097-2d67-4662-9733-45d0ebbe0894	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f	\N	super_admin	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N	\N
64a69583-8567-4ee6-95f2-3f46212f63ad	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f	\N	admin_venue	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N	\N
f5fc630e-7438-4455-bdc4-4c262c709c5a	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f	\N	koresponden	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N	\N
489124c0-ea99-450c-93c8-61ea3c3c3a4e	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f	\N	verifikator	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N	\N
8c07a654-6a15-4422-abb7-8f5ca62bdfdc	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f	\N	auditor	81407725-cab3-4c86-9e57-5dfbd60ae9c1	\N	\N
\.


--
-- Data for Name: kontingens; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.kontingens (id, name, region_type, logo_url, created_at, updated_at) FROM stdin;
d0000000-0000-0000-0000-000000000001	Kota Depok	kota	\N	2026-07-08 06:31:00.498787+00	2026-07-08 06:31:00.498787+00
d0000000-0000-0000-0000-000000000002	Kota Bandung	kota	\N	2026-07-08 06:31:00.498787+00	2026-07-08 06:31:00.498787+00
d0000000-0000-0000-0000-000000000003	Kab. Bogor	kabupaten	\N	2026-07-08 06:31:00.498787+00	2026-07-08 06:31:00.498787+00
d0000000-0000-0000-0000-000000000004	Kota Bogor	kota	\N	2026-07-08 06:31:00.498787+00	2026-07-08 06:31:00.498787+00
\.


--
-- Data for Name: match_participants; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.match_participants (id, match_id, kontingen_id, athlete_name, created_at, updated_at) FROM stdin;
7431e3db-ee78-4ffb-afe6-fa47f6763b41	a0000000-0000-0000-0000-000000000001	d0000000-0000-0000-0000-000000000001	\N	2026-07-09 08:48:30.715384+00	2026-07-09 08:48:30.715384+00
94911a3d-6799-4907-85c6-b371b4d82b45	a0000000-0000-0000-0000-000000000001	d0000000-0000-0000-0000-000000000003	\N	2026-07-09 08:48:30.715384+00	2026-07-09 08:48:30.715384+00
6efba7ab-b173-4e57-ab04-231d1fde10e9	a0000000-0000-0000-0000-000000000002	d0000000-0000-0000-0000-000000000002	\N	2026-07-09 08:48:30.715384+00	2026-07-09 08:48:30.715384+00
06d285ed-53f5-4ab0-a6c7-f46c16727817	a0000000-0000-0000-0000-000000000002	d0000000-0000-0000-0000-000000000004	\N	2026-07-09 08:48:30.715384+00	2026-07-09 08:48:30.715384+00
97944bc1-f03d-4aec-a972-8e3005f69f13	a0000000-0000-0000-0000-000000000001	d0000000-0000-0000-0000-000000000001	\N	2026-07-09 08:48:46.592955+00	2026-07-09 08:48:46.592955+00
9394330b-5312-485e-bc45-6041a5cc2fb8	a0000000-0000-0000-0000-000000000001	d0000000-0000-0000-0000-000000000003	\N	2026-07-09 08:48:46.592955+00	2026-07-09 08:48:46.592955+00
2436d601-61e0-4eef-8f0a-8b28877a11bb	a0000000-0000-0000-0000-000000000002	d0000000-0000-0000-0000-000000000002	\N	2026-07-09 08:48:46.592955+00	2026-07-09 08:48:46.592955+00
2fcdf734-247e-4d9b-ac27-0957cb5878af	a0000000-0000-0000-0000-000000000002	d0000000-0000-0000-0000-000000000004	\N	2026-07-09 08:48:46.592955+00	2026-07-09 08:48:46.592955+00
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.matches (id, nomor_tanding_id, venue_id, match_date, status, round, created_at, updated_at) FROM stdin;
a0000000-0000-0000-0000-000000000001	f0000000-0000-0000-0000-000000000001	e0000000-0000-0000-0000-000000000004	2026-10-30 02:00:00+00	scheduled	penyisihan	2026-07-09 08:48:30.710919+00	2026-07-09 08:48:30.710919+00
a0000000-0000-0000-0000-000000000002	f0000000-0000-0000-0000-000000000002	e0000000-0000-0000-0000-000000000003	2026-11-01 03:00:00+00	scheduled	semifinal	2026-07-09 08:48:30.710919+00	2026-07-09 08:48:30.710919+00
a0000000-0000-0000-0000-000000000003	f0000000-0000-0000-0000-000000000003	e0000000-0000-0000-0000-000000000001	2026-11-09 08:00:00+00	scheduled	final	2026-07-09 08:48:30.710919+00	2026-07-09 08:48:30.710919+00
\.


--
-- Data for Name: medal_submission_history; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.medal_submission_history (id, submission_id, from_status, to_status, actor_id, reason, request_id, created_at) FROM stdin;
\.


--
-- Data for Name: medal_submissions; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.medal_submissions (id, kontingen_id, gold, silver, bronze, evidence_url, notes, status, submitted_by, verified_by, verification_notes, submitted_at, verified_at, published_at, updated_at, rejected_by, published_by, rejected_at) FROM stdin;
\.


--
-- Data for Name: medals; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.medals (id, kontingen_id, gold, silver, bronze, updated_at) FROM stdin;
\.


--
-- Data for Name: media_assets; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.media_assets (id, file_name, file_url, mime_type, file_size, created_at) FROM stdin;
820183ae-5702-44d3-8476-9230c37d2781	Logo Sepak Bola	https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Soccerball.svg/500px-Soccerball.svg.png	image/png	50000	2026-07-09 08:48:46.587653+00
c410529c-18e0-4206-b575-5ebfed5a8c04	Logo Basket	https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Basketball.png/500px-Basketball.png	image/png	50000	2026-07-09 08:48:46.587653+00
53bc79c2-e850-49cf-b276-917469a74e8c	Stadion Merpati	https://cdn0-production-images-kly.akamaized.net/9YhZ3z4_T47fM51xO8y69kYgG1E=/1200x675/smart/filters:quality(75):strip_icc():format(webp)/kly-media-production/medias/4055627/original/038898100_1655455644-Stadion_Merpati_Depok.jpg	image/jpeg	100000	2026-07-09 08:48:46.587653+00
f74abbc5-d662-404f-89f1-53cfc7eacee1	Alun Alun Depok	https://asset.kompas.com/crops/YxP1B0r1l5tE1X8aQ7h5lX9n8sE=/0x0:1000x667/750x500/data/photo/2020/01/12/5e1b2121e7d98.jpg	image/jpeg	150000	2026-07-09 08:48:46.587653+00
\.


--
-- Data for Name: migration_model; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.migration_model (id, version, update_time) FROM stdin;
mrczp	24.0.0	1783395526
\.


--
-- Data for Name: nomor_tandings; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.nomor_tandings (id, cabor_id, name, gender_category, match_type, created_at, updated_at) FROM stdin;
f0000000-0000-0000-0000-000000000001	c0000000-0000-0000-0000-000000000009	Bola Basket 5x5	putra	tanding	2026-07-08 06:31:00.491347+00	2026-07-08 06:31:00.491347+00
f0000000-0000-0000-0000-000000000002	c0000000-0000-0000-0000-000000000003	Hockey Indoor	putri	tanding	2026-07-08 06:31:00.491347+00	2026-07-08 06:31:00.491347+00
f0000000-0000-0000-0000-000000000003	c0000000-0000-0000-0000-000000000001	Sepak Bola Putri	putri	tanding	2026-07-08 06:31:00.491347+00	2026-07-08 06:31:00.491347+00
\.


--
-- Data for Name: offline_client_session; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.offline_client_session (user_session_id, client_id, offline_flag, "timestamp", data, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: offline_user_session; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.offline_user_session (user_session_id, user_id, realm_id, created_on, offline_flag, data, last_session_refresh) FROM stdin;
\.


--
-- Data for Name: outbox_events; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.outbox_events (id, event_id, subject, payload, attempts, next_attempt_at, published_at, last_error, created_at) FROM stdin;
\.


--
-- Data for Name: policy_config; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.policy_config (policy_id, name, value) FROM stdin;
\.


--
-- Data for Name: protocol_mapper; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.protocol_mapper (id, name, protocol, protocol_mapper_name, client_id, client_scope_id) FROM stdin;
a9dfb991-6d62-4c06-9cc2-3fa053c119e4	audience resolve	openid-connect	oidc-audience-resolve-mapper	1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	\N
9ad2628a-67dc-4a83-b07b-c725585a5777	locale	openid-connect	oidc-usermodel-attribute-mapper	0ff83107-f980-4fe5-9571-fda3de2c72ad	\N
6d7cca10-1860-43ff-9672-c7aaf976bc32	role list	saml	saml-role-list-mapper	\N	f7ee9263-7df1-4787-b332-a141c9988a92
a4a8184e-36ac-4883-8c0e-62ffbe0e369c	full name	openid-connect	oidc-full-name-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
a35b714c-e225-40bb-9d79-1a59675e4582	family name	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
2ad2991d-9b55-4ff4-b780-d18e745790e0	given name	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
3b761167-2be8-4925-acaf-d2fe79a9c146	middle name	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
7f5110f6-514a-4fe1-9e1b-42cb338c5627	nickname	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
2cb39c15-9169-4c6d-bb37-852abbf22094	username	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
53a4f3c4-2275-4f27-bdd6-70fe5ac83d19	profile	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
7fe55c19-425e-412c-813d-f77da3f7c0d3	picture	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
6595e841-0a1d-4347-a671-b62cc667a979	website	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
954761da-a572-41a6-bba7-8a084f1d425f	gender	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
44a3a516-f516-4de9-8d3d-b405cd4a1c9d	birthdate	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
c779f609-2cbd-4c0a-8316-d5302fd3694e	zoneinfo	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
ccbb3c77-1bfe-48ad-bc43-4d5a3e227ff1	locale	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
91cd5e14-0e87-4e9f-a34d-02b10567e5f0	updated at	openid-connect	oidc-usermodel-attribute-mapper	\N	5fef7423-c3c4-482a-aee0-38838ff9bf94
20ea368e-a4ab-4ad7-8a2a-344e6e3d6ab4	email	openid-connect	oidc-usermodel-attribute-mapper	\N	270c3296-0bf9-483e-bc48-a4a2f1b306b6
bea12168-9b79-4685-9e6c-f0822b00fbc5	email verified	openid-connect	oidc-usermodel-property-mapper	\N	270c3296-0bf9-483e-bc48-a4a2f1b306b6
0cceb5d4-293d-4fb6-b7d5-decc5b4615b6	address	openid-connect	oidc-address-mapper	\N	70455d37-9b31-4351-9897-2abf64c827dd
fe458a52-ec60-4e55-bb1b-9fdbae7e04c8	phone number	openid-connect	oidc-usermodel-attribute-mapper	\N	e0361c9f-4ca7-4b68-96df-1d7800e65705
860202be-fb75-495d-9aa7-6e19709f9fc5	phone number verified	openid-connect	oidc-usermodel-attribute-mapper	\N	e0361c9f-4ca7-4b68-96df-1d7800e65705
ef7dc34a-89cf-4b53-a5c1-c584ae8d8aac	realm roles	openid-connect	oidc-usermodel-realm-role-mapper	\N	d900d703-375a-4cc0-a4ad-13de9c65f47e
e390bf76-5cb5-494d-a203-1e9f730ea312	client roles	openid-connect	oidc-usermodel-client-role-mapper	\N	d900d703-375a-4cc0-a4ad-13de9c65f47e
6dce43d0-e056-499c-aaa0-59e934d6b163	audience resolve	openid-connect	oidc-audience-resolve-mapper	\N	d900d703-375a-4cc0-a4ad-13de9c65f47e
e2af7589-fd25-47a2-9df8-ab514f2c21b2	allowed web origins	openid-connect	oidc-allowed-origins-mapper	\N	58f158f2-7d61-4210-89ae-a2fe0d012592
8e8c9c96-2433-4b1b-a33d-00d27c392eb6	upn	openid-connect	oidc-usermodel-attribute-mapper	\N	388bc21a-1250-4870-b331-5a0912e25bac
b06a54c4-6951-4288-af86-88ae965e550a	groups	openid-connect	oidc-usermodel-realm-role-mapper	\N	388bc21a-1250-4870-b331-5a0912e25bac
9062d2b9-69ac-4a81-b484-01f434c808ca	acr loa level	openid-connect	oidc-acr-mapper	\N	432dd6ab-31b4-468d-a3c8-dc73bc12cd31
5b836816-85d6-4bc8-bb1b-e80e8619aa3e	audience resolve	openid-connect	oidc-audience-resolve-mapper	d4ae43b8-c3fe-45bd-8a99-7106f8956005	\N
eefd30d5-4357-4f22-af27-027bc7079a1d	role list	saml	saml-role-list-mapper	\N	4f35038e-2f68-4a14-896f-2e853dfa3664
e6d31211-b0d3-4d17-8146-602f3681c369	full name	openid-connect	oidc-full-name-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
3404589a-3434-4e79-8521-f2e362e1d3eb	family name	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
b86eb512-13bb-468a-837c-8a3248d4cd09	given name	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
befb5f41-1041-4d09-a9fd-918386413cf0	middle name	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
2a07fdad-964e-4c2d-b09b-0ad15aae211f	nickname	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
c60ab5d3-5bd3-403c-9c74-f0538acd1bdb	username	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
f36ea456-724d-4ba9-84a0-99ca82af36c9	profile	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
f43cd0fc-c617-47d4-a8cb-591b73d86c78	picture	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
b9c62947-f747-42b9-8cbf-21bd01b03288	website	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
5f1b6aef-b983-47c2-bb5d-adbbc9f919a4	gender	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
ccc54e69-c276-4deb-8749-3300d6d692b4	birthdate	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
75a6bd6c-f6a7-4e1b-aad3-218fa3477d2e	zoneinfo	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
b2a6e1b4-51c9-4938-adea-56812671c52e	locale	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
ca79a3d2-d0ae-49d7-bb20-9f1f2c41ba77	updated at	openid-connect	oidc-usermodel-attribute-mapper	\N	8d4106ba-a05a-45fa-a766-37337d6571d5
2ef5690d-a6fe-408a-91e6-7ad5e8cd775d	email	openid-connect	oidc-usermodel-attribute-mapper	\N	3f544efc-c545-4945-a597-e546b652b878
51548eb8-a890-4d6e-aa8e-e8235f954b75	email verified	openid-connect	oidc-usermodel-property-mapper	\N	3f544efc-c545-4945-a597-e546b652b878
802066f7-37cf-4905-a062-3c9b3720f94a	address	openid-connect	oidc-address-mapper	\N	9ce0984f-ac09-4d06-bd52-ca90f3e37d13
f8f82b6b-baec-48e9-bf2a-8d9f3e44e46b	phone number	openid-connect	oidc-usermodel-attribute-mapper	\N	72058ae9-c3f7-4ebb-aea2-0304ed5c3786
3dc1dc18-94b0-437e-a1fe-4ec3ba3a3155	phone number verified	openid-connect	oidc-usermodel-attribute-mapper	\N	72058ae9-c3f7-4ebb-aea2-0304ed5c3786
5f9c0bf7-9c09-4315-b456-4ea7b30e00aa	realm roles	openid-connect	oidc-usermodel-realm-role-mapper	\N	8d4f60a8-478a-4c56-9685-bffc8ff48a2c
b1e6a657-bc74-4ff3-ab95-7b27aa469b4c	client roles	openid-connect	oidc-usermodel-client-role-mapper	\N	8d4f60a8-478a-4c56-9685-bffc8ff48a2c
e3a6affb-2052-4c1c-9200-09e12f963dc4	audience resolve	openid-connect	oidc-audience-resolve-mapper	\N	8d4f60a8-478a-4c56-9685-bffc8ff48a2c
dc2151d5-287d-4c4c-bfab-4d019ac3a26a	allowed web origins	openid-connect	oidc-allowed-origins-mapper	\N	8de68a90-fc00-4e2e-9d8e-890c1e8e4700
2c264510-8efb-4159-ad56-e2de5323cb09	upn	openid-connect	oidc-usermodel-attribute-mapper	\N	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc
4749c20b-0e31-4c34-963c-7ccac97a9abb	groups	openid-connect	oidc-usermodel-realm-role-mapper	\N	b2eed4eb-dccd-4d8e-a54a-655b98e2a7bc
adb9a00a-c75a-485b-acf9-6723f6289cf2	acr loa level	openid-connect	oidc-acr-mapper	\N	7d448375-40de-4386-bf2f-bb56d7f9e1a2
190054cf-3396-4ed7-a881-10087f564efc	locale	openid-connect	oidc-usermodel-attribute-mapper	c76139e0-33c9-45e7-ad54-593f40ea79cd	\N
7ec166ac-3b77-4291-83f0-acdd8ac9fef8	Client ID	openid-connect	oidc-usersessionmodel-note-mapper	71e0ee67-90a8-433a-9af5-65a902688daa	\N
e6214354-4284-4cb3-90a9-16a76b07d6ab	Client Host	openid-connect	oidc-usersessionmodel-note-mapper	71e0ee67-90a8-433a-9af5-65a902688daa	\N
baa0abcf-3f6c-4460-80e2-0c8e97b027d7	Client IP Address	openid-connect	oidc-usersessionmodel-note-mapper	71e0ee67-90a8-433a-9af5-65a902688daa	\N
\.


--
-- Data for Name: protocol_mapper_config; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.protocol_mapper_config (protocol_mapper_id, value, name) FROM stdin;
9ad2628a-67dc-4a83-b07b-c725585a5777	true	introspection.token.claim
9ad2628a-67dc-4a83-b07b-c725585a5777	true	userinfo.token.claim
9ad2628a-67dc-4a83-b07b-c725585a5777	locale	user.attribute
9ad2628a-67dc-4a83-b07b-c725585a5777	true	id.token.claim
9ad2628a-67dc-4a83-b07b-c725585a5777	true	access.token.claim
9ad2628a-67dc-4a83-b07b-c725585a5777	locale	claim.name
9ad2628a-67dc-4a83-b07b-c725585a5777	String	jsonType.label
6d7cca10-1860-43ff-9672-c7aaf976bc32	false	single
6d7cca10-1860-43ff-9672-c7aaf976bc32	Basic	attribute.nameformat
6d7cca10-1860-43ff-9672-c7aaf976bc32	Role	attribute.name
2ad2991d-9b55-4ff4-b780-d18e745790e0	true	introspection.token.claim
2ad2991d-9b55-4ff4-b780-d18e745790e0	true	userinfo.token.claim
2ad2991d-9b55-4ff4-b780-d18e745790e0	firstName	user.attribute
2ad2991d-9b55-4ff4-b780-d18e745790e0	true	id.token.claim
2ad2991d-9b55-4ff4-b780-d18e745790e0	true	access.token.claim
2ad2991d-9b55-4ff4-b780-d18e745790e0	given_name	claim.name
2ad2991d-9b55-4ff4-b780-d18e745790e0	String	jsonType.label
2cb39c15-9169-4c6d-bb37-852abbf22094	true	introspection.token.claim
2cb39c15-9169-4c6d-bb37-852abbf22094	true	userinfo.token.claim
2cb39c15-9169-4c6d-bb37-852abbf22094	username	user.attribute
2cb39c15-9169-4c6d-bb37-852abbf22094	true	id.token.claim
2cb39c15-9169-4c6d-bb37-852abbf22094	true	access.token.claim
2cb39c15-9169-4c6d-bb37-852abbf22094	preferred_username	claim.name
2cb39c15-9169-4c6d-bb37-852abbf22094	String	jsonType.label
3b761167-2be8-4925-acaf-d2fe79a9c146	true	introspection.token.claim
3b761167-2be8-4925-acaf-d2fe79a9c146	true	userinfo.token.claim
3b761167-2be8-4925-acaf-d2fe79a9c146	middleName	user.attribute
3b761167-2be8-4925-acaf-d2fe79a9c146	true	id.token.claim
3b761167-2be8-4925-acaf-d2fe79a9c146	true	access.token.claim
3b761167-2be8-4925-acaf-d2fe79a9c146	middle_name	claim.name
3b761167-2be8-4925-acaf-d2fe79a9c146	String	jsonType.label
44a3a516-f516-4de9-8d3d-b405cd4a1c9d	true	introspection.token.claim
44a3a516-f516-4de9-8d3d-b405cd4a1c9d	true	userinfo.token.claim
44a3a516-f516-4de9-8d3d-b405cd4a1c9d	birthdate	user.attribute
44a3a516-f516-4de9-8d3d-b405cd4a1c9d	true	id.token.claim
44a3a516-f516-4de9-8d3d-b405cd4a1c9d	true	access.token.claim
44a3a516-f516-4de9-8d3d-b405cd4a1c9d	birthdate	claim.name
44a3a516-f516-4de9-8d3d-b405cd4a1c9d	String	jsonType.label
53a4f3c4-2275-4f27-bdd6-70fe5ac83d19	true	introspection.token.claim
53a4f3c4-2275-4f27-bdd6-70fe5ac83d19	true	userinfo.token.claim
53a4f3c4-2275-4f27-bdd6-70fe5ac83d19	profile	user.attribute
53a4f3c4-2275-4f27-bdd6-70fe5ac83d19	true	id.token.claim
53a4f3c4-2275-4f27-bdd6-70fe5ac83d19	true	access.token.claim
53a4f3c4-2275-4f27-bdd6-70fe5ac83d19	profile	claim.name
53a4f3c4-2275-4f27-bdd6-70fe5ac83d19	String	jsonType.label
6595e841-0a1d-4347-a671-b62cc667a979	true	introspection.token.claim
6595e841-0a1d-4347-a671-b62cc667a979	true	userinfo.token.claim
6595e841-0a1d-4347-a671-b62cc667a979	website	user.attribute
6595e841-0a1d-4347-a671-b62cc667a979	true	id.token.claim
6595e841-0a1d-4347-a671-b62cc667a979	true	access.token.claim
6595e841-0a1d-4347-a671-b62cc667a979	website	claim.name
6595e841-0a1d-4347-a671-b62cc667a979	String	jsonType.label
7f5110f6-514a-4fe1-9e1b-42cb338c5627	true	introspection.token.claim
7f5110f6-514a-4fe1-9e1b-42cb338c5627	true	userinfo.token.claim
7f5110f6-514a-4fe1-9e1b-42cb338c5627	nickname	user.attribute
7f5110f6-514a-4fe1-9e1b-42cb338c5627	true	id.token.claim
7f5110f6-514a-4fe1-9e1b-42cb338c5627	true	access.token.claim
7f5110f6-514a-4fe1-9e1b-42cb338c5627	nickname	claim.name
7f5110f6-514a-4fe1-9e1b-42cb338c5627	String	jsonType.label
7fe55c19-425e-412c-813d-f77da3f7c0d3	true	introspection.token.claim
7fe55c19-425e-412c-813d-f77da3f7c0d3	true	userinfo.token.claim
7fe55c19-425e-412c-813d-f77da3f7c0d3	picture	user.attribute
7fe55c19-425e-412c-813d-f77da3f7c0d3	true	id.token.claim
7fe55c19-425e-412c-813d-f77da3f7c0d3	true	access.token.claim
7fe55c19-425e-412c-813d-f77da3f7c0d3	picture	claim.name
7fe55c19-425e-412c-813d-f77da3f7c0d3	String	jsonType.label
91cd5e14-0e87-4e9f-a34d-02b10567e5f0	true	introspection.token.claim
91cd5e14-0e87-4e9f-a34d-02b10567e5f0	true	userinfo.token.claim
91cd5e14-0e87-4e9f-a34d-02b10567e5f0	updatedAt	user.attribute
91cd5e14-0e87-4e9f-a34d-02b10567e5f0	true	id.token.claim
91cd5e14-0e87-4e9f-a34d-02b10567e5f0	true	access.token.claim
91cd5e14-0e87-4e9f-a34d-02b10567e5f0	updated_at	claim.name
91cd5e14-0e87-4e9f-a34d-02b10567e5f0	long	jsonType.label
954761da-a572-41a6-bba7-8a084f1d425f	true	introspection.token.claim
954761da-a572-41a6-bba7-8a084f1d425f	true	userinfo.token.claim
954761da-a572-41a6-bba7-8a084f1d425f	gender	user.attribute
954761da-a572-41a6-bba7-8a084f1d425f	true	id.token.claim
954761da-a572-41a6-bba7-8a084f1d425f	true	access.token.claim
954761da-a572-41a6-bba7-8a084f1d425f	gender	claim.name
954761da-a572-41a6-bba7-8a084f1d425f	String	jsonType.label
a35b714c-e225-40bb-9d79-1a59675e4582	true	introspection.token.claim
a35b714c-e225-40bb-9d79-1a59675e4582	true	userinfo.token.claim
a35b714c-e225-40bb-9d79-1a59675e4582	lastName	user.attribute
a35b714c-e225-40bb-9d79-1a59675e4582	true	id.token.claim
a35b714c-e225-40bb-9d79-1a59675e4582	true	access.token.claim
a35b714c-e225-40bb-9d79-1a59675e4582	family_name	claim.name
a35b714c-e225-40bb-9d79-1a59675e4582	String	jsonType.label
a4a8184e-36ac-4883-8c0e-62ffbe0e369c	true	introspection.token.claim
a4a8184e-36ac-4883-8c0e-62ffbe0e369c	true	userinfo.token.claim
a4a8184e-36ac-4883-8c0e-62ffbe0e369c	true	id.token.claim
a4a8184e-36ac-4883-8c0e-62ffbe0e369c	true	access.token.claim
c779f609-2cbd-4c0a-8316-d5302fd3694e	true	introspection.token.claim
c779f609-2cbd-4c0a-8316-d5302fd3694e	true	userinfo.token.claim
c779f609-2cbd-4c0a-8316-d5302fd3694e	zoneinfo	user.attribute
c779f609-2cbd-4c0a-8316-d5302fd3694e	true	id.token.claim
c779f609-2cbd-4c0a-8316-d5302fd3694e	true	access.token.claim
c779f609-2cbd-4c0a-8316-d5302fd3694e	zoneinfo	claim.name
c779f609-2cbd-4c0a-8316-d5302fd3694e	String	jsonType.label
ccbb3c77-1bfe-48ad-bc43-4d5a3e227ff1	true	introspection.token.claim
ccbb3c77-1bfe-48ad-bc43-4d5a3e227ff1	true	userinfo.token.claim
ccbb3c77-1bfe-48ad-bc43-4d5a3e227ff1	locale	user.attribute
ccbb3c77-1bfe-48ad-bc43-4d5a3e227ff1	true	id.token.claim
ccbb3c77-1bfe-48ad-bc43-4d5a3e227ff1	true	access.token.claim
ccbb3c77-1bfe-48ad-bc43-4d5a3e227ff1	locale	claim.name
ccbb3c77-1bfe-48ad-bc43-4d5a3e227ff1	String	jsonType.label
20ea368e-a4ab-4ad7-8a2a-344e6e3d6ab4	true	introspection.token.claim
20ea368e-a4ab-4ad7-8a2a-344e6e3d6ab4	true	userinfo.token.claim
20ea368e-a4ab-4ad7-8a2a-344e6e3d6ab4	email	user.attribute
20ea368e-a4ab-4ad7-8a2a-344e6e3d6ab4	true	id.token.claim
20ea368e-a4ab-4ad7-8a2a-344e6e3d6ab4	true	access.token.claim
20ea368e-a4ab-4ad7-8a2a-344e6e3d6ab4	email	claim.name
20ea368e-a4ab-4ad7-8a2a-344e6e3d6ab4	String	jsonType.label
bea12168-9b79-4685-9e6c-f0822b00fbc5	true	introspection.token.claim
bea12168-9b79-4685-9e6c-f0822b00fbc5	true	userinfo.token.claim
bea12168-9b79-4685-9e6c-f0822b00fbc5	emailVerified	user.attribute
bea12168-9b79-4685-9e6c-f0822b00fbc5	true	id.token.claim
bea12168-9b79-4685-9e6c-f0822b00fbc5	true	access.token.claim
bea12168-9b79-4685-9e6c-f0822b00fbc5	email_verified	claim.name
bea12168-9b79-4685-9e6c-f0822b00fbc5	boolean	jsonType.label
0cceb5d4-293d-4fb6-b7d5-decc5b4615b6	formatted	user.attribute.formatted
0cceb5d4-293d-4fb6-b7d5-decc5b4615b6	country	user.attribute.country
0cceb5d4-293d-4fb6-b7d5-decc5b4615b6	true	introspection.token.claim
0cceb5d4-293d-4fb6-b7d5-decc5b4615b6	postal_code	user.attribute.postal_code
0cceb5d4-293d-4fb6-b7d5-decc5b4615b6	true	userinfo.token.claim
0cceb5d4-293d-4fb6-b7d5-decc5b4615b6	street	user.attribute.street
0cceb5d4-293d-4fb6-b7d5-decc5b4615b6	true	id.token.claim
0cceb5d4-293d-4fb6-b7d5-decc5b4615b6	region	user.attribute.region
0cceb5d4-293d-4fb6-b7d5-decc5b4615b6	true	access.token.claim
0cceb5d4-293d-4fb6-b7d5-decc5b4615b6	locality	user.attribute.locality
860202be-fb75-495d-9aa7-6e19709f9fc5	true	introspection.token.claim
860202be-fb75-495d-9aa7-6e19709f9fc5	true	userinfo.token.claim
860202be-fb75-495d-9aa7-6e19709f9fc5	phoneNumberVerified	user.attribute
860202be-fb75-495d-9aa7-6e19709f9fc5	true	id.token.claim
860202be-fb75-495d-9aa7-6e19709f9fc5	true	access.token.claim
860202be-fb75-495d-9aa7-6e19709f9fc5	phone_number_verified	claim.name
860202be-fb75-495d-9aa7-6e19709f9fc5	boolean	jsonType.label
fe458a52-ec60-4e55-bb1b-9fdbae7e04c8	true	introspection.token.claim
fe458a52-ec60-4e55-bb1b-9fdbae7e04c8	true	userinfo.token.claim
fe458a52-ec60-4e55-bb1b-9fdbae7e04c8	phoneNumber	user.attribute
fe458a52-ec60-4e55-bb1b-9fdbae7e04c8	true	id.token.claim
fe458a52-ec60-4e55-bb1b-9fdbae7e04c8	true	access.token.claim
fe458a52-ec60-4e55-bb1b-9fdbae7e04c8	phone_number	claim.name
fe458a52-ec60-4e55-bb1b-9fdbae7e04c8	String	jsonType.label
6dce43d0-e056-499c-aaa0-59e934d6b163	true	introspection.token.claim
6dce43d0-e056-499c-aaa0-59e934d6b163	true	access.token.claim
e390bf76-5cb5-494d-a203-1e9f730ea312	true	introspection.token.claim
e390bf76-5cb5-494d-a203-1e9f730ea312	true	multivalued
e390bf76-5cb5-494d-a203-1e9f730ea312	foo	user.attribute
e390bf76-5cb5-494d-a203-1e9f730ea312	true	access.token.claim
e390bf76-5cb5-494d-a203-1e9f730ea312	resource_access.${client_id}.roles	claim.name
e390bf76-5cb5-494d-a203-1e9f730ea312	String	jsonType.label
ef7dc34a-89cf-4b53-a5c1-c584ae8d8aac	true	introspection.token.claim
ef7dc34a-89cf-4b53-a5c1-c584ae8d8aac	true	multivalued
ef7dc34a-89cf-4b53-a5c1-c584ae8d8aac	foo	user.attribute
ef7dc34a-89cf-4b53-a5c1-c584ae8d8aac	true	access.token.claim
ef7dc34a-89cf-4b53-a5c1-c584ae8d8aac	realm_access.roles	claim.name
ef7dc34a-89cf-4b53-a5c1-c584ae8d8aac	String	jsonType.label
e2af7589-fd25-47a2-9df8-ab514f2c21b2	true	introspection.token.claim
e2af7589-fd25-47a2-9df8-ab514f2c21b2	true	access.token.claim
8e8c9c96-2433-4b1b-a33d-00d27c392eb6	true	introspection.token.claim
8e8c9c96-2433-4b1b-a33d-00d27c392eb6	true	userinfo.token.claim
8e8c9c96-2433-4b1b-a33d-00d27c392eb6	username	user.attribute
8e8c9c96-2433-4b1b-a33d-00d27c392eb6	true	id.token.claim
8e8c9c96-2433-4b1b-a33d-00d27c392eb6	true	access.token.claim
8e8c9c96-2433-4b1b-a33d-00d27c392eb6	upn	claim.name
8e8c9c96-2433-4b1b-a33d-00d27c392eb6	String	jsonType.label
b06a54c4-6951-4288-af86-88ae965e550a	true	introspection.token.claim
b06a54c4-6951-4288-af86-88ae965e550a	true	multivalued
b06a54c4-6951-4288-af86-88ae965e550a	foo	user.attribute
b06a54c4-6951-4288-af86-88ae965e550a	true	id.token.claim
b06a54c4-6951-4288-af86-88ae965e550a	true	access.token.claim
b06a54c4-6951-4288-af86-88ae965e550a	groups	claim.name
b06a54c4-6951-4288-af86-88ae965e550a	String	jsonType.label
9062d2b9-69ac-4a81-b484-01f434c808ca	true	introspection.token.claim
9062d2b9-69ac-4a81-b484-01f434c808ca	true	id.token.claim
9062d2b9-69ac-4a81-b484-01f434c808ca	true	access.token.claim
eefd30d5-4357-4f22-af27-027bc7079a1d	false	single
eefd30d5-4357-4f22-af27-027bc7079a1d	Basic	attribute.nameformat
eefd30d5-4357-4f22-af27-027bc7079a1d	Role	attribute.name
2a07fdad-964e-4c2d-b09b-0ad15aae211f	true	introspection.token.claim
2a07fdad-964e-4c2d-b09b-0ad15aae211f	true	userinfo.token.claim
2a07fdad-964e-4c2d-b09b-0ad15aae211f	nickname	user.attribute
2a07fdad-964e-4c2d-b09b-0ad15aae211f	true	id.token.claim
2a07fdad-964e-4c2d-b09b-0ad15aae211f	true	access.token.claim
2a07fdad-964e-4c2d-b09b-0ad15aae211f	nickname	claim.name
2a07fdad-964e-4c2d-b09b-0ad15aae211f	String	jsonType.label
3404589a-3434-4e79-8521-f2e362e1d3eb	true	introspection.token.claim
3404589a-3434-4e79-8521-f2e362e1d3eb	true	userinfo.token.claim
3404589a-3434-4e79-8521-f2e362e1d3eb	lastName	user.attribute
3404589a-3434-4e79-8521-f2e362e1d3eb	true	id.token.claim
3404589a-3434-4e79-8521-f2e362e1d3eb	true	access.token.claim
3404589a-3434-4e79-8521-f2e362e1d3eb	family_name	claim.name
3404589a-3434-4e79-8521-f2e362e1d3eb	String	jsonType.label
5f1b6aef-b983-47c2-bb5d-adbbc9f919a4	true	introspection.token.claim
5f1b6aef-b983-47c2-bb5d-adbbc9f919a4	true	userinfo.token.claim
5f1b6aef-b983-47c2-bb5d-adbbc9f919a4	gender	user.attribute
5f1b6aef-b983-47c2-bb5d-adbbc9f919a4	true	id.token.claim
5f1b6aef-b983-47c2-bb5d-adbbc9f919a4	true	access.token.claim
5f1b6aef-b983-47c2-bb5d-adbbc9f919a4	gender	claim.name
5f1b6aef-b983-47c2-bb5d-adbbc9f919a4	String	jsonType.label
75a6bd6c-f6a7-4e1b-aad3-218fa3477d2e	true	introspection.token.claim
75a6bd6c-f6a7-4e1b-aad3-218fa3477d2e	true	userinfo.token.claim
75a6bd6c-f6a7-4e1b-aad3-218fa3477d2e	zoneinfo	user.attribute
75a6bd6c-f6a7-4e1b-aad3-218fa3477d2e	true	id.token.claim
75a6bd6c-f6a7-4e1b-aad3-218fa3477d2e	true	access.token.claim
75a6bd6c-f6a7-4e1b-aad3-218fa3477d2e	zoneinfo	claim.name
75a6bd6c-f6a7-4e1b-aad3-218fa3477d2e	String	jsonType.label
b2a6e1b4-51c9-4938-adea-56812671c52e	true	introspection.token.claim
b2a6e1b4-51c9-4938-adea-56812671c52e	true	userinfo.token.claim
b2a6e1b4-51c9-4938-adea-56812671c52e	locale	user.attribute
b2a6e1b4-51c9-4938-adea-56812671c52e	true	id.token.claim
b2a6e1b4-51c9-4938-adea-56812671c52e	true	access.token.claim
b2a6e1b4-51c9-4938-adea-56812671c52e	locale	claim.name
b2a6e1b4-51c9-4938-adea-56812671c52e	String	jsonType.label
b86eb512-13bb-468a-837c-8a3248d4cd09	true	introspection.token.claim
b86eb512-13bb-468a-837c-8a3248d4cd09	true	userinfo.token.claim
b86eb512-13bb-468a-837c-8a3248d4cd09	firstName	user.attribute
b86eb512-13bb-468a-837c-8a3248d4cd09	true	id.token.claim
b86eb512-13bb-468a-837c-8a3248d4cd09	true	access.token.claim
b86eb512-13bb-468a-837c-8a3248d4cd09	given_name	claim.name
b86eb512-13bb-468a-837c-8a3248d4cd09	String	jsonType.label
b9c62947-f747-42b9-8cbf-21bd01b03288	true	introspection.token.claim
b9c62947-f747-42b9-8cbf-21bd01b03288	true	userinfo.token.claim
b9c62947-f747-42b9-8cbf-21bd01b03288	website	user.attribute
b9c62947-f747-42b9-8cbf-21bd01b03288	true	id.token.claim
b9c62947-f747-42b9-8cbf-21bd01b03288	true	access.token.claim
b9c62947-f747-42b9-8cbf-21bd01b03288	website	claim.name
b9c62947-f747-42b9-8cbf-21bd01b03288	String	jsonType.label
befb5f41-1041-4d09-a9fd-918386413cf0	true	introspection.token.claim
befb5f41-1041-4d09-a9fd-918386413cf0	true	userinfo.token.claim
befb5f41-1041-4d09-a9fd-918386413cf0	middleName	user.attribute
befb5f41-1041-4d09-a9fd-918386413cf0	true	id.token.claim
befb5f41-1041-4d09-a9fd-918386413cf0	true	access.token.claim
befb5f41-1041-4d09-a9fd-918386413cf0	middle_name	claim.name
befb5f41-1041-4d09-a9fd-918386413cf0	String	jsonType.label
c60ab5d3-5bd3-403c-9c74-f0538acd1bdb	true	introspection.token.claim
c60ab5d3-5bd3-403c-9c74-f0538acd1bdb	true	userinfo.token.claim
c60ab5d3-5bd3-403c-9c74-f0538acd1bdb	username	user.attribute
c60ab5d3-5bd3-403c-9c74-f0538acd1bdb	true	id.token.claim
c60ab5d3-5bd3-403c-9c74-f0538acd1bdb	true	access.token.claim
c60ab5d3-5bd3-403c-9c74-f0538acd1bdb	preferred_username	claim.name
c60ab5d3-5bd3-403c-9c74-f0538acd1bdb	String	jsonType.label
ca79a3d2-d0ae-49d7-bb20-9f1f2c41ba77	true	introspection.token.claim
ca79a3d2-d0ae-49d7-bb20-9f1f2c41ba77	true	userinfo.token.claim
ca79a3d2-d0ae-49d7-bb20-9f1f2c41ba77	updatedAt	user.attribute
ca79a3d2-d0ae-49d7-bb20-9f1f2c41ba77	true	id.token.claim
ca79a3d2-d0ae-49d7-bb20-9f1f2c41ba77	true	access.token.claim
ca79a3d2-d0ae-49d7-bb20-9f1f2c41ba77	updated_at	claim.name
ca79a3d2-d0ae-49d7-bb20-9f1f2c41ba77	long	jsonType.label
ccc54e69-c276-4deb-8749-3300d6d692b4	true	introspection.token.claim
ccc54e69-c276-4deb-8749-3300d6d692b4	true	userinfo.token.claim
ccc54e69-c276-4deb-8749-3300d6d692b4	birthdate	user.attribute
ccc54e69-c276-4deb-8749-3300d6d692b4	true	id.token.claim
ccc54e69-c276-4deb-8749-3300d6d692b4	true	access.token.claim
ccc54e69-c276-4deb-8749-3300d6d692b4	birthdate	claim.name
ccc54e69-c276-4deb-8749-3300d6d692b4	String	jsonType.label
e6d31211-b0d3-4d17-8146-602f3681c369	true	introspection.token.claim
e6d31211-b0d3-4d17-8146-602f3681c369	true	userinfo.token.claim
e6d31211-b0d3-4d17-8146-602f3681c369	true	id.token.claim
e6d31211-b0d3-4d17-8146-602f3681c369	true	access.token.claim
f36ea456-724d-4ba9-84a0-99ca82af36c9	true	introspection.token.claim
f36ea456-724d-4ba9-84a0-99ca82af36c9	true	userinfo.token.claim
f36ea456-724d-4ba9-84a0-99ca82af36c9	profile	user.attribute
f36ea456-724d-4ba9-84a0-99ca82af36c9	true	id.token.claim
f36ea456-724d-4ba9-84a0-99ca82af36c9	true	access.token.claim
f36ea456-724d-4ba9-84a0-99ca82af36c9	profile	claim.name
f36ea456-724d-4ba9-84a0-99ca82af36c9	String	jsonType.label
f43cd0fc-c617-47d4-a8cb-591b73d86c78	true	introspection.token.claim
f43cd0fc-c617-47d4-a8cb-591b73d86c78	true	userinfo.token.claim
f43cd0fc-c617-47d4-a8cb-591b73d86c78	picture	user.attribute
f43cd0fc-c617-47d4-a8cb-591b73d86c78	true	id.token.claim
f43cd0fc-c617-47d4-a8cb-591b73d86c78	true	access.token.claim
f43cd0fc-c617-47d4-a8cb-591b73d86c78	picture	claim.name
f43cd0fc-c617-47d4-a8cb-591b73d86c78	String	jsonType.label
2ef5690d-a6fe-408a-91e6-7ad5e8cd775d	true	introspection.token.claim
2ef5690d-a6fe-408a-91e6-7ad5e8cd775d	true	userinfo.token.claim
2ef5690d-a6fe-408a-91e6-7ad5e8cd775d	email	user.attribute
2ef5690d-a6fe-408a-91e6-7ad5e8cd775d	true	id.token.claim
2ef5690d-a6fe-408a-91e6-7ad5e8cd775d	true	access.token.claim
2ef5690d-a6fe-408a-91e6-7ad5e8cd775d	email	claim.name
2ef5690d-a6fe-408a-91e6-7ad5e8cd775d	String	jsonType.label
51548eb8-a890-4d6e-aa8e-e8235f954b75	true	introspection.token.claim
51548eb8-a890-4d6e-aa8e-e8235f954b75	true	userinfo.token.claim
51548eb8-a890-4d6e-aa8e-e8235f954b75	emailVerified	user.attribute
51548eb8-a890-4d6e-aa8e-e8235f954b75	true	id.token.claim
51548eb8-a890-4d6e-aa8e-e8235f954b75	true	access.token.claim
51548eb8-a890-4d6e-aa8e-e8235f954b75	email_verified	claim.name
51548eb8-a890-4d6e-aa8e-e8235f954b75	boolean	jsonType.label
802066f7-37cf-4905-a062-3c9b3720f94a	formatted	user.attribute.formatted
802066f7-37cf-4905-a062-3c9b3720f94a	country	user.attribute.country
802066f7-37cf-4905-a062-3c9b3720f94a	true	introspection.token.claim
802066f7-37cf-4905-a062-3c9b3720f94a	postal_code	user.attribute.postal_code
802066f7-37cf-4905-a062-3c9b3720f94a	true	userinfo.token.claim
802066f7-37cf-4905-a062-3c9b3720f94a	street	user.attribute.street
802066f7-37cf-4905-a062-3c9b3720f94a	true	id.token.claim
802066f7-37cf-4905-a062-3c9b3720f94a	region	user.attribute.region
802066f7-37cf-4905-a062-3c9b3720f94a	true	access.token.claim
802066f7-37cf-4905-a062-3c9b3720f94a	locality	user.attribute.locality
3dc1dc18-94b0-437e-a1fe-4ec3ba3a3155	true	introspection.token.claim
3dc1dc18-94b0-437e-a1fe-4ec3ba3a3155	true	userinfo.token.claim
3dc1dc18-94b0-437e-a1fe-4ec3ba3a3155	phoneNumberVerified	user.attribute
3dc1dc18-94b0-437e-a1fe-4ec3ba3a3155	true	id.token.claim
3dc1dc18-94b0-437e-a1fe-4ec3ba3a3155	true	access.token.claim
3dc1dc18-94b0-437e-a1fe-4ec3ba3a3155	phone_number_verified	claim.name
3dc1dc18-94b0-437e-a1fe-4ec3ba3a3155	boolean	jsonType.label
f8f82b6b-baec-48e9-bf2a-8d9f3e44e46b	true	introspection.token.claim
f8f82b6b-baec-48e9-bf2a-8d9f3e44e46b	true	userinfo.token.claim
f8f82b6b-baec-48e9-bf2a-8d9f3e44e46b	phoneNumber	user.attribute
f8f82b6b-baec-48e9-bf2a-8d9f3e44e46b	true	id.token.claim
f8f82b6b-baec-48e9-bf2a-8d9f3e44e46b	true	access.token.claim
f8f82b6b-baec-48e9-bf2a-8d9f3e44e46b	phone_number	claim.name
f8f82b6b-baec-48e9-bf2a-8d9f3e44e46b	String	jsonType.label
5f9c0bf7-9c09-4315-b456-4ea7b30e00aa	true	introspection.token.claim
5f9c0bf7-9c09-4315-b456-4ea7b30e00aa	true	multivalued
5f9c0bf7-9c09-4315-b456-4ea7b30e00aa	foo	user.attribute
5f9c0bf7-9c09-4315-b456-4ea7b30e00aa	true	access.token.claim
5f9c0bf7-9c09-4315-b456-4ea7b30e00aa	realm_access.roles	claim.name
5f9c0bf7-9c09-4315-b456-4ea7b30e00aa	String	jsonType.label
b1e6a657-bc74-4ff3-ab95-7b27aa469b4c	true	introspection.token.claim
b1e6a657-bc74-4ff3-ab95-7b27aa469b4c	true	multivalued
b1e6a657-bc74-4ff3-ab95-7b27aa469b4c	foo	user.attribute
b1e6a657-bc74-4ff3-ab95-7b27aa469b4c	true	access.token.claim
b1e6a657-bc74-4ff3-ab95-7b27aa469b4c	resource_access.${client_id}.roles	claim.name
b1e6a657-bc74-4ff3-ab95-7b27aa469b4c	String	jsonType.label
e3a6affb-2052-4c1c-9200-09e12f963dc4	true	introspection.token.claim
e3a6affb-2052-4c1c-9200-09e12f963dc4	true	access.token.claim
dc2151d5-287d-4c4c-bfab-4d019ac3a26a	true	introspection.token.claim
dc2151d5-287d-4c4c-bfab-4d019ac3a26a	true	access.token.claim
2c264510-8efb-4159-ad56-e2de5323cb09	true	introspection.token.claim
2c264510-8efb-4159-ad56-e2de5323cb09	true	userinfo.token.claim
2c264510-8efb-4159-ad56-e2de5323cb09	username	user.attribute
2c264510-8efb-4159-ad56-e2de5323cb09	true	id.token.claim
2c264510-8efb-4159-ad56-e2de5323cb09	true	access.token.claim
2c264510-8efb-4159-ad56-e2de5323cb09	upn	claim.name
2c264510-8efb-4159-ad56-e2de5323cb09	String	jsonType.label
4749c20b-0e31-4c34-963c-7ccac97a9abb	true	introspection.token.claim
4749c20b-0e31-4c34-963c-7ccac97a9abb	true	multivalued
4749c20b-0e31-4c34-963c-7ccac97a9abb	foo	user.attribute
4749c20b-0e31-4c34-963c-7ccac97a9abb	true	id.token.claim
4749c20b-0e31-4c34-963c-7ccac97a9abb	true	access.token.claim
4749c20b-0e31-4c34-963c-7ccac97a9abb	groups	claim.name
4749c20b-0e31-4c34-963c-7ccac97a9abb	String	jsonType.label
adb9a00a-c75a-485b-acf9-6723f6289cf2	true	introspection.token.claim
adb9a00a-c75a-485b-acf9-6723f6289cf2	true	id.token.claim
adb9a00a-c75a-485b-acf9-6723f6289cf2	true	access.token.claim
190054cf-3396-4ed7-a881-10087f564efc	true	introspection.token.claim
190054cf-3396-4ed7-a881-10087f564efc	true	userinfo.token.claim
190054cf-3396-4ed7-a881-10087f564efc	locale	user.attribute
190054cf-3396-4ed7-a881-10087f564efc	true	id.token.claim
190054cf-3396-4ed7-a881-10087f564efc	true	access.token.claim
190054cf-3396-4ed7-a881-10087f564efc	locale	claim.name
190054cf-3396-4ed7-a881-10087f564efc	String	jsonType.label
7ec166ac-3b77-4291-83f0-acdd8ac9fef8	client_id	user.session.note
7ec166ac-3b77-4291-83f0-acdd8ac9fef8	true	introspection.token.claim
7ec166ac-3b77-4291-83f0-acdd8ac9fef8	true	id.token.claim
7ec166ac-3b77-4291-83f0-acdd8ac9fef8	true	access.token.claim
7ec166ac-3b77-4291-83f0-acdd8ac9fef8	client_id	claim.name
7ec166ac-3b77-4291-83f0-acdd8ac9fef8	String	jsonType.label
baa0abcf-3f6c-4460-80e2-0c8e97b027d7	clientAddress	user.session.note
baa0abcf-3f6c-4460-80e2-0c8e97b027d7	true	introspection.token.claim
baa0abcf-3f6c-4460-80e2-0c8e97b027d7	true	id.token.claim
baa0abcf-3f6c-4460-80e2-0c8e97b027d7	true	access.token.claim
baa0abcf-3f6c-4460-80e2-0c8e97b027d7	clientAddress	claim.name
baa0abcf-3f6c-4460-80e2-0c8e97b027d7	String	jsonType.label
e6214354-4284-4cb3-90a9-16a76b07d6ab	clientHost	user.session.note
e6214354-4284-4cb3-90a9-16a76b07d6ab	true	introspection.token.claim
e6214354-4284-4cb3-90a9-16a76b07d6ab	true	id.token.claim
e6214354-4284-4cb3-90a9-16a76b07d6ab	true	access.token.claim
e6214354-4284-4cb3-90a9-16a76b07d6ab	clientHost	claim.name
e6214354-4284-4cb3-90a9-16a76b07d6ab	String	jsonType.label
\.


--
-- Data for Name: realm; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.realm (id, access_code_lifespan, user_action_lifespan, access_token_lifespan, account_theme, admin_theme, email_theme, enabled, events_enabled, events_expiration, login_theme, name, not_before, password_policy, registration_allowed, remember_me, reset_password_allowed, social, ssl_required, sso_idle_timeout, sso_max_lifespan, update_profile_on_soc_login, verify_email, master_admin_client, login_lifespan, internationalization_enabled, default_locale, reg_email_as_username, admin_events_enabled, admin_events_details_enabled, edit_username_allowed, otp_policy_counter, otp_policy_window, otp_policy_period, otp_policy_digits, otp_policy_alg, otp_policy_type, browser_flow, registration_flow, direct_grant_flow, reset_credentials_flow, client_auth_flow, offline_session_idle_timeout, revoke_refresh_token, access_token_life_implicit, login_with_email_allowed, duplicate_emails_allowed, docker_auth_flow, refresh_token_max_reuse, allow_user_managed_access, sso_max_lifespan_remember_me, sso_idle_timeout_remember_me, default_role) FROM stdin;
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	60	300	60	\N	\N	\N	t	f	0	\N	master	0	\N	f	f	f	f	EXTERNAL	1800	36000	f	f	9412a86d-4c55-4e39-b797-7f9239c20c0d	1800	f	\N	f	f	f	f	0	1	30	6	HmacSHA1	totp	3168add5-fed5-4edb-a1e4-f3c62c7f6cc6	d468cefc-20b7-4a24-805e-9651bcd67744	b3262137-2453-4d85-a4cc-9813dcf4e774	8e0bfad0-b9b8-492c-b4ad-4a245ee853b0	576fa06c-5ed0-46b5-908d-a2169f84fb4a	2592000	f	900	t	f	a5e2dd03-cd14-4f69-bfce-ad7b7b454df1	0	f	0	0	07036674-dd02-4938-a2ca-8b9b447abe3d
81407725-cab3-4c86-9e57-5dfbd60ae9c1	60	300	300	\N	\N	\N	t	f	0	\N	porprov	0	\N	f	f	f	f	EXTERNAL	1800	36000	f	f	9c11e110-0483-4223-8f3d-431c76cdc7a1	1800	f	\N	f	f	f	f	0	1	30	6	HmacSHA1	totp	9e9ed574-628b-4563-92fa-32ea502f920b	e3f47bdb-34b8-467f-ae1c-4a5baeb1e673	2551c17b-6a68-4951-a32f-07a5ba2de15a	49b9a780-1201-491b-8a51-a4213aff9eb8	2dd9992e-23a5-400b-90c7-64b4d48eb81c	2592000	f	900	t	f	d6dcc9f0-f535-43a9-b272-9a84e3f6f1c4	0	f	0	0	e597f43c-a870-4165-956f-465900305fd3
\.


--
-- Data for Name: realm_attribute; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.realm_attribute (name, realm_id, value) FROM stdin;
_browser_header.contentSecurityPolicyReportOnly	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	
_browser_header.xContentTypeOptions	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	nosniff
_browser_header.referrerPolicy	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	no-referrer
_browser_header.xRobotsTag	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	none
_browser_header.xFrameOptions	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	SAMEORIGIN
_browser_header.contentSecurityPolicy	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	frame-src 'self'; frame-ancestors 'self'; object-src 'none';
_browser_header.xXSSProtection	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	1; mode=block
_browser_header.strictTransportSecurity	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	max-age=31536000; includeSubDomains
bruteForceProtected	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	false
permanentLockout	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	false
maxTemporaryLockouts	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	0
maxFailureWaitSeconds	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	900
minimumQuickLoginWaitSeconds	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	60
waitIncrementSeconds	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	60
quickLoginCheckMilliSeconds	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	1000
maxDeltaTimeSeconds	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	43200
failureFactor	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	30
realmReusableOtpCode	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	false
firstBrokerLoginFlowId	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	eeefce3e-0b13-4368-94ff-8ef77b4c4f9a
displayName	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	Keycloak
displayNameHtml	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	<div class="kc-logo-text"><span>Keycloak</span></div>
defaultSignatureAlgorithm	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	RS256
offlineSessionMaxLifespanEnabled	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	false
offlineSessionMaxLifespan	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	5184000
_browser_header.contentSecurityPolicyReportOnly	81407725-cab3-4c86-9e57-5dfbd60ae9c1	
_browser_header.xContentTypeOptions	81407725-cab3-4c86-9e57-5dfbd60ae9c1	nosniff
_browser_header.referrerPolicy	81407725-cab3-4c86-9e57-5dfbd60ae9c1	no-referrer
_browser_header.xRobotsTag	81407725-cab3-4c86-9e57-5dfbd60ae9c1	none
_browser_header.xFrameOptions	81407725-cab3-4c86-9e57-5dfbd60ae9c1	SAMEORIGIN
_browser_header.contentSecurityPolicy	81407725-cab3-4c86-9e57-5dfbd60ae9c1	frame-src 'self'; frame-ancestors 'self'; object-src 'none';
_browser_header.xXSSProtection	81407725-cab3-4c86-9e57-5dfbd60ae9c1	1; mode=block
_browser_header.strictTransportSecurity	81407725-cab3-4c86-9e57-5dfbd60ae9c1	max-age=31536000; includeSubDomains
bruteForceProtected	81407725-cab3-4c86-9e57-5dfbd60ae9c1	false
permanentLockout	81407725-cab3-4c86-9e57-5dfbd60ae9c1	false
maxTemporaryLockouts	81407725-cab3-4c86-9e57-5dfbd60ae9c1	0
maxFailureWaitSeconds	81407725-cab3-4c86-9e57-5dfbd60ae9c1	900
minimumQuickLoginWaitSeconds	81407725-cab3-4c86-9e57-5dfbd60ae9c1	60
waitIncrementSeconds	81407725-cab3-4c86-9e57-5dfbd60ae9c1	60
quickLoginCheckMilliSeconds	81407725-cab3-4c86-9e57-5dfbd60ae9c1	1000
maxDeltaTimeSeconds	81407725-cab3-4c86-9e57-5dfbd60ae9c1	43200
failureFactor	81407725-cab3-4c86-9e57-5dfbd60ae9c1	30
realmReusableOtpCode	81407725-cab3-4c86-9e57-5dfbd60ae9c1	false
defaultSignatureAlgorithm	81407725-cab3-4c86-9e57-5dfbd60ae9c1	RS256
offlineSessionMaxLifespanEnabled	81407725-cab3-4c86-9e57-5dfbd60ae9c1	false
offlineSessionMaxLifespan	81407725-cab3-4c86-9e57-5dfbd60ae9c1	5184000
actionTokenGeneratedByAdminLifespan	81407725-cab3-4c86-9e57-5dfbd60ae9c1	43200
actionTokenGeneratedByUserLifespan	81407725-cab3-4c86-9e57-5dfbd60ae9c1	300
oauth2DeviceCodeLifespan	81407725-cab3-4c86-9e57-5dfbd60ae9c1	600
oauth2DevicePollingInterval	81407725-cab3-4c86-9e57-5dfbd60ae9c1	5
webAuthnPolicyRpEntityName	81407725-cab3-4c86-9e57-5dfbd60ae9c1	keycloak
webAuthnPolicySignatureAlgorithms	81407725-cab3-4c86-9e57-5dfbd60ae9c1	ES256
webAuthnPolicyRpId	81407725-cab3-4c86-9e57-5dfbd60ae9c1	
webAuthnPolicyAttestationConveyancePreference	81407725-cab3-4c86-9e57-5dfbd60ae9c1	not specified
webAuthnPolicyAuthenticatorAttachment	81407725-cab3-4c86-9e57-5dfbd60ae9c1	not specified
webAuthnPolicyRequireResidentKey	81407725-cab3-4c86-9e57-5dfbd60ae9c1	not specified
webAuthnPolicyUserVerificationRequirement	81407725-cab3-4c86-9e57-5dfbd60ae9c1	not specified
webAuthnPolicyCreateTimeout	81407725-cab3-4c86-9e57-5dfbd60ae9c1	0
webAuthnPolicyAvoidSameAuthenticatorRegister	81407725-cab3-4c86-9e57-5dfbd60ae9c1	false
webAuthnPolicyRpEntityNamePasswordless	81407725-cab3-4c86-9e57-5dfbd60ae9c1	keycloak
webAuthnPolicySignatureAlgorithmsPasswordless	81407725-cab3-4c86-9e57-5dfbd60ae9c1	ES256
webAuthnPolicyRpIdPasswordless	81407725-cab3-4c86-9e57-5dfbd60ae9c1	
webAuthnPolicyAttestationConveyancePreferencePasswordless	81407725-cab3-4c86-9e57-5dfbd60ae9c1	not specified
webAuthnPolicyAuthenticatorAttachmentPasswordless	81407725-cab3-4c86-9e57-5dfbd60ae9c1	not specified
webAuthnPolicyRequireResidentKeyPasswordless	81407725-cab3-4c86-9e57-5dfbd60ae9c1	not specified
webAuthnPolicyUserVerificationRequirementPasswordless	81407725-cab3-4c86-9e57-5dfbd60ae9c1	not specified
webAuthnPolicyCreateTimeoutPasswordless	81407725-cab3-4c86-9e57-5dfbd60ae9c1	0
webAuthnPolicyAvoidSameAuthenticatorRegisterPasswordless	81407725-cab3-4c86-9e57-5dfbd60ae9c1	false
cibaBackchannelTokenDeliveryMode	81407725-cab3-4c86-9e57-5dfbd60ae9c1	poll
cibaExpiresIn	81407725-cab3-4c86-9e57-5dfbd60ae9c1	120
cibaInterval	81407725-cab3-4c86-9e57-5dfbd60ae9c1	5
cibaAuthRequestedUserHint	81407725-cab3-4c86-9e57-5dfbd60ae9c1	login_hint
parRequestUriLifespan	81407725-cab3-4c86-9e57-5dfbd60ae9c1	60
firstBrokerLoginFlowId	81407725-cab3-4c86-9e57-5dfbd60ae9c1	1f0f1535-5c79-4a6a-8b3a-ba4a27a038bc
\.


--
-- Data for Name: realm_default_groups; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.realm_default_groups (realm_id, group_id) FROM stdin;
\.


--
-- Data for Name: realm_enabled_event_types; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.realm_enabled_event_types (realm_id, value) FROM stdin;
\.


--
-- Data for Name: realm_events_listeners; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.realm_events_listeners (realm_id, value) FROM stdin;
252774b0-8c55-4991-a6ff-6b8ecd8bcc75	jboss-logging
81407725-cab3-4c86-9e57-5dfbd60ae9c1	jboss-logging
\.


--
-- Data for Name: realm_localizations; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.realm_localizations (realm_id, locale, texts) FROM stdin;
\.


--
-- Data for Name: realm_required_credential; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.realm_required_credential (type, form_label, input, secret, realm_id) FROM stdin;
password	password	t	t	252774b0-8c55-4991-a6ff-6b8ecd8bcc75
password	password	t	t	81407725-cab3-4c86-9e57-5dfbd60ae9c1
\.


--
-- Data for Name: realm_smtp_config; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.realm_smtp_config (realm_id, value, name) FROM stdin;
\.


--
-- Data for Name: realm_supported_locales; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.realm_supported_locales (realm_id, value) FROM stdin;
\.


--
-- Data for Name: redirect_uris; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.redirect_uris (client_id, value) FROM stdin;
d4521e1e-84c7-4b33-b982-056ba57f8928	/realms/master/account/*
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	/realms/master/account/*
0ff83107-f980-4fe5-9571-fda3de2c72ad	/admin/master/console/*
f5832c79-96f4-4f22-8504-e4175dea30ab	/realms/porprov/account/*
d4ae43b8-c3fe-45bd-8a99-7106f8956005	/realms/porprov/account/*
c76139e0-33c9-45e7-ad54-593f40ea79cd	/admin/porprov/console/*
ac15b0b1-470c-48d5-90de-70a5ad10bc80	http://localhost:5173/*
ac15b0b1-470c-48d5-90de-70a5ad10bc80	http://127.0.0.1:5173/*
65fbdf68-3759-4999-b63f-dc572777adc7	http://localhost:8081/*
65fbdf68-3759-4999-b63f-dc572777adc7	porprov://*
65fbdf68-3759-4999-b63f-dc572777adc7	exp://10.0.2.2:8081
\.


--
-- Data for Name: required_action_config; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.required_action_config (required_action_id, value, name) FROM stdin;
\.


--
-- Data for Name: required_action_provider; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.required_action_provider (id, alias, name, realm_id, enabled, default_action, provider_id, priority) FROM stdin;
0b1dd6af-0daa-4fcd-b91b-46e6508d8e17	VERIFY_EMAIL	Verify Email	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	t	f	VERIFY_EMAIL	50
cc1c8c38-caff-48fe-8e0a-6a6d45e939c2	UPDATE_PROFILE	Update Profile	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	t	f	UPDATE_PROFILE	40
d46cb123-d0cb-4a2e-976e-05d828c46a58	CONFIGURE_TOTP	Configure OTP	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	t	f	CONFIGURE_TOTP	10
fafe19c6-75ec-41f9-b4e7-178ae378057e	UPDATE_PASSWORD	Update Password	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	t	f	UPDATE_PASSWORD	30
9b4de294-b111-412d-b9b8-bdfd818a2f7c	TERMS_AND_CONDITIONS	Terms and Conditions	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	f	f	TERMS_AND_CONDITIONS	20
7e3b7821-c5d2-4821-9faf-cf87a7192813	delete_account	Delete Account	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	f	f	delete_account	60
52760ffd-d278-45fc-bd94-b3f3087c3a90	update_user_locale	Update User Locale	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	t	f	update_user_locale	1000
6b3e9870-2daa-4a7d-b741-d8a7f9b55e76	webauthn-register	Webauthn Register	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	t	f	webauthn-register	70
1c5ec121-4ad4-4278-939a-42e104e6ed59	webauthn-register-passwordless	Webauthn Register Passwordless	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	t	f	webauthn-register-passwordless	80
7688fffc-ed36-405d-88f3-1cacaa01aa20	VERIFY_PROFILE	Verify Profile	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	t	f	VERIFY_PROFILE	90
16cd13f8-d685-47a1-ab37-c22fea87b14a	VERIFY_EMAIL	Verify Email	81407725-cab3-4c86-9e57-5dfbd60ae9c1	t	f	VERIFY_EMAIL	50
baaae3ed-2455-41bf-8118-eaf4ec958774	UPDATE_PROFILE	Update Profile	81407725-cab3-4c86-9e57-5dfbd60ae9c1	t	f	UPDATE_PROFILE	40
27e28646-ffa3-4a17-9d34-b4815aa2c7a0	CONFIGURE_TOTP	Configure OTP	81407725-cab3-4c86-9e57-5dfbd60ae9c1	t	f	CONFIGURE_TOTP	10
892fdb1a-3611-4682-8e7a-ecdf1762173b	UPDATE_PASSWORD	Update Password	81407725-cab3-4c86-9e57-5dfbd60ae9c1	t	f	UPDATE_PASSWORD	30
e8fe58c1-bfa1-40da-9be3-85b11f31f9b9	TERMS_AND_CONDITIONS	Terms and Conditions	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f	f	TERMS_AND_CONDITIONS	20
fc9dc63a-902b-4802-bcdf-f8b5fbb09f3a	delete_account	Delete Account	81407725-cab3-4c86-9e57-5dfbd60ae9c1	f	f	delete_account	60
7dd066c3-ea1f-436f-9359-525e5df8a5ae	update_user_locale	Update User Locale	81407725-cab3-4c86-9e57-5dfbd60ae9c1	t	f	update_user_locale	1000
25e969b2-b717-488b-9f07-385dda53d64e	webauthn-register	Webauthn Register	81407725-cab3-4c86-9e57-5dfbd60ae9c1	t	f	webauthn-register	70
846ca90e-f4c8-402a-a36a-83e34ba66815	webauthn-register-passwordless	Webauthn Register Passwordless	81407725-cab3-4c86-9e57-5dfbd60ae9c1	t	f	webauthn-register-passwordless	80
81af82a3-1551-4c23-9146-b1d0963dfe69	VERIFY_PROFILE	Verify Profile	81407725-cab3-4c86-9e57-5dfbd60ae9c1	t	f	VERIFY_PROFILE	90
\.


--
-- Data for Name: resource_attribute; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.resource_attribute (id, name, value, resource_id) FROM stdin;
\.


--
-- Data for Name: resource_policy; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.resource_policy (resource_id, policy_id) FROM stdin;
\.


--
-- Data for Name: resource_scope; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.resource_scope (resource_id, scope_id) FROM stdin;
\.


--
-- Data for Name: resource_server; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.resource_server (id, allow_rs_remote_mgmt, policy_enforce_mode, decision_strategy) FROM stdin;
\.


--
-- Data for Name: resource_server_perm_ticket; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.resource_server_perm_ticket (id, owner, requester, created_timestamp, granted_timestamp, resource_id, scope_id, resource_server_id, policy_id) FROM stdin;
\.


--
-- Data for Name: resource_server_policy; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.resource_server_policy (id, name, description, type, decision_strategy, logic, resource_server_id, owner) FROM stdin;
\.


--
-- Data for Name: resource_server_resource; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.resource_server_resource (id, name, type, icon_uri, owner, resource_server_id, owner_managed_access, display_name) FROM stdin;
\.


--
-- Data for Name: resource_server_scope; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.resource_server_scope (id, name, icon_uri, resource_server_id, display_name) FROM stdin;
\.


--
-- Data for Name: resource_uris; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.resource_uris (resource_id, value) FROM stdin;
\.


--
-- Data for Name: role_attribute; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.role_attribute (id, role_id, name, value) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.schema_migrations (version, dirty) FROM stdin;
3	f
\.


--
-- Data for Name: scope_mapping; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.scope_mapping (client_id, role_id) FROM stdin;
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	052a5b92-31c3-40c1-9727-9be115ca4272
1e781d1e-3ee8-4c0a-93f6-ab60e49f69fb	3126269e-b5f2-4180-84dc-3e3315ae0ef2
d4ae43b8-c3fe-45bd-8a99-7106f8956005	b4aedf21-73cb-4091-95a4-f2c63667e50c
d4ae43b8-c3fe-45bd-8a99-7106f8956005	46f081fb-5aeb-4119-af16-ae43ab2ada42
\.


--
-- Data for Name: scope_policy; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.scope_policy (scope_id, policy_id) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: user_attribute; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_attribute (name, value, user_id, id, long_value_hash, long_value_hash_lower_case, long_value) FROM stdin;
\.


--
-- Data for Name: user_consent; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_consent (id, client_id, user_id, created_date, last_updated_date, client_storage_provider, external_client_id) FROM stdin;
\.


--
-- Data for Name: user_consent_client_scope; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_consent_client_scope (user_consent_id, scope_id) FROM stdin;
\.


--
-- Data for Name: user_entity; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_entity (id, email, email_constraint, email_verified, enabled, federation_link, first_name, last_name, realm_id, username, created_timestamp, service_account_client_link, not_before) FROM stdin;
2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be	\N	afb26ea0-cedc-4573-8c0e-88775977c378	f	t	\N	\N	\N	252774b0-8c55-4991-a6ff-6b8ecd8bcc75	admin	1783395528619	\N	0
974c4449-21e0-4313-81ff-9fea0533f23b	admin@porprov.depok.go.id	admin@porprov.depok.go.id	f	t	\N	Admin	Depok	81407725-cab3-4c86-9e57-5dfbd60ae9c1	admin_depok	1783484604030	\N	0
0b6fcae4-b852-4ad1-8d5b-dfc17d3f55a0	koresponden1@porprov.depok.go.id	koresponden1@porprov.depok.go.id	f	t	\N	Budi	Pramono	81407725-cab3-4c86-9e57-5dfbd60ae9c1	koresponden_1	1783484607339	\N	0
228bec3b-3340-484f-8a54-f9c4e6c18439	\N	b1e734a1-d755-46ab-924c-875b0eaf11df	f	t	\N	\N	\N	81407725-cab3-4c86-9e57-5dfbd60ae9c1	service-account-porprov-backend-service	1784599301292	71e0ee67-90a8-433a-9af5-65a902688daa	0
364494a2-a476-4d9b-ae57-2fb27bf841c8	pdzeus83aw@gmail.com	pdzeus83aw@gmail.com	t	t	\N	Pedro	Iriano	81407725-cab3-4c86-9e57-5dfbd60ae9c1	pedroiriano	1784603217755	\N	0
\.


--
-- Data for Name: user_federation_config; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_federation_config (user_federation_provider_id, value, name) FROM stdin;
\.


--
-- Data for Name: user_federation_mapper; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_federation_mapper (id, name, federation_provider_id, federation_mapper_type, realm_id) FROM stdin;
\.


--
-- Data for Name: user_federation_mapper_config; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_federation_mapper_config (user_federation_mapper_id, value, name) FROM stdin;
\.


--
-- Data for Name: user_federation_provider; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_federation_provider (id, changed_sync_period, display_name, full_sync_period, last_sync, priority, provider_name, realm_id) FROM stdin;
\.


--
-- Data for Name: user_group_membership; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_group_membership (group_id, user_id) FROM stdin;
\.


--
-- Data for Name: user_required_action; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_required_action (user_id, required_action) FROM stdin;
\.


--
-- Data for Name: user_role_mapping; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_role_mapping (role_id, user_id) FROM stdin;
07036674-dd02-4938-a2ca-8b9b447abe3d	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
1b417689-632d-4f5d-90b1-5cf82799f3ba	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
91f83e3c-b56c-444c-b800-7d56a7c37343	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
849a52ce-f089-4811-a95b-436c8002aa31	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
67ca29ac-71cd-400e-b6f1-e3ea4c4a5f7e	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
56979e18-9bcd-4272-9f0f-eedc504f10a4	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
67e1c20f-4633-41fb-b0b6-a7a05aad19df	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
129ecfa4-a7bf-49b9-899d-a79f1a0a926a	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
143ccf9a-0afb-4bb9-b34b-94a56ad23673	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
bf14f1c5-2138-46db-8146-74048cbbfbd2	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
1b36931c-798e-4855-9644-7fec4f5efbd1	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
dc700d1f-ff4a-4c77-8701-f128b32b3ab7	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
3f29de09-3359-4dbc-b77b-7fb24483d9c7	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
2a5018f8-c73d-499a-8504-fe4439ceb952	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
b994cc41-565a-4e5a-b380-2dc57209ce93	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
75f87cf9-8449-42a1-a5dd-1db6bcff99c9	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
10d802c3-5b09-4d02-a46a-36565b1aeb7d	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
cf4996c7-ccf6-4c37-aabd-370ee177cfb0	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
fd11eae8-4dd2-423c-a12b-88ad97747006	2c8ae0c4-6925-4bcb-abfe-5315ac9ec2be
e597f43c-a870-4165-956f-465900305fd3	974c4449-21e0-4313-81ff-9fea0533f23b
88a51097-2d67-4662-9733-45d0ebbe0894	974c4449-21e0-4313-81ff-9fea0533f23b
e597f43c-a870-4165-956f-465900305fd3	0b6fcae4-b852-4ad1-8d5b-dfc17d3f55a0
f5fc630e-7438-4455-bdc4-4c262c709c5a	0b6fcae4-b852-4ad1-8d5b-dfc17d3f55a0
e597f43c-a870-4165-956f-465900305fd3	228bec3b-3340-484f-8a54-f9c4e6c18439
c24c761c-57a3-4873-a53e-35639bb13c4d	228bec3b-3340-484f-8a54-f9c4e6c18439
8e39c824-8706-40e9-b7fe-92da61a6fbcd	228bec3b-3340-484f-8a54-f9c4e6c18439
e597f43c-a870-4165-956f-465900305fd3	364494a2-a476-4d9b-ae57-2fb27bf841c8
88a51097-2d67-4662-9733-45d0ebbe0894	364494a2-a476-4d9b-ae57-2fb27bf841c8
\.


--
-- Data for Name: user_session; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_session (id, auth_method, ip_address, last_session_refresh, login_username, realm_id, remember_me, started, user_id, user_session_state, broker_session_id, broker_user_id) FROM stdin;
\.


--
-- Data for Name: user_session_note; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.user_session_note (user_session, name, value) FROM stdin;
\.


--
-- Data for Name: username_login_failure; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.username_login_failure (realm_id, username, failed_login_not_before, last_failure, last_ip_failure, num_failures) FROM stdin;
\.


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.venues (id, name, address, capacity, created_at, updated_at, city, image_url, latitude, longitude, map_route_url, city_guide_ids, cabor_ids, facilities, readiness_status, contact_person) FROM stdin;
8bea3d3d-e351-4b08-9a22-1519aa12cfec	Lapangan Kukusan	Jl. Palakali, Kukusan, Kecamatan Beji, Kota Depok, Jawa Barat.	500	2026-07-09 04:23:58.369926+00	2026-07-09 04:23:58.369926+00	Depok	/assets/images/venue/Lapangan Kukusan-GATEBALL/Lapangan Kukusan.png	-6.36880000	106.82220000	\N	\N	\N	\N	Persiapan	\N
9210d747-2206-431c-b836-7e39e312b0ae	Depok Sport Hall	Jl. Boulevard Grand Depok City, Tirtajaya, Kec. Sukmajaya, Kota Depok, Jawa Barat.	2000	2026-07-09 04:23:58.369926+00	2026-07-09 04:23:58.369926+00	Depok	/assets/images/venue/Depok Sport Hall-KARATE DAN BASKETBALL/DEPOK SPORT HALL 2.png	-6.40250000	106.79420000	\N	\N	\N	\N	Siap	\N
1042ac37-38b8-4061-9485-537db8523bef	Eden Sports Center	Jl. Raya Pengasinan, Pengasinan, Kec. Sawangan, Kota Depok, Jawa Barat.	1000	2026-07-09 04:23:58.369926+00	2026-07-09 04:23:58.369926+00	Depok	/assets/images/venue/Eden Sport Centre-HOCKEY INDOOR DAN FLOORBALL/Eden Sports Center.png	-6.42550000	106.76220000	\N	\N	\N	\N	Persiapan	\N
0b572973-7573-4561-bfb6-9b53715dd2ef	Lapangan Bola PSP	Jl. Abdul Wahab No.19, Sawangan Lama, Kec. Sawangan, Kota Depok, Jawa Barat.	800	2026-07-09 04:23:58.369926+00	2026-07-09 04:23:58.369926+00	Depok	/assets/images/venue/Lapangan Bola PSP-Hockey Outdoor/Lapangan Bola PSP.png	-6.40350000	106.75920000	\N	\N	\N	\N	Siap	\N
98ceea67-c1d1-48cc-9114-1a89a0600b1c	Stadion Merpati	Jl. Gelatik Raya No.43, Depok Jaya, Kec. Pancoran Mas, Kota Depok, Jawa Barat.	3000	2026-07-09 04:23:58.369926+00	2026-07-09 04:23:58.369926+00	Depok	/assets/images/venue/Lapangan Merpati-Bola Putri/Stadion Merpati.png	-6.39850000	106.81220000	\N	\N	\N	\N	Siap	\N
f3739e48-be9a-413d-8579-8864b007bfca	Stadion Mahakam	Jalan Rasamala Raya No 1, Baktijaya, Kec. Sukmajaya, Kota Depok, Jawa Barat.	1500	2026-07-09 04:23:58.369926+00	2026-07-09 04:23:58.369926+00	Depok	/assets/images/venue/Stadion Mahakam-Bola Putri/STADION MAHAKAM.png	-6.38850000	106.83220000	\N	\N	\N	\N	Persiapan	\N
b5bc2c7c-0caa-49c5-8366-644e2b38252f	Lap. Tembak Kostrad	KOSTRAD 328 (Cilodong), Kec. Cilodong, Kota Depok, Jawa Barat.	500	2026-07-09 04:23:58.369926+00	2026-07-09 04:23:58.369926+00	Depok	/assets/images/venue/Lapangan Tembak Kostrad-Tembak Outdoor/LAPANGAN TEMBAK KOSTRAD CILODONG.png	-6.42850000	106.85220000	\N	\N	\N	\N	Siap	\N
1629e1d2-8bae-4ca9-8009-44693451e95b	Emeralda Golf	Jl. Emeralda Raya, Kec. Tapos, Kota Depok, Jawa Barat.	1000	2026-07-09 04:23:58.369926+00	2026-07-09 04:23:58.369926+00	Depok	/assets/images/venue/Emeralda Golf/EMERALDA GOLF.png	-6.43850000	106.88220000	\N	\N	\N	\N	Siap	\N
fe3676e4-9a73-4146-a795-2fcfa338ae58	GOR Kartika	Jl. Asrama Cilodong No.80, Cilodong, Kec. Cilodong, Kota Depok, Jawa Barat.	800	2026-07-09 04:23:58.369926+00	2026-07-09 04:23:58.369926+00	Depok	/assets/images/venue/Gor Kartika-Sepak Takraw/GOR KARTIKA.png	-6.42850000	106.85220000	\N	\N	\N	\N	Siap	\N
eae6fab3-bd1b-449b-854a-84dba9ca923f	Pantai Cimaja	Desa Cimaja, Kec. Cikakak, Kab. Sukabumi, Jawa Barat.	5000	2026-07-09 04:23:58.369926+00	2026-07-09 04:23:58.369926+00	Depok	/assets/images/venue/Pantai Cimaja-Selancar/PANTAI CIMAJA2.png	-6.95850000	106.46220000	\N	\N	\N	\N	Siap	\N
e0000000-0000-0000-0000-000000000001	Stadion Merpati	Jl. Gelatik Raya No.43, Depok Jaya, Kec. Pancoran Mas, Kota Depok, Jawa Barat	5000	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000002	Lapangan Bola PSP	Jl. Abdul Wahab No.19, Sawangan Lama, Kec. Sawangan, Kota Depok, Jawa Barat	2000	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000003	Eden Sports Center	Jl. Raya Pengasinan, Pengasinan, Kec. Sawangan, Kota Depok, Jawa Barat	1500	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000004	Depok Sport Hall	Jl. Boulevard Grand Depok City, Tirtajaya, Kec. Sukmajaya, Kota Depok, Jawa Barat	3000	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000005	Pantai Cimaja	Desa Cimaja, Kec. Cikakak, Kab. Sukabumi, Jawa Barat	0	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000006	Lapangan Kukusan	Jl. Palakali, Kukusan, Kecamatan Beji, Kota Depok, Jawa Barat	1000	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000007	Stadion Mahakam	Jalan Rasamala Raya No 1, Baktijaya, Kec. Sukmajaya, Kota Depok, Jawa Barat	3000	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000010	Emeralda Golf Club	Jl. Emeralda Raya, Kec. Tapos, Kota Depok, Jawa Barat	1000	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000008	Lapangan Tembak Kostrad Cilodong	KOSTRAD 328 (Cilodong), Kec. Cilodong, Kota Depok, Jawa Barat	500	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000009	GOR Kartika	Jl. Asrama Cilodong No.80, Cilodong, Kec. Cilodong, Kota Depok, Jawa Barat	2500	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000011	Alun-Alun Kota Depok	Boulevard Grand Depok City, Jatimulya, Kec. Cilodong, Kota Depok, Jawa Barat	10000	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000012	Balaikota Depok	Jl. Margonda Raya No.54, Pancoran Mas, Kota Depok, Jawa Barat	2000	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000013	Margo City Mall	Jl. Margonda Raya No.358, Kemiri Muka, Kecamatan Beji, Kota Depok, Jawa Barat	5000	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
e0000000-0000-0000-0000-000000000014	GOR Kota Depok	Jl. Boulevard Grand Depok City, Depok	3000	2026-07-09 08:48:30.696712+00	2026-07-09 08:48:30.696712+00	Depok	\N	\N	\N	\N	\N	\N	\N	Persiapan	\N
\.


--
-- Data for Name: web_origins; Type: TABLE DATA; Schema: public; Owner: porprov_admin
--

COPY public.web_origins (client_id, value) FROM stdin;
0ff83107-f980-4fe5-9571-fda3de2c72ad	+
c76139e0-33c9-45e7-ad54-593f40ea79cd	+
ac15b0b1-470c-48d5-90de-70a5ad10bc80	http://localhost:5173
ac15b0b1-470c-48d5-90de-70a5ad10bc80	http://127.0.0.1:5173
65fbdf68-3759-4999-b63f-dc572777adc7	http://localhost:8081
\.


--
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: porprov_admin
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: porprov_admin
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: porprov_admin
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: porprov_admin
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: porprov_admin
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: porprov_admin
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- Name: topology_id_seq; Type: SEQUENCE SET; Schema: topology; Owner: porprov_admin
--

SELECT pg_catalog.setval('topology.topology_id_seq', 1, false);


--
-- Name: username_login_failure CONSTRAINT_17-2; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.username_login_failure
    ADD CONSTRAINT "CONSTRAINT_17-2" PRIMARY KEY (realm_id, username);


--
-- Name: keycloak_role UK_J3RWUVD56ONTGSUHOGM184WW2-2; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT "UK_J3RWUVD56ONTGSUHOGM184WW2-2" UNIQUE (name, client_realm_constraint);


--
-- Name: client_auth_flow_bindings c_cli_flow_bind; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_auth_flow_bindings
    ADD CONSTRAINT c_cli_flow_bind PRIMARY KEY (client_id, binding_name);


--
-- Name: client_scope_client c_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_scope_client
    ADD CONSTRAINT c_cli_scope_bind PRIMARY KEY (client_id, scope_id);


--
-- Name: cabors cabors_name_key; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.cabors
    ADD CONSTRAINT cabors_name_key UNIQUE (name);


--
-- Name: cabors cabors_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.cabors
    ADD CONSTRAINT cabors_pkey PRIMARY KEY (id);


--
-- Name: city_guides city_guides_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.city_guides
    ADD CONSTRAINT city_guides_pkey PRIMARY KEY (id);


--
-- Name: client_initial_access cnstr_client_init_acc_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT cnstr_client_init_acc_pk PRIMARY KEY (id);


--
-- Name: realm_default_groups con_group_id_def_groups; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT con_group_id_def_groups UNIQUE (group_id);


--
-- Name: broker_link constr_broker_link_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.broker_link
    ADD CONSTRAINT constr_broker_link_pk PRIMARY KEY (identity_provider, user_id);


--
-- Name: client_user_session_note constr_cl_usr_ses_note; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_user_session_note
    ADD CONSTRAINT constr_cl_usr_ses_note PRIMARY KEY (client_session, name);


--
-- Name: component_config constr_component_config_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT constr_component_config_pk PRIMARY KEY (id);


--
-- Name: component constr_component_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT constr_component_pk PRIMARY KEY (id);


--
-- Name: fed_user_required_action constr_fed_required_action; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.fed_user_required_action
    ADD CONSTRAINT constr_fed_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: fed_user_attribute constr_fed_user_attr_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.fed_user_attribute
    ADD CONSTRAINT constr_fed_user_attr_pk PRIMARY KEY (id);


--
-- Name: fed_user_consent constr_fed_user_consent_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.fed_user_consent
    ADD CONSTRAINT constr_fed_user_consent_pk PRIMARY KEY (id);


--
-- Name: fed_user_credential constr_fed_user_cred_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.fed_user_credential
    ADD CONSTRAINT constr_fed_user_cred_pk PRIMARY KEY (id);


--
-- Name: fed_user_group_membership constr_fed_user_group; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.fed_user_group_membership
    ADD CONSTRAINT constr_fed_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: fed_user_role_mapping constr_fed_user_role; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.fed_user_role_mapping
    ADD CONSTRAINT constr_fed_user_role PRIMARY KEY (role_id, user_id);


--
-- Name: federated_user constr_federated_user; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.federated_user
    ADD CONSTRAINT constr_federated_user PRIMARY KEY (id);


--
-- Name: realm_default_groups constr_realm_default_groups; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT constr_realm_default_groups PRIMARY KEY (realm_id, group_id);


--
-- Name: realm_enabled_event_types constr_realm_enabl_event_types; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT constr_realm_enabl_event_types PRIMARY KEY (realm_id, value);


--
-- Name: realm_events_listeners constr_realm_events_listeners; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT constr_realm_events_listeners PRIMARY KEY (realm_id, value);


--
-- Name: realm_supported_locales constr_realm_supported_locales; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT constr_realm_supported_locales PRIMARY KEY (realm_id, value);


--
-- Name: identity_provider constraint_2b; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT constraint_2b PRIMARY KEY (internal_id);


--
-- Name: client_attributes constraint_3c; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT constraint_3c PRIMARY KEY (client_id, name);


--
-- Name: event_entity constraint_4; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.event_entity
    ADD CONSTRAINT constraint_4 PRIMARY KEY (id);


--
-- Name: federated_identity constraint_40; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT constraint_40 PRIMARY KEY (identity_provider, user_id);


--
-- Name: realm constraint_4a; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT constraint_4a PRIMARY KEY (id);


--
-- Name: client_session_role constraint_5; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_session_role
    ADD CONSTRAINT constraint_5 PRIMARY KEY (client_session, role_id);


--
-- Name: user_session constraint_57; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_session
    ADD CONSTRAINT constraint_57 PRIMARY KEY (id);


--
-- Name: user_federation_provider constraint_5c; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT constraint_5c PRIMARY KEY (id);


--
-- Name: client_session_note constraint_5e; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_session_note
    ADD CONSTRAINT constraint_5e PRIMARY KEY (client_session, name);


--
-- Name: client constraint_7; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT constraint_7 PRIMARY KEY (id);


--
-- Name: client_session constraint_8; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_session
    ADD CONSTRAINT constraint_8 PRIMARY KEY (id);


--
-- Name: scope_mapping constraint_81; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT constraint_81 PRIMARY KEY (client_id, role_id);


--
-- Name: client_node_registrations constraint_84; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT constraint_84 PRIMARY KEY (client_id, name);


--
-- Name: realm_attribute constraint_9; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT constraint_9 PRIMARY KEY (name, realm_id);


--
-- Name: realm_required_credential constraint_92; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT constraint_92 PRIMARY KEY (realm_id, type);


--
-- Name: keycloak_role constraint_a; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT constraint_a PRIMARY KEY (id);


--
-- Name: admin_event_entity constraint_admin_event_entity; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.admin_event_entity
    ADD CONSTRAINT constraint_admin_event_entity PRIMARY KEY (id);


--
-- Name: authenticator_config_entry constraint_auth_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.authenticator_config_entry
    ADD CONSTRAINT constraint_auth_cfg_pk PRIMARY KEY (authenticator_id, name);


--
-- Name: authentication_execution constraint_auth_exec_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT constraint_auth_exec_pk PRIMARY KEY (id);


--
-- Name: authentication_flow constraint_auth_flow_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT constraint_auth_flow_pk PRIMARY KEY (id);


--
-- Name: authenticator_config constraint_auth_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT constraint_auth_pk PRIMARY KEY (id);


--
-- Name: client_session_auth_status constraint_auth_status_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_session_auth_status
    ADD CONSTRAINT constraint_auth_status_pk PRIMARY KEY (client_session, authenticator);


--
-- Name: user_role_mapping constraint_c; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT constraint_c PRIMARY KEY (role_id, user_id);


--
-- Name: composite_role constraint_composite_role; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT constraint_composite_role PRIMARY KEY (composite, child_role);


--
-- Name: client_session_prot_mapper constraint_cs_pmp_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_session_prot_mapper
    ADD CONSTRAINT constraint_cs_pmp_pk PRIMARY KEY (client_session, protocol_mapper_id);


--
-- Name: identity_provider_config constraint_d; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT constraint_d PRIMARY KEY (identity_provider_id, name);


--
-- Name: policy_config constraint_dpc; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT constraint_dpc PRIMARY KEY (policy_id, name);


--
-- Name: realm_smtp_config constraint_e; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT constraint_e PRIMARY KEY (realm_id, name);


--
-- Name: credential constraint_f; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT constraint_f PRIMARY KEY (id);


--
-- Name: user_federation_config constraint_f9; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT constraint_f9 PRIMARY KEY (user_federation_provider_id, name);


--
-- Name: resource_server_perm_ticket constraint_fapmt; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT constraint_fapmt PRIMARY KEY (id);


--
-- Name: resource_server_resource constraint_farsr; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT constraint_farsr PRIMARY KEY (id);


--
-- Name: resource_server_policy constraint_farsrp; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT constraint_farsrp PRIMARY KEY (id);


--
-- Name: associated_policy constraint_farsrpap; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT constraint_farsrpap PRIMARY KEY (policy_id, associated_policy_id);


--
-- Name: resource_policy constraint_farsrpp; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT constraint_farsrpp PRIMARY KEY (resource_id, policy_id);


--
-- Name: resource_server_scope constraint_farsrs; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT constraint_farsrs PRIMARY KEY (id);


--
-- Name: resource_scope constraint_farsrsp; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT constraint_farsrsp PRIMARY KEY (resource_id, scope_id);


--
-- Name: scope_policy constraint_farsrsps; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT constraint_farsrsps PRIMARY KEY (scope_id, policy_id);


--
-- Name: user_entity constraint_fb; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT constraint_fb PRIMARY KEY (id);


--
-- Name: user_federation_mapper_config constraint_fedmapper_cfg_pm; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT constraint_fedmapper_cfg_pm PRIMARY KEY (user_federation_mapper_id, name);


--
-- Name: user_federation_mapper constraint_fedmapperpm; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT constraint_fedmapperpm PRIMARY KEY (id);


--
-- Name: fed_user_consent_cl_scope constraint_fgrntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.fed_user_consent_cl_scope
    ADD CONSTRAINT constraint_fgrntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent_client_scope constraint_grntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT constraint_grntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent constraint_grntcsnt_pm; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT constraint_grntcsnt_pm PRIMARY KEY (id);


--
-- Name: keycloak_group constraint_group; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT constraint_group PRIMARY KEY (id);


--
-- Name: group_attribute constraint_group_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT constraint_group_attribute_pk PRIMARY KEY (id);


--
-- Name: group_role_mapping constraint_group_role; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT constraint_group_role PRIMARY KEY (role_id, group_id);


--
-- Name: identity_provider_mapper constraint_idpm; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT constraint_idpm PRIMARY KEY (id);


--
-- Name: idp_mapper_config constraint_idpmconfig; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT constraint_idpmconfig PRIMARY KEY (idp_mapper_id, name);


--
-- Name: migration_model constraint_migmod; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.migration_model
    ADD CONSTRAINT constraint_migmod PRIMARY KEY (id);


--
-- Name: offline_client_session constraint_offl_cl_ses_pk3; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.offline_client_session
    ADD CONSTRAINT constraint_offl_cl_ses_pk3 PRIMARY KEY (user_session_id, client_id, client_storage_provider, external_client_id, offline_flag);


--
-- Name: offline_user_session constraint_offl_us_ses_pk2; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.offline_user_session
    ADD CONSTRAINT constraint_offl_us_ses_pk2 PRIMARY KEY (user_session_id, offline_flag);


--
-- Name: protocol_mapper constraint_pcm; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT constraint_pcm PRIMARY KEY (id);


--
-- Name: protocol_mapper_config constraint_pmconfig; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT constraint_pmconfig PRIMARY KEY (protocol_mapper_id, name);


--
-- Name: redirect_uris constraint_redirect_uris; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT constraint_redirect_uris PRIMARY KEY (client_id, value);


--
-- Name: required_action_config constraint_req_act_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.required_action_config
    ADD CONSTRAINT constraint_req_act_cfg_pk PRIMARY KEY (required_action_id, name);


--
-- Name: required_action_provider constraint_req_act_prv_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT constraint_req_act_prv_pk PRIMARY KEY (id);


--
-- Name: user_required_action constraint_required_action; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT constraint_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: resource_uris constraint_resour_uris_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT constraint_resour_uris_pk PRIMARY KEY (resource_id, value);


--
-- Name: role_attribute constraint_role_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT constraint_role_attribute_pk PRIMARY KEY (id);


--
-- Name: user_attribute constraint_user_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT constraint_user_attribute_pk PRIMARY KEY (id);


--
-- Name: user_group_membership constraint_user_group; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT constraint_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: user_session_note constraint_usn_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_session_note
    ADD CONSTRAINT constraint_usn_pk PRIMARY KEY (user_session, name);


--
-- Name: web_origins constraint_web_origins; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT constraint_web_origins PRIMARY KEY (client_id, value);


--
-- Name: databasechangeloglock databasechangeloglock_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.databasechangeloglock
    ADD CONSTRAINT databasechangeloglock_pkey PRIMARY KEY (id);


--
-- Name: kontingens kontingens_name_key; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.kontingens
    ADD CONSTRAINT kontingens_name_key UNIQUE (name);


--
-- Name: kontingens kontingens_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.kontingens
    ADD CONSTRAINT kontingens_pkey PRIMARY KEY (id);


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
-- Name: medal_submission_history medal_submission_history_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.medal_submission_history
    ADD CONSTRAINT medal_submission_history_pkey PRIMARY KEY (id);


--
-- Name: medal_submissions medal_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.medal_submissions
    ADD CONSTRAINT medal_submissions_pkey PRIMARY KEY (id);


--
-- Name: medals medals_kontingen_id_key; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.medals
    ADD CONSTRAINT medals_kontingen_id_key UNIQUE (kontingen_id);


--
-- Name: medals medals_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.medals
    ADD CONSTRAINT medals_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: nomor_tandings nomor_tandings_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.nomor_tandings
    ADD CONSTRAINT nomor_tandings_pkey PRIMARY KEY (id);


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
-- Name: client_scope_attributes pk_cl_tmpl_attr; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT pk_cl_tmpl_attr PRIMARY KEY (scope_id, name);


--
-- Name: client_scope pk_cli_template; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT pk_cli_template PRIMARY KEY (id);


--
-- Name: resource_server pk_resource_server; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server
    ADD CONSTRAINT pk_resource_server PRIMARY KEY (id);


--
-- Name: client_scope_role_mapping pk_template_scope; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT pk_template_scope PRIMARY KEY (scope_id, role_id);


--
-- Name: default_client_scope r_def_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT r_def_cli_scope_bind PRIMARY KEY (realm_id, scope_id);


--
-- Name: realm_localizations realm_localizations_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_localizations
    ADD CONSTRAINT realm_localizations_pkey PRIMARY KEY (realm_id, locale);


--
-- Name: resource_attribute res_attr_pk; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT res_attr_pk PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: keycloak_group sibling_names; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT sibling_names UNIQUE (realm_id, parent_group, name);


--
-- Name: identity_provider uk_2daelwnibji49avxsrtuf6xj33; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT uk_2daelwnibji49avxsrtuf6xj33 UNIQUE (provider_alias, realm_id);


--
-- Name: client uk_b71cjlbenv945rb6gcon438at; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT uk_b71cjlbenv945rb6gcon438at UNIQUE (realm_id, client_id);


--
-- Name: client_scope uk_cli_scope; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT uk_cli_scope UNIQUE (realm_id, name);


--
-- Name: user_entity uk_dykn684sl8up1crfei6eckhd7; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_dykn684sl8up1crfei6eckhd7 UNIQUE (realm_id, email_constraint);


--
-- Name: resource_server_resource uk_frsr6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5ha6 UNIQUE (name, owner, resource_server_id);


--
-- Name: resource_server_perm_ticket uk_frsr6t700s9v50bu18ws5pmt; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5pmt UNIQUE (owner, requester, resource_server_id, resource_id, scope_id);


--
-- Name: resource_server_policy uk_frsrpt700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT uk_frsrpt700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: resource_server_scope uk_frsrst700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT uk_frsrst700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: user_consent uk_jkuwuvd56ontgsuhogm8uewrt; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT uk_jkuwuvd56ontgsuhogm8uewrt UNIQUE (client_id, client_storage_provider, external_client_id, user_id);


--
-- Name: realm uk_orvsdmla56612eaefiq6wl5oi; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT uk_orvsdmla56612eaefiq6wl5oi UNIQUE (name);


--
-- Name: user_entity uk_ru8tt6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_ru8tt6t700s9v50bu18ws5ha6 UNIQUE (realm_id, username);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: fed_user_attr_long_values; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX fed_user_attr_long_values ON public.fed_user_attribute USING btree (long_value_hash, name);


--
-- Name: fed_user_attr_long_values_lower_case; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX fed_user_attr_long_values_lower_case ON public.fed_user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: idx_admin_event_time; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_admin_event_time ON public.admin_event_entity USING btree (realm_id, admin_event_time);


--
-- Name: idx_assoc_pol_assoc_pol_id; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_assoc_pol_assoc_pol_id ON public.associated_policy USING btree (associated_policy_id);


--
-- Name: idx_auth_config_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_auth_config_realm ON public.authenticator_config USING btree (realm_id);


--
-- Name: idx_auth_exec_flow; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_auth_exec_flow ON public.authentication_execution USING btree (flow_id);


--
-- Name: idx_auth_exec_realm_flow; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_auth_exec_realm_flow ON public.authentication_execution USING btree (realm_id, flow_id);


--
-- Name: idx_auth_flow_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_auth_flow_realm ON public.authentication_flow USING btree (realm_id);


--
-- Name: idx_cl_clscope; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_cl_clscope ON public.client_scope_client USING btree (scope_id);


--
-- Name: idx_client_att_by_name_value; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_client_att_by_name_value ON public.client_attributes USING btree (name, substr(value, 1, 255));


--
-- Name: idx_client_id; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_client_id ON public.client USING btree (client_id);


--
-- Name: idx_client_init_acc_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_client_init_acc_realm ON public.client_initial_access USING btree (realm_id);


--
-- Name: idx_client_session_session; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_client_session_session ON public.client_session USING btree (session_id);


--
-- Name: idx_clscope_attrs; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_clscope_attrs ON public.client_scope_attributes USING btree (scope_id);


--
-- Name: idx_clscope_cl; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_clscope_cl ON public.client_scope_client USING btree (client_id);


--
-- Name: idx_clscope_protmap; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_clscope_protmap ON public.protocol_mapper USING btree (client_scope_id);


--
-- Name: idx_clscope_role; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_clscope_role ON public.client_scope_role_mapping USING btree (scope_id);


--
-- Name: idx_compo_config_compo; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_compo_config_compo ON public.component_config USING btree (component_id);


--
-- Name: idx_component_provider_type; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_component_provider_type ON public.component USING btree (provider_type);


--
-- Name: idx_component_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_component_realm ON public.component USING btree (realm_id);


--
-- Name: idx_composite; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_composite ON public.composite_role USING btree (composite);


--
-- Name: idx_composite_child; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_composite_child ON public.composite_role USING btree (child_role);


--
-- Name: idx_defcls_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_defcls_realm ON public.default_client_scope USING btree (realm_id);


--
-- Name: idx_defcls_scope; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_defcls_scope ON public.default_client_scope USING btree (scope_id);


--
-- Name: idx_event_time; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_event_time ON public.event_entity USING btree (realm_id, event_time);


--
-- Name: idx_fedidentity_feduser; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fedidentity_feduser ON public.federated_identity USING btree (federated_user_id);


--
-- Name: idx_fedidentity_user; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fedidentity_user ON public.federated_identity USING btree (user_id);


--
-- Name: idx_fu_attribute; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_attribute ON public.fed_user_attribute USING btree (user_id, realm_id, name);


--
-- Name: idx_fu_cnsnt_ext; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_cnsnt_ext ON public.fed_user_consent USING btree (user_id, client_storage_provider, external_client_id);


--
-- Name: idx_fu_consent; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_consent ON public.fed_user_consent USING btree (user_id, client_id);


--
-- Name: idx_fu_consent_ru; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_consent_ru ON public.fed_user_consent USING btree (realm_id, user_id);


--
-- Name: idx_fu_credential; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_credential ON public.fed_user_credential USING btree (user_id, type);


--
-- Name: idx_fu_credential_ru; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_credential_ru ON public.fed_user_credential USING btree (realm_id, user_id);


--
-- Name: idx_fu_group_membership; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_group_membership ON public.fed_user_group_membership USING btree (user_id, group_id);


--
-- Name: idx_fu_group_membership_ru; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_group_membership_ru ON public.fed_user_group_membership USING btree (realm_id, user_id);


--
-- Name: idx_fu_required_action; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_required_action ON public.fed_user_required_action USING btree (user_id, required_action);


--
-- Name: idx_fu_required_action_ru; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_required_action_ru ON public.fed_user_required_action USING btree (realm_id, user_id);


--
-- Name: idx_fu_role_mapping; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_role_mapping ON public.fed_user_role_mapping USING btree (user_id, role_id);


--
-- Name: idx_fu_role_mapping_ru; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_fu_role_mapping_ru ON public.fed_user_role_mapping USING btree (realm_id, user_id);


--
-- Name: idx_group_att_by_name_value; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_group_att_by_name_value ON public.group_attribute USING btree (name, ((value)::character varying(250)));


--
-- Name: idx_group_attr_group; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_group_attr_group ON public.group_attribute USING btree (group_id);


--
-- Name: idx_group_role_mapp_group; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_group_role_mapp_group ON public.group_role_mapping USING btree (group_id);


--
-- Name: idx_id_prov_mapp_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_id_prov_mapp_realm ON public.identity_provider_mapper USING btree (realm_id);


--
-- Name: idx_ident_prov_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_ident_prov_realm ON public.identity_provider USING btree (realm_id);


--
-- Name: idx_keycloak_role_client; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_keycloak_role_client ON public.keycloak_role USING btree (client);


--
-- Name: idx_keycloak_role_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_keycloak_role_realm ON public.keycloak_role USING btree (realm);


--
-- Name: idx_match_participants_match_id; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_match_participants_match_id ON public.match_participants USING btree (match_id);


--
-- Name: idx_matches_venue_id; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_matches_venue_id ON public.matches USING btree (venue_id);


--
-- Name: idx_medal_history_submission; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_medal_history_submission ON public.medal_submission_history USING btree (submission_id, created_at DESC);


--
-- Name: idx_medal_outbox_pending; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_medal_outbox_pending ON public.outbox_events USING btree (next_attempt_at, created_at) WHERE (published_at IS NULL);


--
-- Name: idx_medal_submissions_status; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_medal_submissions_status ON public.medal_submissions USING btree (status, submitted_at DESC);


--
-- Name: idx_nomor_tandings_cabor_id; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_nomor_tandings_cabor_id ON public.nomor_tandings USING btree (cabor_id);


--
-- Name: idx_offline_css_preload; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_offline_css_preload ON public.offline_client_session USING btree (client_id, offline_flag);


--
-- Name: idx_offline_uss_by_user; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_offline_uss_by_user ON public.offline_user_session USING btree (user_id, realm_id, offline_flag);


--
-- Name: idx_offline_uss_by_usersess; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_offline_uss_by_usersess ON public.offline_user_session USING btree (realm_id, offline_flag, user_session_id);


--
-- Name: idx_offline_uss_createdon; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_offline_uss_createdon ON public.offline_user_session USING btree (created_on);


--
-- Name: idx_offline_uss_preload; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_offline_uss_preload ON public.offline_user_session USING btree (offline_flag, created_on, user_session_id);


--
-- Name: idx_protocol_mapper_client; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_protocol_mapper_client ON public.protocol_mapper USING btree (client_id);


--
-- Name: idx_realm_attr_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_realm_attr_realm ON public.realm_attribute USING btree (realm_id);


--
-- Name: idx_realm_clscope; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_realm_clscope ON public.client_scope USING btree (realm_id);


--
-- Name: idx_realm_def_grp_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_realm_def_grp_realm ON public.realm_default_groups USING btree (realm_id);


--
-- Name: idx_realm_evt_list_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_realm_evt_list_realm ON public.realm_events_listeners USING btree (realm_id);


--
-- Name: idx_realm_evt_types_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_realm_evt_types_realm ON public.realm_enabled_event_types USING btree (realm_id);


--
-- Name: idx_realm_master_adm_cli; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_realm_master_adm_cli ON public.realm USING btree (master_admin_client);


--
-- Name: idx_realm_supp_local_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_realm_supp_local_realm ON public.realm_supported_locales USING btree (realm_id);


--
-- Name: idx_redir_uri_client; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_redir_uri_client ON public.redirect_uris USING btree (client_id);


--
-- Name: idx_req_act_prov_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_req_act_prov_realm ON public.required_action_provider USING btree (realm_id);


--
-- Name: idx_res_policy_policy; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_res_policy_policy ON public.resource_policy USING btree (policy_id);


--
-- Name: idx_res_scope_scope; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_res_scope_scope ON public.resource_scope USING btree (scope_id);


--
-- Name: idx_res_serv_pol_res_serv; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_res_serv_pol_res_serv ON public.resource_server_policy USING btree (resource_server_id);


--
-- Name: idx_res_srv_res_res_srv; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_res_srv_res_res_srv ON public.resource_server_resource USING btree (resource_server_id);


--
-- Name: idx_res_srv_scope_res_srv; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_res_srv_scope_res_srv ON public.resource_server_scope USING btree (resource_server_id);


--
-- Name: idx_role_attribute; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_role_attribute ON public.role_attribute USING btree (role_id);


--
-- Name: idx_role_clscope; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_role_clscope ON public.client_scope_role_mapping USING btree (role_id);


--
-- Name: idx_scope_mapping_role; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_scope_mapping_role ON public.scope_mapping USING btree (role_id);


--
-- Name: idx_scope_policy_policy; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_scope_policy_policy ON public.scope_policy USING btree (policy_id);


--
-- Name: idx_update_time; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_update_time ON public.migration_model USING btree (update_time);


--
-- Name: idx_us_sess_id_on_cl_sess; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_us_sess_id_on_cl_sess ON public.offline_client_session USING btree (user_session_id);


--
-- Name: idx_usconsent_clscope; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_usconsent_clscope ON public.user_consent_client_scope USING btree (user_consent_id);


--
-- Name: idx_user_attribute; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_user_attribute ON public.user_attribute USING btree (user_id);


--
-- Name: idx_user_attribute_name; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_user_attribute_name ON public.user_attribute USING btree (name, value);


--
-- Name: idx_user_consent; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_user_consent ON public.user_consent USING btree (user_id);


--
-- Name: idx_user_credential; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_user_credential ON public.credential USING btree (user_id);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_user_email ON public.user_entity USING btree (email);


--
-- Name: idx_user_group_mapping; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_user_group_mapping ON public.user_group_membership USING btree (user_id);


--
-- Name: idx_user_reqactions; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_user_reqactions ON public.user_required_action USING btree (user_id);


--
-- Name: idx_user_role_mapping; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_user_role_mapping ON public.user_role_mapping USING btree (user_id);


--
-- Name: idx_user_service_account; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_user_service_account ON public.user_entity USING btree (realm_id, service_account_client_link);


--
-- Name: idx_usr_fed_map_fed_prv; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_usr_fed_map_fed_prv ON public.user_federation_mapper USING btree (federation_provider_id);


--
-- Name: idx_usr_fed_map_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_usr_fed_map_realm ON public.user_federation_mapper USING btree (realm_id);


--
-- Name: idx_usr_fed_prv_realm; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_usr_fed_prv_realm ON public.user_federation_provider USING btree (realm_id);


--
-- Name: idx_web_orig_client; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX idx_web_orig_client ON public.web_origins USING btree (client_id);


--
-- Name: user_attr_long_values; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX user_attr_long_values ON public.user_attribute USING btree (long_value_hash, name);


--
-- Name: user_attr_long_values_lower_case; Type: INDEX; Schema: public; Owner: porprov_admin
--

CREATE INDEX user_attr_long_values_lower_case ON public.user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: medal_submission_history medal_submission_history_immutable; Type: TRIGGER; Schema: public; Owner: porprov_admin
--

CREATE TRIGGER medal_submission_history_immutable BEFORE DELETE OR UPDATE ON public.medal_submission_history FOR EACH ROW EXECUTE FUNCTION public.prevent_medal_history_mutation();


--
-- Name: client_session_auth_status auth_status_constraint; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_session_auth_status
    ADD CONSTRAINT auth_status_constraint FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: identity_provider fk2b4ebc52ae5c3b34; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT fk2b4ebc52ae5c3b34 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_attributes fk3c47c64beacca966; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT fk3c47c64beacca966 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: federated_identity fk404288b92ef007a6; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT fk404288b92ef007a6 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_node_registrations fk4129723ba992f594; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT fk4129723ba992f594 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: client_session_note fk5edfb00ff51c2736; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_session_note
    ADD CONSTRAINT fk5edfb00ff51c2736 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: user_session_note fk5edfb00ff51d3472; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_session_note
    ADD CONSTRAINT fk5edfb00ff51d3472 FOREIGN KEY (user_session) REFERENCES public.user_session(id);


--
-- Name: client_session_role fk_11b7sgqw18i532811v7o2dv76; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_session_role
    ADD CONSTRAINT fk_11b7sgqw18i532811v7o2dv76 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: redirect_uris fk_1burs8pb4ouj97h5wuppahv9f; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT fk_1burs8pb4ouj97h5wuppahv9f FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: user_federation_provider fk_1fj32f6ptolw2qy60cd8n01e8; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT fk_1fj32f6ptolw2qy60cd8n01e8 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_session_prot_mapper fk_33a8sgqw18i532811v7o2dk89; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_session_prot_mapper
    ADD CONSTRAINT fk_33a8sgqw18i532811v7o2dk89 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: realm_required_credential fk_5hg65lybevavkqfki3kponh9v; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT fk_5hg65lybevavkqfki3kponh9v FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_attribute fk_5hrm2vlf9ql5fu022kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu022kqepovbr FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: user_attribute fk_5hrm2vlf9ql5fu043kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu043kqepovbr FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: user_required_action fk_6qj3w1jw9cvafhe19bwsiuvmd; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT fk_6qj3w1jw9cvafhe19bwsiuvmd FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: keycloak_role fk_6vyqfe4cn4wlq8r6kt5vdsj5c; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT fk_6vyqfe4cn4wlq8r6kt5vdsj5c FOREIGN KEY (realm) REFERENCES public.realm(id);


--
-- Name: realm_smtp_config fk_70ej8xdxgxd0b9hh6180irr0o; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT fk_70ej8xdxgxd0b9hh6180irr0o FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_attribute fk_8shxd6l3e9atqukacxgpffptw; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT fk_8shxd6l3e9atqukacxgpffptw FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: composite_role fk_a63wvekftu8jo1pnj81e7mce2; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_a63wvekftu8jo1pnj81e7mce2 FOREIGN KEY (composite) REFERENCES public.keycloak_role(id);


--
-- Name: authentication_execution fk_auth_exec_flow; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_flow FOREIGN KEY (flow_id) REFERENCES public.authentication_flow(id);


--
-- Name: authentication_execution fk_auth_exec_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authentication_flow fk_auth_flow_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT fk_auth_flow_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authenticator_config fk_auth_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT fk_auth_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_session fk_b4ao2vcvat6ukau74wbwtfqo1; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_session
    ADD CONSTRAINT fk_b4ao2vcvat6ukau74wbwtfqo1 FOREIGN KEY (session_id) REFERENCES public.user_session(id);


--
-- Name: user_role_mapping fk_c4fqv34p1mbylloxang7b1q3l; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT fk_c4fqv34p1mbylloxang7b1q3l FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_scope_attributes fk_cl_scope_attr_scope; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT fk_cl_scope_attr_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_scope_role_mapping fk_cl_scope_rm_scope; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT fk_cl_scope_rm_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_user_session_note fk_cl_usr_ses_note; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_user_session_note
    ADD CONSTRAINT fk_cl_usr_ses_note FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: protocol_mapper fk_cli_scope_mapper; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_cli_scope_mapper FOREIGN KEY (client_scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_initial_access fk_client_init_acc_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT fk_client_init_acc_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: component_config fk_component_config; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT fk_component_config FOREIGN KEY (component_id) REFERENCES public.component(id);


--
-- Name: component fk_component_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT fk_component_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_default_groups fk_def_groups_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT fk_def_groups_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_mapper_config fk_fedmapper_cfg; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT fk_fedmapper_cfg FOREIGN KEY (user_federation_mapper_id) REFERENCES public.user_federation_mapper(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_fedprv; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_fedprv FOREIGN KEY (federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: associated_policy fk_frsr5s213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsr5s213xcx4wnkog82ssrfy FOREIGN KEY (associated_policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrasp13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrasp13xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog82sspmt; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82sspmt FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_resource fk_frsrho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog83sspmt; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog83sspmt FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog84sspmt; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog84sspmt FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: associated_policy fk_frsrpas14xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsrpas14xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrpass3xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrpass3xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_perm_ticket fk_frsrpo2128cx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrpo2128cx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_policy fk_frsrpo213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT fk_frsrpo213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_scope fk_frsrpos13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrpos13xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpos53xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpos53xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpp213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpp213xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_scope fk_frsrps213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrps213xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_scope fk_frsrso213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT fk_frsrso213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: composite_role fk_gr7thllb9lu8q4vqa4524jjy8; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_gr7thllb9lu8q4vqa4524jjy8 FOREIGN KEY (child_role) REFERENCES public.keycloak_role(id);


--
-- Name: user_consent_client_scope fk_grntcsnt_clsc_usc; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT fk_grntcsnt_clsc_usc FOREIGN KEY (user_consent_id) REFERENCES public.user_consent(id);


--
-- Name: user_consent fk_grntcsnt_user; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT fk_grntcsnt_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: group_attribute fk_group_attribute_group; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT fk_group_attribute_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: group_role_mapping fk_group_role_group; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT fk_group_role_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: realm_enabled_event_types fk_h846o4h0w8epx5nwedrf5y69j; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT fk_h846o4h0w8epx5nwedrf5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_events_listeners fk_h846o4h0w8epx5nxev9f5y69j; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT fk_h846o4h0w8epx5nxev9f5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: identity_provider_mapper fk_idpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT fk_idpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: idp_mapper_config fk_idpmconfig; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT fk_idpmconfig FOREIGN KEY (idp_mapper_id) REFERENCES public.identity_provider_mapper(id);


--
-- Name: web_origins fk_lojpho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT fk_lojpho213xcx4wnkog82ssrfy FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: scope_mapping fk_ouse064plmlr732lxjcn1q5f1; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT fk_ouse064plmlr732lxjcn1q5f1 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: protocol_mapper fk_pcm_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_pcm_realm FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: credential fk_pfyr0glasqyl0dei3kl69r6v0; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT fk_pfyr0glasqyl0dei3kl69r6v0 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: protocol_mapper_config fk_pmconfig; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT fk_pmconfig FOREIGN KEY (protocol_mapper_id) REFERENCES public.protocol_mapper(id);


--
-- Name: default_client_scope fk_r_def_cli_scope_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT fk_r_def_cli_scope_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: required_action_provider fk_req_act_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT fk_req_act_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_uris fk_resource_server_uris; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT fk_resource_server_uris FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: role_attribute fk_role_attribute_id; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT fk_role_attribute_id FOREIGN KEY (role_id) REFERENCES public.keycloak_role(id);


--
-- Name: realm_supported_locales fk_supported_locales_realm; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT fk_supported_locales_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_config fk_t13hpu1j94r2ebpekr39x5eu5; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT fk_t13hpu1j94r2ebpekr39x5eu5 FOREIGN KEY (user_federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_group_membership fk_user_group_user; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT fk_user_group_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: policy_config fkdc34197cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT fkdc34197cf864c4e43 FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: identity_provider_config fkdc4897cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT fkdc4897cf864c4e43 FOREIGN KEY (identity_provider_id) REFERENCES public.identity_provider(internal_id);


--
-- Name: match_participants match_participants_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.match_participants
    ADD CONSTRAINT match_participants_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: matches matches_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: medal_submission_history medal_submission_history_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.medal_submission_history
    ADD CONSTRAINT medal_submission_history_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.medal_submissions(id);


--
-- Name: nomor_tandings nomor_tandings_cabor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: porprov_admin
--

ALTER TABLE ONLY public.nomor_tandings
    ADD CONSTRAINT nomor_tandings_cabor_id_fkey FOREIGN KEY (cabor_id) REFERENCES public.cabors(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

