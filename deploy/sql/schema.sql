--
-- PostgreSQL database dump
--

\restrict vAz0Ii3PbtL3qYHQPkZxbBFAAI3yr0AhepXnIcUj7RvgV2cdVWUAEZZhtyewJAb

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: advertising_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advertising_blocks (
    id uuid NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    area character varying(30) NOT NULL,
    display_mode character varying(30) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    valid_from timestamp with time zone,
    valid_to timestamp with time zone,
    created_by_user_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.advertising_blocks OWNER TO postgres;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(64),
    payload_diff json,
    ip_address character varying(45),
    "timestamp" timestamp with time zone NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id uuid NOT NULL,
    region_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(50) NOT NULL,
    override_full_screen_block_id uuid,
    override_mode32_block_id uuid,
    address text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: cashiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cashiers (
    id uuid NOT NULL,
    branch_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    ip_address character varying(45) NOT NULL,
    ssh_port integer DEFAULT 22 NOT NULL,
    ssh_credential_id uuid,
    enabled boolean DEFAULT true NOT NULL,
    override_full_screen_block_id uuid,
    override_mode32_block_id uuid,
    current_full_screen_block_id uuid,
    current_mode32_block_id uuid,
    current_content_version character varying(64),
    last_seen_at timestamp with time zone,
    last_sync_status character varying(30) DEFAULT 'UNKNOWN'::character varying NOT NULL,
    guest_screen_version character varying(20),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    ssh_password_encrypted bytea
);


ALTER TABLE public.cashiers OWNER TO postgres;

--
-- Name: job_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_attempts (
    id uuid NOT NULL,
    job_id uuid NOT NULL,
    attempt_number integer DEFAULT 1 NOT NULL,
    status character varying(30) NOT NULL,
    previous_scene_raw text,
    remote_backup_path character varying(255),
    execution_log text,
    duration_ms integer,
    started_at timestamp with time zone NOT NULL,
    finished_at timestamp with time zone
);


ALTER TABLE public.job_attempts OWNER TO postgres;

--
-- Name: maintenance_windows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_windows (
    id uuid NOT NULL,
    branch_id uuid NOT NULL,
    timezone character varying(50) DEFAULT 'Asia/Tashkent'::character varying NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.maintenance_windows OWNER TO postgres;

--
-- Name: media_assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_assets (
    id uuid NOT NULL,
    original_name character varying(255) NOT NULL,
    stored_name character varying(100) NOT NULL,
    sha256 character varying(64) NOT NULL,
    mime_type character varying(100) NOT NULL,
    media_type character varying(20) NOT NULL,
    file_size_bytes bigint DEFAULT '0'::bigint NOT NULL,
    width integer,
    height integer,
    s3_bucket character varying(100) DEFAULT 'media'::character varying NOT NULL,
    s3_key character varying(255) NOT NULL,
    uploaded_by_user_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.media_assets OWNER TO postgres;

--
-- Name: playlist_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.playlist_items (
    id uuid NOT NULL,
    advertising_block_id uuid NOT NULL,
    media_asset_id uuid NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    duration_seconds integer DEFAULT 7 NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.playlist_items OWNER TO postgres;

--
-- Name: publication_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.publication_batches (
    id uuid NOT NULL,
    advertising_block_id uuid,
    scope_type character varying(20) NOT NULL,
    scope_target_ids json NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    total_cashiers integer DEFAULT 0 NOT NULL,
    success_count integer DEFAULT 0 NOT NULL,
    awaiting_restart_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    offline_count integer DEFAULT 0 NOT NULL,
    initiated_by_user_id uuid,
    scheduled_at timestamp with time zone,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    content_snapshot_json json
);


ALTER TABLE public.publication_batches OWNER TO postgres;

--
-- Name: publication_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.publication_jobs (
    id uuid NOT NULL,
    batch_id uuid NOT NULL,
    cashier_id uuid NOT NULL,
    advertising_block_id uuid,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    idempotency_key character varying(128) NOT NULL,
    current_attempt integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 3 NOT NULL,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    error_message text
);


ALTER TABLE public.publication_jobs OWNER TO postgres;

--
-- Name: regions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.regions (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    default_full_screen_block_id uuid,
    default_mode32_block_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.regions OWNER TO postgres;

--
-- Name: ssh_credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ssh_credentials (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    auth_type character varying(20) DEFAULT 'CORPORATE_KEY'::character varying NOT NULL,
    username character varying(100) DEFAULT 'Administrator'::character varying NOT NULL,
    encrypted_secret bytea,
    key_fingerprint character varying(100),
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.ssh_credentials OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    worker_concurrency integer DEFAULT 15 NOT NULL,
    max_concurrent_per_branch integer DEFAULT 2 NOT NULL,
    ssh_connect_timeout_seconds integer DEFAULT 10 NOT NULL,
    ssh_command_timeout_seconds integer DEFAULT 45 NOT NULL,
    sftp_timeout_seconds integer DEFAULT 60 NOT NULL,
    minio_media_retention_days integer DEFAULT 30 NOT NULL,
    cashier_backup_retention_days integer DEFAULT 7 NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(150),
    role character varying(20) DEFAULT 'OPERATOR'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: advertising_blocks advertising_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advertising_blocks
    ADD CONSTRAINT advertising_blocks_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: cashiers cashiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashiers
    ADD CONSTRAINT cashiers_pkey PRIMARY KEY (id);


--
-- Name: job_attempts job_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_attempts
    ADD CONSTRAINT job_attempts_pkey PRIMARY KEY (id);


--
-- Name: maintenance_windows maintenance_windows_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_windows
    ADD CONSTRAINT maintenance_windows_branch_id_key UNIQUE (branch_id);


--
-- Name: maintenance_windows maintenance_windows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_windows
    ADD CONSTRAINT maintenance_windows_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: playlist_items playlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlist_items
    ADD CONSTRAINT playlist_items_pkey PRIMARY KEY (id);


--
-- Name: publication_batches publication_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publication_batches
    ADD CONSTRAINT publication_batches_pkey PRIMARY KEY (id);


--
-- Name: publication_jobs publication_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publication_jobs
    ADD CONSTRAINT publication_jobs_pkey PRIMARY KEY (id);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- Name: ssh_credentials ssh_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ssh_credentials
    ADD CONSTRAINT ssh_credentials_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: publication_jobs uq_batch_cashier; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publication_jobs
    ADD CONSTRAINT uq_batch_cashier UNIQUE (batch_id, cashier_id);


--
-- Name: playlist_items uq_block_order; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlist_items
    ADD CONSTRAINT uq_block_order UNIQUE (advertising_block_id, order_index);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_advertising_blocks_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_advertising_blocks_area ON public.advertising_blocks USING btree (area);


--
-- Name: ix_advertising_blocks_display_mode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_advertising_blocks_display_mode ON public.advertising_blocks USING btree (display_mode);


--
-- Name: ix_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: ix_audit_logs_entity_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);


--
-- Name: ix_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: ix_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: ix_branches_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_branches_code ON public.branches USING btree (code);


--
-- Name: ix_branches_region_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_branches_region_id ON public.branches USING btree (region_id);


--
-- Name: ix_cashiers_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_cashiers_branch_id ON public.cashiers USING btree (branch_id);


--
-- Name: ix_cashiers_ip_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_cashiers_ip_address ON public.cashiers USING btree (ip_address);


--
-- Name: ix_cashiers_last_sync_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_cashiers_last_sync_status ON public.cashiers USING btree (last_sync_status);


--
-- Name: ix_job_attempts_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_job_attempts_job_id ON public.job_attempts USING btree (job_id);


--
-- Name: ix_media_assets_sha256; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_media_assets_sha256 ON public.media_assets USING btree (sha256);


--
-- Name: ix_media_assets_stored_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_media_assets_stored_name ON public.media_assets USING btree (stored_name);


--
-- Name: ix_playlist_items_advertising_block_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_playlist_items_advertising_block_id ON public.playlist_items USING btree (advertising_block_id);


--
-- Name: ix_playlist_items_media_asset_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_playlist_items_media_asset_id ON public.playlist_items USING btree (media_asset_id);


--
-- Name: ix_publication_batches_advertising_block_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_publication_batches_advertising_block_id ON public.publication_batches USING btree (advertising_block_id);


--
-- Name: ix_publication_batches_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_publication_batches_status ON public.publication_batches USING btree (status);


--
-- Name: ix_publication_jobs_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_publication_jobs_batch_id ON public.publication_jobs USING btree (batch_id);


--
-- Name: ix_publication_jobs_cashier_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_publication_jobs_cashier_id ON public.publication_jobs USING btree (cashier_id);


--
-- Name: ix_publication_jobs_idempotency_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_publication_jobs_idempotency_key ON public.publication_jobs USING btree (idempotency_key);


--
-- Name: ix_publication_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_publication_jobs_status ON public.publication_jobs USING btree (status);


--
-- Name: ix_regions_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_regions_code ON public.regions USING btree (code);


--
-- Name: ix_regions_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_regions_name ON public.regions USING btree (name);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: advertising_blocks advertising_blocks_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advertising_blocks
    ADD CONSTRAINT advertising_blocks_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: branches branches_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE RESTRICT;


--
-- Name: cashiers cashiers_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashiers
    ADD CONSTRAINT cashiers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: branches fk_branches_override_full_screen_block; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT fk_branches_override_full_screen_block FOREIGN KEY (override_full_screen_block_id) REFERENCES public.advertising_blocks(id) ON DELETE SET NULL;


--
-- Name: branches fk_branches_override_mode32_block; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT fk_branches_override_mode32_block FOREIGN KEY (override_mode32_block_id) REFERENCES public.advertising_blocks(id) ON DELETE SET NULL;


--
-- Name: cashiers fk_cashiers_current_full_screen_block; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashiers
    ADD CONSTRAINT fk_cashiers_current_full_screen_block FOREIGN KEY (current_full_screen_block_id) REFERENCES public.advertising_blocks(id) ON DELETE SET NULL;


--
-- Name: cashiers fk_cashiers_current_mode32_block; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashiers
    ADD CONSTRAINT fk_cashiers_current_mode32_block FOREIGN KEY (current_mode32_block_id) REFERENCES public.advertising_blocks(id) ON DELETE SET NULL;


--
-- Name: cashiers fk_cashiers_override_full_screen_block; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashiers
    ADD CONSTRAINT fk_cashiers_override_full_screen_block FOREIGN KEY (override_full_screen_block_id) REFERENCES public.advertising_blocks(id) ON DELETE SET NULL;


--
-- Name: cashiers fk_cashiers_override_mode32_block; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashiers
    ADD CONSTRAINT fk_cashiers_override_mode32_block FOREIGN KEY (override_mode32_block_id) REFERENCES public.advertising_blocks(id) ON DELETE SET NULL;


--
-- Name: cashiers fk_cashiers_ssh_credential_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashiers
    ADD CONSTRAINT fk_cashiers_ssh_credential_id FOREIGN KEY (ssh_credential_id) REFERENCES public.ssh_credentials(id) ON DELETE SET NULL;


--
-- Name: regions fk_regions_default_full_screen_block; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT fk_regions_default_full_screen_block FOREIGN KEY (default_full_screen_block_id) REFERENCES public.advertising_blocks(id) ON DELETE SET NULL;


--
-- Name: regions fk_regions_default_mode32_block; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT fk_regions_default_mode32_block FOREIGN KEY (default_mode32_block_id) REFERENCES public.advertising_blocks(id) ON DELETE SET NULL;


--
-- Name: job_attempts job_attempts_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_attempts
    ADD CONSTRAINT job_attempts_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.publication_jobs(id) ON DELETE CASCADE;


--
-- Name: maintenance_windows maintenance_windows_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_windows
    ADD CONSTRAINT maintenance_windows_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: media_assets media_assets_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: playlist_items playlist_items_advertising_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlist_items
    ADD CONSTRAINT playlist_items_advertising_block_id_fkey FOREIGN KEY (advertising_block_id) REFERENCES public.advertising_blocks(id) ON DELETE CASCADE;


--
-- Name: playlist_items playlist_items_media_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlist_items
    ADD CONSTRAINT playlist_items_media_asset_id_fkey FOREIGN KEY (media_asset_id) REFERENCES public.media_assets(id) ON DELETE RESTRICT;


--
-- Name: publication_batches publication_batches_advertising_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publication_batches
    ADD CONSTRAINT publication_batches_advertising_block_id_fkey FOREIGN KEY (advertising_block_id) REFERENCES public.advertising_blocks(id) ON DELETE SET NULL;


--
-- Name: publication_batches publication_batches_initiated_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publication_batches
    ADD CONSTRAINT publication_batches_initiated_by_user_id_fkey FOREIGN KEY (initiated_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: publication_jobs publication_jobs_advertising_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publication_jobs
    ADD CONSTRAINT publication_jobs_advertising_block_id_fkey FOREIGN KEY (advertising_block_id) REFERENCES public.advertising_blocks(id) ON DELETE SET NULL;


--
-- Name: publication_jobs publication_jobs_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publication_jobs
    ADD CONSTRAINT publication_jobs_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.publication_batches(id) ON DELETE CASCADE;


--
-- Name: publication_jobs publication_jobs_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.publication_jobs
    ADD CONSTRAINT publication_jobs_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.cashiers(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict vAz0Ii3PbtL3qYHQPkZxbBFAAI3yr0AhepXnIcUj7RvgV2cdVWUAEZZhtyewJAb

