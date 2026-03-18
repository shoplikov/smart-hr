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

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TYPE public.doc_type_enum AS ENUM (
    'vnd', 'strategy', 'policy', 'kpi_framework', 'regulation', 'instruction', 'standard', 'other'
);

CREATE TYPE public.goal_event_type_enum AS ENUM (
    'created', 'edited', 'submitted', 'approved', 'rejected', 'status_changed', 'commented', 'archived'
);

CREATE TYPE public.goal_status_enum AS ENUM (
    'draft', 'active', 'submitted', 'approved', 'in_progress', 'done', 'cancelled', 'overdue', 'archived'
);

CREATE TYPE public.project_role_enum AS ENUM (
    'pm', 'ba', 'dev_backend', 'dev_frontend', 'devops', 'qa', 'analyst', 'ml', 'architect', 'security', 'support', 'other'
);

CREATE TYPE public.project_status_enum AS ENUM (
    'idea', 'planning', 'active', 'on_hold', 'done', 'cancelled'
);

CREATE TYPE public.quarter_enum AS ENUM (
    'Q1', 'Q2', 'Q3', 'Q4'
);

CREATE TYPE public.review_verdict_enum AS ENUM (
    'approve', 'reject', 'needs_changes', 'comment_only'
);

CREATE TYPE public.system_type_enum AS ENUM (
    'crm', 'erp', 'hr', 'dwh', 'bi', 'integration', 'ml', 'portal', 'mobile', 'monitoring', 'other'
);

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

SET default_tablespace = '';
SET default_table_access_method = heap;

CREATE TABLE public.departments (
    id bigint NOT NULL,
    name text NOT NULL,
    code text,
    parent_id bigint,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.departments_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;

CREATE TABLE public.documents (
    doc_id uuid DEFAULT gen_random_uuid() NOT NULL,
    doc_type public.doc_type_enum NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    valid_from date NOT NULL,
    valid_to date,
    owner_department_id bigint,
    department_scope jsonb,
    keywords text[],
    version text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.employee_projects (
    employee_id bigint NOT NULL,
    project_id uuid NOT NULL,
    role public.project_role_enum DEFAULT 'other'::public.project_role_enum NOT NULL,
    allocation_percent smallint,
    start_date date,
    end_date date,
    CONSTRAINT employee_projects_allocation_percent_check CHECK (((allocation_percent IS NULL) OR ((allocation_percent >= 1) AND (allocation_percent <= 100))))
);

CREATE TABLE public.employees (
    id bigint NOT NULL,
    employee_code text,
    full_name text NOT NULL,
    email text,
    department_id bigint NOT NULL,
    position_id bigint NOT NULL,
    manager_id bigint,
    hire_date date,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.employees_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;

CREATE TABLE public.goal_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    goal_id uuid NOT NULL,
    event_type public.goal_event_type_enum NOT NULL,
    actor_id bigint,
    old_status public.goal_status_enum,
    new_status public.goal_status_enum,
    old_text text,
    new_text text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.goal_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    goal_id uuid NOT NULL,
    reviewer_id bigint,
    verdict public.review_verdict_enum DEFAULT 'comment_only'::public.review_verdict_enum NOT NULL,
    comment_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.goals (
    goal_id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id bigint NOT NULL,
    department_id bigint NOT NULL,
    employee_name_snapshot text,
    position_snapshot text,
    department_name_snapshot text,
    project_id uuid,
    system_id bigint,
    goal_text text NOT NULL,
    year smallint NOT NULL,
    quarter public.quarter_enum NOT NULL,
    metric text,
    deadline date,
    weight numeric(5,2) DEFAULT 1.00 NOT NULL,
    status public.goal_status_enum DEFAULT 'draft'::public.goal_status_enum NOT NULL,
    external_ref text,
    priority smallint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT goals_priority_check CHECK (((priority IS NULL) OR ((priority >= 1) AND (priority <= 5)))),
    CONSTRAINT goals_weight_check CHECK (((weight > (0)::numeric) AND (weight <= (100)::numeric))),
    CONSTRAINT goals_year_check CHECK (((year >= 2000) AND (year <= 2100)))
);

CREATE TABLE public.kpi_catalog (
    metric_key text NOT NULL,
    title text NOT NULL,
    unit text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.kpi_timeseries (
    id bigint NOT NULL,
    scope_type text NOT NULL,
    department_id bigint,
    employee_id bigint,
    project_id uuid,
    system_id bigint,
    metric_key text NOT NULL,
    period_date date NOT NULL,
    value_num numeric(18,6) NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_kpi_scope_ref CHECK ((((scope_type = 'company'::text) AND (department_id IS NULL) AND (employee_id IS NULL) AND (project_id IS NULL) AND (system_id IS NULL)) OR ((scope_type = 'department'::text) AND (department_id IS NOT NULL) AND (employee_id IS NULL) AND (project_id IS NULL) AND (system_id IS NULL)) OR ((scope_type = 'employee'::text) AND (employee_id IS NOT NULL)) OR ((scope_type = 'project'::text) AND (project_id IS NOT NULL)) OR ((scope_type = 'system'::text) AND (system_id IS NOT NULL)))),
    CONSTRAINT kpi_timeseries_scope_type_check CHECK ((scope_type = ANY (ARRAY['company'::text, 'department'::text, 'employee'::text, 'project'::text, 'system'::text])))
);

CREATE SEQUENCE public.kpi_timeseries_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.kpi_timeseries_id_seq OWNED BY public.kpi_timeseries.id;

CREATE TABLE public.positions (
    id bigint NOT NULL,
    name text NOT NULL,
    grade text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.positions_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.positions_id_seq OWNED BY public.positions.id;

CREATE TABLE public.project_systems (
    project_id uuid NOT NULL,
    system_id bigint NOT NULL
);

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text,
    name text NOT NULL,
    description text,
    owner_department_id bigint,
    status public.project_status_enum DEFAULT 'active'::public.project_status_enum NOT NULL,
    start_date date,
    end_date date,
    budget_kzt numeric(18,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.systems (
    id bigint NOT NULL,
    name text NOT NULL,
    system_type public.system_type_enum NOT NULL,
    owner_department_id bigint,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.systems_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.systems_id_seq OWNED BY public.systems.id;

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);
ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);
ALTER TABLE ONLY public.kpi_timeseries ALTER COLUMN id SET DEFAULT nextval('public.kpi_timeseries_id_seq'::regclass);
ALTER TABLE ONLY public.positions ALTER COLUMN id SET DEFAULT nextval('public.positions_id_seq'::regclass);
ALTER TABLE ONLY public.systems ALTER COLUMN id SET DEFAULT nextval('public.systems_id_seq'::regclass);

ALTER TABLE ONLY public.departments ADD CONSTRAINT departments_code_key UNIQUE (code);
ALTER TABLE ONLY public.departments ADD CONSTRAINT departments_name_key UNIQUE (name);
ALTER TABLE ONLY public.departments ADD CONSTRAINT departments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.documents ADD CONSTRAINT documents_pkey PRIMARY KEY (doc_id);
ALTER TABLE ONLY public.employee_projects ADD CONSTRAINT employee_projects_pkey PRIMARY KEY (employee_id, project_id, role);
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_email_key UNIQUE (email);
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_employee_code_key UNIQUE (employee_code);
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.goal_events ADD CONSTRAINT goal_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.goal_reviews ADD CONSTRAINT goal_reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.goals ADD CONSTRAINT goals_pkey PRIMARY KEY (goal_id);
ALTER TABLE ONLY public.kpi_catalog ADD CONSTRAINT kpi_catalog_pkey PRIMARY KEY (metric_key);
ALTER TABLE ONLY public.kpi_timeseries ADD CONSTRAINT kpi_timeseries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.positions ADD CONSTRAINT positions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.project_systems ADD CONSTRAINT project_systems_pkey PRIMARY KEY (project_id, system_id);
ALTER TABLE ONLY public.projects ADD CONSTRAINT projects_code_key UNIQUE (code);
ALTER TABLE ONLY public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.systems ADD CONSTRAINT systems_name_key UNIQUE (name);
ALTER TABLE ONLY public.systems ADD CONSTRAINT systems_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.positions ADD CONSTRAINT uq_positions_name_grade UNIQUE (name, grade);

CREATE INDEX idx_departments_parent_id ON public.departments USING btree (parent_id);
CREATE INDEX idx_documents_doc_type ON public.documents USING btree (doc_type);
CREATE INDEX idx_documents_keywords_gin ON public.documents USING gin (keywords);
CREATE INDEX idx_documents_owner_dept ON public.documents USING btree (owner_department_id);
CREATE INDEX idx_documents_scope_gin ON public.documents USING gin (department_scope);
CREATE INDEX idx_documents_valid_from ON public.documents USING btree (valid_from);
CREATE INDEX idx_employee_projects_project_id ON public.employee_projects USING btree (project_id);
CREATE INDEX idx_employees_department_id ON public.employees USING btree (department_id);
CREATE INDEX idx_employees_manager_id ON public.employees USING btree (manager_id);
CREATE INDEX idx_employees_position_id ON public.employees USING btree (position_id);
CREATE INDEX idx_goal_events_created_at ON public.goal_events USING btree (created_at);
CREATE INDEX idx_goal_events_event_type ON public.goal_events USING btree (event_type);
CREATE INDEX idx_goal_events_goal_id ON public.goal_events USING btree (goal_id);
CREATE INDEX idx_goal_reviews_goal_id ON public.goal_reviews USING btree (goal_id);
CREATE INDEX idx_goal_reviews_reviewer_id ON public.goal_reviews USING btree (reviewer_id);
CREATE INDEX idx_goal_reviews_verdict ON public.goal_reviews USING btree (verdict);
CREATE INDEX idx_goals_dept_yq ON public.goals USING btree (department_id, year, quarter);
CREATE INDEX idx_goals_employee_yq ON public.goals USING btree (employee_id, year, quarter);
CREATE INDEX idx_goals_project_id ON public.goals USING btree (project_id);
CREATE INDEX idx_goals_status ON public.goals USING btree (status);
CREATE INDEX idx_goals_system_id ON public.goals USING btree (system_id);
CREATE INDEX idx_kpi_ts_dept_date ON public.kpi_timeseries USING btree (department_id, period_date);
CREATE INDEX idx_kpi_ts_emp_date ON public.kpi_timeseries USING btree (employee_id, period_date);
CREATE INDEX idx_kpi_ts_metric_date ON public.kpi_timeseries USING btree (metric_key, period_date);
CREATE INDEX idx_kpi_ts_proj_date ON public.kpi_timeseries USING btree (project_id, period_date);
CREATE INDEX idx_kpi_ts_sys_date ON public.kpi_timeseries USING btree (system_id, period_date);
CREATE INDEX idx_projects_owner_dept ON public.projects USING btree (owner_department_id);
CREATE INDEX idx_projects_status ON public.projects USING btree (status);
CREATE INDEX idx_systems_owner_dept ON public.systems USING btree (owner_department_id);
CREATE INDEX idx_systems_type ON public.systems USING btree (system_type);

CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_kpi_catalog_updated_at BEFORE UPDATE ON public.kpi_catalog FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_systems_updated_at BEFORE UPDATE ON public.systems FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE ONLY public.departments ADD CONSTRAINT departments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.documents ADD CONSTRAINT documents_owner_department_id_fkey FOREIGN KEY (owner_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.employee_projects ADD CONSTRAINT employee_projects_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.employee_projects ADD CONSTRAINT employee_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.goal_events ADD CONSTRAINT goal_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.goal_events ADD CONSTRAINT goal_events_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(goal_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.goal_reviews ADD CONSTRAINT goal_reviews_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(goal_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.goal_reviews ADD CONSTRAINT goal_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.goals ADD CONSTRAINT goals_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.goals ADD CONSTRAINT goals_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.goals ADD CONSTRAINT goals_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.goals ADD CONSTRAINT goals_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.kpi_timeseries ADD CONSTRAINT kpi_timeseries_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.kpi_timeseries ADD CONSTRAINT kpi_timeseries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.kpi_timeseries ADD CONSTRAINT kpi_timeseries_metric_key_fkey FOREIGN KEY (metric_key) REFERENCES public.kpi_catalog(metric_key) ON DELETE RESTRICT;
ALTER TABLE ONLY public.kpi_timeseries ADD CONSTRAINT kpi_timeseries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.kpi_timeseries ADD CONSTRAINT kpi_timeseries_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.project_systems ADD CONSTRAINT project_systems_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.project_systems ADD CONSTRAINT project_systems_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.projects ADD CONSTRAINT projects_owner_department_id_fkey FOREIGN KEY (owner_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.systems ADD CONSTRAINT systems_owner_department_id_fkey FOREIGN KEY (owner_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
