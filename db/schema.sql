-- ─────────────────────────────────────────────────────────────
-- KnowFlow Database Schema — Maxwell Entities LLC
-- Paste this entire file into Supabase → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  daily_time_minutes integer default 15,
  self_rating text default 'Intermediate',
  preferred_topics text[] default '{}',
  notifications_enabled boolean default true,
  family_safe_mode boolean default false,
  streak_days integer default 0,
  last_active_date date,
  total_articles_read integer default 0
);

create table if not exists assessments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  completed_at timestamptz default now(),
  score_pct integer not null,
  correct_count integer not null,
  total_questions integer not null,
  self_rating text,
  daily_time text,
  gap_domains text[] default '{}',
  raw_results jsonb default '{}'
);

create table if not exists learning_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  assessment_id uuid references assessments(id),
  created_at timestamptz default now(),
  is_active boolean default true,
  headline text,
  summary text,
  weeks jsonb default '[]',
  gaps jsonb default '[]'
);

create table if not exists saved_articles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  saved_at timestamptz default now(),
  title text not null,
  summary text,
  source text,
  url text,
  topic text,
  emoji text
);

create table if not exists article_cache (
  id uuid primary key default uuid_generate_v4(),
  fetched_at timestamptz default now(),
  expires_at timestamptz default now() + interval '24 hours',
  source text not null,
  topic text,
  title text not null,
  summary text,
  url text,
  emoji text,
  ai_verified boolean default false,
  is_safe boolean default true
);

create table if not exists ad_campaigns (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  advertiser_name text not null,
  advertiser_email text not null,
  company text,
  website text,
  package_type text,
  budget_range text,
  campaign_goals text,
  status text default 'pending',
  start_date date,
  end_date date,
  total_budget_usd numeric(10,2),
  spent_usd numeric(10,2) default 0,
  target_topics text[] default '{}'
);

create table if not exists ad_impressions (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references ad_campaigns(id),
  recorded_at timestamptz default now(),
  topic text,
  user_region text
);

create table if not exists chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  messages jsonb default '[]'
);

create index if not exists idx_assessments_user on assessments(user_id);
create index if not exists idx_learning_plans_user on learning_plans(user_id);
create index if not exists idx_saved_articles_user on saved_articles(user_id);
create index if not exists idx_article_cache_expires on article_cache(expires_at);
create index if not exists idx_ad_impressions_campaign on ad_impressions(campaign_id);

alter table users enable row level security;
alter table assessments enable row level security;
alter table learning_plans enable row level security;
alter table saved_articles enable row level security;
alter table chat_sessions enable row level security;
alter table article_cache enable row level security;
alter table ad_campaigns enable row level security;
alter table ad_impressions enable row level security;

create policy "users_own_data" on users for all using (auth.uid() = id);
create policy "assessments_own_data" on assessments for all using (auth.uid() = user_id);
create policy "learning_plans_own_data" on learning_plans for all using (auth.uid() = user_id);
create policy "saved_articles_own_data" on saved_articles for all using (auth.uid() = user_id);
create policy "chat_sessions_own_data" on chat_sessions for all using (auth.uid() = user_id);
create policy "article_cache_public_read" on article_cache for select using (true);
