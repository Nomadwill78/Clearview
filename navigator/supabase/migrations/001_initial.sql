-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Organizations
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subscription_tier text not null default 'starter' check (subscription_tier in ('starter','professional','enterprise')),
  subscription_status text not null default 'active' check (subscription_status in ('active','past_due','cancelled','trialing')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Org members (mirrored from Clerk)
create table org_members (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  clerk_user_id text not null unique,
  role text not null check (role in ('admin','leadership','staff','board')),
  invited_by uuid references org_members(id),
  joined_at timestamptz not null default now()
);

-- KPI definitions (org_id null = standard framework)
create table kpi_definitions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  domain text not null check (domain in ('financial','program','governance','fundraising','operations')),
  name text not null,
  description text not null,
  scoring_logic jsonb not null default '{"type":"threshold","target":0,"direction":"above"}',
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- Uploaded documents
create table documents (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  uploaded_by uuid not null references org_members(id),
  category text not null check (category in ('financial','program','governance','fundraising')),
  file_name text not null,
  storage_path text not null,
  file_size_bytes int not null,
  processing_status text not null default 'pending' check (processing_status in ('pending','processing','complete','failed')),
  processing_error text,
  created_at timestamptz not null default now()
);

-- Extracted KPI values
create table kpi_values (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  kpi_id uuid not null references kpi_definitions(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  raw_value text,
  numeric_value numeric,
  confidence text not null default 'medium' check (confidence in ('high','medium','low')),
  manually_overridden boolean not null default false,
  period_label text not null default '',
  created_at timestamptz not null default now()
);

-- Computed KPI scores
create table kpi_scores (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  kpi_id uuid not null references kpi_definitions(id) on delete cascade,
  score numeric not null check (score >= 1 and score <= 5),
  period_label text not null default '',
  computed_at timestamptz not null default now()
);

-- Virtual consultant chat messages
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  cited_sources jsonb default '[]',
  created_at timestamptz not null default now()
);

-- Action plan items
create table action_items (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  kpi_id uuid references kpi_definitions(id) on delete set null,
  title text not null,
  description text not null,
  assigned_role text not null check (assigned_role in ('leadership','staff')),
  suggested_due_date date,
  status text not null default 'open' check (status in ('open','in_progress','complete')),
  created_by text not null default 'ai',
  updated_at timestamptz not null default now()
);

-- Consultant hand-off events
create table handoff_events (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  triggered_by text not null check (triggered_by in ('user_request','kpi_urgent','plan_stalled','ai_limit')),
  briefing_doc text not null,
  submitted_at timestamptz not null default now(),
  email_delivered boolean not null default false
);

-- Row-level security
alter table organizations enable row level security;
alter table org_members enable row level security;
alter table kpi_definitions enable row level security;
alter table documents enable row level security;
alter table kpi_values enable row level security;
alter table kpi_scores enable row level security;
alter table chat_messages enable row level security;
alter table action_items enable row level security;
alter table handoff_events enable row level security;

-- Seed standard KPI framework
insert into kpi_definitions (org_id, domain, name, description, scoring_logic, sort_order) values
  -- Financial
  (null, 'financial', 'Operating Reserve Ratio', 'Months of operating expenses held in reserve', '{"type":"threshold","target":3,"direction":"above","unit":"months"}', 1),
  (null, 'financial', 'Revenue Diversification Index', 'No single source exceeds 30% of total revenue', '{"type":"threshold","target":0.3,"direction":"below","unit":"ratio"}', 2),
  (null, 'financial', 'Program Expense Ratio', 'Percentage of expenses going to programs (target >75%)', '{"type":"threshold","target":0.75,"direction":"above","unit":"ratio"}', 3),
  (null, 'financial', 'Administrative Expense Ratio', 'Percentage of expenses for admin/overhead (target <15%)', '{"type":"threshold","target":0.15,"direction":"below","unit":"ratio"}', 4),
  -- Program
  (null, 'program', 'Beneficiary Growth Rate', 'Year-over-year growth in people served', '{"type":"trend","direction":"above","unit":"percent"}', 5),
  (null, 'program', 'Program Completion Rate', 'Percentage of participants completing programs', '{"type":"threshold","target":0.7,"direction":"above","unit":"ratio"}', 6),
  (null, 'program', 'Output per Dollar', 'Units of service delivered per $1,000 spent', '{"type":"trend","direction":"above","unit":"count"}', 7),
  -- Governance
  (null, 'governance', 'Board Meeting Attendance', 'Average board member attendance rate', '{"type":"threshold","target":0.8,"direction":"above","unit":"ratio"}', 8),
  (null, 'governance', 'Policy Compliance Score', 'Percentage of required policies in place and current', '{"type":"threshold","target":0.9,"direction":"above","unit":"ratio"}', 9),
  (null, 'governance', 'Strategic Plan Coverage', 'Percentage of strategic plan goals tracked', '{"type":"threshold","target":0.8,"direction":"above","unit":"ratio"}', 10),
  -- Fundraising
  (null, 'fundraising', 'Donor Retention Rate', 'Percentage of donors who gave again this year', '{"type":"threshold","target":0.6,"direction":"above","unit":"ratio"}', 11),
  (null, 'fundraising', 'Cost per Dollar Raised', 'Administrative cost per $1 raised', '{"type":"threshold","target":0.2,"direction":"below","unit":"ratio"}', 12),
  (null, 'fundraising', 'Fundraising Revenue Ratio', 'Fundraising revenue as percentage of total revenue', '{"type":"range","min":0.2,"max":0.6,"unit":"ratio"}', 13),
  -- Operations
  (null, 'operations', 'Staff Turnover Rate', 'Annual staff turnover (target <20%)', '{"type":"threshold","target":0.2,"direction":"below","unit":"ratio"}', 14),
  (null, 'operations', 'Grant Compliance Rate', 'Percentage of grants with timely reporting', '{"type":"threshold","target":0.95,"direction":"above","unit":"ratio"}', 15);
